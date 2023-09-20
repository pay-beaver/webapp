import { useState } from "react";
import { Header } from "./Header";
import {
  Button,
  TextField,
} from "@shopify/polaris";
import { toHex } from "viem";
import {
  setMyAddressStorage,
  setPrivateKeyStorage,
  storeNewToken,
} from "./storage";
import { useNavigate } from "react-router-dom";
import { getMyAddressFromOwner } from "./operations";
import {
  ChainsSettings,
  SupportedChainsList,
} from "./types";

export function PrivateKeyLoginScreen() {
  const navigate = useNavigate();
  const [privateKey, setPrivateKey] =
    useState<string>("");
  const [errorMessage, setErrorMessage] =
    useState<string>("");

  const onGenerateNewPrivateKey = () => {
    const privateKey = crypto.getRandomValues(
      new Uint8Array(32)
    );
    setPrivateKey(toHex(privateKey).slice(2));
  };

  const onLogIn = async () => {
    // Validate the private key.
    if (privateKey.length !== 64) {
      setErrorMessage(
        "Private key must be 64 symbols long"
      );
      return;
    }
    if (!/^[0-9a-fA-F]+$/.test(privateKey)) {
      setErrorMessage(
        "Private key must be a hexadecimal string"
      );
      return;
    }
    setPrivateKeyStorage(
      `0x${privateKey.toLowerCase()}`
    );
    const myAddress =
      await getMyAddressFromOwner();
    console.log(
      "Logged in with address:",
      myAddress
    );
    setMyAddressStorage(myAddress);
    // Probably should move somewhere else?
    // Ensuring that there are some default tokens for the users to explore.
    SupportedChainsList.forEach((chain) => {
      const defaultTokens =
        ChainsSettings[chain.id]
          .defaultERC20Tokens;
      defaultTokens.forEach((token) =>
        storeNewToken(token)
      );
    });
    navigate("/overview");
  };

  return (
    <div>
      <Header
        canGoBack={true}
        screenTitle="Private key login"
      />
      <p
        style={{
          marginTop: 16,
          marginBottom: 16,
        }}
      >
        Advanced mode. Enter your private key or
        generate a new one. Store it securely. Key
        is a 64 symbols hexadecimal string.
      </p>
      <TextField
        autoComplete="off"
        label="Private key"
        value={privateKey}
        onChange={setPrivateKey}
      />
      <div style={{ height: 16 }} />
      <Button onClick={onGenerateNewPrivateKey}>
        Generate new private key
      </Button>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginTop: 32,
          flexDirection: "column",
        }}
      >
        {errorMessage && (
          <p
            style={{
              color: "red",
              marginBottom: 16,
            }}
          >
            {errorMessage}
          </p>
        )}
        <Button primary onClick={onLogIn}>
          Log in
        </Button>
      </div>
    </div>
  );
}
