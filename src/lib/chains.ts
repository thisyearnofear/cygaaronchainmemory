import type { Chain } from "viem";

// Abstract Mainnet
export const abstractMainnet = {
  id: 2741,
  name: "Abstract",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [
        "https://api.mainnet.abs.xyz",
        "https://frequent-withered-surf.abstract-mainnet.quiknode.pro/c980208c0896a2be88b9ea59315aa350d415d4f1",
        "https://abstract-mainnet.g.alchemy.com/v2/Tx9luktS3qyIwEKVtjnQrpq8t3MNEV-B",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Abscan",
      url: "https://abscan.org",
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11" as `0x${string}`,
      blockCreated: 1_234_567,
    },
  },
} as const satisfies Chain;

// Abstract Testnet
export const abstractTestnet = {
  id: 11124,
  name: "Abstract Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://api.testnet.abs.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Abscan Testnet",
      url: "https://sepolia.abscan.org",
    },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11" as `0x${string}`,
      blockCreated: 1_234_567,
    },
  },
  testnet: true,
} as const satisfies Chain;

// Ethereum Mainnet (for reference)
export const ethereumMainnet = {
  id: 1,
  name: "Ethereum",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://eth.llamarpc.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Etherscan",
      url: "https://etherscan.io",
    },
  },
} as const satisfies Chain;

// Helper function to get chain details by ID
export function getChainById(chainId: number): Chain | undefined {
  switch (chainId) {
    case abstractMainnet.id:
      return abstractMainnet;
    case abstractTestnet.id:
      return abstractTestnet;
    case ethereumMainnet.id:
      return ethereumMainnet;
    default:
      return undefined;
  }
}

// Helper function to get chain details by mode
export function getChainByMode(mode: "game" | "claim"): Chain {
  return mode === "game" ? abstractMainnet : abstractTestnet;
}
