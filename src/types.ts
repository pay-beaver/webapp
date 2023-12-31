import { Chain, Formatters, Hex } from "viem";
// import { ChainConfig } from "viem/dist/types/types/chain";
// import { Assign } from "viem/dist/types/types/utils";
import { base, baseGoerli } from "viem/chains";

export type ViemChain = any;
export type SupportedChain =
  | typeof base
  | typeof baseGoerli;

export type ActivityType =
  | "start-subscription"
  | "subscription-payment"
  | "cancel-subscription"
  | "transfer";

export const BackgroundColor = "#222222";
export const Dark1Color = "#333333";
export const Dark2Color = "#444444";
export const PrimaryColor = "#FF9900";
export const Primary2Color = "#A06E23";

export const SupportedChainsList: SupportedChain[] =
  [base, baseGoerli];

export const SupportedChainsById = {
  [base.id]: base,
  [baseGoerli.id]: baseGoerli,
};
export const DefaultChain = base;

export const JiffyScanNetworks = {
  [base.id]: "base",
  [baseGoerli.id]: "base-testnet",
};

export const NativeTokenAddress =
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const ZerodevMumbaiProjectId =
  "20dc52a9-91ff-43a9-9d32-1edd3cb23aff";

// Make a constant mapping of chain id to chain settings
export const ChainsSettings: {
  [chainId: number]: ChainSettings;
} = {
  [base.id]: {
    validatorAddress:
      "0x5E1cc70f09EBe454eee8d8E7110B86e40f9fcA02",
    executorAddress:
      "0xc824Cb40e4253Ae1A7C024eFc20eD9f788645b9a",
    preVerificationGas: 2000000,
    verificationGasLimit: 200000,
    defaultERC20Tokens: [
      {
        address:
          "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        chainId: base.id,
        decimals: 6,
        name: "USD Coin",
        symbol: "USDC",
      },
    ],
    httpRpcUrl:
      "https://api.stackup.sh/v1/node/ef15e96a97a9a368317e3f04d3b850870204d5ef0f68b699dd5070f5ab6edb54",
    explorer: "https://basescan.org/",
  },
  [baseGoerli.id]: {
    validatorAddress:
      "0xc824Cb40e4253Ae1A7C024eFc20eD9f788645b9a",
    executorAddress:
      "0x5E1cc70f09EBe454eee8d8E7110B86e40f9fcA02", // Yes, very confusing, but right now validator on base mainnet is the executor on the testnet :(.
    preVerificationGas: 100000,
    verificationGasLimit: 200000,
    defaultERC20Tokens: [
      {
        address:
          "0xA29b548056c3fD0f68BAd9d4829EC4E66f22f796",
        chainId: baseGoerli.id,
        decimals: 18,
        name: "Compound",
        symbol: "COMP",
      },
    ],
    httpRpcUrl:
      "https://base-goerli.g.alchemy.com/v2/PyhX0B5YxLRdSDob7vZ3wlRVv_WVFjwc",
    explorer: "https://goerli.basescan.org/",
  },
};
export interface ERC20Token {
  name: string;
  symbol: string;
  decimals: number;
  address: `0x${string}`;
  chainId: number;
}

export interface OwnedERC20Token {
  token: ERC20Token;
  balance: number;
  price: number;
}

export interface Subscription {
  id: number;
  name: string;
  tokenAddress: `0x${string}`;
  chainId: number;
  humanAmount: number;
  to: `0x${string}`;
  startedAt: number;
  intervalInSeconds: number;
  canceledAt: number | null; // null means it's still active
}

export interface ActivityAction {
  chainId: number;
  title: string;
  description: string;
  timestamp: number;
  userOpHash?: string;
  activityType: ActivityType;
  details?: any;
}

export interface ChainSettings {
  validatorAddress: Hex;
  executorAddress: Hex;
  preVerificationGas: number;
  verificationGasLimit: number;
  defaultERC20Tokens: ERC20Token[]; // default tokens to show in the wallet to give users some tips on how to use the app
  httpRpcUrl: string;
  explorer: string;
}

export interface GeneralSettings {
  chain: SupportedChain;
  setChain: (chainId: number) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
}
