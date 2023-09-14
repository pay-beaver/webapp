import { useEffect, useState } from "react";
import {
  ConnectButton,
  RainbowKitProvider,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import { WagmiConfig, createConfig, useAccount, configureChains } from "wagmi";
import { Header } from "./Header";
import { Hex, concatHex, keccak256, recoverMessageAddress } from "viem";
import { signMessage } from "@wagmi/core";
import { polygonMumbai } from "wagmi/chains";
import {
  githubWallet,
  googleWallet,
  twitterWallet,
} from "@zerodev/wagmi/rainbowkit";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { Button, TextField } from "@shopify/polaris";
import {
  getPrivateKeyStorage,
  getSocialSecretKeyStorage,
  setMyAddressStorage,
  setPrivateKeyStorage,
  setSocialSecretKeyStorage,
  storeNewToken,
} from "./storage";
import { useNavigate } from "react-router-dom";
import { getMyAddressFromOwner } from "./operations";
import {
  CHAIN_SETTINGS,
  SUPPORTED_CHAINS_LIST,
  ZERODEV_MUMBAI_PROJECT_ID,
} from "./types";
import { ZeroDevWeb3Auth } from "@zerodev/web3auth";

async function deriveSocialSecretKey(): Promise<Hex> {
  const zeroDevWeb3Auth = new ZeroDevWeb3Auth(ZERODEV_MUMBAI_PROJECT_ID);
  const privateKey = await zeroDevWeb3Auth.provider.request({
    method: "eth_private_key", // use "private_key" for other non-evm chains
  });
  return `0x${privateKey}`;
}

function SocialWalletLoginScreen(props: {
  onLogedIn: (socialSecretKey: Hex) => void;
}) {
  // Prompt the user to connect a social network and obtain their social secret key.
  // I call it secret (not private) key because it's not a key to the user's funds without a password,
  // plus it's stored in the unencrypted local browser storage (so it's not treated 100% safely).
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!isConnected) return;
    console.log("Connected! Validating the signer.");

    (async () => {
      let socialSecretKey;
      try {
        socialSecretKey = await deriveSocialSecretKey();
      } catch (e) {
        console.log("Error while deriving the social secret key:", e);
        setErrorMessage(
          "We are very sorry, but there was some error with logging you in.\n Please try again or choose a different social network or log in with a private key."
        );
        return;
      }
      props.onLogedIn(socialSecretKey);
    })();
  }, [isConnected, props]);

  return (
    <div>
      <p style={{ marginTop: "20px" }}>
        Welcome to Abstract Wallet! A wallet that makes interaction with
        blockchains easy while keeping it secure. Key features:
      </p>
      <ol>
        <li>Log in with a social account. No seed phrases.</li>
        <li>Setup subscriptions and automatically make periodic payments.</li>
      </ol>
      <p>
        We are extremely excited to see you using the wallet, but keep in mind
        that it is still a beta version and breaking changes are being
        introduced (though you can always find older versions on our github). We
        would love if you share your feedback with us!
      </p>
      {errorMessage && (
        <p style={{ color: "red", whiteSpace: "pre-line" }}>{errorMessage}</p>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          height: "100px",
        }}
      >
        {isConnected ? (
          <p>Connected.</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: 32,
            }}
          >
            <ConnectButton label="Connect" />
            <p style={{ marginTop: 8 }}>
              Alternatively:{" "}
              <span
                onClick={() => navigate("/private-key-login")}
                style={{ color: "blue", textDecoration: "underline" }}
              >
                log in
              </span>{" "}
              with a private key
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PasswordLoginScreen(props: {
  onPasswordSubmit: (password: string) => void;
}) {
  const [passwordShown, setPasswordShown] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
      }}
    >
      <div>
        <p>Now please enter your password.</p>
        <p style={{ marginBottom: 16 }}>
          If it is your first time using Abstract Wallet, create a new password
          and make sure it's long and hard to guess.
        </p>
        <TextField
          label="Password"
          type={passwordShown ? "text" : "password"}
          value={password}
          onChange={setPassword}
          autoComplete="on"
          connectedRight={
            <Button onClick={() => setPasswordShown(!passwordShown)}>
              {passwordShown ? "Hide" : "Show"}
            </Button>
          }
        />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 16,
          }}
        >
          <Button primary onClick={() => props.onPasswordSubmit(password)}>
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}

export function LoginScreen() {
  const navigate = useNavigate();
  const [socialSecretKey, setSocialSecretKey] = useState<Hex | null>(null);

  useEffect(() => {
    if (getPrivateKeyStorage() !== null) {
      navigate("/home"); // we are fully logged in
    }
    const socialSecretKey = getSocialSecretKeyStorage();
    if (socialSecretKey !== null) {
      setSocialSecretKey(socialSecretKey);
    }
  }, [navigate]);

  const onPasswordSubmit = (password: string) => {
    (async () => {
      const utf8Encode = new TextEncoder();
      const passwordHash = keccak256(utf8Encode.encode(password));

      const privateKey = keccak256(concatHex([socialSecretKey!, passwordHash]));
      setPrivateKeyStorage(privateKey);

      const myAddress = await getMyAddressFromOwner();
      console.log("Logged in with address:", myAddress);
      setMyAddressStorage(myAddress);

      // Probably should move somewhere else?
      // Ensuring that there are some default tokens for the users to explore.
      SUPPORTED_CHAINS_LIST.forEach((chain) => {
        const defaultTokens = CHAIN_SETTINGS[chain.id].defaultERC20Tokens;
        defaultTokens.forEach((token) => storeNewToken(token));
      });
      navigate("/home");
    })();
  };

  const onLoggedIn = (socialSecretKey: Hex) => {
    setSocialSecretKeyStorage(socialSecretKey);
    setSocialSecretKey(socialSecretKey);
  };

  return (
    <div>
      <Header canGoBack={false} screenTitle="Abstract Wallet" />
      {socialSecretKey ? (
        <PasswordLoginScreen onPasswordSubmit={onPasswordSubmit} />
      ) : (
        <SocialWalletLoginScreen onLogedIn={onLoggedIn} />
      )}
    </div>
  );
}
