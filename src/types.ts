import { Chain, Formatters } from "viem";
import { ChainConfig } from "viem/dist/types/types/chain";
import { Assign } from "viem/dist/types/types/utils";
import { base, baseGoerli } from "viem/chains";

export type ViemChain = Assign<Chain, ChainConfig<Formatters>>;

export type SupportedChain = typeof base | typeof baseGoerli;
export const SUPPORTED_CHAINS_LIST: SupportedChain[] = [base, baseGoerli];
export const SupportedChainsById = {
  [base.id]: base,
  [baseGoerli.id]: baseGoerli,
};
export const DEFAULT_CHAIN = base;

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
}

export interface Subscription {
  id: number;
  name: string;
  tokenAddress: `0x${string}`;
  chainId: number;
  humanAmount: number;
  to: `0x${string}`;
  intervalInSeconds: number;
  canceled: boolean;
}
