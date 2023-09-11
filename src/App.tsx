import "./App.css";
import "@shopify/polaris/build/esm/styles.css";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SendScreen from "./SendScreen";
import { AppProvider, LegacyCard, Scrollable } from "@shopify/polaris";
import { HomeScreen } from "./HomeScreen";
import { AddSubscriptionScreen } from "./AddSubscriptionScreen";
import { ImportTokenScreen } from "./ImportTokenScreen";
import {
  clearDecryptedPrivateKey,
  setDecryptedPrivateKey,
  setMyAddressStorage,
} from "./storage";
import { LoginScreen } from "./LoginScreen";

window.Buffer = window.Buffer || require("buffer").Buffer;

function App() {
  // setMyAddressStorage("0xcA9e9FC5f719ccCbC8859080981b3A3A77058C77");
  // setDecryptedPrivateKey(`0x${"10".repeat(32)}`);
  clearDecryptedPrivateKey();
  return (
    <AppProvider i18n={{}}>
      <LegacyCard>
        <Scrollable style={{ height: "600px", padding: 10 }}>
          <MemoryRouter>
            <Routes>
              <Route index element={<LoginScreen />} />
              <Route path="/home" element={<HomeScreen />} />
              <Route path="/send" element={<SendScreen />} />
              <Route
                path="/add-subscription"
                element={<AddSubscriptionScreen />}
              />
              <Route path="/import-token" element={<ImportTokenScreen />} />
            </Routes>
          </MemoryRouter>
        </Scrollable>
      </LegacyCard>
    </AppProvider>
  );
}

export default App;
