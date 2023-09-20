import { createContext, useState } from "react";
import {
  DefaultChain,
  SupportedChain,
  GeneralSettings,
} from "./types";
import {
  getCurrentChain,
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

  const settings = {
    chain,
    setChain: (chainId: number) => {
      setCurrentChain(chainId);
      setChain(getCurrentChain());
    },
  };

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}
