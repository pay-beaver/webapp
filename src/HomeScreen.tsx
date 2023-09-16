import {
  HorizontalGrid,
  LegacyCard,
  LegacyTabs,
  Select,
  Tooltip,
} from "@shopify/polaris";
import {
  useState,
  useCallback,
  useEffect,
} from "react";
import { TokensListComponent } from "./TokensList";
import { SubscriptionsComponent } from "./Subscriptions";
import { ActivityComponent } from "./Activity";
import { base, baseGoerli } from "viem/chains";
import {
  SUPPORTED_CHAINS_LIST,
  SupportedChain,
} from "./types";
import { shortenAddress } from "./utils";
import { getMyAddressFromOwner } from "./operations";
import {
  getCurrentChain,
  getMyAddressStorage,
  setCurrentChain,
} from "./storage";
import { Header } from "./Header";

const HOME_TABS = [
  {
    id: "tokens-tab",
    content: "Tokens",
  },
  {
    id: "subscriptions-tab",
    content: "Subscriptions",
  },
  {
    id: "activity-tab",
    content: "Activity",
  },
];

const CHAIN_OPTIONS = [
  {
    label: "Base Goerli",
    value: baseGoerli.id.toString(),
  },
  {
    label: "Base Mainnet",
    value: base.id.toString(),
  },
];

export function HomeScreen() {
  const [chain, setChain] =
    useState<SupportedChain>(getCurrentChain());
  const myAddress = getMyAddressStorage();
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = useCallback(
    (selectedTabIndex: number) =>
      setTabIndex(selectedTabIndex),
    []
  );

  return (
    <div>
      <Header
        canGoBack={false}
        screenTitle="Beaver (ex. Abstract) Wallet"
        settingsAvailable
      />
      <div style={{ marginBottom: 4 }}>
        <HorizontalGrid columns={2}>
          <Select
            label=""
            options={CHAIN_OPTIONS}
            onChange={(value) => {
              const newSelectedChain =
                SUPPORTED_CHAINS_LIST.find(
                  (chain) =>
                    chain.id.toString() === value
                );
              setChain(newSelectedChain!);
              setCurrentChain(newSelectedChain!);
            }}
            value={chain.id.toString()}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <Tooltip
              content={myAddress}
              width="wide"
            >
              <p
                style={{
                  paddingTop: 8,
                  textDecoration: "underline",
                }}
              >
                {myAddress
                  ? shortenAddress(myAddress)
                  : "Loading..."}
              </p>
            </Tooltip>
          </div>
        </HorizontalGrid>
      </div>
      <LegacyTabs
        tabs={HOME_TABS}
        selected={tabIndex}
        onSelect={handleTabChange}
        fitted
      >
        <LegacyCard.Section>
          {HOME_TABS[tabIndex].id ===
          "tokens-tab" ? (
            <TokensListComponent chain={chain} />
          ) : HOME_TABS[tabIndex].id ===
            "subscriptions-tab" ? (
            <SubscriptionsComponent
              chain={chain}
            />
          ) : HOME_TABS[tabIndex].id ===
            "activity-tab" ? (
            <ActivityComponent chain={chain} />
          ) : null}
        </LegacyCard.Section>
      </LegacyTabs>
    </div>
  );
}
