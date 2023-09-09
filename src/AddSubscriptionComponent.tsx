import { Button, Select, TextField } from "@shopify/polaris";
import { useState } from "react";
import { ERC20Token } from "./types";
import { getUserOwnedTokens } from "./tokens";
import NumberField from "./NumberField";

export function AddSubscriptionComponent() {
  const availableTokens: ERC20Token[] = getUserOwnedTokens();
  const [selectedToken, setSelectedToken] = useState<ERC20Token | null>(null);
  const [subscriptionName, setSubscriptionName] = useState<string>("");
  const [amount, setAmount] = useState<string>("0");
  const [recipient, setRecipient] = useState<string>("");

  return (
    <div>
      <TextField
        label="Subscription Name"
        autoComplete="off"
        value={subscriptionName}
        onChange={setSubscriptionName}
      />
      <Select
        label="Token to send"
        options={availableTokens.map((token) => {
          return {
            label: token.name,
            value: token.address,
          };
        })}
        onChange={(value) => {
          setSelectedToken(
            availableTokens.find((token) => token.address === value) || null
          );
        }}
        value={selectedToken?.address}
        placeholder="Select token to send"
      />
      <NumberField value={amount} onChange={setAmount} />
      <TextField
        label="Send to"
        autoComplete="off"
        value={recipient}
        onChange={setRecipient}
      />
      <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
        <Button primary>Done</Button>
      </div>
    </div>
  );
}
