import {
  LocalAccountSigner,
  UserOperationCallData,
  UserOperationRequest,
  getUserOperationHash,
} from "@alchemy/aa-core";
import { ECDSAProvider, ERC20Abi, ValidatorMode } from "@zerodev/sdk";
import {
  Hex,
  concatHex,
  createPublicClient,
  encodeFunctionData,
  getAddress,
  getFunctionSelector,
  http,
  pad,
  parseAbi,
  toHex,
} from "viem";
import { SubscriptionProvider } from "./provider/subscriptionProvider";
import { base, baseGoerli } from "viem/chains";
import {
  ERC20Token,
  NATIVE_TOKEN_ADDRESS,
  SupportedChain,
  ViemChain,
} from "./types";
import { getDecryptedPrivateKey, getMyAddressStorage } from "./storage";

const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
const NONEXISTENT_RANDOM_ADDRESS = "0xc8Ed97256DFBf0926639e373b0b42c31c438f2b4";

const ZERODEV_PROJECT_IDS = {
  [baseGoerli.id]: "f0847be6-87cf-4ea6-b291-ec28dbf3e086",
  [base.id]: "9bedf0c4-17e6-4b4b-8ccb-a7e1f6e05097",
};

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

const SUBSCRIPTION_VALIDATOR_STORAGE_SOLIDITY =
  "function subscriptionValidatorStorage(address account) returns (address)";
const SUBSCRIPTION_VALIDATOR_STORAGE_ABI = parseAbi([
  SUBSCRIPTION_VALIDATOR_STORAGE_SOLIDITY,
]);

function getOwner() {
  return LocalAccountSigner.privateKeyToAccountSigner(
    getDecryptedPrivateKey()!
  );
}

export async function getMyAddressFromOwner(
  chain: SupportedChain
): Promise<Hex> {
  const ecdsaProvider = await getEcdsaProvider(ZERODEV_PROJECT_IDS[chain.id]);
  return ecdsaProvider.getAccount().getAddress();
}

export async function getEcdsaProvider(
  projectId: string
): Promise<ECDSAProvider> {
  const owner = getOwner();
  let ecdsaProvider = await ECDSAProvider.init({
    projectId,
    owner,
    opts: {
      accountConfig: {
        accountAddress: getMyAddressStorage()!,
      },
    },
  });
  return ecdsaProvider;
}

