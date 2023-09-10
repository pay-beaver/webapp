import { LocalAccountSigner, UserOperationRequest } from "@alchemy/aa-core";
import { ECDSAProvider, ERC20Abi, ValidatorMode } from "@zerodev/sdk";
import {
  Hex,
  concatHex,
  encodeFunctionData,
  getFunctionSelector,
  pad,
  parseAbi,
  toHex,
} from "viem";
import { SubscriptionProvider } from "./provider/subscriptionProvider";
import { base, baseGoerli } from "viem/chains";
import { ERC20Token, SupportedChain as SupportedChain } from "./types";
import { COMP_TOKEN } from "./tokens";

const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

const PRIVATE_KEY = `0x${"10".repeat(32)}` as Hex;

const ZERODEV_PROJECT_IDS = {
  [baseGoerli.id]: "f0847be6-87cf-4ea6-b291-ec28dbf3e086",
  [base.id]: "9bedf0c4-17e6-4b4b-8ccb-a7e1f6e05097",
};

const ACCOUNT_ADDRESS = "0xcA9e9FC5f719ccCbC8859080981b3A3A77058C77";

const VALIDATOR_ADDRESS = "0xc824Cb40e4253Ae1A7C024eFc20eD9f788645b9a";
const EXECUTOR_ADDRESS = "0x5E1cc70f09EBe454eee8d8E7110B86e40f9fcA02";

const PAYMENT_FUNCTION_SOLIDITY =
  "function payForSubscription(address _token, uint256 _amount, address _to, string calldata subscriptionId)";
const PAYMENT_FUNCTION_SELECTOR = getFunctionSelector(
  PAYMENT_FUNCTION_SOLIDITY
);
const PAYMENT_FUNCTION_ABI = parseAbi([PAYMENT_FUNCTION_SOLIDITY]);

const TERMINATE_SUBSCRIPTION_FUNCTION_SOLIDITY =
  "function terminateSubscription(uint192 _subscriptionId)";
const TERMINATE_SUBSCRIPTION_FUNCTION_ABI = parseAbi([
  TERMINATE_SUBSCRIPTION_FUNCTION_SOLIDITY,
]);

export async function getEcdsaProvider(
  projectId: string
): Promise<ECDSAProvider> {
  const owner = LocalAccountSigner.privateKeyToAccountSigner(PRIVATE_KEY);
  let ecdsaProvider = await ECDSAProvider.init({
    projectId,
    owner,
    opts: {
      accountConfig: {
        accountAddress: ACCOUNT_ADDRESS,
      },
    },
  });
  return ecdsaProvider;
}

export async function getSubscriptionProvider(
  chain: SupportedChain
): Promise<SubscriptionProvider> {
  const projectId = ZERODEV_PROJECT_IDS[chain.id];
  const owner = LocalAccountSigner.privateKeyToAccountSigner(PRIVATE_KEY);
  const ecdsaProvider = await getEcdsaProvider(projectId);
  const subsctiptionProvider = await SubscriptionProvider.init({
    projectId,
    owner,
    opts: {
      accountConfig: {
        accountAddress: ACCOUNT_ADDRESS,
        defaultValidator: ecdsaProvider.getValidator(),
        chain: chain,
      },
      validatorConfig: {
        mode: ValidatorMode.plugin,
        validatorAddress: VALIDATOR_ADDRESS,
        executor: EXECUTOR_ADDRESS,
        selector: PAYMENT_FUNCTION_SELECTOR,
      },
    },
  });
  await subsctiptionProvider.getAccount().approvePlugin();

  return subsctiptionProvider;
}

export async function sendERC20Token(
  token: ERC20Token,
  to: Hex,
  humanAmount: number
) {
  const uintAmount = Math.floor(humanAmount * 10 ** token.decimals);
  const ecdsaProvider = await getEcdsaProvider(
    ZERODEV_PROJECT_IDS[baseGoerli.id]
  );
  const { hash } = await ecdsaProvider.sendUserOperation({
    target: token.address,
    data: encodeFunctionData({
      abi: ERC20Abi,
      functionName: "transfer",
      args: [to, BigInt(uintAmount)],
    }),
  });
  console.log("Sent with hash", hash);
  const txHash = await ecdsaProvider.waitForUserOperationTransaction(
    hash as Hex
  );
  console.log("Executed!", txHash);
}

