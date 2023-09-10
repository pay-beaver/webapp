import React from "react";
import { Buffer } from "buffer";
import "./App.css";
import "@shopify/polaris/build/esm/styles.css";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SendScreen from "./SendScreen";
import { AppProvider } from "@shopify/polaris";
import { I18n } from "@shopify/polaris/build/ts/src/utilities/i18n";
import { HomeScreen } from "./HomeScreen";
import { AddSubscriptionScreen } from "./AddSubscriptionScreen";
import { ImportTokenScreen } from "./ImportTokenScreen";

window.Buffer = window.Buffer || require("buffer").Buffer;

function App() {
  return (
    <AppProvider i18n={{}}>
      <MemoryRouter>
        <Routes>
          <Route index element={<HomeScreen />} />
          <Route path="/send" element={<SendScreen />} />
          <Route path="/add-subscription" element={<AddSubscriptionScreen />} />
          <Route path="/import-token" element={<ImportTokenScreen />} />
        </Routes>
      </MemoryRouter>
    </AppProvider>
  );
}

export default App;
