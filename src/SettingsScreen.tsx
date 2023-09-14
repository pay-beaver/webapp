import { Button } from "@shopify/polaris";
import { Header } from "./Header";
import {
  clearPrivateKeyStorage,
  clearSocialSecretKeyStorage,
  getPrivateKeyStorage,
} from "./storage";
import { useState } from "react";

export function SettingsScreen() {
  const [privateKey, setPrivateKey] = useState<string>("");

  const onLogOut = () => {
    clearPrivateKeyStorage();
    clearSocialSecretKeyStorage();
    window.location.href = "/";
  };

  const onShowPrivateKey = () => {
    setPrivateKey(getPrivateKeyStorage()!.slice(2));
  };

  return (
    <div>
      <Header canGoBack={true} screenTitle="Settings" />
      <Button onClick={onShowPrivateKey}>Show my private key</Button>
      {privateKey && (
        <div style={{ marginTop: 16 }}>
          <p>Your private key is:</p>
          <p
            style={{
              lineBreak: "anywhere",
            }}
          >
            {privateKey}
          </p>
        </div>
      )}
      <div style={{ height: 24 }} />
      <Button onClick={onLogOut}>Log out</Button>
    </div>
  );
}
