import React, { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { CYGAAR_ADDRESSES, TOTAL_DISTRIBUTION } from "../lib/tokenConfig";
import { CygaarDistributor } from "../contracts/CygaarDistributor";
import { CygaarTestToken } from "../contracts/CygaarTestToken";
import { ClaimButton } from "./ClaimButton";
import { ClaimableTokens } from "./ClaimableTokens";

interface LeaderboardEntry {
  address: string;
  score: number;
  position: number;
  perfectScores: number;
  levelsCompleted: number;
}

interface DistributionStats {
  totalClaimed: number;
  remainingTokens: number;
  claimCount: number;
  lastClaimers: string[];
  userBalance: number;
  hasClaimed: boolean;
}

interface TokenDistributionStatsProps {
  userAddress: string;
  leaderboardEntry: LeaderboardEntry | null;
}

export const TokenDistributionStats: React.FC<TokenDistributionStatsProps> = ({
  userAddress,
  leaderboardEntry,
}) => {
  const [stats, setStats] = useState<DistributionStats>({
    totalClaimed: 0,
    remainingTokens: TOTAL_DISTRIBUTION,
    claimCount: 0,
    lastClaimers: [],
    userBalance: 0,
    hasClaimed: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      // Connect to the Abstract testnet
      const provider = new ethers.JsonRpcProvider(
        "https://api.testnet.abs.xyz"
      );

      // Get distributor contract
      const distributor = new ethers.Contract(
        CYGAAR_ADDRESSES.DISTRIBUTOR_ADDRESS,
        CygaarDistributor.abi,
        provider
      );

      // Get token contract
      const token = new ethers.Contract(
        CYGAAR_ADDRESSES.TOKEN_ADDRESS,
        CygaarTestToken.abi,
        provider
      );

      // Get total supply
      const totalSupply = await token.totalSupply();
      const totalSupplyFormatted = Number(ethers.formatEther(totalSupply));

      // Get claim count
      const claimCount = await distributor.claimCount();

      // Get last 5 claimers
      const lastClaimers = [];
      for (let i = 0; i < Math.min(5, Number(claimCount)); i++) {
        const claimer = await distributor.claimers(i);
        lastClaimers.push(claimer);
      }

      // Get user balance if connected
      let userBalance = 0;
      let hasClaimed = false;
      if (userAddress) {
        const balance = await token.balanceOf(userAddress);
        userBalance = Number(ethers.formatEther(balance));

        // Check if user has claimed
        for (let i = 0; i < Number(claimCount); i++) {
          const claimer = await distributor.claimers(i);
          if (claimer.toLowerCase() === userAddress.toLowerCase()) {
            hasClaimed = true;
            break;
          }
        }
      }

      setStats({
        totalClaimed: totalSupplyFormatted,
        remainingTokens: TOTAL_DISTRIBUTION - totalSupplyFormatted,
        claimCount: Number(claimCount),
        lastClaimers,
        userBalance,
        hasClaimed,
      });
    } catch (err) {
      setError("Failed to fetch distribution stats");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return <div className="text-center p-4">Loading distribution stats...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Global Stats */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            CYGAAR Token Distribution Stats
          </h2>
          <button
            onClick={fetchStats}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-700">
              Total Claimed
            </h3>
            <p className="text-2xl font-bold">
              {stats.totalClaimed.toLocaleString()} CYGAAR
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-700">Remaining</h3>
            <p className="text-2xl font-bold">
              {stats.remainingTokens.toLocaleString()} CYGAAR
            </p>
          </div>
        </div>

        {userAddress && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Your Balance</h3>
            <p className="text-2xl font-bold">
              {stats.userBalance.toLocaleString()} CYGAAR
            </p>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Total Claims</h3>
          <p className="text-2xl font-bold">{stats.claimCount}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Recent Claimers</h3>
          <div className="space-y-2">
            {stats.lastClaimers.map((claimer, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-lg">
                <p className="font-mono text-sm break-all">{claimer}</p>
              </div>
            ))}
            {stats.lastClaimers.length === 0 && (
              <p className="text-gray-500">No claims yet</p>
            )}
          </div>
        </div>
      </div>

      {/* User-specific Claims */}
      {userAddress && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ClaimableTokens
            leaderboardEntry={leaderboardEntry}
            hasClaimed={stats.hasClaimed}
          />

          {!stats.hasClaimed && leaderboardEntry && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">Claim Your Tokens</h3>
              <ClaimButton
                userAddress={userAddress}
                onClaimSuccess={fetchStats}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
