import { Button } from "@shopify/polaris";
import { getUserSubscriptions } from "./tokens";
import { Subscription } from "./types";
import { shortenAddress } from "./utils";
import { useNavigate } from "react-router-dom";

function SinglePaymentComponent(props: { subscription: Subscription }) {
  return (
    <div style={{ marginBottom: 20, marginTop: 20 }}>
      <p>{props.subscription.name}</p>
      <p>
        {props.subscription.amount.toFixed(2)} {props.subscription.token.symbol}{" "}
        / month to {shortenAddress(props.subscription.to)}
      </p>
      <Button size="micro" destructive>
        Cancel
      </Button>
    </div>
  );
}

export function SubscriptionsComponent() {
  const navigate = useNavigate();
  const userSubscriptions = getUserSubscriptions();

  return (
    <div>
      <Button onClick={() => navigate("/add-subscription")}>
        Setup new subscription
      </Button>
      {userSubscriptions.map((subscription, index) => (
        <SinglePaymentComponent key={index} subscription={subscription} />
      ))}
    </div>
  );
}
