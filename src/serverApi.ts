import { UserOperationRequest } from "@alchemy/aa-core";
import { Subscription } from "./types";

const SERVER_URL = "https://abstract-wallet-backend.onrender.com/new-user-ops";

export async function uploadSubscriptionOpsToServer(
  userOps: UserOperationRequest[],
  subscription: Subscription
) {
  console.log(
    "Uploading ops to server. Number of ops to upload:",
    userOps.length
  );
  console.log("First 2 ops:", JSON.stringify(userOps.slice(0, 2)));

  const preparedOps = userOps.map((op, index) => ({
    message: op,
    sender: op.sender,
    sendAt: subscription.startedAt + index * subscription.intervalInSeconds,
    subscriptionId: subscription.id,
    chainId: subscription.chainId,
  }));

  await fetch(SERVER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ newOps: preparedOps }),
  });
}
