import { Hex } from "viem";
import {
  ActivityAction,
  DefaultChain,
  ERC20Token,
  NativeTokenAddress,
  Subscription,
  SupportedChain,
  SupportedChainsById,
  ViemChain,
} from "./types";
import { timestampNow } from "./utils";

function getTokens(): ERC20Token[] {
  const serializedTokens =
    window.localStorage.getItem(
      `tokens-${getMyAddressStorage()}`
    );
  if (!serializedTokens) {
    return [];
  }
  return JSON.parse(
    serializedTokens
  ) as ERC20Token[];
}

export function getChainTokens(
  chain: ViemChain
): ERC20Token[] {
  const tokens = getTokens();
  const nativeToken: ERC20Token = {
    name: chain.nativeCurrency.name,
    symbol: chain.nativeCurrency.symbol,
    decimals: chain.nativeCurrency.decimals,
    chainId: chain.id,
    address: NativeTokenAddress,
  };
  return tokens
    .filter((token) => token.chainId === chain.id)
    .concat([nativeToken]);
}

export function storeNewToken(token: ERC20Token) {
  const tokens = getTokens();
  const tokenExists = tokens.some(
    (existingToken) =>
      existingToken.address === token.address
  );
  if (tokenExists) {
    return;
  }
  tokens.push(token);
  window.localStorage.setItem(
    `tokens-${getMyAddressStorage()}`,
    JSON.stringify(tokens)
  );
}

export function getSubscriptions(): Subscription[] {
  const serializedSubscriptions =
    window.localStorage.getItem(
      `subscriptions-${getMyAddressStorage()}`
    );
  if (!serializedSubscriptions) {
    return [];
  }
  return JSON.parse(serializedSubscriptions);
}

export function getChainSubscriptions(
  chain: ViemChain
): Subscription[] {
  const subscriptions = getSubscriptions();
  return subscriptions.filter(
    (subscription) =>
      subscription.chainId === chain.id
  );
}

export function setSubscriptions(
  subscriptions: Subscription[]
) {
  window.localStorage.setItem(
    `subscriptions-${getMyAddressStorage()}`,
    JSON.stringify(subscriptions)
  );
}

export function storeNewSubscription(
  subscription: Subscription
) {
  const subscriptions = getSubscriptions();
  subscriptions.push(subscription);
  setSubscriptions(subscriptions);
}

export function cancelSubscription(
  subscriptionId: number
) {
  const subscriptions = getSubscriptions();
  const toCancelIndex = subscriptions.findIndex(
    (subscription) =>
      subscription.id === subscriptionId
  );
  if (toCancelIndex === -1) {
    throw new Error(
      "Subscription to cancel not found"
    );
  }
  subscriptions[toCancelIndex].canceledAt =
    timestampNow();
  setSubscriptions(subscriptions);
}

export function getCurrentChain(): SupportedChain {
  const serializedSelectedChain =
    window.localStorage.getItem(
      `selectedChain-${getMyAddressStorage()}`
    );
  if (!serializedSelectedChain) {
    return DefaultChain;
  }

  const chainId = parseInt(
    serializedSelectedChain
  );
  const selectedChain =
    SupportedChainsById[
      chainId as keyof typeof SupportedChainsById
    ];
  if (!selectedChain) {
    return DefaultChain;
  }
  return selectedChain;
}

export function setCurrentChain(chainId: number) {
  window.localStorage.setItem(
    `selectedChain-${getMyAddressStorage()}`,
    chainId.toString()
  );
}

export function getActivity(): ActivityAction[] {
  const serializedActivity =
    window.localStorage.getItem(
      `activity-${getMyAddressStorage()}`
    );
  if (!serializedActivity) {
    return [];
  }
  return JSON.parse(serializedActivity);
}

export function getChainActivity(
  chain: ViemChain
): ActivityAction[] {
  const activity = getActivity();
  return activity.filter(
    (activity) => activity.chainId === chain.id
  );
}

export function addActivityAction(
  action: ActivityAction
) {
  const activity = getActivity();

  const paymentExists = activity.some(
    // Don't add duplicate subscription payments
    (existingAction) =>
      existingAction.chainId === action.chainId &&
      existingAction.timestamp ===
        action.timestamp &&
      existingAction.details?.subscriptionId ===
        action.details?.subscriptionId &&
      existingAction.activityType ===
        "subscription-payment" &&
      action.activityType ===
        "subscription-payment"
  );

  if (paymentExists) {
    console.log(
      "Duplicate subscription payment was not added",
      action
    );
    return;
  }

  activity.push(action);
  window.localStorage.setItem(
    `activity-${getMyAddressStorage()}`,
    JSON.stringify(activity)
  );
}

export function getStorageSubscriptionsEnabled(
  chain: SupportedChain
): boolean {
  const subscriptionsEnabled =
    window.localStorage.getItem(
      `subscriptionsEnabled-${
        chain.id
      }-${getMyAddressStorage()}`
    );
  if (!subscriptionsEnabled) {
    return false;
  }
  if (subscriptionsEnabled !== "true") {
    return false;
  }
  return true;
}

export function setStorageSubscriptionsEnabled(
  enabled: boolean,
  chain: SupportedChain
) {
  window.localStorage.setItem(
    `subscriptionsEnabled-${
      chain.id
    }-${getMyAddressStorage()}`,
    enabled.toString()
  );
}

export function setMyAddressStorage(
  myAddress: Hex
) {
  window.localStorage.setItem(
    `myAddress`,
    myAddress
  );
}

export function getMyAddressStorage(): Hex | null {
  return window.localStorage.getItem(
    `myAddress`
  ) as Hex;
}

export function clearMyAddressStorage() {
  window.localStorage.removeItem(`myAddress`);
}

export function setPrivateKeyStorage(
  decryptedPrivateKey: Hex
) {
  window.sessionStorage.setItem(
    `privateKey`,
    decryptedPrivateKey
  );
}

export function getPrivateKeyStorage(): Hex | null {
  return window.sessionStorage.getItem(
    `privateKey`
  ) as Hex;
}

export function clearPrivateKeyStorage() {
  window.sessionStorage.removeItem(`privateKey`);
}
