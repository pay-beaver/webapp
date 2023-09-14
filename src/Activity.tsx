import {
  ActivityAction,
  JIFFY_SCAN_NETWORKS,
  SupportedChain,
  SupportedChainsById,
} from "./types";
import { useEffect, useState } from "react";
import {
  addActivityAction,
  getActivity,
  getChainSubscriptions,
  getChainTokens,
  getSubscriptions,
} from "./storage";
import { CircleInformationMajor } from "@shopify/polaris-icons";
import { Scrollable, Spinner, Tooltip } from "@shopify/polaris";
import { shortenAddress, timestampNow } from "./utils";
import {
  get4337RpcClient,
  getSubscriptionProvider,
  makeSubscriptionPaymentHash,
} from "./operations";

async function generateSubscriptionPaymentActions(chain: SupportedChain) {
  const subscriptions = getChainSubscriptions(chain);
  const subscriptionProvider = await getSubscriptionProvider(chain); // Ugly, but doing it here to reduce time costs
  const rpcClient = await get4337RpcClient(chain);
  for (const sub of subscriptions) {
    const tokens = getChainTokens(
      SupportedChainsById[sub.chainId as keyof typeof SupportedChainsById]
    );
    const token = tokens.find(
      (token) =>
        token.address === sub.tokenAddress && token.chainId === chain.id
    )!;

    const alreadyProcessedPayments = getActivity().filter(
      (action) =>
        action.activityType === "subscription-payment" &&
        action.chainId === chain.id &&
        action.details.subscriptionId === sub.id
    );
    let startTimestamp = sub.startedAt;
    if (alreadyProcessedPayments.length > 0) {
      startTimestamp = alreadyProcessedPayments.sort(
        (a, b) => b.timestamp - a.timestamp
      )[0].timestamp;

      // We don't want to process the same payment that has already been processed
      startTimestamp += sub.intervalInSeconds;
    }

    let endTs = timestampNow();
    if (sub.canceledAt !== null) endTs = sub.canceledAt;
    const possibleNewPaymentsCount = Math.ceil(
      (endTs - startTimestamp) / sub.intervalInSeconds
    );
    for (let i = 0; i < possibleNewPaymentsCount; i++) {
      const opHash = await makeSubscriptionPaymentHash(
        subscriptionProvider,
        SupportedChainsById[chain.id as keyof typeof SupportedChainsById],
        token,
        sub.humanAmount,
        sub.to,
        sub.id,
        alreadyProcessedPayments.length + i
      );

      const userOp = await rpcClient.getUserOperationByHash(opHash);
      if (userOp === null) {
        break; // There can't be anymore payments after a failed pament
      }
      addActivityAction({
        chainId: chain.id,
        title: "Subscription payment",
        description: `Paid ${sub.humanAmount.toFixed(6)} ${
          token?.symbol
        } for subscription ${sub.name} to ${shortenAddress(sub.to)}`,
        timestamp: startTimestamp + i * sub.intervalInSeconds,
        userOpHash: opHash,
        activityType: "subscription-payment",
        details: {
          subscriptionId: sub.id,
        },
      });
    }
  }
}

function ActionComponent(props: { action: ActivityAction }) {
  const humanDate = new Date(props.action.timestamp * 1000).toLocaleString();
  let jiffyscanLink = null;
  if (props.action.userOpHash) {
    const jiffyScanNetworkId =
      JIFFY_SCAN_NETWORKS[
        props.action.chainId as keyof typeof JIFFY_SCAN_NETWORKS
      ];
    jiffyscanLink = `https://www.jiffyscan.xyz/userOpHash/${props.action.userOpHash}?network=${jiffyScanNetworkId}`;
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 16, marginBottom: 4 }}>{props.action.title}</p>
      <p style={{ color: "grey", marginBottom: 4 }}>
        {props.action.description}
      </p>
      <p style={{ color: "grey" }}>{humanDate}</p>
      {jiffyscanLink && (
        <div>
          <p style={{ color: "grey", display: "inline" }}>
            More details on{" "}
            <a href={jiffyscanLink} style={{ color: "blue" }}>
              {" "}
              JiffyScan
            </a>
          </p>
          <Tooltip content="Please allow some time for the user operation to be indexed on JiffyScan">
            <div style={{ display: "inline" }}>
              <CircleInformationMajor width={20} widths="24px" />
            </div>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

export function ActivityComponent(props: { chain: SupportedChain }) {
  const [activity, setActivity] = useState<ActivityAction[]>([]);
  const [finishedLoading, setFinishedLoading] = useState<boolean>(false);

  useEffect(() => {
    const readAndSetActivity = async () => {
      setActivity(
        getActivity()
          .filter((action) => action.chainId === props.chain.id)
          .sort((a, b) => {
            const tsDiff = b.timestamp - a.timestamp;
            if (tsDiff !== 0) return tsDiff;
            return "Subscription payment" === a.title ? -1 : 1;
          })
      );
    };

    readAndSetActivity(); // preload
    (async () => {
      await generateSubscriptionPaymentActions(props.chain);
      readAndSetActivity();
      setFinishedLoading(true);
    })();
  }, [props.chain]);

  return (
    <div>
      {!finishedLoading && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <Spinner accessibilityLabel="Loading your activity" size="small" />
        </div>
      )}
      {activity.map((action, index) => (
        <ActionComponent key={index} action={action} />
      ))}
      {activity.length === 0 && finishedLoading && (
        <p style={{ color: "grey" }}>No activity yet</p>
      )}
    </div>
  );
}
