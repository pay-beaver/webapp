import { MobileBackArrowMajor } from "@shopify/polaris-icons";
import { useNavigate } from "react-router-dom";
import { SettingsMinor } from "@shopify/polaris-icons";
import { PrimaryColor } from "./types";
import { GoBackIcon } from "./icons";
import { useState } from "react";

export function Header(props: {
  canGoBack: boolean;
  screenTitle: string;
  settingsAvailable?: boolean;
}) {
  const navigate = useNavigate();
  const [backHovered, setBackHovered] =
    useState(false);

  let goBackBackgroundOpacity = 0;
  if (backHovered) {
    goBackBackgroundOpacity = 0.1;
  }

  let goBackComponent = <div />;
  if (props.canGoBack) {
    goBackComponent = (
      <div
        onMouseEnter={() => setBackHovered(true)}
        onMouseLeave={() => setBackHovered(false)}
        style={{
          backgroundColor: `rgba(255, 255, 255, ${goBackBackgroundOpacity})`,
          borderRadius: 8,
          paddingLeft: 12,
          paddingRight: 12,
          paddingTop: 2,
        }}
        onClick={() => {
          setBackHovered(false);
          navigate(-1);
        }}
      >
        <GoBackIcon />
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 16,
        paddingTop: 6,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {goBackComponent}
        <div>
          <p
            style={{
              textAlign: "center",
              fontSize: 32,
              color: "white",
            }}
          >
            {props.screenTitle}
          </p>
        </div>
        <div />
      </div>
    </div>
  );
}
