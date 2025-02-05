import { useWriteContract, useChainId } from "wagmi";
import {
  keccak256,
  type TransactionReceipt,
  stringToHex,
  createPublicClient,
  http,
} from "viem";
import { useState, useCallback, useEffect } from "react";
import { abstractClient } from "@/app/providers";
import { abstractMainnet } from "./chains";

const PENGUIN_GAME_ABI = [
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
] as const;

const CONTRACT_ADDRESS = "0xB945d267eab7EfAe0b41253F50D690DBe712702C" as const;

// UI types (what we use in components)
export type LeaderboardEntry = {
  player: `0x${string}`;
  score: number; // uint32 in contract
};

export type LeaderboardData = {
  level: number;
  data: LeaderboardEntry[];
};

// Add a custom error type for user-friendly messages
export type GameError = {
  type: "user_rejected" | "network" | "unknown";
  message: string;
};

export function usePenguinGameContract() {
  const { writeContractAsync } = useWriteContract();
  const [leaderboards, setLeaderboards] = useState<LeaderboardData[]>([]);
  const chainId = useChainId();

  const refreshLeaderboard = useCallback(async () => {
    if (!chainId) return;

    try {
      const newLeaderboards: LeaderboardData[] = [];

      for (let level = 1; level <= 3; level++) {
        try {
          // Contract returns uint32 scores, so we can use number directly
          const data = (await abstractClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: PENGUIN_GAME_ABI,
            functionName: "getLeaderboard",
            args: [level],
          })) as LeaderboardEntry[];

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

  const startGame = async (level: number): Promise<`0x${string}`> => {
    const levelHash = keccak256(
      stringToHex(
        JSON.stringify({
          level,
          timestamp: Date.now(),
          random: Math.random(),
        })
      )
    );

    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: PENGUIN_GAME_ABI,
      functionName: "startGame",
      args: [level, levelHash],
    });

    return hash;
  };

  const submitScore = async (
    args: [number, number, `0x${string}`] // [level, clicks, proof]
  ): Promise<{
    hash: `0x${string}`;
    wait: () => Promise<TransactionReceipt>;
  }> => {
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: PENGUIN_GAME_ABI,
        functionName: "submitScore",
        args, // Contract expects uint8, uint32, bytes
        gas: BigInt(300000),
      });

      return {
        hash,
        wait: async () => {
          const rpcUrls = abstractMainnet.rpcUrls.default.http;
          let receipt = null;
          let lastError: Error | null = null;

          for (let attempt = 0; attempt < 3; attempt++) {
            for (const rpc of rpcUrls) {
              try {
                const client = createPublicClient({
                  chain: abstractMainnet,
                  transport: http(rpc),
                });

                receipt = await client.waitForTransactionReceipt({
                  hash,
                  timeout: 30_000,
                  retryDelay: 2_000,
                });

                if (receipt) break;
              } catch (err) {
                const error = err as Error;
                console.warn(
                  `Attempt ${attempt + 1} failed for ${rpc}:`,
                  error
                );
                lastError = error;
                await new Promise((resolve) =>
                  setTimeout(resolve, 2000 * (attempt + 1))
                );
                continue;
              }
            }
            if (receipt) break;
          }

          if (!receipt) {
            console.error("All RPC attempts failed:", lastError);
            throw new Error("Failed to get transaction receipt from all RPCs");
          }

          // Check events in the receipt
          console.log("Transaction receipt:", receipt);
          console.log("Events emitted:", receipt.logs);

          return receipt;
        },
      };
    } catch (err) {
      const error = err as Error;

      if (typeof error.message === "string") {
        if (
          error.message.toLowerCase().includes("user denied") ||
          error.message.toLowerCase().includes("user rejected")
        ) {
          throw {
            type: "user_rejected",
            message: "Transaction cancelled",
          } as GameError;
        }
        if (error.message.includes("insufficient funds")) {
          throw { type: "network", message: "Insufficient funds" } as GameError;
        }
      }

      console.error("Score submission error:", error);
      throw { type: "unknown", message: "Failed to submit score" } as GameError;
    }
  };

  useEffect(() => {
    const unwatch = abstractClient.watchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: PENGUIN_GAME_ABI,
      eventName: "ScoreSubmitted",
      onLogs: (logs) => {
        console.log("New score submitted:", logs);
        refreshLeaderboard();
      },
    });

    return () => {
      unwatch();
    };
  }, [refreshLeaderboard]);

  return {
    leaderboards,
    refreshLeaderboard,
    startGame,
    submitScore,
  };
}
