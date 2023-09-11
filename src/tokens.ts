import { baseGoerli } from "viem/chains";
import {
  ERC20Token,
  NATIVE_TOKEN_ADDRESS,
  OwnedERC20Token,
  ViemChain,
} from "./types";
import { Hex, createPublicClient, http } from "viem";
import { ERC20Abi } from "@zerodev/sdk";

export const COMP_TOKEN: ERC20Token = {
  address: "0xA29b548056c3fD0f68BAd9d4829EC4E66f22f796",
  name: "Compound Token",
  symbol: "COMP",
  decimals: 18,
  chainId: baseGoerli.id,
};

export async function getTokenBalances(
  tokens: ERC20Token[],
  chain: ViemChain,
  address: Hex
): Promise<OwnedERC20Token[]> {
  const rpcClient = createPublicClient({
    chain: chain,
    transport: http(),
  });

  const nativeTokenIndex = tokens.findIndex(
    (token) => token.address === NATIVE_TOKEN_ADDRESS
  );
  let nativeToken;
  if (nativeTokenIndex !== -1) {
    [nativeToken] = tokens.splice(nativeTokenIndex, 1);
  }

  const result = await rpcClient.multicall({
    contracts: tokens.map((token) => ({
      address: token.address,
      abi: ERC20Abi as any,
      functionName: "balanceOf",
      args: [address],
    })),
  });

  const balances = result.map((r) => r.result! as unknown as BigInt);

  if (nativeTokenIndex !== -1) {
    const nativeTokenBalance = await rpcClient.getBalance({ address });
    balances.splice(nativeTokenIndex, 0, nativeTokenBalance);
    tokens.splice(nativeTokenIndex, 0, nativeToken!);
  }

  return tokens.map((token, index) => ({
    token,
    balance: Number(balances[index]) / 10 ** token.decimals,
  }));
}

export async function resolveToken(
  chain: ViemChain,
  address: Hex
): Promise<ERC20Token | undefined> {
  const rpcClient = createPublicClient({
    chain: chain,
    transport: http(),
  });
  const result = await rpcClient.multicall({
    contracts: [
      {
        address: address,
        abi: ERC20Abi as any,
        functionName: "name",
        args: [],
      },
      {
        address: address,
        abi: ERC20Abi as any,
        functionName: "symbol",
        args: [],
      },
      {
        address: address,
        abi: ERC20Abi as any,
        functionName: "decimals",
        args: [],
      },
    ],
  });

  if (
    result.length !== 3 ||
    result[0].status !== "success" ||
    result[1].status !== "success" ||
    result[2].status !== "success"
  ) {
    return undefined;
  }

  return {
    address: address,
    chainId: chain.id,
    name: result[0].result as any,
    symbol: result[1].result as any,
    decimals: Number(result[2].result as any),
  };
}
