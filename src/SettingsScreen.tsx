import { Button } from "@shopify/polaris";
import { Header } from "./Header";
import {
  clearPrivateKeyStorage,
  getPrivateKeyStorage,
} from "./storage";
import { useState } from "react";

export function SettingsScreen() {
  const [privateKey, setPrivateKey] =
    useState<string>("");

  const onLogOut = () => {
    clearPrivateKeyStorage();
    window.location.href = "/";
  };

  const onShowPrivateKey = () => {
    setPrivateKey(
      getPrivateKeyStorage()!.slice(2)
    );
  };

  return (
    <div>
      <button
        onClick={onShowPrivateKey}
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
        Show my private key
      </button>
      {privateKey && (
        <div style={{ marginTop: 8 }}>
          <p>Your private key is:</p>
          <p
            style={{
              lineBreak: "anywhere",
              color: "white",
            }}
          >
            {privateKey}
          </p>
        </div>
      )}
      <div style={{ height: 24 }} />
      <button
        onClick={onLogOut}
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
        Log out
      </button>
    </div>
  );
}
