"use client";

import {
  RainbowKitProvider,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { createPublicClient } from "viem";
import { abstractWallet } from "@abstract-foundation/agw-react/connectors";
import "@rainbow-me/rainbowkit/styles.css";
import { useState, useEffect } from "react";
import {
  abstractMainnet,
  abstractTestnet,
  ethereumMainnet,
} from "@/lib/chains";

// Configure connectors for wallets
const connectors = connectorsForWallets(
  [
    {
      groupName: "Abstract",
      wallets: [abstractWallet],
    },
  ],
  {
    appName: "Remenguini",
    projectId: "1ac4e0e446668e1e32011669ebc982dc",
  }
);

// Create wagmi config with all chains
export const config = createConfig({
  connectors,
  chains: [abstractMainnet, abstractTestnet, ethereumMainnet],
  transports: {
    [abstractMainnet.id]: http(),
    [abstractTestnet.id]: http(),
    [ethereumMainnet.id]: http(),
  },
});

// Create public clients for all chains
export const abstractMainnetClient = createPublicClient({
  chain: abstractMainnet,
  transport: http(abstractMainnet.rpcUrls.default.http[0]),
});

export const abstractTestnetClient = createPublicClient({
  chain: abstractTestnet,
  transport: http(abstractTestnet.rpcUrls.default.http[0]),
});

export const ethereumClient = createPublicClient({
  chain: ethereumMainnet,
  transport: http(ethereumMainnet.rpcUrls.default.http[0]),
});

// Export default client for game interactions (Abstract Mainnet)
export const publicClient = abstractMainnetClient;

// Add missing exports for compatibility
export const abstractClient = abstractTestnetClient;
export const mainnetClient = ethereumClient;

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
