import { GoogleSocialWalletConnector } from "@zerodev/wagmi";

export function LoginScreen() {
  const connector = new GoogleSocialWalletConnector({
    options: {
      projectId: "f0847be6-87cf-4ea6-b291-ec28dbf3e086",
    },
  });

  return <p>Login</p>;
}
