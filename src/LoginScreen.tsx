import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ConnectButton,
  RainbowKitProvider,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import {
  WagmiConfig,
  createConfig,
  useAccount,
  configureChains,
} from "wagmi";
import { Header } from "./Header";
import {
  Hex,
  concatHex,
  keccak256,
  recoverMessageAddress,
} from "viem";
import { signMessage } from "@wagmi/core";
import { polygonMumbai } from "wagmi/chains";
import {
  githubWallet,
  googleWallet,
  twitterWallet,
} from "@zerodev/wagmi/rainbowkit";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import {
  Button,
  Spinner,
  TextField,
} from "@shopify/polaris";
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
import { Web3Auth } from "@web3auth/modal";

function SocialWalletLoginScreen(props: {
  onLogedIn: (socialSecretKey: Hex) => void;
}) {
  // Prompt the user to connect a social network and obtain their social secret key.
  // I call it secret (not private) key because it's not a key to the user's funds without a password,
  // plus it's stored in the unencrypted local browser storage (so it's not treated 100% safely).
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] =
    useState<string>("");
  let web3auth = useRef<Web3Auth | null>(null);
  const [
    web3authInitialized,
    setWeb3authInitialized,
  ] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      //Initialize within your constructor
      web3auth.current = new Web3Auth({
        clientId:
          "BNYFspU1CjXS6E7c2-YhZPX8FfshYKkMAk8kHGPvVyo7Bdls5X6JKSZD0iqJFT2_QAhglWeNGq0kkSB_CArHs-k", // Get your Client ID from Web3Auth Dashboard
        chainConfig: {
          chainNamespace: "eip155",
          chainId: "0x1", // Please use 0x5 for Goerli Testnet
          rpcTarget: "https://eth.llamarpc.com",
        },
        authMode: "WALLET",
        web3AuthNetwork: "testnet",
      });
      await web3auth.current.initModal();
      setWeb3authInitialized(true);
    })();
  }, []);

  const onLogin = async () => {
    if (!web3auth.current) return;

    await web3auth.current!.connect();
    const socialSecretKey =
      await web3auth.current.provider?.request({
        method: "eth_private_key",
      });
    props.onLogedIn(socialSecretKey as Hex);
  };

  return (
    <div>
      <p style={{ marginTop: "20px" }}>
        Welcome to Beaver Wallet! A wallet that
        makes interaction with blockchains easy
        while keeping it secure. Key features:
      </p>
      <ol>
        <li>
          Log in with a social account. No seed
          phrases.
        </li>
        <li>
          Setup subscriptions and automatically
          make periodic payments.
        </li>
      </ol>
      <p>
        We are extremely excited to see you using
        the wallet, but keep in mind that it is
        still a beta version and breaking changes
        are being introduced (though you can
        always find older versions on our github).
        We would love if you share your feedback
        with us!
      </p>
      {errorMessage && (
        <p
          style={{
            color: "red",
            whiteSpace: "pre-line",
          }}
        >
          {errorMessage}
        </p>
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
        {false ? (
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
            {web3authInitialized ? (
              <Button primary onClick={onLogin}>
                Log in
              </Button>
            ) : (
              <Spinner size="small" />
            )}
            <p style={{ marginTop: 8 }}>
              Alternatively:{" "}
              <span
                onClick={() =>
                  navigate("/private-key-login")
                }
                style={{
                  color: "blue",
                  textDecoration: "underline",
                }}
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
  const [passwordShown, setPasswordShown] =
    useState<boolean>(false);
  const [password, setPassword] =
    useState<string>("");

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
          If it is your first time using Beaver
          Wallet, create a new password and make
          sure it's long and hard to guess.
        </p>
        <TextField
          label="Password"
          type={
            passwordShown ? "text" : "password"
          }
          value={password}
          onChange={setPassword}
          autoComplete="on"
          connectedRight={
            <Button
              onClick={() =>
                setPasswordShown(!passwordShown)
              }
            >
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
          <Button
            primary
            onClick={() =>
              props.onPasswordSubmit(password)
            }
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}

export function LoginScreen() {
  const navigate = useNavigate();
  const [socialSecretKey, setSocialSecretKey] =
    useState<Hex | null>(null);

  useEffect(() => {
    if (getPrivateKeyStorage() !== null) {
      navigate("/home"); // we are fully logged in
    }
    const socialSecretKey =
      getSocialSecretKeyStorage();
    if (socialSecretKey !== null) {
      setSocialSecretKey(socialSecretKey);
    }
  }, [navigate]);

  const onPasswordSubmit = (password: string) => {
    (async () => {
      const utf8Encode = new TextEncoder();
      const passwordHash = keccak256(
        utf8Encode.encode(password)
      );

      const privateKey = keccak256(
        concatHex([
          socialSecretKey!,
          passwordHash,
        ])
      );
      setPrivateKeyStorage(privateKey);

      const myAddress =
        await getMyAddressFromOwner();
      console.log(
        "Logged in with address:",
        myAddress
      );
      setMyAddressStorage(myAddress);

      // Probably should move somewhere else?
      // Ensuring that there are some default tokens for the users to explore.
      SUPPORTED_CHAINS_LIST.forEach((chain) => {
        const defaultTokens =
          CHAIN_SETTINGS[chain.id]
            .defaultERC20Tokens;
        defaultTokens.forEach((token) =>
          storeNewToken(token)
        );
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
      <Header
        canGoBack={false}
        screenTitle="Beaver Wallet"
      />
      {socialSecretKey ? (
        <PasswordLoginScreen
          onPasswordSubmit={onPasswordSubmit}
        />
      ) : (
        <SocialWalletLoginScreen
          onLogedIn={onLoggedIn}
        />
      )}
    </div>
  );
}
