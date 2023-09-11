import { Hex } from "viem";
import {
  ActivityAction,
  DEFAULT_CHAIN,
  ERC20Token,
  NATIVE_TOKEN_ADDRESS,
  Subscription,
  SupportedChain,
  SupportedChainsById,
  ViemChain,
} from "./types";
import { timestampNow } from "./utils";

function getTokens(): ERC20Token[] {
  const serializedTokens = window.localStorage.getItem("tokens");
  if (!serializedTokens) {
    return [];
  }
  return JSON.parse(serializedTokens) as ERC20Token[];
}

export function getChainTokens(chain: ViemChain): ERC20Token[] {
  const tokens = getTokens();
  const nativeToken: ERC20Token = {
    name: chain.nativeCurrency.name,
    symbol: chain.nativeCurrency.symbol,
    decimals: chain.nativeCurrency.decimals,
    chainId: chain.id,
    address: NATIVE_TOKEN_ADDRESS,
  };
  return tokens
    .filter((token) => token.chainId === chain.id)
    .concat([nativeToken]);
}

export function storeNewToken(token: ERC20Token) {
  const tokens = getTokens();
  tokens.push(token);
  window.localStorage.setItem("tokens", JSON.stringify(tokens));
}

export function getSubscriptions(): Subscription[] {
  const serializedSubscriptions = window.localStorage.getItem("subscriptions");
  if (!serializedSubscriptions) {
    return [];
  }
  return JSON.parse(serializedSubscriptions);
}

export function getChainSubscriptions(chain: ViemChain): Subscription[] {
  const subscriptions = getSubscriptions();
  return subscriptions.filter(
    (subscription) => subscription.chainId === chain.id
  );
}

export function setSubscriptions(subscriptions: Subscription[]) {
  window.localStorage.setItem("subscriptions", JSON.stringify(subscriptions));
}

export function storeNewSubscription(subscription: Subscription) {
  const subscriptions = getSubscriptions();
  subscriptions.push(subscription);
  setSubscriptions(subscriptions);
}

export function cancelSubscription(subscriptionId: number) {
  const subscriptions = getSubscriptions();
  const toCancelIndex = subscriptions.findIndex(
    (subscription) => subscription.id === subscriptionId
  );
  if (toCancelIndex === -1) {
    throw new Error("Subscription to cancel not found");
  }
  subscriptions[toCancelIndex].canceledAt = timestampNow();
  setSubscriptions(subscriptions);
}

export function getCurrentChain(): SupportedChain {
  const serializedSelectedChain = window.localStorage.getItem("selectedChain");
  if (!serializedSelectedChain) {
    return DEFAULT_CHAIN;
  }

  const chainId = parseInt(serializedSelectedChain);
  const selectedChain =
    SupportedChainsById[chainId as keyof typeof SupportedChainsById];
  if (!selectedChain) {
    return DEFAULT_CHAIN;
  }
  return selectedChain;
}

export function setCurrentChain(chain: SupportedChain) {
  window.localStorage.setItem("selectedChain", chain.id.toString());
}

export function getActivity(): ActivityAction[] {
  const serializedActivity = window.localStorage.getItem("activity");
  if (!serializedActivity) {
    return [];
  }
  return JSON.parse(serializedActivity);
}

export function getChainActivity(chain: ViemChain): ActivityAction[] {
  const activity = getActivity();
  return activity.filter((activity) => activity.chainId === chain.id);
}

export function addActivityAction(action: ActivityAction) {
  const activity = getActivity();
  activity.push(action);
  window.localStorage.setItem("activity", JSON.stringify(activity));
}

export function getStorageSubscriptionsEnabled(chain: SupportedChain): boolean {
  const subscriptionsEnabled = window.localStorage.getItem(
    `subscriptionsEnabled-${chain.id}`
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
    `subscriptionsEnabled-${chain.id}`,
    enabled.toString()
  );
}

export function setMyAddressStorage(myAddress: Hex) {
  window.localStorage.setItem(`myAddress`, myAddress);
}

export function getMyAddressStorage(): Hex | null {
  return window.localStorage.getItem(`myAddress`) as Hex;
}

export function setEncryptedPrivateKey(encryptedPrivateKey: Hex) {
  window.localStorage.setItem(`encryptedPrivateKey`, encryptedPrivateKey);
}

export function getEncryptedPrivateKey(): Hex | null {
  return window.localStorage.getItem(`encryptedPrivateKey`) as Hex;
}

export function setDecryptedPrivateKey(decryptedPrivateKey: Hex) {
  window.sessionStorage.setItem(`decryptedPrivateKey`, decryptedPrivateKey);
}

export function getDecryptedPrivateKey(): Hex | null {
  return window.sessionStorage.getItem(`decryptedPrivateKey`) as Hex;
}

export function clearDecryptedPrivateKey() {
  window.sessionStorage.removeItem(`decryptedPrivateKey`);
}
