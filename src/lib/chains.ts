import type { Chain } from "viem";

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