export async function getSubscriptionProvider(
  chain: SupportedChain
): Promise<SubscriptionProvider> {
  const projectId = ZERODEV_PROJECT_IDS[chain.id];
  const owner = getOwner();
  const ecdsaProvider = await getEcdsaProvider(projectId);
  const subsctiptionProvider = await SubscriptionProvider.init({
    projectId,
    owner,
    opts: {
      accountConfig: {
        accountAddress: getMyAddressStorage()!,
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
): Promise<Hex> {
  const uintAmount = Math.floor(humanAmount * 10 ** token.decimals);
  const ecdsaProvider = await getEcdsaProvider(
    ZERODEV_PROJECT_IDS[baseGoerli.id]
  );

  let userOpBuildingData: UserOperationCallData;
  if (token.address === NATIVE_TOKEN_ADDRESS) {
    userOpBuildingData = {
      target: to,
      value: BigInt(uintAmount),
      data: "0x",
    };
  } else {
    userOpBuildingData = {
      target: token.address,
      data: encodeFunctionData({
        abi: ERC20Abi,
        functionName: "transfer",
        args: [to, BigInt(uintAmount)],
      }),
    };
  }

  const { hash } = await ecdsaProvider.sendUserOperation(userOpBuildingData);
  console.log("Sent with hash", hash);
  const txHash = await ecdsaProvider.waitForUserOperationTransaction(
    hash as Hex
  );
  console.log("Executed!", txHash);
  return hash as Hex;
}

export async function terminateSubscription(
  chain: SupportedChain,
  subscriptionId: number
): Promise<Hex> {
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
  return hash as Hex;
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
      getMyAddressStorage()!,
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
    sender: getMyAddressStorage()!,
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

export async function makeSubscriptionPaymentHashes(
  subscriptionProvider: SubscriptionProvider,
  chain: SupportedChain,
  token: ERC20Token,
  humanAmount: number,
  to: Hex,
  subscriptionId: number,
  startingTimestamp: number,
  intervalInSeconds: number,
  passedPaymentsCount: number
): Promise<Hex[]> {
  const uintAmount = Math.floor(humanAmount * 10 ** token.decimals).toFixed(0);

  const hashes: Hex[] = [];
  for (let i = 0; i < passedPaymentsCount; i++) {
    const userOp = await makeSubscriptionPaymentOp(
      subscriptionProvider,
      token.address,
      uintAmount,
      to,
      subscriptionId.toString(),
      startingTimestamp + intervalInSeconds * i,
      subscriptionId,
      i
    );

    const hash = getUserOperationHash(
      {
        ...userOp,
        signature: "0x",
      },
      ENTRY_POINT_ADDRESS,
      BigInt(chain.id)
    ) as Hex;

    hashes.push(hash);
  }

  return hashes;
}

export async function makeMultiplePaymentOps(
  chain: SupportedChain,
  token: ERC20Token,
  humanAmount: number,
  to: Hex,
  subscriptionId: number,
  startingTimestamp: number,
  intervalInSeconds: number,
  numberOfPayments: number
): Promise<UserOperationRequest[]> {
  const subscriptionProvider = await getSubscriptionProvider(chain);
  console.log(`Starting generation of ${numberOfPayments} ops`);
  const ops: UserOperationRequest[] = [];

  const uintAmount = Math.floor(humanAmount * 10 ** token.decimals).toFixed(0);

  for (let i = 0; i < numberOfPayments; i++) {
    const userOp = await makeSubscriptionPaymentOp(
      subscriptionProvider,
      token.address,
      uintAmount,
      to,
      subscriptionId.toString(),
      startingTimestamp + intervalInSeconds * i,
      subscriptionId,
      i
    );
    ops.push(userOp);
  }

  return ops;
}

export async function getOnChainSubscriptionsEnabled(
  chain: SupportedChain
): Promise<boolean> {
  const rpcClient = createPublicClient({
    chain: chain,
    transport: http(),
  });
  const result = await rpcClient.call({
    to: VALIDATOR_ADDRESS,
    data: encodeFunctionData({
      abi: SUBSCRIPTION_VALIDATOR_STORAGE_ABI,
      functionName: "subscriptionValidatorStorage",
      args: [getMyAddressStorage()!],
    }),
  });
  if (result.data === undefined) {
    return false;
  }
  if (result.data.length !== 66 || !result.data.startsWith("0x")) {
    throw new Error(
      `Invalid result ${result.data} when getting subscriptions owner`
    );
  }
  const onChainOwnerAddress = getAddress(`0x${result.data.slice(-40)}`);
  const realOwnerAddress = await getOwner().getAddress();
  return onChainOwnerAddress.toLowerCase() === realOwnerAddress.toLowerCase();
}

export async function deployKernel(chain: ViemChain) {
  const ecdsaProvider = await getEcdsaProvider(
    ZERODEV_PROJECT_IDS[chain.id as keyof typeof ZERODEV_PROJECT_IDS]
  );
  const { hash } = await ecdsaProvider.sendUserOperation({
    target: "0x4bBa290826C253BD854121346c370a9886d1bC26", // any address
    data: "0x",
  });
  console.log("Deploying kernel with user op hash", hash);
  const txHash = await ecdsaProvider.waitForUserOperationTransaction(
    hash as Hex
  );
  console.log("Deployed Kernel with tx hash", txHash);
}

export async function enableSubscriptionsPlugin(
  chain: SupportedChain,
  sampleToken: ERC20Token
) {
  const subscriptionProvider = await getSubscriptionProvider(chain);
  const subscriptionId = Math.floor(Math.random() * 1e6);
  const userOp = await makeSubscriptionPaymentOp(
    subscriptionProvider,
    sampleToken.address,
    "0",
    NONEXISTENT_RANDOM_ADDRESS,
    subscriptionId.toString(),
    0,
    subscriptionId,
    0
  );
  const userOpHash = await subscriptionProvider.rpcClient.sendUserOperation(
    userOp,
    ENTRY_POINT_ADDRESS
  );
  console.log("Sent user op to enable subscriptions plugin", userOpHash);
  const txHash = await subscriptionProvider.waitForUserOperationTransaction(
    userOpHash
  );
  console.log("Enabled subscriptions plugin with tx hash", txHash);
}

export async function fullySetupSubscriptionsOnChain(
  chain: SupportedChain,
  sampleToken: ERC20Token
) {
  const rpcClient = createPublicClient({
    chain: chain,
    transport: http(),
  });
  const walletBytecode = await rpcClient.getBytecode({
    address: getMyAddressStorage()!,
  });
  if (walletBytecode === undefined) {
    await deployKernel(chain);
  }

  const onChainSubscriptionsEnabled = await getOnChainSubscriptionsEnabled(
    chain
  );
  if (!onChainSubscriptionsEnabled) {
    await enableSubscriptionsPlugin(chain, sampleToken);
  }
}
