"use client";

import {
  RainbowKitProvider,
  connectorsForWallets,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, WagmiProvider } from "wagmi";
import { createClient, http, createPublicClient } from "viem";
import { eip712WalletActions } from "viem/zksync";
import { abstractWallet } from "@abstract-foundation/agw-react/connectors";
import "@rainbow-me/rainbowkit/styles.css";

// Export the chain configuration
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
      http: [
        "https://frequent-withered-surf.abstract-testnet.quiknode.pro/c980208c0896a2be88b9ea59315aa350d415d4f1",
      ],
    },
    public: {
      http: [
        "https://frequent-withered-surf.abstract-testnet.quiknode.pro/c980208c0896a2be88b9ea59315aa350d415d4f1",
      ],
    },
    quicknode: {
      http: [
        "https://frequent-withered-surf.abstract-testnet.quiknode.pro/c980208c0896a2be88b9ea59315aa350d415d4f1",
      ],
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
    appDescription: "A blockchain memory game powered by Abstract",
    appUrl: "https://remenguini.xyz",
  }
);

// Add debug logging after config creation
console.log("Wallet Configuration:", {
  chains: [abstractTestnet],
  connectors: connectors,
});

// Create wagmi config
export const config = createConfig({
  connectors,
  chains: [abstractTestnet],
  client({ chain }) {
    return createClient({
      chain,
      transport: http(),
    }).extend(eip712WalletActions());
  },
  ssr: true,
});

// Create public client
export const publicClient = createPublicClient({
  chain: abstractTestnet,
  transport: http(),
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
