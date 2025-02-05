export const abi = [
  // Game functions
  {
    inputs: [
      { internalType: "uint8", name: "level", type: "uint8" },
      { internalType: "bytes32", name: "levelHash", type: "bytes32" },
    ],
    name: "startGame",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint8", name: "level", type: "uint8" },
      { internalType: "uint32", name: "clicks", type: "uint32" },
      { internalType: "bytes", name: "proof", type: "bytes" },
    ],
    name: "submitScore",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint8", name: "level", type: "uint8" }],
    name: "getLeaderboard",
    outputs: [
      {
        components: [
          { internalType: "address", name: "player", type: "address" },
          { internalType: "uint32", name: "score", type: "uint32" },
        ],
        internalType: "struct PenguinGameMainnet.LeaderboardEntry[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Smart wallet support
  {
    inputs: [{ internalType: "address", name: "eoa", type: "address" }],
    name: "associateWallet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "wallet", type: "address" }],
    name: "getActualPlayer",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  // Stats functions
  {
    inputs: [
      { internalType: "address", name: "player", type: "address" },
      { internalType: "uint8", name: "level", type: "uint8" },
    ],
    name: "getPlayerBestScore",
    outputs: [{ internalType: "uint32", name: "bestScore", type: "uint32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint8", name: "level", type: "uint8" }],
    name: "getUniquePlayersCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Constants and admin
  {
    inputs: [],
    name: "MAX_LEVEL",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "LEADERBOARD_SIZE",
    outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
