import { Box, Button, TextField } from "@shopify/polaris";
import React from "react";
import { ERC20Token } from "./types";
import NumberField from "./NumberField";
import { useLocation } from "react-router-dom";
import { tryPlugin } from "./operations";

export default function SendScreen() {
  const [sendTo, setSendTo] = React.useState<string | null>(null);
  const [amountToSend, setAmountToSend] = React.useState<string | null>(null);

  const { state } = useLocation();
  const selectedToken: ERC20Token | null = state?.token || null;

  return (
    <Box>
      <p>Sending token: {selectedToken?.name}</p>
      <TextField
        label="Send to"
        value={sendTo ? sendTo : ""}
        onChange={(value) => setSendTo(value)}
        autoComplete="off"
      />
      <NumberField value={amountToSend} onChange={setAmountToSend} />
      <Button
        disabled={
          selectedToken === null || sendTo === null || amountToSend === null
        }
        onClick={() => tryPlugin()}
      >
        Send operation
      </Button>
    </Box>
  );
}
