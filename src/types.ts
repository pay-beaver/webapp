import { BigNumber as PureBigNumber } from "bignumber.js";

export interface ERC20Token {
  name: string;
  symbol: string;
  decimals: number;
  address: `0x${string}`;
}

export interface OwnedERC20Token extends ERC20Token {
  balance: PureBigNumber;
}

export interface Subscription {
  id: string;
  name: string;
  token: ERC20Token;
  amount: PureBigNumber;
  to: `0x${string}`;
}
