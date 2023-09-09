import {
  Box,
  Button,
  LegacyCard,
  LegacyTabs,
  TabProps,
  Tabs,
} from "@shopify/polaris";
import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { TokensListComponent } from "./TokensList";
import { SubscriptionsComponent } from "./Subscriptions";
import { ActivityComponent } from "./Activity";

export function HomeScreen() {
  const [selected, setSelected] = useState(0);

  const handleTabChange = useCallback(
    (selectedTabIndex: number) => setSelected(selectedTabIndex),
    []
  );

  const tabs = [
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

  return (
    <LegacyCard>
      <LegacyTabs
        tabs={tabs}
        selected={selected}
        onSelect={handleTabChange}
        fitted
      >
        <LegacyCard.Section>
          {tabs[selected].id === "tokens-tab" ? (
            <TokensListComponent />
          ) : tabs[selected].id === "subscriptions-tab" ? (
            <SubscriptionsComponent />
          ) : tabs[selected].id === "activity-tab" ? (
            <ActivityComponent />
          ) : null}
        </LegacyCard.Section>
      </LegacyTabs>
    </LegacyCard>
  );
}
