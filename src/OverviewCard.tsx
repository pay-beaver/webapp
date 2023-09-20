import {
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  Primary2Color,
  PrimaryColor,
  SupportedChain,
} from "./types";
import {
  getChainTokens,
  getCurrentChain,
  getMyAddressStorage,
  setCurrentChain,
} from "./storage";
import { base, baseGoerli } from "viem/chains";
import { SettingsContext } from "./GeneralSettings";
import { ChainSelect } from "./ChainSelect";
import { getTokenBalances } from "./tokens";

const CHAIN_OPTIONS = [
  {
    label: "Base Goerli",
    value: baseGoerli.id.toString(),
  },
  {
    label: "Base Mainnet",
    value: base.id.toString(),
  },
];

export function OverviewCard() {
  const { chain } = useContext(SettingsContext);
  const [totalvalue, setTotalValue] = useState<
    number | null
  >(null);
  const myAddress = getMyAddressStorage();

  useEffect(() => {
    (async () => {
      const pureTokens = await getChainTokens(
        chain
      );
      const tokensWithBalances =
        await getTokenBalances(
          pureTokens,
          chain,
          getMyAddressStorage()!
        );
      const total = tokensWithBalances.reduce(
        (acc, token) => {
          return (
            acc + token.balance * token.price
          );
        },
        0
      );
      setTotalValue(total);
    })();
  }, [chain]);

  return (
    <div
      style={{
        backgroundImage: `linear-gradient(to bottom right, ${PrimaryColor}77, ${PrimaryColor}22)`,
        padding: 20,
        borderRadius: 40,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <p
          style={{
            color: "white",
            marginBottom: 120,
            display: "inline-block",
            fontSize: 24,
            marginLeft: 8,
            marginTop: 8,
          }}
        >
          Total: ${totalvalue?.toFixed(6)}
        </p>
        <ChainSelect />
      </div>
      <p
        style={{
          color: "white",
          fontSize: 16,
          marginLeft: 8,
          marginBottom: 8,
        }}
      >
        {myAddress}
      </p>
    </div>
  );
}
