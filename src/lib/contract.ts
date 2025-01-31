import { useWriteContract, useChainId } from "wagmi";
import { keccak256, type TransactionReceipt, stringToHex } from "viem";
import { useState, useCallback } from "react";
import { publicClient } from "@/app/providers";

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

  const refreshLeaderboard = useCallback(async () => {
    if (!chainId) return;

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
  }, [chainId]);

  const startGame = async (level: number) => {
    try {
      // Generate a random level hash using viem's utilities
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
    try {
      console.log("Current leaderboard scores:", {
        level: Number(args[0]),
        newScore: Number(args[1]),
        existingScores: leaderboards[Number(args[0]) - 1]?.data?.map(
          (entry) => ({
            player: entry.player,
            score: Number(entry.score),
          })
        ),
      });

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

      console.log("Score submission transaction hash:", hash);

      return {
        hash,
        wait: async () => {
          const receipt = await window.ethereum!.request({
            method: "eth_getTransactionReceipt",
            params: [hash],
          });
          console.log("Transaction receipt:", receipt);

          // Type-safe status check
          const status = receipt?.status as TransactionStatus;
          const isSuccess =
            status === "success" || status === 1 || status === "0x1";

          if (isSuccess) {
            // Refresh the appropriate leaderboard
            const level = Number(args[0]);
            console.log(`Refreshing leaderboard for level ${level}`);

            try {
              await refreshLeaderboard();
              console.log("Leaderboard refresh completed");
            } catch (error) {
              console.error("Failed to refresh leaderboard:", error);
            }
          } else {
            console.error("Transaction failed with status:", status);
          }

          return receipt as TransactionReceipt;
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
