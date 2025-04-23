import React from "react";
import { TOKEN_REWARDS } from "../lib/tokenConfig";

interface LeaderboardEntry {
  address: string;
  score: number;
  position: number;
  perfectScores: number;
  levelsCompleted: number;
}

interface ClaimableTokensProps {
  leaderboardEntry: LeaderboardEntry | null;
  hasClaimed: boolean;
}

export const ClaimableTokens: React.FC<ClaimableTokensProps> = ({
  leaderboardEntry,
  hasClaimed,
}) => {
  if (!leaderboardEntry) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-gray-500">Play the game to earn tokens!</p>
      </div>
    );
  }

  const calculateRewards = () => {
    let totalRewards = 0;
    const rewards = [];

    // Base reward for completing levels
    if (leaderboardEntry.levelsCompleted > 0) {
      const baseReward =
        TOKEN_REWARDS.BASE_REWARD * leaderboardEntry.levelsCompleted;
      totalRewards += baseReward;
      rewards.push({
        type: "Level Completion",
        amount: baseReward,
        description: `${leaderboardEntry.levelsCompleted} levels completed`,
      });
    }

    // Leaderboard position bonus
    if (leaderboardEntry.position <= 10) {
      totalRewards += TOKEN_REWARDS.TOP_LEADERBOARD_BONUS;
      rewards.push({
        type: "Top 10 Position",
        amount: TOKEN_REWARDS.TOP_LEADERBOARD_BONUS,
        description: `Ranked #${leaderboardEntry.position}`,
      });
    }

    // Perfect score bonus
    if (leaderboardEntry.perfectScores > 0) {
      const perfectScoreReward =
        TOKEN_REWARDS.PERFECT_SCORE_BONUS * leaderboardEntry.perfectScores;
      totalRewards += perfectScoreReward;
      rewards.push({
        type: "Perfect Scores",
        amount: perfectScoreReward,
        description: `${leaderboardEntry.perfectScores} perfect scores`,
      });
    }

    // All levels bonus
    if (leaderboardEntry.levelsCompleted === 3) {
      totalRewards += TOKEN_REWARDS.ALL_LEVELS_BONUS;
      rewards.push({
        type: "All Levels Bonus",
        amount: TOKEN_REWARDS.ALL_LEVELS_BONUS,
        description: "Completed all 3 levels",
      });
    }

    return { totalRewards, rewards };
  };

  const { totalRewards, rewards } = calculateRewards();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4">Your Rewards</h3>

      {hasClaimed ? (
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-green-800">
            You have already claimed your tokens!
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-lg font-semibold">Total Claimable:</p>
            <p className="text-2xl font-bold text-green-600">
              {totalRewards} CYGAAR
            </p>
          </div>

          <div className="space-y-3">
            {rewards.map((reward, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{reward.type}</p>
                    <p className="text-sm text-gray-600">
                      {reward.description}
                    </p>
                  </div>
                  <p className="font-bold text-green-600">+{reward.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
