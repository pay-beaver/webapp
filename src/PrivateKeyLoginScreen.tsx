import { useContext, useState } from "react";
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
  PrimaryColor,
  SupportedChainsList,
} from "./types";
import { SettingsContext } from "./GeneralSettings";

export function PrivateKeyLoginScreen() {
  const { setIsLoggedIn } = useContext(
    SettingsContext
  );
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
    setIsLoggedIn(true);
    navigate("/overview");
  };

  return (
    <div>
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
      <p
        style={{
          color: "white",
          marginBottom: 8,
          marginTop: 24,
          width: 400,
        }}
      >
        Private key
      </p>
      <input
        autoComplete="off"
        value={privateKey}
        onChange={(event) =>
          setPrivateKey(event.target.value)
        }
        style={{
          backgroundColor:
            "rgba(255, 255, 255, 0.2)",
          color: "white",
          borderWidth: 0,
          padding: 8,
          borderRadius: 6,
          width: 400,
        }}
        placeholder="Your hexadecimal private key"
      />
      <div style={{ height: 16 }} />
      <button
        onClick={onGenerateNewPrivateKey}
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
        Generate new private key
      </button>
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
        <button
          onClick={onLogIn}
          style={{
            backgroundColor: `${PrimaryColor}BB`,
            borderWidth: 0,
            padding: 8,
            paddingLeft: 16,
            paddingRight: 16,
            borderRadius: 6,
            color: "white",
            fontSize: 16,
          }}
        >
          Log in
        </button>
      </div>
    </div>
  );
}
