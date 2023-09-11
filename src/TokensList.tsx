import { Box, Button } from "@shopify/polaris";
import {
  ERC20Token,
  NATIVE_TOKEN_ADDRESS,
  OwnedERC20Token,
  SupportedChain,
  ViemChain,
} from "./types";
import { useNavigate } from "react-router-dom";
import { getChainTokens, getMyAddressStorage } from "./storage";
import { useEffect, useState } from "react";
import { getTokenBalances } from "./tokens";

function SingleTokenComponent(props: {
  ownedToken: OwnedERC20Token;
  onSend: (token: ERC20Token) => void;
}) {
  return (
    <div style={{ marginBottom: 8, marginTop: 16 }}>
      <p style={{ display: "inline" }}>
        {props.ownedToken.balance.toFixed(6)} {props.ownedToken.token.symbol}
      </p>
      <div style={{ display: "inline", float: "right" }}>
        <Button
          size="micro"
          onClick={() => props.onSend(props.ownedToken.token)}
        >
          Send
        </Button>
      </div>
    </div>
  );
}

export function TokensListComponent(props: { chain: SupportedChain }) {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<OwnedERC20Token[]>([]);

  useEffect(() => {
    (async () => {
      const pureTokens = await getChainTokens(props.chain);
      const tokensWithBalances = await getTokenBalances(
        pureTokens,
        props.chain,
        getMyAddressStorage()!
      );

      // Put native token on top
      // Then put tokens with balance on top
      tokensWithBalances.sort((a, b) => {
        if (a.token.address === NATIVE_TOKEN_ADDRESS) {
          return -1;
        }
        if (b.token.address === NATIVE_TOKEN_ADDRESS) {
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
  }, [props.chain]);

  const onSend = (token: ERC20Token) => {
    navigate("/send", { state: { token } });
  };

  return (
    <Box>
      <Button
        onClick={() =>
          navigate("/import-token", { state: { chain: props.chain } })
        }
      >
        Import token
      </Button>
      {tokens.map((token, index) => (
        <SingleTokenComponent key={index} ownedToken={token} onSend={onSend} />
      ))}
    </Box>
  );
}
