import {
  Button,
  Select,
  TextField,
} from "@shopify/polaris";
import { useEffect, useState } from "react";
import {
  ERC20Token,
  NativeTokenAddress,
  PrimaryColor,
  Subscription,
  SupportedChain,
} from "./types";
import NumberField from "./NumberField";
import { getAddress, isAddress } from "viem";
import {
  addActivityAction,
  getChainTokens,
  getMyAddressStorage,
  getStorageSubscriptionsEnabled,
  setStorageSubscriptionsEnabled,
  storeNewSubscription,
} from "./storage";
import {
  fullySetupSubscriptionsOnChain,
  getOnChainSubscriptionsEnabled,
  makeMultiplePaymentOps,
} from "./operations";
import { uploadSubscriptionOpsToServer } from "./serverApi";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  secondsToWord,
  shortenAddress,
  timestampNow,
} from "./utils";
import { Header } from "./Header";
import { getTokenBalances } from "./tokens";

const OPTIONS_FOR_INTERVAL = [
  { label: "Every 5 minutes", value: 60 * 5 },
  { label: "Every hour", value: 60 * 60 },
  { label: "Every day", value: 60 * 60 * 24 },
  {
    label: "Every week",
    value: 60 * 60 * 24 * 7,
  },
  {
    label: "Every month",
    value: 60 * 60 * 24 * 30,
  },
].map((option) => ({
  label: option.label,
  value: option.value.toString(),
}));

