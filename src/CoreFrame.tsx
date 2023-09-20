import { Scrollable } from "@shopify/polaris";
import { Header } from "./Header";
import { Navigation } from "./Navigation";
import { BackgroundColor } from "./types";
import { ReactNode } from "react";

export function CoreFrame(props: {
  element: ReactNode;
  headerTitle: string;
  canGoBack?: boolean;
}) {
  return (
    <div
      style={{
        backgroundColor: BackgroundColor,
        height: "100vh",
        paddingTop: 40,
        paddingBottom: 40,
        overflowY: "scroll",
        display: "flex",
        justifyContent: "center",
        paddingLeft: 100,
        paddingRight: 100,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          width: 1000,
        }}
      >
        <Navigation />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            width: "100%",
          }}
        >
          <Header
            screenTitle={props.headerTitle}
            canGoBack={props.canGoBack ?? false}
          />
          <div
            style={{
              paddingTop: 40,
              paddingLeft: 40,
            }}
          >
            {props.element}
          </div>
        </div>
      </div>
    </div>
  );
}
