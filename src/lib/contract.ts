import {
  useAbstractClient,
  useGlobalWalletSignerAccount,
} from "@abstract-foundation/agw-react";
import { useWriteContract, useChainId, useAccount } from "wagmi";
import { keccak256, type TransactionReceipt, stringToHex } from "viem";
import { useState, useCallback, useEffect } from "react";
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
  {
    inputs: [{ internalType: "address", name: "wallet", type: "address" }],
    name: "activeSessions",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "startTime", type: "uint256" },
          { internalType: "bytes32", name: "levelHash", type: "bytes32" },
          { internalType: "bool", name: "isComplete", type: "bool" },
          { internalType: "uint256", name: "clickCount", type: "uint256" },
          { internalType: "address", name: "actualPlayer", type: "address" },
        ],
        internalType: "struct PenguinGame.GameSession",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Update network-specific contract addresses
const CONTRACT_ADDRESSES = {
  11124: "0xef95c894e210251c0736d3D432C3151D684AD8F5", // Abstract Testnet
  2741: "0x...", // Abstract Mainnet (when ready)
} as const;

// Use dynamic contract address based on network
const getContractAddress = (chainId: number) => {
  const address =
    CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  if (!address) throw new Error(`No contract address for chain ${chainId}`);
  return address;
};

type WagmiTransaction = {
  hash: `0x${string}`;
  wait: () => Promise<TransactionReceipt>;
};

// Remove unused types
type ErrorWithMessage = {
  message?: string;
  code?: string | number;
  reason?: string;
  shortMessage?: string;
} & Error;

type AbstractWalletError = {
  message: string;
  code?: number | string;
  data?: unknown;
} & Error;

export type LeaderboardEntry = {
  player: `0x${string}`;
  score: bigint;
};

export type LeaderboardData = {
  level: number;
  data: readonly LeaderboardEntry[];
};

// Define strict types for transaction status
type EthereumTransactionStatus = 1 | 0 | "0x1" | "0x0";

// Helper function to check transaction success
const isTransactionSuccessful = (
  receipt: TransactionReceipt | { status: EthereumTransactionStatus }
): boolean => {
  if (!receipt.status) return false;

  // Handle viem TransactionReceipt status
  if (typeof receipt.status === "string") {
    return receipt.status === "success";
  }

  // Handle Ethereum transaction status
  return receipt.status === 1 || receipt.status === "0x1";
};