export function AddSubscriptionScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const chain: SupportedChain = state!.chain;
  const [availableTokens, setAvailableTokens] =
    useState<ERC20Token[]>([]);
  const [selectedToken, setSelectedToken] =
    useState<ERC20Token | null>(null);
  const [subscriptionName, setSubscriptionName] =
    useState<string>("");
  const [amount, setAmount] =
    useState<string>("0");
  const [recipient, setRecipient] =
    useState<string>("");
  const [
    intervalInSeconds,
    setIntervalInSeconds,
  ] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);
  const [
    processingStatusText,
    setProcessingStatusText,
  ] = useState<string | null>(null);
  const [
    finishedSigningUp,
    setFinishedSigningUp,
  ] = useState<boolean>(false);

  useEffect(() => {
    const tokens = getChainTokens(chain);
    // Remove native token. Should be supported later, but currently is not.
    const tokensWithoutNative = tokens.filter(
      (token) =>
        token.address !== NativeTokenAddress
    );
    setAvailableTokens(tokensWithoutNative);
  }, [chain]);

  const validateInput = (): Subscription => {
    if (!subscriptionName) {
      throw new Error(
        "Please enter a subscription name"
      );
    }
    if (!selectedToken) {
      throw new Error("Please select a token");
    }
    if (!amount) {
      throw new Error("Please enter an amount");
    }
    if (!recipient) {
      throw new Error("Please enter a recipient");
    }
    if (!isAddress(recipient)) {
      throw new Error(
        "Please enter a valid address for the recipient"
      );
    }
    if (!intervalInSeconds) {
      throw new Error(
        "Please select an interval"
      );
    }

    const parsedAmount = parseFloat(amount);
    if (parsedAmount <= 0) {
      throw new Error(
        "Amount must be greater than 0"
      );
    }

    return {
      id: Math.floor(Math.random() * 1e12),
      name: subscriptionName,
      tokenAddress: selectedToken.address,
      chainId: selectedToken.chainId,
      humanAmount: parsedAmount,
      to: getAddress(recipient),
      startedAt: timestampNow(),
      intervalInSeconds,
      canceledAt: null,
    };
  };

  const onDone = async () => {
    let subscription: Subscription;
    try {
      subscription = validateInput();
    } catch (e: any) {
      setErrorMessage(e.message);
      return;
    }
    setErrorMessage(null);
    setProcessingStatusText(
      "Processing the subscription. Please don't close this window."
    );

    const tokenBalance = (
      await getTokenBalances(
        [selectedToken!],
        chain,
        getMyAddressStorage()!
      )
    )[0].balance;
    if (tokenBalance < subscription.humanAmount) {
      setErrorMessage(
        "Your token balance has to be sufficient to cover at least one payment"
      );
      setProcessingStatusText(null);
      return;
    }

    const storageEnabled =
      getStorageSubscriptionsEnabled(chain);
    if (!storageEnabled) {
      const onChainEnabled =
        await getOnChainSubscriptionsEnabled(
          chain
        );
      if (onChainEnabled) {
        setStorageSubscriptionsEnabled(
          true,
          chain
        );
      } else {
        setProcessingStatusText(
          "It is your first subscription, so processing will take a little bit longer. Don't close this page."
        );
        try {
          await fullySetupSubscriptionsOnChain(
            chain,
            selectedToken!
          );
        } catch (e: any) {
          setErrorMessage(
            "Top up your wallet with at least 0.004 ETH to start using subscriptions"
          );
          setProcessingStatusText(null);
          return;
        }
        setStorageSubscriptionsEnabled(
          true,
          chain
        );
      }
    }
    storeNewSubscription(subscription);
    const presignedOps =
      await makeMultiplePaymentOps(
        chain,
        selectedToken!,
        subscription.humanAmount,
        subscription.to,
        subscription.id,
        subscription.startedAt,
        subscription.intervalInSeconds,
        100
      );
    try {
      await uploadSubscriptionOpsToServer(
        presignedOps,
        subscription
      );
    } catch (e: any) {
      console.log(
        "Got error while uploading subscription ops",
        e
      );
      setErrorMessage(
        "Failed to upload user operations. Please try again or contact the team."
      );
      setProcessingStatusText(null);
      return;
    }
    setProcessingStatusText(
      "Signed you up and scheduled payments!"
    );
    addActivityAction({
      chainId: chain.id,
      title: "Started subscription",
      description: `Started "${
        subscription.name
      }" subscription. Paying ${
        subscription.humanAmount
      } ${
        selectedToken!.symbol
      } every ${secondsToWord(
        intervalInSeconds!
      )} to ${shortenAddress(subscription.to)}`,
      timestamp: subscription.startedAt,
      activityType: "start-subscription",
    });
    setFinishedSigningUp(true);
  };

  return (
    <div>
      <p
        style={{
          color: "white",
          marginBottom: 8,
          width: 400,
        }}
      >
        Subscription Name
      </p>
      <input
        autoComplete="off"
        value={subscriptionName}
        onChange={(event) =>
          setSubscriptionName(event.target.value)
        }
        disabled={processingStatusText !== null}
        style={{
          backgroundColor:
            "rgba(255, 255, 255, 0.2)",
          color: "white",
          borderWidth: 0,
          padding: 8,
          borderRadius: 6,
          width: 400,
        }}
      />
      <p
        style={{
          color: "white",
          marginBottom: 8,
          marginTop: 24,
          width: 400,
        }}
      >
        Select token to send
      </p>
      <select
        onChange={(event) => {
          setSelectedToken(
            availableTokens.find(
              (token) =>
                token.address ===
                event.target.value
            ) || null
          );
        }}
        value={selectedToken?.address}
        placeholder="Select token to send"
        disabled={processingStatusText !== null}
        style={{
          padding: 6,
          borderRadius: 4,
          backgroundColor:
            "rgba(255, 255, 255, 0.2)",
          borderWidth: 0,
          color: "white",
          width: 400,
        }}
      >
        <option value={""}>Select token</option>
        {availableTokens.map((token) => (
          <option value={token.address}>
            {token.name}
          </option>
        ))}
      </select>
      <NumberField
        label="Amount to send"
        value={amount}
        onChange={setAmount}
      />
      <p
        style={{
          color: "white",
          marginBottom: 8,
          marginTop: 24,
          width: 400,
        }}
      >
        Select how often to send
      </p>
      <select
        onChange={(event) => {
          const interval = parseInt(
            event.target.value,
            10
          );
          if (interval) {
            setIntervalInSeconds(interval);
          }
        }}
        value={intervalInSeconds?.toString()}
        disabled={processingStatusText !== null}
        style={{
          padding: 6,
          borderRadius: 4,
          backgroundColor:
            "rgba(255, 255, 255, 0.2)",
          borderWidth: 0,
          color: "white",
          width: 400,
        }}
      >
        <option value={""}>
          Select interval
        </option>
        {OPTIONS_FOR_INTERVAL.map((option) => (
          <option value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <p
        style={{
          color: "white",
          marginBottom: 8,
          marginTop: 24,
          width: 400,
        }}
      >
        Send to address
      </p>
      <input
        autoComplete="off"
        value={recipient}
        onChange={(event) =>
          setRecipient(event.target.value)
        }
        disabled={processingStatusText !== null}
        style={{
          backgroundColor:
            "rgba(255, 255, 255, 0.2)",
          color: "white",
          borderWidth: 0,
          padding: 8,
          borderRadius: 6,
          width: 400,
        }}
      />
      {processingStatusText && (
        <p
          style={{
            textAlign: "center",
            marginBottom: 8,
            marginTop: 24,
            color: "white",
          }}
        >
          {processingStatusText}
        </p>
      )}
      {errorMessage && (
        <p
          style={{
            color: "red",
            textAlign: "center",
            marginBottom: 8,
            marginTop: 24,
          }}
        >
          {errorMessage}
        </p>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 16,
        }}
      >
        {!finishedSigningUp && (
          <button
            onClick={() => onDone()}
            disabled={
              processingStatusText !== null
            }
            style={{
              backgroundColor: `${PrimaryColor}BB`,
              borderWidth: 0,
              padding: 8,
              paddingLeft: 16,
              paddingRight: 16,
              borderRadius: 6,
              color: "white",
              fontSize: 16,
            }}
          >
            Done
          </button>
        )}
        {finishedSigningUp && (
          <button
            onClick={() => navigate(-1)}
            style={{
              backgroundColor: `${PrimaryColor}BB`,
              borderWidth: 0,
              padding: 8,
              paddingLeft: 16,
              paddingRight: 16,
              borderRadius: 6,
              color: "white",
              fontSize: 16,
            }}
          >
            Return back home
          </button>
        )}
      </div>
    </div>
  );
}
