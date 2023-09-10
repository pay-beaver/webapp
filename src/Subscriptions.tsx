import { Button } from "@shopify/polaris";
import { ERC20Token, Subscription, SupportedChain } from "./types";
import { secondsToWord, shortenAddress } from "./utils";
import { useNavigate } from "react-router-dom";
import {
  cancelSubscription,
  getChainTokens,
  getSubscriptions,
  getTokens,
} from "./storage";
import { useEffect, useState } from "react";
import { terminateSubscription } from "./operations";

function SinglePaymentComponent(props: {
  chain: SupportedChain;
  subscription: Subscription;
  tokens: ERC20Token[];
  canceled: boolean;
}) {
  const [cancelling, setCancelling] = useState<boolean>(false);

  const token = props.tokens.find(
    (token) =>
      token.address === props.subscription.tokenAddress &&
      token.chainId === props.subscription.chainId
  );

  const onCancel = async () => {
    setCancelling(true);
    await terminateSubscription(props.chain, props.subscription.id);
    cancelSubscription(props.subscription.id);
    setCancelling(false);
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
    (subscription) => !subscription.canceled
  );
  const canceledSubscriptions = subscriptions.filter(
    (subscription) => subscription.canceled
  );

  useEffect(() => {
    const chainTokens = getChainTokens(props.chain);
    setTokens(chainTokens);
    const userSubscriptions = getSubscriptions();
    setSubscriptions(
      userSubscriptions.filter(
        (subscription) => subscription.chainId === props.chain.id
      )
    );
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
        />
      ))}
    </div>
  );
}
