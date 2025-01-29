"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePenguinGameContract } from "@/lib/contract";
import { keccak256, toBytes } from "viem";
import Image from "next/image";
import { useAccount } from "wagmi";
import LeaderboardDisplay from "./LeaderboardDisplay";

interface Tile {
  id: number;
  value: number;
  revealed: boolean;
  matched: boolean;
}

interface GameState {
  level: number;
  clicks: number;
  tiles: Tile[];
  selectedTiles: number[];
  gameStarted: boolean;
  showYeti: boolean;
  showCelebration: boolean;
  leaderboardKey?: number;
  hints: {
    showPatternHint: boolean;
    showMatchingHint: boolean;
    showTripletHint: boolean;
    showLevel3Hint: boolean;
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

// Add type for the receipt status
type TransactionStatus = "success" | "reverted" | 1 | "0x1";

// Add type guard function
function isLevel2Config(
  config: Level1Config | Level2Config | Level3Config
): config is Level2Config {
  return "triplets" in config && "yetis" in config;
}

const MemoryGame: React.FC = () => {
  const { isConnected } = useAccount();
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
  });

  const { submitScore, refetchLeaderboard, startGame } =
    usePenguinGameContract();

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
  }, [gameState.gameStarted, initializeGame]);

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

  const handleTileClick = async (index: number) => {
    // Don't allow clicks if tile is already revealed/matched
    if (gameState.tiles[index].revealed || gameState.tiles[index].matched) {
      return;
    }

    // Update clicks
    setGameState((prev) => ({
      ...prev,
      clicks: prev.clicks + 1,
    }));

    // Handle yeti click
    if (gameState.tiles[index].value === 8) {
      const updatedTiles = [...gameState.tiles];
      updatedTiles[index].revealed = true;

      setGameState((prev) => ({
        ...prev,
        tiles: updatedTiles,
        showYeti: true,
      }));

      // For level 3, reset all progress on yeti encounter
      if (gameState.level === 3) {
        setTimeout(() => {
          setGameState((prev) => ({
            ...prev,
            tiles: prev.tiles.map((tile) => ({
              ...tile,
              revealed: false,
              matched: false,
            })),
            selectedTiles: [],
            showYeti: false,
          }));
        }, 1500);
      } else {
        // Level 2 yeti behavior stays the same
        setTimeout(() => {
          setGameState((prev) => ({
            ...prev,
            tiles: prev.tiles.map((tile, i) =>
              i === index ? { ...tile, revealed: false } : tile
            ),
            showYeti: false,
          }));
        }, 1500);
      }
      return;
    }

    // Reveal the clicked tile
    const updatedTiles = [...gameState.tiles];
    updatedTiles[index].revealed = true;

    // Add to selected tiles
    const newSelectedTiles = [...gameState.selectedTiles, index];

    // Check if we have a potential match
    const selectedValues = newSelectedTiles.map(
      (i) => gameState.tiles[i].value
    );
    const allSameValue = selectedValues.every((v) => v === selectedValues[0]);

    // Find how many tiles should match for this group
    const groupSize = gameState.tiles.filter(
      (t) => t.value === gameState.tiles[index].value
    ).length;

    setGameState((prev) => ({
      ...prev,
      tiles: updatedTiles,
      selectedTiles: newSelectedTiles,
    }));

    // Check for match if we've selected all tiles in the group
    if (newSelectedTiles.length === groupSize) {
      setTimeout(() => {
        if (allSameValue) {
          // It's a match!
          setGameState((prev) => ({
            ...prev,
            tiles: prev.tiles.map((tile, i) =>
              newSelectedTiles.includes(i) ? { ...tile, matched: true } : tile
            ),
            selectedTiles: [],
          }));

          // Check if level is complete
          const remainingUnmatched = updatedTiles.filter(
            (t) => !t.matched && t.value !== 8
          ).length;

          if (remainingUnmatched === groupSize) {
            handleLevelComplete();
          }
        } else {
          // No match, hide tiles
          setGameState((prev) => ({
            ...prev,
            tiles: prev.tiles.map((tile, i) =>
              newSelectedTiles.includes(i) ? { ...tile, revealed: false } : tile
            ),
            selectedTiles: [],
          }));
        }
      }, 1000);
    }
  };

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

      // First start the game session
      console.log("Starting game session...");
      await startGame(gameState.level);
      console.log("Game session started");

      // Then submit the score
      console.log("Starting score submission...");
      const tx = await submitScore([
        BigInt(gameState.level),
        BigInt(gameState.clicks),
        "0x" as const,
      ]);

      console.log("Waiting for transaction confirmation...");
      const receipt = await tx.wait();

      // Type-safe status check
      const status = receipt.status as TransactionStatus;
      const isSuccess =
        status === "success" || status === 1 || status === "0x1";

      if (isSuccess) {
        console.log(
          "Transaction successful, waiting for leaderboard update..."
        );

        // Wait longer for the blockchain state to update
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Increased to 5 seconds

        // Force a refresh
        await refetchLeaderboard();

        console.log("Score submitted successfully!");
        alert(
          "Score submitted successfully! Check the leaderboard to see your position."
        );
      } else {
        console.error("Transaction failed:", receipt);
        alert("Failed to submit score to leaderboard.");
      }

      setGameState((prev) => ({
        ...prev,
        leaderboardKey: (prev.leaderboardKey || 0) + 1,
      }));
    } catch (error) {
      console.error("Failed to submit score:", error);
      alert("Failed to submit score. Please try again.");
    } finally {
      const submitButton = document.getElementById(
        "submit-score-btn"
      ) as HTMLButtonElement | null;
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Score to Leaderboard";
      }
    }
  };

  // Check clicks and progressively show hints
  useEffect(() => {
    const { showMatchingHint, showPatternHint, showTripletHint } =
      gameState.hints;

    if (showMatchingHint) {
      // ... hint logic
    }
  }, [gameState.hints]); // Depend on the entire hints object

  useEffect(() => {
    const { showLevel3Hint, showPatternHint } = gameState.hints;

    if (showLevel3Hint) {
      // ... hint logic
    }
  }, [gameState.hints]); // Depend on the entire hints object

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
                  <span className="font-bold">Quick Count:</span> You're looking
                  for:
                  <ul className="list-disc list-inside mt-1">
                    <li>4 different penguin types (3 of each)</li>
                    <li>3 yetis to avoid</li>
                    <li>Some filler penguins that don't match</li>
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
              <span className="font-bold">💡 Level 3 Tip:</span> Each group can
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
          <div className="bg-white p-8 rounded-lg text-center">
            <Image
              src="/images/penguin9.png"
              alt="Celebration"
              width={150}
              height={150}
              className="animate-bounce-custom mx-auto mb-4"
              priority
            />
            <h3 className="text-3xl font-bold text-green-500 mb-4">
              Level Complete!
            </h3>
            <p className="text-xl mb-4">
              You completed level {gameState.level} in {gameState.clicks}{" "}
              clicks!
            </p>
            <div className="space-y-4">
              <button
                onClick={handleSubmitScore}
                id="submit-score-btn"
                className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Score to Leaderboard
              </button>

              <button
                onClick={() => {
                  setGameState((prev) => ({
                    ...prev,
                    level: Math.min(prev.level + 1, 3),
                    gameStarted: false,
                    showCelebration: false,
                  }));
                }}
                className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {gameState.level < 3 ? "Continue to Next Level" : "Play Again"}
              </button>
            </div>
          </div>
        </div>
      )}

      {renderHints()}
    </div>
  );
};

export default MemoryGame;
