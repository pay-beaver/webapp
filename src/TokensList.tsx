import { Box, Button } from "@shopify/polaris";
import {
  ChainsSettings,
  ERC20Token,
  NativeTokenAddress,
  OwnedERC20Token,
  SupportedChain,
} from "./types";
import { useNavigate } from "react-router-dom";
import {
  getChainTokens,
  getMyAddressStorage,
} from "./storage";
import {
  useContext,
  useEffect,
  useState,
} from "react";
import {
  getTokenBalances,
  queryTokenIconUrlBySymbol,
} from "./tokens";
import { ExternalMinor } from "@shopify/polaris-icons";
import { SettingsContext } from "./GeneralSettings";
import { DaiIcon, DefaultIcon } from "./icons";
import { queryTokenPriceBySymbol } from "./price";

function SingleTokenComponent(props: {
  ownedToken: OwnedERC20Token;
  onSend: (token: ERC20Token) => void;
}) {
  const [iconUrl, setIconUrl] = useState("");

  const chainSettings =
    ChainsSettings[
      props.ownedToken.token.chainId
    ];
  const addressToOpenOnExplorer =
    props.ownedToken.token.address ===
    NativeTokenAddress
      ? getMyAddressStorage()!
      : props.ownedToken.token.address;

  const usdValue =
    props.ownedToken.balance *
    props.ownedToken.price;

  useEffect(() => {
    (async () => {
      const iconUrl =
        await queryTokenIconUrlBySymbol(
          props.ownedToken.token.symbol
        );
      setIconUrl(iconUrl);
    })();
  }, [props.ownedToken.token.symbol]);

  return (
    <div
      style={{
        marginBottom: 8,
        marginTop: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      {iconUrl ? (
        <img
          src={iconUrl}
          alt="Token icon"
          width={32}
        />
      ) : (
        <DefaultIcon />
      )}
      <p
        style={{
          display: "inline",
          color: "white",
          fontSize: 16,
          marginLeft: 8,
        }}
      >
        {props.ownedToken.balance.toFixed(6)}{" "}
        {props.ownedToken.token.symbol}
      </p>
      <p
        style={{
          color: "white",
          opacity: 0.5,
          marginLeft: 8,
        }}
      >
        ~$
        {usdValue.toFixed(6)}
      </p>
      <div
        onClick={() =>
          window.open(
            chainSettings.explorer +
              "address/" +
              addressToOpenOnExplorer
          )
        }
        style={{
          display: "inline",
          marginLeft: 8,
        }}
      ></div>
      <button
        onClick={() =>
          props.onSend(props.ownedToken.token)
        }
        style={{
          padding: 8,
          paddingLeft: 12,
          paddingRight: 12,
          borderRadius: 8,
          borderWidth: 0,
          backgroundColor:
            "rgba(255, 255, 255, 0.1)",
          marginLeft: "auto",
          color: "white",
        }}
      >
        Send
      </button>
    </div>
  );
}

export function TokensListComponent() {
  const navigate = useNavigate();
  const { chain } = useContext(SettingsContext);
  const [tokens, setTokens] = useState<
    OwnedERC20Token[]
  >([]);

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

      // Put native token on top
      // Then put tokens with balance on top
      tokensWithBalances.sort((a, b) => {
        if (
          a.token.address === NativeTokenAddress
        ) {
          return -1;
        }
        if (
          b.token.address === NativeTokenAddress
        ) {
          return 1;
        }
        if (a.balance > 0 && b.balance === 0) {
          return -1;
        }
        if (a.balance === 0 && b.balance > 0) {
          return 1;
        }
        return 0;
      });
      setTokens(tokensWithBalances);
    })();
  }, [chain]);

  const onSend = (token: ERC20Token) => {
    navigate("/send", { state: { token } });
  };

  return (
    <div style={{ marginTop: 40 }}>
      <p
        style={{
          color: "white",
          fontSize: 32,
          marginBottom: 20,
          marginRight: 20,
          display: "inline-block",
        }}
      >
        Tokens
      </p>
      <button
        onClick={() =>
          navigate("/import-token", {
            state: { chain: chain },
          })
        }
        style={{
          padding: 10,
          fontSize: 12,
          borderRadius: 12,
          borderWidth: 0,
          color: "white",
          backgroundColor:
            "rgba(255, 255, 255, 0.1)",
        }}
      >
        Import token
      </button>
      {tokens.map((token, index) => (
        <SingleTokenComponent
          key={index}
          ownedToken={token}
          onSend={onSend}
        />
      ))}
    </div>
  );
}
