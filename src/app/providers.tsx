"use client";

import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { http } from "viem";
import { mainnet } from "viem/chains";
import "@rainbow-me/rainbowkit/styles.css";
import { useState, useEffect } from "react";

const abstractTestnet = {
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

// Create wagmi config
const config = getDefaultConfig({
  appName: "Penguin Memory Game",
  projectId: "1ac4e0e446668e1e32011669ebc982dc",
  chains: [abstractTestnet, mainnet],
  transports: {
    [abstractTestnet.id]: http(),
    [mainnet.id]: http(),
  },
});

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
