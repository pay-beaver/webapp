import { LocalAccountSigner, UserOperationStruct } from "@alchemy/aa-core";
import { ECDSAProvider, ERC20Abi, ValidatorMode } from "@zerodev/sdk";
import {
  Hex,
  encodeFunctionData,
  getFunctionSelector,
  hexToNumber,
  pad,
  parseAbi,
  toHex,
} from "viem";
import { SubscriptionProvider } from "./provider/subscriptionProvider";
import { baseGoerli } from "viem/chains";
import { ERC20Token } from "./types";
import { COMP_TOKEN } from "./tokens";

const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

const PRIVATE_KEY = `0x${"10".repeat(32)}` as Hex;

const ZERODEV_PROJECT_ID = "f0847be6-87cf-4ea6-b291-ec28dbf3e086";

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

export async function getEcdsaProvider(): Promise<ECDSAProvider> {
  const owner = LocalAccountSigner.privateKeyToAccountSigner(PRIVATE_KEY);
  let ecdsaProvider = await ECDSAProvider.init({
    projectId: ZERODEV_PROJECT_ID,
    owner,
    opts: {
      accountConfig: {
        accountAddress: ACCOUNT_ADDRESS,
      },
    },
  });
  return ecdsaProvider;
}

export async function getSubscriptionProvider(): Promise<SubscriptionProvider> {
  const owner = LocalAccountSigner.privateKeyToAccountSigner(PRIVATE_KEY);
  const ecdsaProvider = await getEcdsaProvider();
  const subsctiptionProvider = await SubscriptionProvider.init({
    projectId: ZERODEV_PROJECT_ID,
    owner,
    opts: {
      accountConfig: {
        accountAddress: ACCOUNT_ADDRESS,
        defaultValidator: ecdsaProvider.getValidator(),
        chain: baseGoerli,
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

export async function sendERC20Token() {
  const ecdsaProvider = await getEcdsaProvider();
  const { hash } = await ecdsaProvider.sendUserOperation({
    target: COMP_TOKEN.address,
    data: encodeFunctionData({
      abi: ERC20Abi,
      functionName: "transfer",
      args: [ACCOUNT_ADDRESS, BigInt(0)],
    }),
  });
  console.log("Sent with hash", hash);
  await ecdsaProvider.waitForUserOperationTransaction(hash as Hex);
  console.log("Executed!");
}

export async function terminateSubscription() {
  const ecdsaProvider = await getEcdsaProvider();
  const { hash } = await ecdsaProvider.sendUserOperation({
    target: VALIDATOR_ADDRESS,
    data: encodeFunctionData({
      abi: TERMINATE_SUBSCRIPTION_FUNCTION_ABI,
      functionName: "terminateSubscription",
      args: [BigInt(4)],
    }),
  });
  console.log("Terminating subscription with hash", hash);
  await ecdsaProvider.waitForUserOperationTransaction(hash as Hex);
  console.log("Terminated!");
}

export async function makeSubscriptionPaymentOp(
  token: ERC20Token,
  uintAmount: string,
  to: `0x${string}`,
  subscriptionId: string,
  validAfter: number, // timestamp in seconds
  nonceKey: number,
  nonceSequence: number
): Promise<UserOperationStruct> {
  const userOp: UserOperationStruct = {
    callData: 
  };


  const subscriptionProvider = await getSubscriptionProvider();
  const userOp = await subscriptionProvider.buildUserOperation({
    target: ACCOUNT_ADDRESS,
    data: encodeFunctionData({
      abi: PAYMENT_FUNCTION_ABI,
      functionName: "payForSubscription",
      args: [token.address, BigInt(uintAmount), to, subscriptionId],
    }),
  });
  userOp.nonce =
    "0x" +
    nonceKey.toString(16).padStart(48, "0") +
    nonceSequence.toString(16).padStart(16, "0");
  userOp.verificationGasLimit = 200000; // For some reason it is estimated badly
  userOp.signature = pad(toHex(validAfter), { size: 6 }); // Ugly hack to pass `validAfter` to the signing function
  userOp.maxPriorityFeePerGas = 2 * 10 ** 9;
  userOp.maxFeePerGas = 2 * 10 ** 9;
  userOp.callGasLimit = toHex(userOp.callGasLimit || 0);
  userOp.preVerificationGas = toHex(userOp.preVerificationGas || 0);
  userOp.signature = await subscriptionProvider
    .getValidator()
    .getSignature(userOp as any);

  return userOp;
}

export async function tryPlugin() {
  console.log("Starting generation");
  const userOp = await makeSubscriptionPaymentOp(
    COMP_TOKEN,
    "2" + "0".repeat(17),
    "0x4bBa290826C253BD854121346c370a9886d1bC26",
    "test-subscription",
    0,
    5,
    0
  );
  console.log("Generation finished", userOp);

  const ecdsaProvider = await getEcdsaProvider();
  const hash = await ecdsaProvider.rpcClient.sendUserOperation(
    userOp as any,
    ENTRY_POINT_ADDRESS
  );
  console.log("Sent with hash", hash);
  const txHash = await ecdsaProvider.waitForUserOperationTransaction(
    hash as Hex
  );
  console.log("Executed!", txHash);
}
