import {
  DEFAULT_CHAIN,
  ERC20Token,
  Subscription,
  SupportedChain,
  SupportedChainsById,
  ViemChain,
} from "./types";

export function getTokens(): ERC20Token[] {
  const serializedTokens = window.localStorage.getItem("tokens");
  if (!serializedTokens) {
    return [];
  }
  return JSON.parse(serializedTokens) as ERC20Token[];
}

export function getChainTokens(chain: ViemChain): ERC20Token[] {
  const tokens = getTokens();
  return tokens.filter((token) => token.chainId === chain.id);
}

export function setTokens(tokens: ERC20Token[]) {
  window.localStorage.setItem("tokens", JSON.stringify(tokens));
}

export function storeNewToken(token: ERC20Token) {
  const tokens = getTokens();
  tokens.push(token);
  setTokens(tokens);
}

export function getSubscriptions(): Subscription[] {
  const serializedSubscriptions = window.localStorage.getItem("subscriptions");
  if (!serializedSubscriptions) {
    return [];
  }
  return JSON.parse(serializedSubscriptions);
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
  subscriptions[toCancelIndex].canceled = true;
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
