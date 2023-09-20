import {
  Button,
  Frame,
  Toast,
} from "@shopify/polaris";
import {
  ERC20Token,
  PrimaryColor,
  Subscription,
  SupportedChain,
} from "./types";
import {
  secondsToWord,
  shortenAddress,
  timestampNow,
} from "./utils";
import { useNavigate } from "react-router-dom";
import {
  addActivityAction,
  cancelSubscription as cancelSubscriptionStorage,
  getChainSubscriptions,
  getChainTokens,
} from "./storage";
import {
  useContext,
  useEffect,
  useState,
} from "react";
import { terminateSubscription } from "./operations";
import { Hex } from "viem";
import { SettingsContext } from "./GeneralSettings";

function SinglePaymentComponent(props: {
  chain: SupportedChain;
  subscription: Subscription;
  tokens: ERC20Token[];
  canceled: boolean;
  onCancelSuccess: () => void;
}) {
  const [cancelling, setCancelling] =
    useState<boolean>(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);
  const token = props.tokens.find(
    (token) =>
      token.address ===
        props.subscription.tokenAddress &&
      token.chainId === props.subscription.chainId
  );
  const alreadyMadePayments = Math.ceil(
    (timestampNow() -
      props.subscription.startedAt) /
      props.subscription.intervalInSeconds
  );
  const nextPaymentTs =
    props.subscription.startedAt +
    alreadyMadePayments *
      props.subscription.intervalInSeconds;
  const nextPaymentHumanized = new Date(
    nextPaymentTs * 1000
  ).toLocaleString();

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
      setErrorMessage(
        "Failed to cancel. Do you have enough ETH?"
      );
      return;
    }
    cancelSubscriptionStorage(
      props.subscription.id
    );
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
    <div
      style={{
        marginBottom: 20,
        border: "2px solid #FFFFFF44",
        padding: 12,
        width: "fit-content",
        borderRadius: 12,
      }}
    >
      <p
        style={{
          color: props.canceled
            ? "grey"
            : "white",
          fontWeight: "bolder",
        }}
      >
        {props.subscription.name}
      </p>
      <p
        style={{
          color: props.canceled
            ? "grey"
            : "white",
        }}
      >
        {props.subscription.humanAmount.toFixed(
          2
        )}{" "}
        {token.symbol} per{" "}
        {secondsToWord(
          props.subscription.intervalInSeconds
        )}{" "}
        to {shortenAddress(props.subscription.to)}
      </p>
      {!props.canceled && (
        <p
          style={{
            color: "white",
            marginBottom: 4,
          }}
        >
          Next payment at {nextPaymentHumanized}
        </p>
      )}
      {errorMessage && (
        <p style={{ color: "red" }}>
          {errorMessage}
        </p>
      )}
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
      Please import token{" "}
      {props.subscription.tokenAddress} on chain{" "}
      {props.subscription.chainId} into your
      account
    </p>
  );
}

export function SubscriptionsComponent() {
  const { chain } = useContext(SettingsContext);
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] =
    useState<Subscription[]>([]);
  const [tokens, setTokens] = useState<
    ERC20Token[]
  >([]);

  const activeSubscriptions =
    subscriptions.filter(
      (subscription) =>
        subscription.canceledAt === null
    );
  const canceledSubscriptions =
    subscriptions.filter(
      (subscription) =>
        subscription.canceledAt !== null
    );

  const loadData = () => {
    const chainTokens = getChainTokens(chain);
    setTokens(chainTokens);
    const userSubscriptions =
      getChainSubscriptions(chain);
    setSubscriptions(
      userSubscriptions.sort(
        (a, b) => b.startedAt - a.startedAt
      )
    );
  };

  useEffect(() => {
    loadData();
  }, [chain]);

  return (
    <div>
      <div
        onClick={() =>
          navigate("/add-subscription", {
            state: { chain: chain },
          })
        }
        style={{
          // backgroundColor:
          //   "rgba(255, 255, 255, 0.1)",
          backgroundImage: `linear-gradient(to bottom right, ${PrimaryColor}55, ${PrimaryColor}33)`,
          color: "white",
          padding: 12,
          width: "fit-content",
          borderRadius: 8,
        }}
      >
        Setup new subscription
      </div>
      <p
        style={{
          fontWeight: "bolder",
          fontSize: 24,
          marginTop: 32,
          marginBottom: 8,
          color: "white",
        }}
      >
        Active
      </p>
      {activeSubscriptions.length === 0 && (
        <p
          style={{ color: "grey", fontSize: 16 }}
        >
          No active subscriptions
        </p>
      )}
      {activeSubscriptions.map(
        (subscription, index) => (
          <SinglePaymentComponent
            key={index}
            subscription={subscription}
            tokens={tokens}
            canceled={false}
            chain={chain}
            onCancelSuccess={loadData}
          />
        )
      )}
      <p
        style={{
          fontWeight: "bolder",
          fontSize: 24,
          marginTop: 32,
          marginBottom: 8,
          color: "white",
        }}
      >
        Canceled
      </p>
      {canceledSubscriptions.length === 0 && (
        <p
          style={{ color: "grey", fontSize: 16 }}
        >
          No canceled subscriptions
        </p>
      )}
      {canceledSubscriptions.map(
        (subscription, index) => (
          <SinglePaymentComponent
            key={index}
            subscription={subscription}
            tokens={tokens}
            canceled={true}
            chain={chain}
            onCancelSuccess={loadData}
          />
        )
      )}
    </div>
  );
}
