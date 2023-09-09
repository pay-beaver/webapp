import { Box, Button } from "@shopify/polaris";
import { getUserOwnedTokens } from "./tokens";
import { ERC20Token, OwnedERC20Token } from "./types";
import { useNavigate } from "react-router-dom";

function SingleTokenComponent(props: {
  token: OwnedERC20Token;
  onSend: (token: ERC20Token) => void;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ display: "inline" }}>
        {props.token.balance.toString()} {props.token.symbol}
      </p>
      <div style={{ display: "inline", float: "right" }}>
        <Button size="micro" onClick={() => props.onSend(props.token)}>
          Send
        </Button>
      </div>
    </div>
  );
}

export function TokensListComponent() {
  const navigate = useNavigate();
  const ownedTokens = getUserOwnedTokens();

  const onSend = (token: ERC20Token) => {
    navigate(`/send`, { state: { token } });
  };

  return (
    <Box>
      {ownedTokens.map((token, index) => (
        <SingleTokenComponent key={index} token={token} onSend={onSend} />
      ))}
    </Box>
  );
}
