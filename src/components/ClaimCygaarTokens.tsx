import React, { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useChainId,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatEther } from "viem";
import { toast } from "react-hot-toast";
import { abstractClient } from "@/app/providers";
import {
  CYGAAR_ADDRESSES,
  TOKEN_REWARDS,
  TOTAL_DISTRIBUTION,
  EXPLORER_URL,
} from "@/lib/tokenConfig";

const CYGAAR_DISTRIBUTOR_ABI = [
  {
    inputs: [],
    name: "claimRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "calculateRewards",
    outputs: [
      { internalType: "uint256", name: "totalReward", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "hasClaimed",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "claimedAmount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "distributionActive",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalDistributed",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const CYGAAR_TOKEN_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export default function ClaimCygaarTokens() {
  const { address } = useAccount();
  const chainId = useChainId();
  const [claimableAmount, setClaimableAmount] = useState<bigint | null>(null);
  const [hasClaimed, setHasClaimed] = useState<boolean | null>(null);
  const [tokenBalance, setTokenBalance] = useState<bigint | null>(null);
  const [isDistributionActive, setIsDistributionActive] = useState<
    boolean | null
  >(null);
  const [totalDistributed, setTotalDistributed] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  // Check if distribution is active
  const { data: distributionActive } = useReadContract({
    address: CYGAAR_ADDRESSES.DISTRIBUTOR_ADDRESS,
    abi: CYGAAR_DISTRIBUTOR_ABI,
    functionName: "distributionActive",
  });

  // Get total distributed so far
  const { data: totalDistributedData } = useReadContract({
    address: CYGAAR_ADDRESSES.DISTRIBUTOR_ADDRESS,
    abi: CYGAAR_DISTRIBUTOR_ABI,
    functionName: "totalDistributed",
  });

  // Get user's claimable amount
  const { data: claimableAmountData, refetch: refetchClaimable } =
    useReadContract({
      address: CYGAAR_ADDRESSES.DISTRIBUTOR_ADDRESS,
      abi: CYGAAR_DISTRIBUTOR_ABI,
      functionName: "calculateRewards",
      args: address ? [address] : undefined,
    });

  // Check if user has already claimed
  const { data: hasClaimedData, refetch: refetchClaimed } = useReadContract({
    address: CYGAAR_ADDRESSES.DISTRIBUTOR_ADDRESS,
    abi: CYGAAR_DISTRIBUTOR_ABI,
    functionName: "hasClaimed",
    args: address ? [address] : undefined,
  });

  // Get user's token balance
  const { data: tokenBalanceData, refetch: refetchBalance } = useReadContract({
    address: CYGAAR_ADDRESSES.TOKEN_ADDRESS,
    abi: CYGAAR_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // Write contract hook for claiming
  const { writeContractAsync } = useWriteContract();

  // Update state when data is fetched
  useEffect(() => {
    setClaimableAmount(claimableAmountData ?? null);
    setHasClaimed(hasClaimedData ?? null);
    setTokenBalance(tokenBalanceData ?? null);
    setIsDistributionActive(distributionActive ?? null);
    setTotalDistributed(totalDistributedData ?? null);
  }, [
    claimableAmountData,
    hasClaimedData,
    tokenBalanceData,
    distributionActive,
    totalDistributedData,
  ]);

  // Calculate the percentage of tokens distributed
  const distributedPercentage = totalDistributed
    ? (Number(formatEther(totalDistributed)) / TOTAL_DISTRIBUTION) * 100
    : 0;

  // Claim tokens function
  const handleClaim = async () => {
    if (
      !address ||
      hasClaimed ||
      !isDistributionActive ||
      !claimableAmount ||
      claimableAmount === BigInt(0)
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const hash = await writeContractAsync({
        address: CYGAAR_ADDRESSES.DISTRIBUTOR_ADDRESS,
        abi: CYGAAR_DISTRIBUTOR_ABI,
        functionName: "claimRewards",
      });

      setTransactionHash(hash);
      toast.success("Claim transaction submitted!");
      console.log("Transaction hash:", hash);

      // Wait for transaction to complete
      try {
        const receipt = await abstractClient.waitForTransactionReceipt({
          hash,
          timeout: 30_000,
        });

        if (receipt.status === "success") {
          toast.success("Successfully claimed CYGAAR tokens!");

          // Refresh data
          refetchClaimed();
          refetchBalance();
          refetchClaimable();
        } else {
          toast.error("Transaction failed. Please try again.");
        }
      } catch (error) {
        console.error("Transaction receipt error:", error);
        toast.error("Failed to confirm transaction. Please check your wallet.");
      }
    } catch (error: any) {
      console.error("Claim error:", error);
      toast.error(error?.message || "Failed to claim. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 md:p-8">
        {!address ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-6">
              Connect your wallet to check your $CYGAAR tokens
            </h3>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Distribution Progress */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-500">
                  Distribution Progress
                </h3>
                <span className="text-sm font-medium">
                  {totalDistributed
                    ? Number(formatEther(totalDistributed)).toLocaleString()
                    : "0"}{" "}
                  / {TOTAL_DISTRIBUTION.toLocaleString()} $CYGAAR
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${Math.min(distributedPercentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {distributedPercentage.toFixed(2)}% of tokens have been claimed
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Your Balance */}
              <div className="bg-blue-50 p-5 rounded-xl">
                <h3 className="text-lg font-semibold mb-1">
                  Your $CYGAAR Balance
                </h3>
                {tokenBalance !== null ? (
                  <>
                    <p className="text-3xl font-bold text-blue-700">
                      {parseFloat(formatEther(tokenBalance)).toLocaleString()}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">$CYGAAR</p>
                  </>
                ) : (
                  <p className="text-gray-500">Loading your balance...</p>
                )}
              </div>

              {/* Claimable Tokens */}
              <div className="bg-emerald-50 p-5 rounded-xl">
                <h3 className="text-lg font-semibold mb-1">Claimable Tokens</h3>
                {hasClaimed === null ? (
                  <p className="text-gray-500">Loading claim status...</p>
                ) : hasClaimed ? (
                  <>
                    <p className="text-3xl font-bold text-emerald-700">0</p>
                    <p className="text-sm mt-2 text-emerald-600">
                      You have already claimed your tokens!
                    </p>
                  </>
                ) : claimableAmount !== null ? (
                  <>
                    <p className="text-3xl font-bold text-emerald-700">
                      {parseFloat(
                        formatEther(claimableAmount)
                      ).toLocaleString()}
                    </p>
                    <p className="text-sm text-emerald-600 mt-1">
                      $CYGAAR available to claim
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500">Calculating your rewards...</p>
                )}
              </div>
            </div>

            {/* Claim Button */}
            {!hasClaimed &&
              claimableAmount !== null &&
              claimableAmount > BigInt(0) && (
                <div className="mt-6">
                  <button
                    onClick={handleClaim}
                    disabled={isLoading || !isDistributionActive}
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition ${
                      isLoading
                        ? "bg-blue-400 cursor-wait"
                        : !isDistributionActive
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isLoading
                      ? "Claiming..."
                      : !isDistributionActive
                      ? "Distribution Paused"
                      : "Claim Your $CYGAAR Tokens"}
                  </button>

                  {!isDistributionActive && (
                    <p className="text-xs text-center mt-2 text-orange-500">
                      Token distribution is currently paused. Please check back
                      later.
                    </p>
                  )}
                </div>
              )}

            {/* Already Claimed */}
            {hasClaimed && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg text-center">
                <p className="font-medium">
                  You have already claimed your $CYGAAR tokens.
                </p>
                {tokenBalance && tokenBalance > BigInt(0) && (
                  <p className="text-sm mt-2 text-gray-600">
                    Your{" "}
                    {parseFloat(formatEther(tokenBalance)).toLocaleString()}{" "}
                    $CYGAAR tokens are in your wallet.
                  </p>
                )}
              </div>
            )}

            {/* No Tokens to Claim */}
            {!hasClaimed &&
              claimableAmount !== null &&
              claimableAmount === BigInt(0) && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800">
                    No Tokens Available
                  </h4>
                  <p className="text-sm mt-1 text-yellow-700">
                    You don't have any $CYGAAR tokens to claim. Only players who
                    participated in the game before the distribution deadline
                    are eligible.
                  </p>
                </div>
              )}

            {/* Transaction Success */}
            {transactionHash && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800">
                  Transaction Submitted
                </h4>
                <p className="text-sm mt-1 text-green-700 break-all">
                  Hash: {transactionHash}
                </p>
                <a
                  href={`${EXPLORER_URL}${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                >
                  View on Abstract Explorer
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Distribution Info Footer */}
      <div className="bg-gray-50 p-6 border-t border-gray-100">
        <h3 className="font-semibold mb-3">$CYGAAR Distribution Rules</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Rewards are based on:</h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>
                Completing game levels ({TOKEN_REWARDS.BASE_REWARD} $CYGAAR per
                level)
              </li>
              <li>
                Achieving top 10 leaderboard positions (
                {TOKEN_REWARDS.TOP_LEADERBOARD_BONUS} $CYGAAR bonus)
              </li>
              <li>
                Getting perfect scores with minimum clicks (
                {TOKEN_REWARDS.PERFECT_SCORE_BONUS} $CYGAAR bonus)
              </li>
              <li>
                Completing all 3 levels ({TOKEN_REWARDS.ALL_LEVELS_BONUS}{" "}
                $CYGAAR bonus)
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Important Notes:</h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>
                Total distribution: {TOTAL_DISTRIBUTION.toLocaleString()}{" "}
                $CYGAAR tokens
              </li>
              <li>
                Only addresses that played before the deadline are eligible
              </li>
              <li>You can only claim once per address</li>
              <li>Tokens will be distributed until the pool is depleted</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
