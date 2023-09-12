import { Button } from "@shopify/polaris";
import { Header } from "./Header";
import { clearPrivateKeyStorage, clearSocialSecretKeyStorage } from "./storage";

export function SettingsScreen() {
  const onLogOut = () => {
    clearPrivateKeyStorage();
    clearSocialSecretKeyStorage();
    window.location.href = "/";
  };

  return (
    <div>
      <Header canGoBack={true} screenTitle="Settings" />
      <Button onClick={onLogOut}>Log out</Button>
    </div>
  );
}
