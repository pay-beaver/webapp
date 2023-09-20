import {
  Button,
  LegacyCard,
  TextField,
} from "@shopify/polaris";
import { useState } from "react";
import { Hex, getAddress, isAddress } from "viem";
import { resolveToken } from "./tokens";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ERC20Token,
  PrimaryColor,
} from "./types";
import { storeNewToken } from "./storage";
import { Header } from "./Header";

export function ImportTokenScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const chain = state!.chain;
  const [tokenAddress, setTokenAddress] =
    useState<string>("");
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);
  const [
    processingStatusText,
    setProcessingStatusText,
  ] = useState<string | null>(null);
  const [resolvedToken, setResolvedToken] =
    useState<ERC20Token | null>(null);
  const [imported, setImported] =
    useState<boolean>(false);

  const validateAddress = (): Hex => {
    if (!tokenAddress) {
      throw new Error(
        "Please enter a token address"
      );
    }
    if (!isAddress(tokenAddress)) {
      throw new Error(
        "Please enter a valid token address"
      );
    }
    return getAddress(tokenAddress);
  };

  const onResolve = async () => {
    let address;
    try {
      address = validateAddress();
    } catch (e: any) {
      setErrorMessage(e.message);
      return;
    }
    setErrorMessage(null);
    setProcessingStatusText(
      "Resolving token properties"
    );
    const token = await resolveToken(
      chain,
      address
    );
    if (token === undefined) {
      setErrorMessage("Could not resolve token");
      setProcessingStatusText(null);
      return;
    }
    setProcessingStatusText(
      `Resolved token. \n Name: ${token.name} \n Symbol: ${token.symbol} \n Decimals: ${token.decimals}`
    );
    setResolvedToken(token);
  };

  const onImport = async () => {
    await storeNewToken(resolvedToken!);
    setProcessingStatusText(
      "Successfully imported!"
    );
    setImported(true);
  };

  return (
    <div>
      <p
        style={{
          color: "white",
          marginBottom: 8,
          marginTop: 24,
          width: 400,
        }}
      >
        Token address
      </p>
      <input
        placeholder="0x..."
        autoComplete="off"
        value={tokenAddress}
        onChange={(event) =>
          setTokenAddress(event.target.value)
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
      />
      {processingStatusText && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              marginTop: 10,
              whiteSpace: "pre-line",
              color: "white",
            }}
          >
            {processingStatusText}
          </p>
        </div>
      )}
      {errorMessage && (
        <p
          style={{
            color: "red",
            textAlign: "center",
            marginTop: 10,
            marginBottom: 10,
          }}
        >
          {errorMessage}
        </p>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 16,
        }}
      >
        {resolvedToken === null && (
          <button
            onClick={onResolve}
            disabled={
              processingStatusText !== null
            }
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
            Resolve
          </button>
        )}
        {resolvedToken !== null && !imported && (
          <button
            onClick={onImport}
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
            Import
          </button>
        )}
        {imported && (
          <button
            onClick={() => navigate(-1)}
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
            Return back home
          </button>
        )}
      </div>
    </div>
  );
}
