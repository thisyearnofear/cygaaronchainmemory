"use client";

import React from "react";

const Leaderboard: React.FC = () => {
  // Placeholder leaderboard data
  const leaderboard = [
    { player: "0x123...abc", score: 8 },
    { player: "0x456...def", score: 10 },
    { player: "0x789...ghi", score: 12 },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Leaderboard</h1>
      <ul>
        {leaderboard.map((entry, index) => (
          <li key={index} className="mb-2">
            {index + 1}. {entry.player} - {entry.score} clicks
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;
