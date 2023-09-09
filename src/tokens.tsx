import {
  LocalAccountSigner,
  UserOperationCallData,
  UserOperationRequest,
  getUserOperationHash,
} from "@alchemy/aa-core";
import { ERC20Token, OwnedERC20Token, Subscription } from "./types";
import { BigNumber as PureBigNumber } from "bignumber.js";
import {
  ECDSAProvider,
  SessionKeyProvider,
  ZeroDevProvider,
} from "@zerodev/sdk";
import { encodeFunctionData, parseAbi } from "viem";
import { ERC20_ABI } from "./erc20_abi";
import { generatePrivateKey } from "viem/accounts";

const USDC_TOKEN: ERC20Token = {
  address: "0x52D800ca262522580CeBAD275395ca6e7598C014",
  name: "USDC Token",
  symbol: "USDC",
  decimals: 6,
};

export function getUserOwnedTokens(): OwnedERC20Token[] {
  let ownedUSDC: OwnedERC20Token = Object.assign(
    { balance: PureBigNumber("100.1") },
    USDC_TOKEN
  );
  ownedUSDC.balance = PureBigNumber("100.1");

  return [
    {
      address: "0x1558c6FadDe1bEaf0f6628BDd1DFf3461185eA24",
      name: "AAVE Token",
      symbol: "AAVE",
      decimals: 18,
      balance: PureBigNumber("34.1"),
    },
    ownedUSDC,
  ];
}

export function getUserSubscriptions(): Subscription[] {
  return [
    {
      id: "ua-army-donation",
      name: "Ukrainian Army donation",
      amount: PureBigNumber("10"),
      token: USDC_TOKEN,
      to: "0xB38Bb847D9dC852B70d9ed539C87cF459812DA16",
    },
    {
      id: "mom-donation",
      name: "Donation to mom",
      amount: PureBigNumber("100"),
      token: USDC_TOKEN,
      to: "0x34207C538E39F2600FE672bB84A90efF190ae4C7",
    },
  ];
}