export async function terminateSubscription(
  chain: SupportedChain,
  subscriptionId: number
) {
  const ecdsaProvider = await getEcdsaProvider(ZERODEV_PROJECT_IDS[chain.id]);
  const { hash } = await ecdsaProvider.sendUserOperation({
    target: VALIDATOR_ADDRESS,
    data: encodeFunctionData({
      abi: TERMINATE_SUBSCRIPTION_FUNCTION_ABI,
      functionName: "terminateSubscription",
      args: [BigInt(subscriptionId)],
    }),
  });
  console.log("Terminating subscription with hash", hash);
  const txHash = await ecdsaProvider.waitForUserOperationTransaction(
    hash as Hex
  );
  console.log("Terminated!", txHash);
}

export async function makeSubscriptionPaymentOp(
  subscriptionProvider: SubscriptionProvider,
  tokenAddress: Hex,
  uintAmount: string,
  to: `0x${string}`,
  subscriptionId: string,
  validAfter: number, // timestamp in seconds
  nonceKey: number,
  nonceSequence: number
): Promise<UserOperationRequest> {
  let nonce = "0x";
  nonce += nonceKey.toString(16).padStart(48, "0");
  nonce += nonceSequence.toString(16).padStart(16, "0");

  const userOp: UserOperationRequest = {
    callData: await subscriptionProvider.account!.encodeExecute(
      ACCOUNT_ADDRESS,
      BigInt(0),
      encodeFunctionData({
        abi: PAYMENT_FUNCTION_ABI,
        functionName: "payForSubscription",
        args: [tokenAddress, BigInt(uintAmount), to, subscriptionId],
      })
    ),
    initCode: "0x",
    nonce: nonce as Hex,
    paymasterAndData: "0x",
    callGasLimit: toHex(300000),
    sender: ACCOUNT_ADDRESS,
    maxFeePerGas: toHex(2 * 10 ** 9),
    maxPriorityFeePerGas: toHex(2 * 10 ** 9),
    preVerificationGas: toHex(60000),
    verificationGasLimit: toHex(200000),
    signature: pad(toHex(validAfter), { size: 6 }), // Ugly hack to pass `validAfter` to the signing function
  };

  userOp.signature = concatHex([
    subscriptionProvider.getValidator().mode,
    await subscriptionProvider.getValidator().signUserOp(userOp),
  ]);

  return userOp;
}

export async function makeMultiplePaymentOps(
  chain: SupportedChain,
  token: ERC20Token,
  humanAmount: number,
  to: Hex,
  subscriptionId: number,
  intervalInSeconds: number,
  numberOfPayments: number
): Promise<UserOperationRequest[]> {
  const subscriptionProvider = await getSubscriptionProvider(chain);
  console.log(`Starting generation of ${numberOfPayments} ops`);
  const ops: UserOperationRequest[] = [];

  const uintAmount = Math.floor(humanAmount * 10 ** token.decimals).toFixed(0);
  const nowInSeconds = Math.floor(Date.now() / 1000);

  for (let i = 0; i < numberOfPayments; i++) {
    const userOp = await makeSubscriptionPaymentOp(
      subscriptionProvider,
      token.address,
      uintAmount,
      to,
      subscriptionId.toString(),
      nowInSeconds + intervalInSeconds * i,
      subscriptionId,
      i
    );
    ops.push(userOp);
  }

  return ops;
}

export async function getMyAddress(chain: SupportedChain): Promise<Hex> {
  const ecdsaProvider = await getEcdsaProvider(ZERODEV_PROJECT_IDS[chain.id]);
  return ecdsaProvider.getAccount().getAddress();
}

export async function tryPlugin() {}
