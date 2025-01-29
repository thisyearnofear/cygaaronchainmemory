export const abi = [
  {
    inputs: [
      { name: "level", type: "uint256" },
      { name: "levelHash", type: "bytes32" },
    ],
    name: "startGame",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "level", type: "uint256" },
      { name: "clicks", type: "uint256" },
      { name: "proof", type: "bytes" },
    ],
    name: "submitScore",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
