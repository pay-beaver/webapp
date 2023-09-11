import { UserOperationRequest } from "@alchemy/aa-core";

export function uploadSubscriptionOpsToServer(userOps: UserOperationRequest[]) {
  // TODO: upload to server
  console.log(
    "uploading to server",
    userOps.length,
    JSON.stringify(userOps.slice(0, 10))
  );
}