export function usePenguinGameContract() {
  const { writeContractAsync } = useWriteContract();
  const { data: abstractClient, isLoading: isAbstractLoading } =
    useAbstractClient();
  const { address: signerAddress, isConnected: isSignerConnected } =
    useGlobalWalletSignerAccount();
  const { connector } = useAccount();
  const [leaderboards, setLeaderboards] = useState<LeaderboardData[]>([]);
  const chainId = useChainId();
  const [isWalletReady, setIsWalletReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Enhanced initialization check
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const connectorId = connector?.id; // Destructure to avoid object reference changes

    const checkInitialization = async () => {
      if (connectorId === "abstract") {
        try {
          if (abstractClient && isSignerConnected) {
            const account = await abstractClient.account;
            const chain = await abstractClient.chain;

            if (account && chain) {
              console.log("Abstract wallet initialized:", {
                account: account.address,
                chain: chain.id,
                signer: signerAddress,
              });
              setIsInitialized(true);
              return;
            }
          }
          // If not initialized, try again in 1 second
          timeoutId = setTimeout(checkInitialization, 1000);
        } catch (error) {
          console.log("Initialization check failed:", error);
          timeoutId = setTimeout(checkInitialization, 1000);
        }
      }
    };

    checkInitialization();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [abstractClient, isSignerConnected, signerAddress, connector?.id]); // Add connector?.id to deps

  // Add initialization check
  useEffect(() => {
    if (connector?.id === "abstract") {
      const checkWalletReady = async () => {
        try {
          if (abstractClient && isSignerConnected) {
            // Check if we can access the account
            const account = await abstractClient.account;
            if (account) {
              console.log("Abstract wallet ready:", {
                account: account.address,
                signer: signerAddress,
                chainId,
              });
              setIsWalletReady(true);
            }
          }
        } catch (error) {
          console.log("Wallet not ready yet:", error);
          setIsWalletReady(false);
        }
      };

      checkWalletReady();
    }
  }, [abstractClient, isSignerConnected, signerAddress, chainId]);

  const refreshLeaderboard = useCallback(async () => {
    if (!chainId) return;

    try {
      console.log("Refreshing all leaderboards...");
      const newLeaderboards: LeaderboardData[] = [];

      for (let level = 1; level <= 3; level++) {
        try {
          const data = (await publicClient.readContract({
            address: getContractAddress(chainId),
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
      const isAbstractWallet = connector?.id === "abstract";

      if (isAbstractWallet) {
        if (!isInitialized) {
          console.log("Waiting for wallet initialization...");
          throw new Error("Please wait for wallet initialization");
        }

        if (!abstractClient || !isSignerConnected) {
          throw new Error("Wallet not properly connected");
        }
      }

      // Generate level hash with more entropy
      const levelHash = keccak256(
        stringToHex(
          JSON.stringify({
            level,
            timestamp: Date.now(),
            random: Math.random(),
            nonce: Date.now() + Math.random(),
          })
        )
      );

      console.log("Starting game with Abstract Wallet:", {
        level,
        levelHash,
        wallet: abstractClient?.account?.address,
        signer: signerAddress,
        isWalletReady,
        chainId,
      });

      if (isAbstractWallet && abstractClient && isSignerConnected) {
        try {
          // Use Abstract's writeContract method directly
          const hash = await abstractClient.writeContract({
            address: getContractAddress(chainId),
            abi: PENGUIN_GAME_ABI,
            functionName: "startGame",
            args: [BigInt(level), levelHash],
          });

          console.log("Transaction submitted:", {
            hash,
            from: abstractClient.account?.address,
            to: getContractAddress(chainId),
            signer: signerAddress,
            chainId,
          });

          const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            timeout: 60_000,
            confirmations: 3,
          });

          console.log("Transaction receipt:", receipt);

          if (!isTransactionSuccessful(receipt)) {
            throw new Error("Failed to start game session");
          }

          return hash;
        } catch (error: unknown) {
          const abstractError = error as AbstractWalletError;
          console.error("Abstract wallet error:", {
            error: abstractError,
            code: abstractError.code,
            data: abstractError.data,
            message: abstractError.message,
          });
          throw abstractError;
        }
      }

      // Regular wallet flow
      const hash = await writeContractAsync({
        address: getContractAddress(chainId),
        abi: PENGUIN_GAME_ABI,
        functionName: "startGame",
        args: [BigInt(level), levelHash],
      });

      // Wait for transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Start game receipt:", receipt);

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
      console.log("Submitting score with args:", args);
      const isAbstractWallet = connector?.id === "abstract";

      if (isAbstractWallet && abstractClient && isSignerConnected) {
        try {
          // Use Abstract's writeContract method directly
          const hash = await abstractClient.writeContract({
            address: getContractAddress(chainId),
            abi: PENGUIN_GAME_ABI,
            functionName: "submitScore",
            args,
          });

          console.log("Transaction hash:", hash);

          return {
            hash,
            wait: async () => {
              const receipt = await publicClient.waitForTransactionReceipt({
                hash,
                timeout: 60_000,
                confirmations: 2,
              });

              console.log("Transaction receipt:", receipt);

              if (isTransactionSuccessful(receipt)) {
                await refreshLeaderboard();
              } else {
                console.error("Transaction failed:", receipt);
                throw new Error("Transaction failed");
              }

              return receipt;
            },
          };
        } catch (error: unknown) {
          const abstractError = error as AbstractWalletError;
          console.error("Abstract wallet error:", {
            error: abstractError,
            code: abstractError.code,
            data: abstractError.data,
            message: abstractError.message,
          });
          throw abstractError;
        }
      }

      // Regular wallet submission
      const hash = await writeContractAsync({
        address: getContractAddress(chainId),
        abi: PENGUIN_GAME_ABI,
        functionName: "submitScore",
        args,
      });

      return {
        hash,
        wait: async () => {
          const receipt = await window.ethereum!.request({
            method: "eth_getTransactionReceipt",
            params: [hash],
          });

          if (receipt && isTransactionSuccessful(receipt)) {
            await refreshLeaderboard();
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
    isAbstractLoading,
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
