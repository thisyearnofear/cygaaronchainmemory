import { usePenguinGameContract } from "@/lib/contract";
import type { LeaderboardEntry } from "@/lib/contract";
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
  const { leaderboards } = usePenguinGameContract();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!isLoaded) return null;

  const currentLeaderboard = leaderboards[level - 1];
  if (!currentLeaderboard?.data?.length) return null;

  const topThree = currentLeaderboard.data.slice(0, 3);

  return (
    <div className="bg-white/90 p-2 rounded-lg shadow-sm text-center mb-4">
      <h3 className="text-sm font-semibold mb-1">Level {level} Top Scores</h3>
      {topThree && topThree.length > 0 ? (
        <div className="flex justify-center gap-4">
          {topThree.map((entry: LeaderboardEntry, index: number) => (
            <div key={index} className="text-xs">
              <AddressDisplay address={entry.player} />
              <span className="ml-1 font-medium">{Number(entry.score)}</span>
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
