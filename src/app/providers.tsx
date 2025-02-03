"use client";

import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { mainnet } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { abstractWallet } from "@abstract-foundation/agw-react/connectors";
import { AbstractWalletProvider } from "@abstract-foundation/agw-react";
import "@rainbow-me/rainbowkit/styles.css";

export const abstractTestnet = {
  id: 11124,
  name: "Abstract Testnet",
  network: "abstract-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://api.testnet.abs.xyz"],
    },
    public: {
      http: ["https://api.testnet.abs.xyz"],
    },
  },
} as const;

// RainbowKit configuration for normal wallets
export const wagmiConfig = getDefaultConfig({
  appName: "Remenguiny",
  projectId: "1ac4e0e446668e1e32011669ebc982dc",
  chains: [abstractTestnet, mainnet],
  wallets: [
    {
      groupName: "Abstract",
      wallets: [abstractWallet], // This adds Abstract Wallet as an option in RainbowKit
    },
  ],
});

const queryClient = new QueryClient();

// Provider nesting that enables both systems
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AbstractWalletProvider // This enables Abstract Wallet functionality
          chain={abstractTestnet}
          queryClient={queryClient}
        >
          <RainbowKitProvider>{children}</RainbowKitProvider>
        </AbstractWalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
