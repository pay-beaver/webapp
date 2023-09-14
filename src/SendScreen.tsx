import { Box, Button, LegacyCard, TextField, Tooltip } from "@shopify/polaris";
import { ERC20Token, JIFFY_SCAN_NETWORKS } from "./types";
import NumberField from "./NumberField";
import { useLocation, useNavigate } from "react-router-dom";
import { sendERC20Token } from "./operations";
import { Hex, getAddress, isAddress } from "viem";
import { addActivityAction } from "./storage";
import { shortenAddress, timestampNow } from "./utils";
import { useState } from "react";
import { CircleInformationMajor } from "@shopify/polaris-icons";
import { Header } from "./Header";

export default function SendScreen() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const selectedToken: ERC20Token = state!.token;
  const [sendTo, setSendTo] = useState<string | null>(null);
  const [amountToSend, setAmountToSend] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingStatusText, setProcessingStatusText] = useState<
    string | null
  >(null);
  const [sentUserOpHash, setSentUserOpHash] = useState<Hex | null>(null);

  let jiffyscanLink = null;
  if (sentUserOpHash) {
    const jiffyScanNetworkId =
      JIFFY_SCAN_NETWORKS[
        selectedToken!.chainId as keyof typeof JIFFY_SCAN_NETWORKS
      ];
    jiffyscanLink = `https://www.jiffyscan.xyz/userOpHash/${sentUserOpHash}?network=${jiffyScanNetworkId}`;
  }

  const validateInput = (): [number, Hex] => {
    if (!sendTo) {
      throw new Error("Please enter a recipient");
    }
    if (!isAddress(sendTo)) {
      throw new Error("Please enter a valid recipient address");
    }
    if (!amountToSend) {
      throw new Error("Please enter an amount");
    }

    return [parseFloat(amountToSend), getAddress(sendTo)];
  };

  const onSend = async () => {
    let validatedAmountToSend: number;
    let validatedSendTo: Hex;
    try {
      [validatedAmountToSend, validatedSendTo] = validateInput();
    } catch (e: any) {
      setErrorMessage(e.message);
      return;
    }

    setErrorMessage(null);
    setProcessingStatusText("Sending the token...");
    let userOpHash: Hex;
    try {
      userOpHash = await sendERC20Token(
        selectedToken!,
        validatedSendTo,
        validatedAmountToSend
      );
    } catch (e: any) {
      console.error("Got error when sending token", e);
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
      <Header canGoBack={true} screenTitle="Send token" />
      <p style={{ marginTop: 10, marginBottom: 10 }}>
        Sending token: <strong>{selectedToken?.name}</strong>
      </p>
      <TextField
        label="Send to"
        value={sendTo ? sendTo : ""}
        onChange={(value) => setSendTo(value)}
        autoComplete="off"
      />
      <div style={{ height: 10 }} />
      <NumberField
        label="Amount to send"
        value={amountToSend}
        onChange={setAmountToSend}
      />
      {processingStatusText && (
        <p style={{ textAlign: "center", marginTop: 10 }}>
          {processingStatusText}
        </p>
      )}
      {errorMessage && (
        <p style={{ color: "red", textAlign: "center", marginTop: 10 }}>
          {errorMessage}
        </p>
      )}
      {jiffyscanLink && (
        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 12 }}
        >
          <p style={{ display: "inline" }}>
            Successfully sent! Details: <a href={jiffyscanLink}> JiffyScan</a>
          </p>
          <Tooltip content="Please allow some time for the user operation to be indexed on JiffyScan">
            <div style={{ display: "inline" }}>
              <CircleInformationMajor width={20} widths="24px" />
            </div>
          </Tooltip>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
        {!sentUserOpHash && (
          <Button
            disabled={
              selectedToken === null ||
              sendTo === null ||
              amountToSend === null ||
              processingStatusText !== null
            }
            onClick={onSend}
            primary
          >
            Send operation
          </Button>
        )}
        {sentUserOpHash && (
          <Button primary onClick={() => navigate(-1)}>
            Return back home
          </Button>
        )}
      </div>
    </div>
  );
}
