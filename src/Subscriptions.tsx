import { Button, Frame, Toast } from "@shopify/polaris";
import { ERC20Token, Subscription, SupportedChain } from "./types";
import { secondsToWord, shortenAddress, timestampNow } from "./utils";
import { useNavigate } from "react-router-dom";
import {
  addActivityAction,
  cancelSubscription as cancelSubscriptionStorage,
  getChainSubscriptions,
  getChainTokens,
} from "./storage";
import { useEffect, useState } from "react";
import { terminateSubscription } from "./operations";
import { Hex } from "viem";

function SinglePaymentComponent(props: {
  chain: SupportedChain;
  subscription: Subscription;
  tokens: ERC20Token[];
  canceled: boolean;
  onCancelSuccess: () => void;
}) {
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const token = props.tokens.find(
    (token) =>
      token.address === props.subscription.tokenAddress &&
      token.chainId === props.subscription.chainId
  );
  const alreadyMadePayments = Math.ceil(
    (timestampNow() - props.subscription.startedAt) /
      props.subscription.intervalInSeconds
  );
  const nextPaymentTs =
    props.subscription.startedAt +
    alreadyMadePayments * props.subscription.intervalInSeconds;
  const nextPaymentHumanized = new Date(nextPaymentTs * 1000).toLocaleString();

  const onCancel = async () => {
    setCancelling(true);
    setErrorMessage(null);
    let userOpHash: Hex;
    try {
      userOpHash = await terminateSubscription(
        props.chain,
        props.subscription.id
      );
    } catch (e) {
      setCancelling(false);
      setErrorMessage("Failed to cancel. Do you have enough ETH?");
      return;
    }
    cancelSubscriptionStorage(props.subscription.id);
    addActivityAction({
      chainId: props.chain.id,
      title: "Canceled subscription",
      description: `Canceled "${props.subscription.name}" subscription. No more payments will be made.`,
      timestamp: timestampNow(),
      userOpHash,
      activityType: "start-subscription",
    });
    setCancelling(false);
    props.onCancelSuccess();
  };

  return token ? (
    <div style={{ marginBottom: 20 }}>
      <p style={{ color: props.canceled ? "grey" : "black" }}>
        {props.subscription.name}
      </p>
      <p style={{ color: props.canceled ? "grey" : "black" }}>
        {props.subscription.humanAmount.toFixed(2)} {token.symbol} per{" "}
        {secondsToWord(props.subscription.intervalInSeconds)} to{" "}
        {shortenAddress(props.subscription.to)}
      </p>
      {!props.canceled && (
        <p style={{ color: "black" }}>Next payment at {nextPaymentHumanized}</p>
      )}
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
      <Button
        size="micro"
        destructive
        onClick={onCancel}
        disabled={props.canceled || cancelling}
      >
        {cancelling ? "Cancelling..." : "Cancel"}
      </Button>
    </div>
  ) : (
    <p>
      Please import token {props.subscription.tokenAddress} on chain{" "}
      {props.subscription.chainId} into your account
    </p>
  );
}

export function SubscriptionsComponent(props: { chain: SupportedChain }) {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [tokens, setTokens] = useState<ERC20Token[]>([]);

  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.canceledAt === null
  );
  const canceledSubscriptions = subscriptions.filter(
    (subscription) => subscription.canceledAt !== null
  );

  const loadData = () => {
    const chainTokens = getChainTokens(props.chain);
    setTokens(chainTokens);
    const userSubscriptions = getChainSubscriptions(props.chain);
    setSubscriptions(
      userSubscriptions.sort((a, b) => b.startedAt - a.startedAt)
    );
  };

  useEffect(() => {
    loadData();
  }, [props.chain]);

  return (
    <div>
      <Button
        onClick={() =>
          navigate("/add-subscription", { state: { chain: props.chain } })
        }
      >
        Setup new subscription
      </Button>
      <p
        style={{
          fontWeight: "bolder",
          fontSize: 16,
          marginTop: 16,
          marginBottom: 8,
        }}
      >
        Active
      </p>
      {activeSubscriptions.length === 0 && (
        <p style={{ color: "grey" }}>No active subscriptions</p>
      )}
      {activeSubscriptions.map((subscription, index) => (
        <SinglePaymentComponent
          key={index}
          subscription={subscription}
          tokens={tokens}
          canceled={false}
          chain={props.chain}
          onCancelSuccess={loadData}
        />
      ))}
      <p
        style={{
          fontWeight: "bolder",
          fontSize: 16,
          marginTop: 8,
          marginBottom: 8,
        }}
      >
        Canceled
      </p>
      {canceledSubscriptions.length === 0 && (
        <p style={{ color: "grey" }}>No canceled subscriptions</p>
      )}
      {canceledSubscriptions.map((subscription, index) => (
        <SinglePaymentComponent
          key={index}
          subscription={subscription}
          tokens={tokens}
          canceled={true}
          chain={props.chain}
          onCancelSuccess={loadData}
        />
      ))}
    </div>
  );
}
