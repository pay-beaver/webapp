import {
  Box,
  Button,
  LegacyCard,
  TextField,
  Tooltip,
} from "@shopify/polaris";
import {
  ERC20Token,
  JiffyScanNetworks,
  PrimaryColor,
} from "./types";
import NumberField from "./NumberField";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import { sendERC20Token } from "./operations";
import { Hex, getAddress, isAddress } from "viem";
import { addActivityAction } from "./storage";
import {
  shortenAddress,
  timestampNow,
} from "./utils";
import { useState } from "react";
import { CircleInformationMajor } from "@shopify/polaris-icons";
import { Header } from "./Header";

export default function SendScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const selectedToken: ERC20Token = state!.token;
  const [sendTo, setSendTo] = useState<
    string | null
  >(null);
  const [amountToSend, setAmountToSend] =
    useState<string | null>(null);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);
  const [
    processingStatusText,
    setProcessingStatusText,
  ] = useState<string | null>(null);
  const [sentUserOpHash, setSentUserOpHash] =
    useState<Hex | null>(null);

  let jiffyscanLink = null;
  if (sentUserOpHash) {
    const jiffyScanNetworkId =
      JiffyScanNetworks[
        selectedToken!
          .chainId as keyof typeof JiffyScanNetworks
      ];
    jiffyscanLink = `https://www.jiffyscan.xyz/userOpHash/${sentUserOpHash}?network=${jiffyScanNetworkId}`;
  }

  const validateInput = (): [number, Hex] => {
    if (!sendTo) {
      throw new Error("Please enter a recipient");
    }
    if (!isAddress(sendTo)) {
      throw new Error(
        "Please enter a valid recipient address"
      );
    }
    if (!amountToSend) {
      throw new Error("Please enter an amount");
    }

    return [
      parseFloat(amountToSend),
      getAddress(sendTo),
    ];
  };

  const onSend = async () => {
    let validatedAmountToSend: number;
    let validatedSendTo: Hex;
    try {
      [validatedAmountToSend, validatedSendTo] =
        validateInput();
    } catch (e: any) {
      setErrorMessage(e.message);
      return;
    }

    setErrorMessage(null);
    setProcessingStatusText(
      "Sending the token..."
    );
    let userOpHash: Hex;
    try {
      userOpHash = await sendERC20Token(
        selectedToken!,
        validatedSendTo,
        validatedAmountToSend
      );
    } catch (e: any) {
      console.error(
        "Got error when sending token",
        e
      );
      setErrorMessage(
        "Could not send the token. Make sure that your ETH balance is sufficient to pay for the operation and that your token balance is sufficient."
      );
      setProcessingStatusText(null);
      return;
    }
    addActivityAction({
      chainId: selectedToken.chainId,
      title: "Sent token",
      description: `Sent ${validatedAmountToSend} ${
        selectedToken!.symbol
      } to ${shortenAddress(validatedSendTo!)}`,
      timestamp: timestampNow(),
      userOpHash,
      activityType: "start-subscription",
    });
    setProcessingStatusText(null);
    setSentUserOpHash(userOpHash);
  };

  return (
    <div>
      <p
        style={{
          marginTop: 10,
          marginBottom: 10,
          color: "white",
        }}
      >
        Sending token:{" "}
        <strong>{selectedToken?.name}</strong>
      </p>
      <p
        style={{
          color: "white",
          marginBottom: 8,
          marginTop: 24,
          width: 400,
        }}
      >
        Send to
      </p>
      <input
        placeholder="0x..."
        value={sendTo ? sendTo : ""}
        onChange={(event) =>
          setSendTo(event.target.value)
        }
        autoComplete="off"
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
      <div style={{ height: 10 }} />
      <NumberField
        label="Amount to send"
        value={amountToSend}
        onChange={setAmountToSend}
      />
      {processingStatusText && (
        <p
          style={{
            textAlign: "center",
            marginTop: 10,
            color: "white",
          }}
        >
          {processingStatusText}
        </p>
      )}
      {errorMessage && (
        <p
          style={{
            color: "red",
            textAlign: "center",
            marginTop: 10,
          }}
        >
          {errorMessage}
        </p>
      )}
      {jiffyscanLink && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 12,
          }}
        >
          <p
            style={{
              display: "inline",
              color: "white",
            }}
          >
            Successfully sent! Details:{" "}
            <a
              href={jiffyscanLink}
              style={{ color: PrimaryColor }}
            >
              {" "}
              JiffyScan
            </a>
          </p>
          <Tooltip content="Please allow some time for the user operation to be indexed on JiffyScan">
            <div style={{ display: "inline" }}>
              <CircleInformationMajor
                width={20}
                widths="24px"
              />
            </div>
          </Tooltip>
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 16,
        }}
      >
        {!sentUserOpHash && (
          <button
            disabled={
              selectedToken === null ||
              sendTo === null ||
              amountToSend === null ||
              processingStatusText !== null
            }
            onClick={onSend}
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
            Send operation
          </button>
        )}
        {sentUserOpHash && (
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
