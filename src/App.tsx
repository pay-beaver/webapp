import "./App.css";
import "@shopify/polaris/build/esm/styles.css";
import "@rainbow-me/rainbowkit/styles.css";
import { BrowserRouter, MemoryRouter, Route, Routes } from "react-router-dom";
import SendScreen from "./SendScreen";
import { AppProvider, LegacyCard, Scrollable } from "@shopify/polaris";
import { HomeScreen } from "./HomeScreen";
import { AddSubscriptionScreen } from "./AddSubscriptionScreen";
import { ImportTokenScreen } from "./ImportTokenScreen";
import { LoginScreen } from "./LoginScreen";
import { SettingsScreen } from "./SettingsScreen";
import { WagmiWrapper } from "./WagmiWrapper";
import { PrivateKeyLoginScreen } from "./PrivateKeyLoginScreen";

window.Buffer = window.Buffer || require("buffer").Buffer;

function App() {
  return (
    <AppProvider i18n={{}}>
      <WagmiWrapper>
        <div
          style={{
            backgroundColor: "white",
            height: "100vh",
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <Scrollable style={{ height: "100vh", width: "500px", padding: 10 }}>
            <MemoryRouter>
              <Routes>
                <Route index element={<LoginScreen />} />
                <Route
                  path="/private-key-login"
                  element={<PrivateKeyLoginScreen />}
                />
                <Route path="/home" element={<HomeScreen />} />
                <Route path="/send" element={<SendScreen />} />
                <Route
                  path="/add-subscription"
                  element={<AddSubscriptionScreen />}
                />
                <Route path="/import-token" element={<ImportTokenScreen />} />
                <Route path="/settings" element={<SettingsScreen />} />
              </Routes>
            </MemoryRouter>
          </Scrollable>
        </div>
      </WagmiWrapper>
    </AppProvider>
  );
}

export default App;
