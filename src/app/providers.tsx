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
import { abstractMainnet } from "@/lib/chains";
import { mainnet } from "viem/chains";

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

// Create wagmi config with both chains
export const config = createConfig({
  connectors,
  chains: [abstractMainnet, mainnet],
  transports: {
    [abstractMainnet.id]: http(),
    [mainnet.id]: http(),
  },
});

// Create public clients for both chains
export const abstractClient = createPublicClient({
  chain: abstractMainnet,
  transport: http(abstractMainnet.rpcUrls.default.http[0]),
});

export const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

// Export default client for game interactions
export const publicClient = abstractClient;

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
