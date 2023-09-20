import { createContext, useState } from "react";
import {
  DefaultChain,
  SupportedChain,
  GeneralSettings,
} from "./types";
import {
  getCurrentChain,
  getMyAddressStorage,
  setCurrentChain,
} from "./storage";

export const SettingsContext = createContext(
  null as unknown as GeneralSettings
);

export function SettingsWrapper({
  children,
}: {
  children: any;
}) {
  const [chain, setChain] =
    useState<SupportedChain>(getCurrentChain());

  const [isLoggedIn, setIsLoggedIn] = useState(
    getMyAddressStorage() !== null
  );

  const settings = {
    chain,
    setChain: (chainId: number) => {
      setCurrentChain(chainId);
      setChain(getCurrentChain());
    },
    isLoggedIn,
    setIsLoggedIn,
  };

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}
