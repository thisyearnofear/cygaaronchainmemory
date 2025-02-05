import { usePenguinGameContract, type LeaderboardEntry } from "@/lib/contract";
import { useState, useEffect } from "react";
import { useEnsName } from "@/hooks/useEnsName";

interface MiniLeaderboardProps {
  level: number;
}

const AddressDisplay = ({ address }: { address: string }) => {
  const { ensName } = useEnsName(address);
  return (
    <span className="text-gray-600">
      {ensName || `${address.slice(0, 4)}...${address.slice(-2)}`}
    </span>
  );
};

const MiniLeaderboard: React.FC<MiniLeaderboardProps> = ({ level }) => {
  const { leaderboards, refreshLeaderboard } = usePenguinGameContract();
  const [isLoaded, setIsLoaded] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log(
      `MiniLeaderboard Level ${level}:`,
      leaderboards.find((board) => board.level === level)?.data
    );
  }, [level, leaderboards]);

  useEffect(() => {
    setIsLoaded(true);
    refreshLeaderboard().catch(console.error);
  }, [refreshLeaderboard]);

  if (!isLoaded) return null;

  const currentLeaderboard = leaderboards.find(
    (board) => board.level === level
  );
  const topThree = currentLeaderboard?.data.slice(0, 3) || [];

  return (
    <div className="bg-white/90 p-2 rounded-lg shadow-sm text-center mb-4">
      <h3 className="text-sm font-semibold mb-1">Level {level} Top Scores</h3>
      {topThree.length > 0 ? (
        <div className="flex justify-center gap-4">
          {topThree.map((entry: LeaderboardEntry, index: number) => (
            <div key={index} className="text-xs">
              <AddressDisplay address={entry.player} />
              <span className="ml-1 font-medium">{entry.score}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 italic">
          No scores yet - be first!
        </p>
      )}
    </div>
  );
};

export default MiniLeaderboard;
