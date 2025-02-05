import { useWriteContract, useChainId } from "wagmi";
import {
  keccak256,
  type TransactionReceipt,
  stringToHex,
  createPublicClient,
  http,
} from "viem";
import { useState, useCallback } from "react";
import { publicClient } from "@/app/providers";
import { abstractTestnet } from "wagmi/chains";

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

// Update WagmiTransaction type to match zkSync receipt format
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

// Add a more specific error type
type ContractError = {
  message?: string;
  code?: string | number;
  details?: string;
  data?: unknown;
} & Error;

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
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: PENGUIN_GAME_ABI,
        functionName: "submitScore",
        args,
        gas: BigInt(300000),
      });

      return {
        hash,
        wait: async () => {
          const rpcUrls = abstractTestnet.rpcUrls.default.http;
          let receipt = null;
          let lastError: Error | null = null;

          for (let attempt = 0; attempt < 3; attempt++) {
            for (const rpc of rpcUrls) {
              try {
                const client = createPublicClient({
                  chain: abstractTestnet,
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

          // Ensure all required fields are present with correct types
          const standardReceipt: TransactionReceipt = {
            ...receipt,
            blockHash:
              receipt.blockHash ||
              "0x0000000000000000000000000000000000000000000000000000000000000000",
            blockNumber: receipt.blockNumber || BigInt(0),
            contractAddress: receipt.contractAddress || null,
            from: receipt.from,
            status: receipt.status,
            to: receipt.to || null,
            transactionHash: receipt.transactionHash,
            transactionIndex: receipt.transactionIndex || 0,
            logs: receipt.logs.map((log) => ({
              ...log,
              blockHash: log.blockHash || receipt.blockHash,
              blockNumber: log.blockNumber || receipt.blockNumber || BigInt(0),
              logIndex: log.logIndex || 0,
              removed: false,
              transactionHash: log.transactionHash || receipt.transactionHash,
              transactionIndex:
                log.transactionIndex || receipt.transactionIndex || 0,
            })),
          };

          // Handle different status formats more safely
          const statusString = String(standardReceipt.status).toLowerCase();
          const numericStatus = Number(standardReceipt.status);
          const isSuccess =
            statusString === "success" ||
            statusString === "1" ||
            statusString === "0x1" ||
            numericStatus === 1;

          if (isSuccess) {
            await refreshLeaderboard();
          } else {
            console.error(
              "Transaction failed with status:",
              standardReceipt.status
            );
          }

          return standardReceipt;
        },
      };
    } catch (err) {
      const error = err as unknown as ContractError;

      // Handle user rejection with a cleaner error
      if (typeof error.message === "string") {
        if (
          error.message.toLowerCase().includes("user denied") ||
          error.message.toLowerCase().includes("user rejected")
        ) {
          const gameError: GameError = {
            type: "user_rejected",
            message: "Transaction cancelled",
          };
          throw gameError;
        }
        if (error.message.includes("insufficient funds")) {
          const gameError: GameError = {
            type: "network",
            message: "Insufficient funds",
          };
          throw gameError;
        }
      }

      // Handle other errors
      console.error("Score submission error:", error);
      const gameError: GameError = {
        type: "unknown",
        message: "Failed to submit score",
      };
      throw gameError;
    }
  };

  return {
    leaderboards,
    refreshLeaderboard,
    startGame,
    submitScore,
  };
}
