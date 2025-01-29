"use client";

import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { mainnet } from "wagmi/chains";
import { createPublicClient } from "viem";
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
export const config = createConfig({
  chains: [abstractTestnet, mainnet],
  transports: {
    [abstractTestnet.id]: http(),
    [mainnet.id]: http(),
  },
});

// Create a proper public client using viem
export const publicClient = createPublicClient({
  chain: abstractTestnet,
  transport: http(abstractTestnet.rpcUrls.public.http[0]),
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
