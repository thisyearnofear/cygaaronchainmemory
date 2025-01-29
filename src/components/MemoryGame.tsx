"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePenguinGameContract } from "@/lib/contract";
import Image from "next/image";
import { useAccount } from "wagmi";
import LeaderboardDisplay from "./LeaderboardDisplay";

interface Tile {
  id: number;
  value: number;
  revealed: boolean;
  matched: boolean;
}

type GameHints = {
  showPatternHint: boolean;
  showMatchingHint: boolean;
  showTripletHint: boolean;
  showLevel3Hint: boolean;
};

interface GameState {
  level: number;
  clicks: number;
  tiles: Tile[];
  selectedTiles: number[];
  gameStarted: boolean;
  showYeti: boolean;
  showCelebration: boolean;
  leaderboardKey?: number;
  hints: GameHints;
  submissionStatus?: {
    success: boolean;
    message: string;
    showLeaderboard: boolean;
  };
}

// Define specific types for each level config
type Level1Config = {
  rows: number;
  cols: number;
  pairs: number;
};

type Level2Config = {
  rows: number;
  cols: number;
  triplets: number;
  yetis: number;
};

type Level3Config = {
  rows: number;
  cols: number;
  groups: number;
  yetis: number;
};

// Type the LEVEL_CONFIG object
const LEVEL_CONFIG: {
  1: Level1Config;
  2: Level2Config;
  3: Level3Config;
} = {
  1: { rows: 4, cols: 4, pairs: 8 },
  2: { rows: 4, cols: 6, triplets: 4, yetis: 3 },
  3: { rows: 5, cols: 6, groups: 6, yetis: 5 },
} as const;

// Move these type definitions outside
type LeaderboardEntry = {
  player: `0x${string}`;
  score: bigint;
};

type LeaderboardData = {
  level: number;
  data?: readonly LeaderboardEntry[];
};

type TransactionStatus = "success" | "reverted" | 1 | "0x1";

// Add type guard function
function isLevel2Config(
  config: Level1Config | Level2Config | Level3Config
): config is Level2Config {
  return "triplets" in config && "yetis" in config;
}

