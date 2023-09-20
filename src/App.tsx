import "./App.css";
import "@shopify/polaris/build/esm/styles.css";
import "@rainbow-me/rainbowkit/styles.css";
import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router-dom";
import SendScreen from "./SendScreen";
import { AppProvider } from "@shopify/polaris";
import { OverviewScreen } from "./OverviewScreen";
import { AddSubscriptionScreen } from "./AddSubscriptionScreen";
import { ImportTokenScreen } from "./ImportTokenScreen";
import { LoginScreen } from "./LoginScreen";
import { SettingsScreen } from "./SettingsScreen";
import { PrivateKeyLoginScreen } from "./PrivateKeyLoginScreen";
import { CoreFrame } from "./CoreFrame";
import { SettingsWrapper } from "./GeneralSettings";
import { ActivityComponent } from "./Activity";
import { SubscriptionsComponent } from "./Subscriptions";

window.Buffer =
  window.Buffer || require("buffer").Buffer;

function App() {
  return (
    <AppProvider i18n={{}}>
      <SettingsWrapper>
        <MemoryRouter>
          <Routes>
            <Route
              path="/"
              element={
                <CoreFrame
                  element={<LoginScreen />}
                  headerTitle="Beaver Wallet"
                />
              }
            />
            <Route
              path="/private-key-login"
              element={
                <CoreFrame
                  element={
                    <PrivateKeyLoginScreen />
                  }
                  headerTitle="Beaver Wallet"
                  canGoBack
                />
              }
            />
            <Route
              path="/overview"
              element={
                <CoreFrame
                  element={<OverviewScreen />}
                  headerTitle="Beaver Wallet"
                />
              }
            />
            <Route
              path="/send"
              element={
                <CoreFrame
                  element={<SendScreen />}
                  headerTitle="Send token"
                  canGoBack
                />
              }
            />
            <Route
              path="/add-subscription"
              element={
                <CoreFrame
                  element={
                    <AddSubscriptionScreen />
                  }
                  headerTitle="Add subscription"
                  canGoBack
                />
              }
            />
            <Route
              path="/import-token"
              element={
                <CoreFrame
                  element={<ImportTokenScreen />}
                  headerTitle="Import token"
                  canGoBack
                />
              }
            />
            <Route
              path="/settings"
              element={
                <CoreFrame
                  element={<SettingsScreen />}
                  headerTitle="Settings"
                />
              }
            />
            <Route
              path="/activity"
              element={
                <CoreFrame
                  element={<ActivityComponent />}
                  headerTitle="Activity history"
                />
              }
            />
            <Route
              path="/subscriptions"
              element={
                <CoreFrame
                  element={
                    <SubscriptionsComponent />
                  }
                  headerTitle="Subscriptions"
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </SettingsWrapper>
    </AppProvider>
  );
}

export default App;
