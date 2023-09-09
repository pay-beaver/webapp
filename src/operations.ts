import { LocalAccountSigner, getUserOperationHash } from "@alchemy/aa-core";
import { ECDSAProvider, ValidatorMode } from "@zerodev/sdk";
import {
  Hex,
  encodeFunctionData,
  getFunctionSelector,
  parseAbi,
  zeroAddress,
} from "viem";
import { SubscriptionProvider } from "./provider/subscriptionProvider";
import { polygonMumbai } from "viem/chains";

const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

const PRIVATE_KEY = `0x${"10".repeat(32)}` as Hex;

const ZERODEV_PROJECT_ID = "20dc52a9-91ff-43a9-9d32-1edd3cb23aff";

const ACCOUNT_ADDRESS = "0xcA9e9FC5f719ccCbC8859080981b3A3A77058C77";

const VALIDATOR_ADDRESS = "0x2e1632fa8F521B9a17CfA1E4f8d6aAB9110BcdDD";
const EXECUTOR_ADDRESS = "0xE0196A80b669Fe9cD70f57C48A768Bf64a1447d2";

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
  const subsctiptionProvider = await SubscriptionProvider.init({
    projectId: ZERODEV_PROJECT_ID,
    owner,
    opts: {
      accountConfig: {
        accountAddress: ACCOUNT_ADDRESS,
      },
      validatorConfig: {
        mode: ValidatorMode.plugin,
        validatorAddress: VALIDATOR_ADDRESS,
        executor: EXECUTOR_ADDRESS,
        selector: PAYMENT_FUNCTION_SELECTOR,
      },
    },
  });

  const ecdsaProvider = await getEcdsaProvider();
  const enableSig = await ecdsaProvider
    .getValidator()
    .approveExecutor(
      ACCOUNT_ADDRESS,
      PAYMENT_FUNCTION_SELECTOR,
      EXECUTOR_ADDRESS,
      0,
      0,
      subsctiptionProvider.getValidator()
    );
  subsctiptionProvider.getValidator().setEnableSignature(enableSig);

  return subsctiptionProvider;
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

export async function enableSubscriptionPlugin() {
  const subscriptionProvider = await getSubscriptionProvider();
  const { hash } = await subscriptionProvider.sendUserOperation({
    target: ACCOUNT_ADDRESS,
    data: encodeFunctionData({
      abi: PAYMENT_FUNCTION_ABI,
      functionName: "payForSubscription",
      args: [
        "0x1558c6FadDe1bEaf0f6628BDd1DFf3461185eA24", // some random erc20 token
        BigInt(0),
        "0x1558c6FadDe1bEaf0f6628BDd1DFf3461185eA24",
        "0",
      ],
    }),
  });

  console.log("Sent with hash", hash);
  await subscriptionProvider.waitForUserOperationTransaction(hash as Hex);
  console.log("Executed!");
}

export async function tryPlugin() {
  enableSubscriptionPlugin();
}
