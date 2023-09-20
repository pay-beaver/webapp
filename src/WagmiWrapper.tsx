import { Hex } from "viem";
import { polygonMumbai } from "viem/chains";
import {
  WagmiConfig,
  configureChains,
  createConfig,
} from "wagmi";
import {
  githubWallet,
  googleWallet,
  twitterWallet,
} from "@zerodev/wagmi/rainbowkit";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import {
  RainbowKitProvider,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import { ZerodevMumbaiProjectId } from "./types";

export function WagmiWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    chains,
    publicClient,
    webSocketPublicClient,
  } = configureChains(
    [polygonMumbai], // Chain doesn't matter because we use a custom signer later anyway
    [
      jsonRpcProvider({
        rpc: (chain) => ({
          http: "https://rpc-mumbai.maticvigil.com",
        }), // We only need mumbai
      }),
    ]
  );

  const connectors = connectorsForWallets([
    {
      groupName: "Social",
      wallets: [
        googleWallet({
          chains,
          options: {
            projectId: ZerodevMumbaiProjectId,
          },
        }),
        githubWallet({
          chains,
          options: {
            projectId: ZerodevMumbaiProjectId,
          },
        }),
        twitterWallet({
          chains,
          options: {
            projectId: ZerodevMumbaiProjectId,
          },
        }),
      ],
    },
  ]);

  const config = createConfig({
    autoConnect: false,
    connectors,
    publicClient,
    webSocketPublicClient,
  });

  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider
        chains={chains}
        modalSize="compact"
      >
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
