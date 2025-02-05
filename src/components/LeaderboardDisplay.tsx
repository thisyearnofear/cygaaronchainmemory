"use client";

import {
  usePenguinGameContract,
  type LeaderboardEntry,
  type LeaderboardData,
} from "@/lib/contract";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

// Add type for social identities
interface SocialIdentity {
  displayName: string;
  platform: "ens" | "farcaster" | "lens";
}

// Add type for name resolution result
interface NameResolution {
  displayName: string;
  source: "web3bio" | "ensdata" | "address";
}

// Utility function for name resolution with fallback
async function resolveNameWithFallback(addr: string): Promise<NameResolution> {
  try {
    // Try web3.bio first
    const ensResponse = await fetch(`https://api.web3.bio/ns/ens/${addr}`);
    if (ensResponse.ok) {
      const data = await ensResponse.json();
      if (data.displayName) {
        return { displayName: data.displayName, source: "web3bio" };
      }
    }

    // Try Farcaster if ENS not found
    const fcResponse = await fetch(`https://api.web3.bio/profile/${addr}`);
    if (fcResponse.ok) {
      const profiles = await fcResponse.json();
      const fcProfile = profiles.find(
        (p: SocialIdentity) => p.platform === "farcaster"
      );
      if (fcProfile?.displayName) {
        return { displayName: fcProfile.displayName, source: "web3bio" };
      }

      // Try Lens if Farcaster not found
      const lensProfile = profiles.find(
        (p: SocialIdentity) => p.platform === "lens"
      );
      if (lensProfile?.displayName) {
        return { displayName: lensProfile.displayName, source: "web3bio" };
      }
    }

    // Fallback to ensdata.net
    const ensdataResponse = await fetch(`https://ensdata.net/${addr}`);
    if (ensdataResponse.ok) {
      const data = await ensdataResponse.json();
      if (data.name) {
        return { displayName: data.name, source: "ensdata" };
      }
    }
  } catch (error) {
    console.error(`Error resolving name for ${addr}:`, error);
  }

  // Fallback to shortened address
  return {
    displayName: `${addr.slice(0, 6)}...${addr.slice(-4)}`,
    source: "address",
  };
}

interface LeaderboardDisplayProps {
  refreshKey?: number;
}

const LeaderboardDisplay: React.FC<LeaderboardDisplayProps> = ({
  refreshKey,
}) => {
  const { leaderboards, refreshLeaderboard } = usePenguinGameContract();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHighlighted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { address } = useAccount();

  // Store all resolved names with their source platform
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>(
    {}
  );
  const [isResolvingNames, setIsResolvingNames] = useState(false);

  // Fetch names for all addresses in the leaderboard
  useEffect(() => {
    const uniqueAddresses = new Set<string>();
    leaderboards.forEach((board) => {
      board.data?.forEach((entry) => {
        if (!resolvedNames[entry.player]) {
          uniqueAddresses.add(entry.player);
        }
      });
    });

    if (uniqueAddresses.size === 0) return;

    async function resolveNames() {
      if (isResolvingNames) return;
      setIsResolvingNames(true);

      const newNames: Record<string, string> = { ...resolvedNames };

      await Promise.all(
        Array.from(uniqueAddresses).map(async (addr) => {
          const resolution = await resolveNameWithFallback(addr);
          newNames[addr] = resolution.displayName;
        })
      );

      setResolvedNames(newNames);
      setIsResolvingNames(false);
    }

    const timeoutId = setTimeout(resolveNames, 500);
    return () => clearTimeout(timeoutId);
  }, [leaderboards, resolvedNames, isResolvingNames]);

  // Debug logging
  useEffect(() => {
    console.log("LeaderboardDisplay: Current state:", {
      leaderboards: leaderboards.map((board) => ({
        level: board.level,
        entries:
          board.data?.map((entry) => ({
            address: entry.player,
            score: Number(entry.score),
          })) || [],
      })),
      timestamp: new Date().toISOString(),
    });
  }, [leaderboards]);

  // Load leaderboards on refresh key change
  useEffect(() => {
    if (refreshKey !== undefined) {
      refreshLeaderboard();
      setIsLoaded(true);
    }
  }, [refreshKey, refreshLeaderboard]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log("LeaderboardDisplay: Refreshing leaderboard...");
    try {
      await refreshLeaderboard();
      console.log("LeaderboardDisplay: Refresh complete");
    } catch (error) {
      console.error("LeaderboardDisplay: Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Handle initial load here instead of during render
    setIsLoading(false);
  }, [leaderboards]);

  if (!isLoaded) {
    return (
      <div className="text-center p-4">
        <button
          onClick={() => {
            refreshLeaderboard();
            setIsLoaded(true);
          }}
          className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg hover:bg-emerald-200 transition-colors"
        >
          Load Leaderboards
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <div>Loading leaderboards...</div>;
  }

  // Type-safe board rendering
  const renderBoard = (board: LeaderboardData) => (
    <div key={board.level} className="bg-white/50 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold">Level {board.level}</h4>
      </div>

      {board.data.length === 0 ? (
        <p className="text-gray-500 italic">No scores yet</p>
      ) : (
        <div className="space-y-2">
          {board.data.map((entry: LeaderboardEntry, index: number) => (
            <div
              key={`${entry.player}-${index}`}
              className={`flex justify-between items-center p-2 ${
                entry.player === address ? "bg-green-100/50" : "bg-white/30"
              } rounded`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold">{index + 1}.</span>
                <span className="font-mono">
                  {resolvedNames[entry.player] || entry.player}
                </span>
              </div>
              <span className="font-bold">{entry.score} clicks</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`bg-white/80 rounded-xl shadow-lg p-6 mt-4 transition-colors duration-500 
      ${isHighlighted ? "bg-green-100/80" : ""}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">🏆 Leaderboard</h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isRefreshing ? "Refreshing..." : "🔄 Refresh"}
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Complete levels in fewer clicks to climb the leaderboard!
      </p>

      <div className="space-y-6">{leaderboards.map(renderBoard)}</div>
    </div>
  );
};

export default LeaderboardDisplay;
