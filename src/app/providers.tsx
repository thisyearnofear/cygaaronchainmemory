"use client";

import {
  RainbowKitProvider,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { mainnet } from "wagmi/chains";
import { createPublicClient } from "viem";
import { abstractWallet } from "@abstract-foundation/agw-react/connectors";
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
      http: [
        "https://api.testnet.abs.xyz",
        "https://frequent-withered-surf.abstract-testnet.quiknode.pro/c980208c0896a2be88b9ea59315aa350d415d4f1",
        "https://abstract-testnet.g.alchemy.com/v2/Tx9luktS3qyIwEKVtjnQrpq8t3MNEV-B",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Abscan",
      url: "https://sepolia.abscan.org",
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11" as `0x${string}`,
      blockCreated: 1_234_567,
    },
  },
} as const;

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

// Create wagmi config
export const config = createConfig({
  connectors,
  chains: [abstractTestnet, mainnet],
  transports: {
    [abstractTestnet.id]: http(),
    [mainnet.id]: http(),
  },
});

// Create a proper public client using viem
export const publicClient = createPublicClient({
  chain: abstractTestnet,
  transport: http(abstractTestnet.rpcUrls.default.http[0]),
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
