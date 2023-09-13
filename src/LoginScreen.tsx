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
import { CHAIN_SETTINGS, SUPPORTED_CHAINS_LIST } from "./types";

const ZERODEV_MUMBAI_PROJECT_ID = "20dc52a9-91ff-43a9-9d32-1edd3cb23aff";

async function deriveSocialSecretKey(): Promise<Hex> {
  // I have no idea on how to get the secret key directly from the social wallet
  // So doing it this way:
  // 1. Take the social wallet
  // 2. Sign a sample message with it (can be anything, but has to be consistent across app versions)
  // 3. Hash the signature with keccak256 and get our 32 byte secret key

  const sampleMessage = "Abstract Wallet social login message"; // Can be anything
  const signature = await signMessage({
    message: sampleMessage,
  });
  await recoverMessageAddress({
    // Also check that the signature is valid
    message: sampleMessage,
    signature: signature as Hex,
  });
  return keccak256(signature);
}

function RealSocialWalletLoginScreen(props: {
  onLogedIn: (socialSecretKey: Hex) => void;
}) {
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
        setErrorMessage(
          "We are very sorry, but there was some error with logging you in.\n Please try again or choose a different social network."
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
        {isConnected ? <p>Connected.</p> : <ConnectButton label="Connect" />}
      </div>
    </div>
  );
}

export function SocialWalletLoginScreen(props: {
  onLogedIn: (socialSecretKey: Hex) => void;
}) {
  // Prompt the user to connect a social network and obtain their social secret key.
  // I call it secret (not private) key because it's not a key to the user's funds without a password,
  // plus it's stored in the unencrypted local browser storage (so it's not treated 100% safely).

  const { chains, publicClient, webSocketPublicClient } = configureChains(
    [polygonMumbai], // Chain doesn't matter because we use a custom signer later anyway
    [
      jsonRpcProvider({
        rpc: (chain) => ({ http: "https://rpc-mumbai.maticvigil.com" }), // We only need mumbai
      }),
    ]
  );

  const connectors = connectorsForWallets([
    {
      groupName: "Social",
      wallets: [
        googleWallet({
          chains,
          options: { projectId: ZERODEV_MUMBAI_PROJECT_ID },
        }),
        githubWallet({
          chains,
          options: { projectId: ZERODEV_MUMBAI_PROJECT_ID },
        }),
        twitterWallet({
          chains,
          options: { projectId: ZERODEV_MUMBAI_PROJECT_ID },
        }),
      ],
    },
  ]);

  const config = createConfig({
    autoConnect: false,
    connectors,
    publicClient,
    webSocketPublicClient,
  });

  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider chains={chains} modalSize="compact">
        <RealSocialWalletLoginScreen onLogedIn={props.onLogedIn} />
      </RainbowKitProvider>
    </WagmiConfig>
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
      console.log("Password:", password);

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
