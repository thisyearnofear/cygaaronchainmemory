import { useReadContract, useWriteContract } from "wagmi";
import { keccak256, type TransactionReceipt, stringToHex } from "viem";
import { useEffect } from "react";

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

type LeaderboardEntry = {
  player: `0x${string}`;
  score: bigint;
};

type LeaderboardData = readonly LeaderboardEntry[];

// Add type for the receipt status
type TransactionStatus = "success" | "reverted" | 1 | "0x1";

// Fix the any type
type ErrorWithMessage = Error & {
  message?: string;
};

export function usePenguinGameContract() {
  const { writeContractAsync } = useWriteContract();

  const startGame = async (level: number) => {
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

    return hash;
  };

  // Create separate hooks for each level's leaderboard
  const {
    data: level1Leaderboard,
    refetch: refetchLevel1,
    error: error1,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PENGUIN_GAME_ABI,
    functionName: "getLeaderboard",
    args: [BigInt(1)],
  });

  // Log leaderboard data and errors
  useEffect(() => {
    if (level1Leaderboard) {
      console.log("Level 1 leaderboard fetched:", {
        addresses: level1Leaderboard.map(
          (entry: LeaderboardEntry) => entry.player
        ),
        scores: level1Leaderboard.map((entry: LeaderboardEntry) =>
          Number(entry.score)
        ),
      });
    }
    if (error1) {
      console.error("Level 1 leaderboard error:", error1);
    }
  }, [level1Leaderboard, error1]);

  const {
    data: level2Leaderboard,
    refetch: refetchLevel2,
    error: error2,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PENGUIN_GAME_ABI,
    functionName: "getLeaderboard",
    args: [BigInt(2)],
  });

  const {
    data: level3Leaderboard,
    refetch: refetchLevel3,
    error: error3,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: PENGUIN_GAME_ABI,
    functionName: "getLeaderboard",
    args: [BigInt(3)],
  });

  // Log leaderboard data and errors
  useEffect(() => {
    if (level2Leaderboard) {
      console.log("Level 2 leaderboard fetched:", {
        addresses: level2Leaderboard.map(
          (entry: LeaderboardEntry) => entry.player
        ),
        scores: level2Leaderboard.map((entry: LeaderboardEntry) =>
          Number(entry.score)
        ),
      });
    }
    if (error2) {
      console.error("Level 2 leaderboard error:", error2);
    }
  }, [level2Leaderboard, error2]);

  useEffect(() => {
    if (level3Leaderboard) {
      console.log("Level 3 leaderboard fetched:", {
        addresses: level3Leaderboard.map(
          (entry: LeaderboardEntry) => entry.player
        ),
        scores: level3Leaderboard.map((entry: LeaderboardEntry) =>
          Number(entry.score)
        ),
      });
    }
    if (error3) {
      console.error("Level 3 leaderboard error:", error3);
    }
  }, [level3Leaderboard, error3]);

  const leaderboards = [
    { level: 1, data: level1Leaderboard as LeaderboardData | undefined },
    { level: 2, data: level2Leaderboard as LeaderboardData | undefined },
    { level: 3, data: level3Leaderboard as LeaderboardData | undefined },
  ];

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
              switch (level) {
                case 1:
                  await refetchLevel1();
                  break;
                case 2:
                  await refetchLevel2();
                  break;
                case 3:
                  await refetchLevel3();
                  break;
              }
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

  const refetchLeaderboard = async () => {
    console.log("Refreshing all leaderboards...");
    try {
      const results = await Promise.all([
        refetchLevel1().catch((e) => {
          console.error("Level 1 refresh error:", e);
          return null;
        }),
        refetchLevel2().catch((e) => {
          console.error("Level 2 refresh error:", e);
          return null;
        }),
        refetchLevel3().catch((e) => {
          console.error("Level 3 refresh error:", e);
          return null;
        }),
      ]);
      console.log("All leaderboards refreshed:", results);
    } catch (error) {
      console.error("Failed to refresh leaderboards:", error);
    }
  };

  return {
    startGame,
    submitScore,
    leaderboards,
    refetchLeaderboard,
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
