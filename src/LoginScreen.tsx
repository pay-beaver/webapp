import {
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Header } from "./Header";
import { Hex } from "viem";
import {
  Button,
  Spinner,
} from "@shopify/polaris";
import {
  getPrivateKeyStorage,
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
import { Web3Auth } from "@web3auth/modal";
import { SettingsContext } from "./GeneralSettings";

function SocialWalletLoginScreen(props: {
  onLogedIn: (privateKey: Hex) => void;
}) {
  const navigate = useNavigate();
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
    let privateKey =
      await web3auth.current.provider?.request({
        method: "eth_private_key",
      });
    privateKey = `0x${privateKey}`;
    console.log("private key", privateKey);
    props.onLogedIn(privateKey as Hex);
  };

  return (
    <div style={{ color: "white" }}>
      <p
        style={{
          marginTop: "20px",
        }}
      >
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
              <button
                onClick={onLogin}
                style={{
                  padding: 8,
                  paddingLeft: 16,
                  paddingRight: 16,
                  borderRadius: 6,
                  borderWidth: 0,
                  backgroundColor: `${PrimaryColor}BB`,
                  color: "white",
                  fontSize: 16,
                }}
              >
                Log in
              </button>
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
                  color: PrimaryColor,
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

export function LoginScreen() {
  const navigate = useNavigate();
  const { isLoggedIn, setIsLoggedIn } =
    useContext(SettingsContext);

  const postLogin = async (privateKey: Hex) => {
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

  useEffect(() => {
    if (isLoggedIn) {
      const privateKey = getPrivateKeyStorage();
      postLogin(privateKey!);
    }
  }, []);

  const onLoggedIn = (privateKey: Hex) => {
    setPrivateKeyStorage(privateKey);
    postLogin(privateKey);
  };

  return (
    <SocialWalletLoginScreen
      onLogedIn={onLoggedIn}
    />
  );
}
