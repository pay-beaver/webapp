import { Button, Select, TextField } from "@shopify/polaris";
import { useEffect, useState } from "react";
import {
  ERC20Token,
  NATIVE_TOKEN_ADDRESS,
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
import { useLocation, useNavigate } from "react-router-dom";
import { secondsToWord, shortenAddress, timestampNow } from "./utils";
import { Header } from "./Header";
import { getTokenBalances } from "./tokens";

const OPTIONS_FOR_INTERVAL = [
  { label: "Every 5 minutes", value: 60 * 5 },
  { label: "Every hour", value: 60 * 60 },
  { label: "Every day", value: 60 * 60 * 24 },
  { label: "Every week", value: 60 * 60 * 24 * 7 },
  { label: "Every month", value: 60 * 60 * 24 * 30 },
].map((option) => ({ label: option.label, value: option.value.toString() }));

export function AddSubscriptionScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const chain: SupportedChain = state!.chain;
  const [availableTokens, setAvailableTokens] = useState<ERC20Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<ERC20Token | null>(null);
  const [subscriptionName, setSubscriptionName] = useState<string>("");
  const [amount, setAmount] = useState<string>("0");
  const [recipient, setRecipient] = useState<string>("");
  const [intervalInSeconds, setIntervalInSeconds] = useState<number | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingStatusText, setProcessingStatusText] = useState<
    string | null
  >(null);
  const [finishedSigningUp, setFinishedSigningUp] = useState<boolean>(false);

  useEffect(() => {
    const tokens = getChainTokens(chain);
    // Remove native token. Should be supported later, but currently is not.
    const tokensWithoutNative = tokens.filter(
      (token) => token.address !== NATIVE_TOKEN_ADDRESS
    );
    setAvailableTokens(tokensWithoutNative);
  }, [chain]);

  const validateInput = (): Subscription => {
    if (!subscriptionName) {
      throw new Error("Please enter a subscription name");
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
      throw new Error("Please enter a valid address for the recipient");
    }
    if (!intervalInSeconds) {
      throw new Error("Please select an interval");
    }

    const parsedAmount = parseFloat(amount);
    if (parsedAmount <= 0) {
      throw new Error("Amount must be greater than 0");
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
      await getTokenBalances([selectedToken!], chain, getMyAddressStorage()!)
    )[0].balance;
    if (tokenBalance < subscription.humanAmount) {
      setErrorMessage(
        "Your token balance has to be sufficient to cover at least one payment"
      );
      setProcessingStatusText(null);
      return;
    }

    const storageEnabled = getStorageSubscriptionsEnabled(chain);
    if (!storageEnabled) {
      const onChainEnabled = await getOnChainSubscriptionsEnabled(chain);
      if (onChainEnabled) {
        setStorageSubscriptionsEnabled(true, chain);
      } else {
        setProcessingStatusText(
          "It is your first subscription, so processing will take a little bit longer."
        );
        try {
          await fullySetupSubscriptionsOnChain(chain, selectedToken!);
        } catch (e: any) {
          setErrorMessage(
            "Top up your wallet with at least 0.004 ETH to start using subscriptions"
          );
          setProcessingStatusText(null);
          return;
        }
        setStorageSubscriptionsEnabled(true, chain);
      }
    }
    storeNewSubscription(subscription);
    const presignedOps = await makeMultiplePaymentOps(
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
      await uploadSubscriptionOpsToServer(presignedOps, subscription);
    } catch (e: any) {
      console.log("Got error while uploading subscription ops", e);
      setErrorMessage(
        "Failed to upload user operations. Please try again or contact the team."
      );
      setProcessingStatusText(null);
      return;
    }
    setProcessingStatusText("Signed you up and scheduled payments!");
    addActivityAction({
      chainId: chain.id,
      title: "Started subscription",
      description: `Started "${subscription.name}" subscription. Paying ${
        subscription.humanAmount
      } ${selectedToken!.symbol} every ${secondsToWord(
        intervalInSeconds!
      )} to ${shortenAddress(subscription.to)}`,
      timestamp: subscription.startedAt,
      activityType: "start-subscription",
    });
    setFinishedSigningUp(true);
  };

  return (
    <div>
      <Header canGoBack={true} screenTitle="Subscription" />
      <TextField
        label="Subscription Name"
        autoComplete="off"
        value={subscriptionName}
        onChange={setSubscriptionName}
        disabled={processingStatusText !== null}
      />
      <Select
        label="Token to send"
        options={availableTokens.map((token) => {
          return {
            label: token.name,
            value: token.address,
          };
        })}
        onChange={(value) => {
          setSelectedToken(
            availableTokens.find((token) => token.address === value) || null
          );
        }}
        value={selectedToken?.address}
        placeholder="Select token to send"
        disabled={processingStatusText !== null}
      />
      <NumberField
        label="Amount to send"
        value={amount}
        onChange={setAmount}
        disabled={processingStatusText !== null}
      />
      <Select
        label="Send every"
        options={OPTIONS_FOR_INTERVAL}
        placeholder="Select how often to send"
        value={intervalInSeconds?.toString()}
        onChange={(value) => {
          const interval = parseInt(value, 10);
          if (interval) {
            setIntervalInSeconds(interval);
          }
        }}
        disabled={processingStatusText !== null}
      />
      <TextField
        label="Send to address"
        autoComplete="off"
        value={recipient}
        onChange={setRecipient}
        disabled={processingStatusText !== null}
      />
      {processingStatusText && (
        <p style={{ textAlign: "center", marginTop: 10 }}>
          {processingStatusText}
        </p>
      )}
      {errorMessage && (
        <p style={{ color: "red", textAlign: "center", marginTop: 10 }}>
          {errorMessage}
        </p>
      )}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
        {!finishedSigningUp && (
          <Button
            primary
            onClick={() => onDone()}
            disabled={processingStatusText !== null}
          >
            Done
          </Button>
        )}
        {finishedSigningUp && (
          <Button primary onClick={() => navigate(-1)}>
            Return back home
          </Button>
        )}
      </div>
    </div>
  );
}