const MemoryGame: React.FC = () => {
  // Move the hook inside the component
  const { submitScore, refetchLeaderboard, startGame, leaderboards } =
    usePenguinGameContract();

  const { isConnected, address: account } = useAccount();
  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    clicks: 0,
    tiles: [],
    selectedTiles: [],
    gameStarted: false,
    showYeti: false,
    showCelebration: false,
    hints: {
      showPatternHint: false,
      showMatchingHint: false,
      showTripletHint: false,
      showLevel3Hint: false,
    },
    submissionStatus: {
      success: false,
      message: "",
      showLeaderboard: false,
    },
  });

  // Add a loading state to prevent multiple clicks
  const [isProcessingMatch, setIsProcessingMatch] = useState(false);

  const initializeGame = useCallback(() => {
    const config = LEVEL_CONFIG[gameState.level as keyof typeof LEVEL_CONFIG];
    const totalTiles = config.rows * config.cols;

    let values: number[] = [];

    if (gameState.level === 1) {
      // Level 1: Simple pairs
      for (let i = 0; i < totalTiles / 2; i++) {
        values.push(i, i);
      }
    } else if (gameState.level === 2) {
      // Type guard to ensure we have Level2Config
      if (!isLevel2Config(config)) {
        console.error("Invalid config for level 2");
        return;
      }

      // Level 2: 4 triplets (12 tiles) + 3 yetis = 15 tiles total
      const tripletCount = config.triplets;
      for (let i = 0; i < tripletCount; i++) {
        values.push(i, i, i);
      }

      // Add exactly 3 yetis
      for (let i = 0; i < config.yetis; i++) {
        values.push(8);
      }

      // Fill remaining tiles with dummy penguins if needed
      while (values.length < totalTiles) {
        values.push(7);
      }
    } else if (gameState.level === 3) {
      // Type guard for Level3Config
      if (!("groups" in config && "yetis" in config)) {
        console.error("Invalid config for level 3");
        return;
      }

      // Create groups of varying sizes (2-4 penguins)
      let remainingTiles = totalTiles - config.yetis;
      let penguinType = 0;

      while (remainingTiles > 0) {
        // Randomly choose group size between 2-4
        const groupSize = Math.min(
          Math.floor(Math.random() * 3) + 2,
          remainingTiles
        );
        for (let i = 0; i < groupSize; i++) {
          values.push(penguinType);
        }
        remainingTiles -= groupSize;
        penguinType++;
      }

      // Add yetis
      for (let i = 0; i < config.yetis; i++) {
        values.push(8); // 8 represents yeti
      }
    }

    // Shuffle tiles
    values = values.sort(() => Math.random() - 0.5);

    const initialTiles = values.map((value, index) => ({
      id: index,
      value,
      revealed: false,
      matched: false,
    }));

    setGameState((prev) => ({
      ...prev,
      gameStarted: true,
      clicks: 0,
      tiles: initialTiles,
      selectedTiles: [],
    }));
  }, [gameState.level]);

  useEffect(() => {
    if (gameState.gameStarted) {
      initializeGame();
    }
  }, [gameState.gameStarted, initializeGame, gameState]);

  const handleStartGame = () => {
    try {
      // Initialize tiles
      const config = LEVEL_CONFIG[gameState.level as keyof typeof LEVEL_CONFIG];
      const totalTiles = config.rows * config.cols;
      let values: number[] = [];
      for (let i = 0; i < totalTiles / 2; i++) {
        values.push(i, i);
      }
      values = values.sort(() => Math.random() - 0.5);
      const initialTiles = values.map((value, index) => ({
        id: index,
        value,
        revealed: false,
        matched: false,
      }));

      setGameState((prev) => ({
        ...prev,
        gameStarted: true,
        clicks: 0,
        tiles: initialTiles,
      }));
    } catch (error) {
      console.error("Failed to initialize game:", error);
      alert("Failed to initialize game. Please try again.");
    }
  };

  const handleLevelComplete = async () => {
    try {
      // Show celebration first
      setGameState((prev) => ({ ...prev, showCelebration: true }));

      // Let the celebration modal handle score submission and level progression
    } catch (error) {
      console.error("Level completion error:", error);
    }
  };

  // Improve the tile click handler
  const handleTileClick = useCallback(
    async (index: number) => {
      if (isProcessingMatch) return;

      if (!gameState.tiles[index]) {
        console.error("Invalid tile index:", index);
        return;
      }

      if (gameState.tiles[index].matched || gameState.tiles[index].revealed)
        return;

      // Handle yeti click
      if (gameState.tiles[index].value === 8) {
        setGameState((prev) => ({
          ...prev,
          tiles: prev.tiles.map((tile, i) =>
            i === index ? { ...tile, revealed: true } : tile
          ),
          showYeti: true,
        }));

        setTimeout(() => {
          setGameState((prev) => ({
            ...prev,
            tiles: prev.tiles.map((tile, i) =>
              i === index ? { ...tile, revealed: false } : tile
            ),
            showYeti: false,
          }));
        }, 1500);
        return;
      }

      // Different max selections based on level
      const maxSelections = gameState.level === 1 ? 2 : 3;
      if (gameState.selectedTiles.length >= maxSelections) return;

      if (gameState.selectedTiles.includes(index)) return;

      setGameState((prev) => {
        const newTiles = prev.tiles.map((tile, i) =>
          i === index ? { ...tile, revealed: true } : tile
        );
        const newSelectedTiles = [...prev.selectedTiles, index];

        // Check for matches when we have enough selections
        if (newSelectedTiles.length === maxSelections) {
          setIsProcessingMatch(true);

          setTimeout(() => {
            setGameState((current) => {
              const selectedTileValues = newSelectedTiles.map(
                (idx) => current.tiles[idx].value
              );

              // Check if all selected tiles have the same value
              const isMatch = selectedTileValues.every(
                (val) => val === selectedTileValues[0]
              );

              const updatedTiles = current.tiles.map((tile, i) => {
                if (newSelectedTiles.includes(i)) {
                  return {
                    ...tile,
                    matched: isMatch,
                    revealed: isMatch,
                  };
                }
                return tile;
              });

              // For level 3, check if all groups are complete
              const allMatched = updatedTiles.every((tile) => {
                if (tile.value === 8) return true; // Yetis are always "matched"
                if (gameState.level === 3) {
                  // Count how many of this type are matched
                  const matchedOfType = updatedTiles.filter(
                    (t) => t.value === tile.value && t.matched
                  ).length;
                  // Count total of this type
                  const totalOfType = updatedTiles.filter(
                    (t) => t.value === tile.value
                  ).length;
                  return matchedOfType === totalOfType;
                }
                return tile.matched;
              });

              if (allMatched) {
                setTimeout(() => {
                  handleLevelComplete();
                }, 500);
              }

              return {
                ...current,
                tiles: updatedTiles,
                selectedTiles: [],
                clicks: current.clicks + 1,
              };
            });

            setIsProcessingMatch(false);
          }, 1000);
        }

        return {
          ...prev,
          tiles: newTiles,
          selectedTiles: newSelectedTiles,
          clicks: prev.clicks + (newSelectedTiles.length === 1 ? 1 : 0),
        };
      });
    },
    [
      isProcessingMatch,
      handleLevelComplete,
      gameState.level,
      gameState.selectedTiles,
      gameState.tiles,
    ]
  );

  // Update the score submission logic with proper types
  const handleSubmitScore = async () => {
    if (gameState.clicks < 8) {
      alert("Score too low - minimum 8 clicks required per level");
      return;
    }

    try {
      const submitButton = document.getElementById(
        "submit-score-btn"
      ) as HTMLButtonElement | null;
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Submitting Score...";
      }

      await startGame(gameState.level);
      const tx = await submitScore([
        BigInt(gameState.level),
        BigInt(gameState.clicks),
        "0x" as const,
      ]);

      setGameState((prev) => ({
        ...prev,
        submissionStatus: {
          success: true,
          message: "Submitting score to blockchain...",
          showLeaderboard: false,
        },
      }));

      const receipt = await tx.wait();
      const status = receipt.status as TransactionStatus;
      const isSuccess =
        status === "success" || status === 1 || status === "0x1";

      if (isSuccess) {
        // Wait for blockchain state to update
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await refetchLeaderboard();

        setGameState((prev) => ({
          ...prev,
          submissionStatus: {
            success: true,
            message: "Score submitted successfully!",
            showLeaderboard: true,
          },
        }));
      }
    } catch (error) {
      console.error("Failed to submit score:", error);
      setGameState((prev) => ({
        ...prev,
        submissionStatus: {
          success: false,
          message: "Failed to submit score. Please try again.",
          showLeaderboard: false,
        },
      }));
    }
  };

  // Check clicks and progressively show hints
  useEffect(() => {
    if (gameState.level === 2) {
      const { hints, clicks } = gameState;
      if (clicks >= 75 && !hints.showPatternHint) {
        setGameState((prev) => ({
          ...prev,
          hints: { ...prev.hints, showPatternHint: true },
        }));
      }
      if (clicks >= 90 && !hints.showMatchingHint) {
        setGameState((prev) => ({
          ...prev,
          hints: { ...prev.hints, showMatchingHint: true },
        }));
      }
      if (clicks >= 105 && !hints.showTripletHint) {
        setGameState((prev) => ({
          ...prev,
          hints: { ...prev.hints, showTripletHint: true },
        }));
      }
    }
  }, [gameState.clicks, gameState.level, gameState.hints]);

  // Update hint system for level 3
  useEffect(() => {
    if (gameState.level === 3) {
      const { hints, clicks } = gameState;
      if (clicks >= 75 && !hints.showPatternHint) {
        setGameState((prev) => ({
          ...prev,
          hints: { ...prev.hints, showPatternHint: true },
        }));
      }
      if (clicks >= 90 && !hints.showLevel3Hint) {
        setGameState((prev) => ({
          ...prev,
          hints: { ...prev.hints, showLevel3Hint: true },
        }));
      }
    }
  }, [gameState.clicks, gameState.level, gameState.hints]);

  // Render more specific and helpful hints
  const renderHints = () => {
    if (gameState.level === 2) {
      return (
        <div className="mt-4 space-y-2">
          {gameState.hints.showPatternHint && (
            <div className="bg-blue-100 p-3 rounded-lg text-sm animate-fade-in">
              <span className="font-bold">💡 Game Tip:</span> There are exactly
              4 different types of penguins to find, and each appears three
              times. Watch out for the 3 yetis!
            </div>
          )}

          {gameState.hints.showMatchingHint && (
            <div className="bg-green-100 p-3 rounded-lg text-sm animate-fade-in">
              <span className="font-bold">🎯 Memory Tip:</span> Try dividing the
              board into sections - penguins of the same type are often placed
              in nearby areas. Start with one section at a time!
            </div>
          )}

          {gameState.hints.showTripletHint && (
            <div className="bg-purple-100 p-3 rounded-lg text-sm animate-fade-in">
              <span className="font-bold">🔍 Strategy:</span> Found two matching
              penguins? The third one is likely in the same row or an adjacent
              row. Mark the positions mentally!
              {gameState.clicks >= 90 && (
                <div className="mt-2 text-xs text-gray-600">
                  <span className="font-bold">Quick Count:</span> You&apos;re
                  looking for:
                  <ul className="list-disc list-inside mt-1">
                    <li>4 different penguin types (3 of each)</li>
                    <li>3 yetis to avoid</li>
                    <li>Some filler penguins that don&apos;t match</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      );
    } else if (gameState.level === 3) {
      return (
        <div className="mt-4 space-y-2">
          {gameState.hints.showPatternHint && (
            <div className="bg-blue-100 p-3 rounded-lg text-sm animate-fade-in">
              <span className="font-bold">Level 3 Tip:</span> Each group can
              have 2-4 matching penguins. Pay attention to how many matches you
              need!
            </div>
          )}

          {gameState.hints.showLevel3Hint && (
            <div className="bg-purple-100 p-3 rounded-lg text-sm animate-fade-in">
              <span className="font-bold">⚠️ Warning:</span> The 5 yetis in this
              level will reset ALL your progress! Try to remember where they
              are.
              {gameState.clicks >= 120 && (
                <div className="mt-2 text-xs text-gray-600">
                  <span className="font-bold">Pro Tip:</span> Try revealing
                  tiles in a systematic pattern to find groups and remember yeti
                  locations.
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Update the handleCelebrationActions to include penguin art
  const handleCelebrationActions = () => {
    // Check current score against leaderboard
    const currentLeaderboard = leaderboards[
      gameState.level - 1
    ] as LeaderboardData;
    const currentBestScore = currentLeaderboard?.data?.find(
      (entry: LeaderboardEntry) =>
        entry.player.toLowerCase() === (account?.toLowerCase() ?? "")
    );

    const isBetterScore =
      !currentBestScore || gameState.clicks < Number(currentBestScore.score);

    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center mb-6">
          <Image
            src={`/images/penguin${gameState.level - 1}.png`}
            alt="Celebration Penguin"
            width={150}
            height={150}
            className="animate-bounce-gentle mb-4"
            priority
          />
          <p className="text-xl">
            You completed the level in {gameState.clicks} clicks!
          </p>
        </div>

        {isBetterScore ? (
          <button
            id="submit-score-btn"
            onClick={handleSubmitScore}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
          >
            Submit Score to Leaderboard
          </button>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 italic">
              Your current score ({gameState.clicks} clicks) isn&apos;t better
              than your previous best ({Number(currentBestScore?.score)}{" "}
              clicks).
            </p>
            <p className="text-gray-600 font-medium mt-2">
              Keep trying to improve!
            </p>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleRetryLevel}
            className="flex-1 bg-gray-200 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
          >
            Retry Level
          </button>
          {gameState.level < 3 && (
            <button
              onClick={handleNextLevel}
              className="flex-1 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
            >
              Next Level
            </button>
          )}
        </div>
      </div>
    );
  };

  // Add level management functions
  const handleRetryLevel = () => {
    setGameState((prev) => ({
      ...prev,
      showCelebration: false,
      gameStarted: false,
      clicks: 0,
      tiles: [],
      selectedTiles: [],
      submissionStatus: undefined,
    }));
    setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        gameStarted: true,
      }));
    }, 100);
  };

  const handleNextLevel = () => {
    if (gameState.level >= 3) return;

    setGameState((prev) => ({
      ...prev,
      level: prev.level + 1,
      showCelebration: false,
      gameStarted: false,
      clicks: 0,
      tiles: [],
      selectedTiles: [],
      submissionStatus: undefined,
      hints: {
        showPatternHint: false,
        showMatchingHint: false,
        showTripletHint: false,
        showLevel3Hint: false,
      },
    }));
    setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        gameStarted: true,
      }));
    }, 100);
  };

  if (!isConnected) {
    return (
      <div className="game-container">
        <div className="game-info">
          <h2 className="text-2xl font-bold mb-2">
            Welcome to Cygaar Memory Club
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            Connect your wallet to start playing!
          </p>
          <LeaderboardDisplay refreshKey={gameState.leaderboardKey} />
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-info">
        <h2 className="text-2xl font-bold mb-2">Level {gameState.level}</h2>
        <div className="mb-2">Clicks: {gameState.clicks}</div>
        <div className="mb-4 text-gray-600">
          {gameState.level === 1
            ? "Find matching pairs of penguins. Click two tiles to reveal them."
            : gameState.level === 2
            ? "Find triplets of matching penguins. Watch out for yetis!"
            : "Final Challenge: Find triplets and watch for extra yetis!"}
        </div>
        {!gameState.gameStarted && (
          <>
            <button
              onClick={handleStartGame}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mb-4"
            >
              Start Game
            </button>
            <LeaderboardDisplay refreshKey={gameState.leaderboardKey} />
          </>
        )}
      </div>

      {gameState.gameStarted && (
        <div
          className="game-grid"
          style={{
            gridTemplateColumns: `repeat(${
              gameState.level === 1 ? 4 : 6
            }, minmax(0, 1fr))`,
          }}
        >
          {gameState.tiles.map((tile: Tile, index: number) => (
            <div
              key={tile.id}
              onClick={() => handleTileClick(index)}
              className={`game-tile ${
                tile.revealed || tile.matched ? "revealed" : ""
              } ${tile.matched ? "matched" : ""}`}
            >
              {(tile.revealed || tile.matched) && (
                <Image
                  src={`/images/penguin${tile.value}.png`}
                  alt={`Penguin ${tile.value}`}
                  width={150}
                  height={150}
                  className={`penguin-image ${tile.matched ? "matched" : ""}`}
                  priority
                />
              )}
            </div>
          ))}
        </div>
      )}

      {gameState.showYeti && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg text-center">
            <Image
              src="/images/penguin8.png"
              alt="Yeti"
              width={150}
              height={150}
              className="animate-bounce-custom mx-auto mb-4"
              priority
            />
            <h3 className="text-3xl font-bold text-red-500 mb-4">
              ROARRRRRR!!
            </h3>
            <button
              onClick={() =>
                setGameState((prev) => ({ ...prev, showYeti: false }))
              }
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Continue Playing
            </button>
          </div>
        </div>
      )}

      {gameState.showCelebration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="text-center">
              <Image
                src={`/images/penguin${gameState.level - 1}.png`}
                alt="Celebration Penguin"
                width={150}
                height={150}
                className="animate-bounce-gentle mx-auto mb-4"
                priority
              />
              <h2 className="text-2xl font-bold mb-4">
                Level {gameState.level} Complete!
              </h2>
            </div>

            {gameState.submissionStatus ? (
              <>
                <p
                  className={`mb-4 text-center ${
                    gameState.submissionStatus.success
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {gameState.submissionStatus.message}
                </p>
                {gameState.submissionStatus.showLeaderboard && (
                  <div className="mb-4">
                    <LeaderboardDisplay refreshKey={gameState.leaderboardKey} />
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleRetryLevel}
                    className="flex-1 bg-gray-200 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
                  >
                    Retry Level
                  </button>
                  {gameState.level < 3 && (
                    <button
                      onClick={handleNextLevel}
                      className="flex-1 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
                    >
                      Next Level
                    </button>
                  )}
                </div>
              </>
            ) : (
              handleCelebrationActions()
            )}
          </div>
        </div>
      )}

      {renderHints()}
    </div>
  );
};

export default MemoryGame;
