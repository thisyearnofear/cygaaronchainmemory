import { useWriteContract, useChainId, usePublicClient } from "wagmi";
import { keccak256, type TransactionReceipt, stringToHex } from "viem";
import { useState, useCallback } from "react";
import { wagmiConfig } from "@/app/providers";

const PENGUIN_GAME_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "level", type: "uint256" },
      { internalType: "bytes32", name: "levelHash", type: "bytes32" },
    ],
    name: "startGame",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "level", type: "uint256" },
      { internalType: "uint256", name: "clicks", type: "uint256" },
      { internalType: "bytes", name: "proof", type: "bytes" },
    ],
    name: "submitScore",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "level", type: "uint256" }],
    name: "getLeaderboard",
    outputs: [
      {
        components: [
          { internalType: "address", name: "player", type: "address" },
          { internalType: "uint256", name: "score", type: "uint256" },
        ],
        internalType: "struct PenguinGame.LeaderboardEntry[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const CONTRACT_ADDRESS = "0xFae263fE7ae81169119aC43e6523d51eaBC9b6D2" as const;

type WagmiTransaction = {
  hash: `0x${string}`;
  wait: () => Promise<TransactionReceipt>;
};

export type LeaderboardEntry = {
  player: `0x${string}`;
  score: bigint;
};

export type LeaderboardData = {
  level: number;
  data: readonly LeaderboardEntry[];
};

// Add type for the receipt status
type TransactionStatus = "success" | "reverted" | 1 | "0x1";

// Fix the any type
type ErrorWithMessage = Error & {
  message?: string;
};

export function usePenguinGameContract() {
  const { writeContractAsync } = useWriteContract();
  const [leaderboards, setLeaderboards] = useState<LeaderboardData[]>([]);
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const refreshLeaderboard = useCallback(async () => {
    if (!chainId || !publicClient) return;

    try {
      console.log("Refreshing all leaderboards...");
      const newLeaderboards: LeaderboardData[] = [];

      for (let level = 1; level <= 3; level++) {
        try {
          const data = (await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: PENGUIN_GAME_ABI,
            functionName: "getLeaderboard",
            args: [BigInt(level)],
          })) as readonly LeaderboardEntry[];

          newLeaderboards.push({ level, data });
        } catch (error) {
          console.error(`Level ${level} leaderboard error:`, error);
          newLeaderboards.push({ level, data: [] });
        }
      }

      setLeaderboards(newLeaderboards);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    }
  }, [chainId, publicClient]);

  const startGame = async (level: number) => {
    if (!publicClient) throw new Error("Public client not initialized");

    try {
      const levelHash = keccak256(
        stringToHex(
          JSON.stringify({
            level,
            timestamp: Date.now(),
            random: Math.random(),
          })
        )
      );

      console.log("Starting game session...", { level, levelHash });

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: PENGUIN_GAME_ABI,
        functionName: "startGame",
        args: [BigInt(level), levelHash],
      });

      // Wait for transaction to be mined
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    } catch (error) {
      console.error("Failed to start game:", error);
      throw error;
    }
  };

  const submitScore = async (
    args: [bigint, bigint, `0x${string}`]
  ): Promise<WagmiTransaction> => {
    if (!publicClient) throw new Error("Public client not initialized");

    try {
      console.log("Submitting score:", {
        level: Number(args[0]),
        clicks: Number(args[1]),
        contractAddress: CONTRACT_ADDRESS,
      });

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: PENGUIN_GAME_ABI,
        functionName: "submitScore",
        args,
      });

      return {
        hash,
        wait: async () => {
          const receipt = await publicClient.waitForTransactionReceipt({
            hash,
          });

          if (receipt.status === "success") {
            await refreshLeaderboard();
          }

          return receipt;
        },
      };
    } catch (error) {
      console.error("Score submission error:", error);
      handleError(error as ErrorWithMessage);
    }
  };

  return {
    leaderboards,
    refreshLeaderboard,
    startGame,
    submitScore,
  };
}

// Use handleError in startGame and submitScore
function handleError(error: ErrorWithMessage | null): never {
  if (!error) throw new Error("Unknown error");

  if (error.message?.includes("User denied")) {
    throw new Error("Transaction rejected");
  }

  throw error;
}
