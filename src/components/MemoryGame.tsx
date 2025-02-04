"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { usePenguinGameContract } from "@/lib/contract";
import Image from "next/image";
import { useAccount } from "wagmi";
import LeaderboardDisplay from "./LeaderboardDisplay";
import NetworkCheck from "./NetworkCheck";
import MiniLeaderboard from "./MiniLeaderboard";
import CommentaryOverlay from "./CommentaryOverlay";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useImagePreloader } from "@/hooks/useImagePreloader";

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

// First, define a type for valid levels
type GameLevel = 1 | 2 | 3;

// Update GameState to use the specific level type
interface GameState {
  level: GameLevel; // This ensures level can only be 1, 2, or 3
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
  wrongAttempts: Record<number, number>;
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
  pairs: number;
  yetis: number;
};

// Type the LEVEL_CONFIG object with specific level types
const LEVEL_CONFIG = {
  1: { rows: 4, cols: 4, pairs: 8 },
  2: { rows: 4, cols: 4, triplets: 4, yetis: 1 },
  3: { rows: 4, cols: 4, pairs: 7, yetis: 2 }, // 14 tiles total: 7 pairs and 2 yetis
} as const satisfies Record<
  GameLevel,
  Level1Config | Level2Config | Level3Config
>;

// Add type guard function
function isLevel2Config(
  config: Level1Config | Level2Config | Level3Config
): config is Level2Config {
  return "triplets" in config && "yetis" in config;
}

// Add this type for better state management
type CompletionState = {
  showingOptions: boolean;
  isSubmitting: boolean;
  hasSubmitted: boolean;
};

// First, let's create a separate hook for initialization
const useGameInitialization = (
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) => {
  useEffect(() => {
    if (gameState.gameStarted) {
      const config = LEVEL_CONFIG[gameState.level as GameLevel];
      const totalTiles = config.rows * config.cols;

      let values: number[] = [];

      if (gameState.level === 1) {
        // Level 1 initialization
        for (let i = 0; i < totalTiles / 2; i++) {
          values.push(i, i);
        }
      } else if (gameState.level === 2) {
        // Level 2 initialization
        if (!isLevel2Config(config)) {
          console.error("Invalid config for level 2");
          return;
        }

        // Add triplets
        for (let i = 0; i < config.triplets; i++) {
          values.push(i, i, i);
        }

        // Add 1 yeti
        values.push(8);

        // Fill remaining tiles with non-matching penguins
        const remainingTiles = totalTiles - values.length;
        for (let i = 0; i < remainingTiles; i++) {
          values.push(7);
        }
      } else if (gameState.level === 3) {
        // Level 3 initialization
        if (!isLevel3Config(config)) {
          console.error("Invalid config for level 3");
          return;
        }

        // Add pairs
        for (let i = 0; i < config.pairs; i++) {
          values.push(i, i);
        }

        // Add yetis
        for (let i = 0; i < config.yetis; i++) {
          values.push(8);
        }

        // Fill any remaining spaces with non-matching penguins
        const remainingTiles = totalTiles - values.length;
        for (let i = 0; i < remainingTiles; i++) {
          values.push(7);
        }
      }

      // Shuffle values
      values = values.sort(() => Math.random() - 0.5);

      // Create tiles
      const initialTiles = values.map((value, index) => ({
        id: index,
        value,
        revealed: false,
        matched: false,
      }));

      setGameState((prev) => ({
        ...prev,
        tiles: initialTiles,
        selectedTiles: [],
      }));
    }
  }, [gameState.gameStarted, gameState.level, setGameState]);
};

// Update type guard for Level 3
function isLevel3Config(
  config: Level1Config | Level2Config | Level3Config
): config is Level3Config {
  return "pairs" in config && "yetis" in config;
}

const MemoryGame: React.FC = () => {
  // Add at the top of the component
  useImagePreloader();

  // Move the hook inside the component
  const { submitScore, refreshLeaderboard, startGame } =
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
    leaderboardKey: undefined,
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
    wrongAttempts: {},
  });

  // Add matches count to state
  const [matchCount, setMatchCount] = useState(0);

  // Add state for completion flow
  const [completionState, setCompletionState] = useState<CompletionState>({
    showingOptions: false,
    isSubmitting: false,
    hasSubmitted: false,
  });

  // Add a ref to track pending hide operations
  const pendingHideRef = useRef<NodeJS.Timeout | null>(null);

  // Add ref for yeti timeout
  const yetiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use the initialization hook
  useGameInitialization(gameState, setGameState);

  // Update handleStartGame to not set state directly
  const handleStartGame = useCallback(() => {
    try {
      setGameState((prev) => ({
        ...prev,
        gameStarted: true,
        clicks: 0,
        selectedTiles: [],
      }));
    } catch (error) {
      console.error("Failed to initialize game:", error);
      alert("Failed to initialize game. Please try again.");
    }
  }, []);

  // Update level transition handlers
  const handleRetryLevel = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      level: prev.level,
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
      wrongAttempts: {},
    }));
  }, []);

  const handleNextLevel = useCallback(() => {
    if (gameState.level >= 3) return;

    setGameState((prev) => ({
      ...prev,
      level: (prev.level + 1) as GameLevel,
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
      wrongAttempts: {},
    }));
  }, [gameState.level]);

  const handleLevelComplete = useCallback(async () => {
    // Show celebration regardless of connection status
    setGameState((prev) => {
      // Only update if not already showing celebration
      if (prev.showCelebration) return prev;
      return { ...prev, showCelebration: true };
    });

    // Don't attempt to start game session if not connected
    if (!isConnected) return;

    try {
      // Only attempt to start game session if connected
      await startGame(gameState.level);
    } catch (error) {
      console.error("Level completion error:", error);
      // Only show alert for submission errors if connected
      if (isConnected) {
        alert("Failed to submit score. Please try again.");
      }
    }
  }, [gameState.level, startGame, isConnected]);

  // Add these handlers before the handleTileClick function
  const handleMatch = useCallback((matchedTiles: number[]) => {
    setGameState((prev) => {
      const newTiles = prev.tiles.map((tile) => ({
        ...tile,
        matched: matchedTiles.includes(tile.id) ? true : tile.matched,
        revealed: matchedTiles.includes(tile.id) ? true : tile.revealed,
      }));

      const matchableTiles = newTiles.filter(
        (tile) => tile.value !== 7 && tile.value !== 8
      );
      const allMatched = matchableTiles.every((tile) => tile.matched);

      return {
        ...prev,
        tiles: newTiles,
        selectedTiles: [],
        showCelebration: allMatched,
      };
    });

    setMatchCount((prev) => prev + 1);
  }, []);

  const handleNoMatch = useCallback((selectedTiles: number[]) => {
    // Clear any pending hide operations
    if (pendingHideRef.current) {
      clearTimeout(pendingHideRef.current);
    }

    // Update wrong attempts counter
    setGameState((prev) => {
      const newWrongAttempts = { ...prev.wrongAttempts };
      selectedTiles.forEach((index) => {
        newWrongAttempts[index] = (newWrongAttempts[index] || 0) + 1;
      });

      return {
        ...prev,
        wrongAttempts: newWrongAttempts,
      };
    });

    // Hide tiles after a delay
    pendingHideRef.current = setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        selectedTiles: [],
        tiles: prev.tiles.map((tile) => ({
          ...tile,
          revealed: tile.matched ? true : false, // Keep matched tiles revealed
        })),
      }));
      pendingHideRef.current = null;
    }, 800);
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (pendingHideRef.current) {
        clearTimeout(pendingHideRef.current);
      }
    };
  }, []);

  // Update the handleTileClick logic for Level 3
  const handleTileClick = async (index: number) => {
    // Don't allow clicks on matched or already selected tiles
    if (
      gameState.tiles[index].matched ||
      gameState.selectedTiles.includes(index)
    ) {
      return;
    }

    // Don't allow new selections while processing a no-match hide animation
    if (pendingHideRef.current) {
      return;
    }

    // Handle yeti click first
    if (gameState.tiles[index].value === 8) {
      // Clear any existing timeouts
      if (yetiTimeoutRef.current) {
        clearTimeout(yetiTimeoutRef.current);
      }

      if (gameState.level === 3) {
        // Level 3: Reset all progress when hitting a yeti
        setGameState((prev) => ({
          ...prev,
          showYeti: true,
          selectedTiles: [],
          tiles: prev.tiles.map((tile) => ({
            ...tile,
            revealed: false,
            matched: false,
          })),
        }));
      } else {
        // Level 2: Just show yeti animation and continue as normal tile
        setGameState((prev) => ({
          ...prev,
          showYeti: true,
          clicks: prev.clicks + 1,
          selectedTiles: [...prev.selectedTiles, index],
          tiles: prev.tiles.map((tile, i) =>
            i === index ? { ...tile, revealed: true } : tile
          ),
        }));
      }

      // Auto-hide yeti after 1.5 seconds
      yetiTimeoutRef.current = setTimeout(() => {
        setGameState((prev) => ({ ...prev, showYeti: false }));
      }, 1500);

      // For Level 2, continue with selection logic
      if (gameState.level === 2) {
        const selectedTiles = [...gameState.selectedTiles, index];
        if (selectedTiles.length === 3) {
          handleNoMatch(selectedTiles);
        }
      }
      return;
    }

    // Get max selections based on level
    const maxSelections = gameState.level === 2 ? 3 : 2;
    if (gameState.selectedTiles.length >= maxSelections) {
      return;
    }

    // Increment clicks and reveal the tile
    setGameState((prev) => ({
      ...prev,
      clicks: prev.clicks + 1,
      selectedTiles: [...prev.selectedTiles, index],
      tiles: prev.tiles.map((tile, i) =>
        i === index ? { ...tile, revealed: true } : tile
      ),
    }));

    // Check for matches
    const selectedTiles = [...gameState.selectedTiles, index];
    const requiredMatches = gameState.level === 2 ? 3 : 2;

    if (selectedTiles.length === requiredMatches) {
      const values = selectedTiles.map((i) => gameState.tiles[i].value);
      const allMatch = values.every((v) => v === values[0]);

      if (allMatch) {
        handleMatch(selectedTiles);
      } else {
        handleNoMatch(selectedTiles);
      }
    }
  };

  // Update handleSubmitScore to refresh leaderboard after successful submission
  const handleSubmitScore = async () => {
    if (!account || completionState.isSubmitting) return;

    setCompletionState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      await startGame(gameState.level);
      await submitScore([
        BigInt(gameState.level),
        BigInt(gameState.clicks),
        "0x" as const,
      ]);

      // Refresh leaderboard after successful submission
      await refreshLeaderboard();

      setCompletionState((prev) => ({
        ...prev,
        isSubmitting: false,
        hasSubmitted: true,
      }));

      setGameState((prev) => ({
        ...prev,
        submissionStatus: {
          success: true,
          message: "Score submitted successfully!",
          showLeaderboard: true,
        },
        leaderboardKey: Date.now(),
      }));
    } catch (error) {
      console.error("Score submission error:", error);
      setCompletionState((prev) => ({ ...prev, isSubmitting: false }));
      setGameState((prev) => ({
        ...prev,
        submissionStatus: {
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to submit score",
          showLeaderboard: false,
        },
      }));
    }
  };

  // Update the hint effect
  useEffect(() => {
    if (!gameState.gameStarted) return;

    // Show pattern hint after 30 seconds
    const patternTimer = setTimeout(() => {
      if (gameState.clicks > 30) {
        setGameState((prev) => ({
          ...prev,
          hints: { ...prev.hints, showPatternHint: true },
        }));
      }
    }, 30000);

    return () => clearTimeout(patternTimer);
  }, [gameState.gameStarted, gameState.clicks, setGameState]);

  // Update the matching hint effect
  useEffect(() => {
    if (!gameState.gameStarted) return;

    // Show matching hint after 60 seconds
    const matchingTimer = setTimeout(() => {
      if (gameState.clicks > 60) {
        setGameState((prev) => ({
          ...prev,
          hints: { ...prev.hints, showMatchingHint: true },
        }));
      }
    }, 60000);

    return () => clearTimeout(matchingTimer);
  }, [gameState.gameStarted, gameState.clicks, setGameState]);

  // Update the completion check effect
  useEffect(() => {
    if (
      !gameState.gameStarted ||
      !gameState.tiles.length ||
      gameState.showCelebration
    )
      return;

    const matchableTiles = gameState.tiles.filter(
      (tile) => tile.value !== 7 && tile.value !== 8
    );
    const allMatched = matchableTiles.every((tile) => tile.matched);

    if (allMatched) {
      handleLevelComplete();
    }
  }, [
    gameState.gameStarted,
    gameState.level,
    gameState.tiles,
    gameState.showCelebration,
    handleLevelComplete,
  ]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (yetiTimeoutRef.current) {
        clearTimeout(yetiTimeoutRef.current);
      }
    };
  }, []);

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
              <span className="font-bold">Level 3 Tip:</span>{" "}
              {gameState.level === 3
                ? "First find all 3 pairs of matching penguins!"
                : "Now find the 2 triplets of matching penguins!"}
            </div>
          )}

          {gameState.hints.showLevel3Hint && (
            <div className="bg-purple-100 p-3 rounded-lg text-sm animate-fade-in">
              <span className="font-bold">⚠️ Warning:</span> The 2 yetis in this
              level will reset ALL your progress! Try to remember where they
              are.
              {gameState.clicks >= 120 && (
                <div className="mt-2 text-xs text-gray-600">
                  <span className="font-bold">Pro Tip:</span> Try revealing
                  tiles in a systematic pattern to find matches and avoid yetis.
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Update the celebration modal content
  const handleCelebrationActions = () => {
    const getLevelDescription = (level: number) => {
      switch (level) {
        case 1:
          return "matched all the penguin pairs";
        case 2:
          return "found all the penguin triplets while dodging a yeti";
        case 3:
          return "conquered the double yeti challenge with two yetis";
        default:
          return "completed the challenge";
      }
    };

    const getPlayerName = () => {
      if (!isConnected) return "0xYourWalletHere";
      return account || "0xYourWalletHere";
    };

    const tweetText = encodeURIComponent(
      `🐧 Just ${getLevelDescription(gameState.level)} in ${
        gameState.clicks
      } clicks at Remenguiny #Remenguiny\n\n` +
        `https://www.abs.xyz/trade/token?address=0x35efa4699edd7b468cbbf4fff7b6e7afc0a7ada6\n\n` +
        `thanks @0xcygaar & team for building @abstractchain\n\n` +
        `${getPlayerName()}\n\n` +
        `Play for yourself: https://www.cygaar.xyz`
    );

    return (
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <Image
              src="/images/penguin9.png"
              alt="Cygaar"
              width={150}
              height={150}
              className="animate-bounce-gentle mb-4"
              priority
            />
            <h2 className="text-2xl font-bold">
              Level {gameState.level} Complete!
            </h2>
            <p className="text-lg mt-2">
              Great job! You completed it in {gameState.clicks} clicks!
            </p>
          </div>

          {/* Action Buttons */}
          {!completionState.showingOptions ? (
            <div className="space-y-3">
              {isConnected ? (
                <button
                  onClick={() =>
                    setCompletionState((prev) => ({
                      ...prev,
                      showingOptions: true,
                    }))
                  }
                  className="w-full bg-emerald-500 text-white py-3 px-4 rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  Submit Score to Leaderboard
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-emerald-50 p-4 rounded-lg text-sm">
                    <p className="mb-3">
                      Connect your wallet to submit your score to the
                      leaderboard!
                    </p>
                    <div className="flex justify-center">
                      <ConnectButton />
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={
                  gameState.level < 3 ? handleNextLevel : handleRetryLevel
                }
                className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
              >
                {gameState.level < 3 ? "Continue to Next Level" : "Play Again"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Score Submission Info */}
              <div className="bg-emerald-50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Submitting Your Score</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>First transaction: Activate game session</li>
                  <li>Second transaction: Submit your score</li>
                  <li>Leaderboard updates within ~1 minute</li>
                </ol>
                {gameState.submissionStatus && (
                  <p className="mt-3 text-sm text-gray-600">
                    {gameState.submissionStatus.message}
                  </p>
                )}
              </div>

              {/* Submission Status */}
              {gameState.submissionStatus && (
                <div
                  className={`p-4 rounded-lg ${
                    gameState.submissionStatus.success
                      ? "bg-green-50"
                      : "bg-red-50"
                  }`}
                >
                  <p
                    className={
                      gameState.submissionStatus.success
                        ? "text-green-700"
                        : "text-red-700"
                    }
                  >
                    {gameState.submissionStatus.message}
                  </p>
                </div>
              )}

              {/* Submit/Back Buttons */}
              <div className="space-y-3">
                {!gameState.submissionStatus?.success && (
                  <button
                    onClick={handleSubmitScore}
                    disabled={completionState.isSubmitting}
                    className="w-full bg-emerald-500 text-white py-3 px-4 rounded-lg hover:bg-emerald-600 transition-colors disabled:bg-emerald-300"
                  >
                    {completionState.isSubmitting
                      ? "Processing..."
                      : "Submit Score"}
                  </button>
                )}
                <button
                  onClick={() =>
                    setCompletionState((prev) => ({
                      ...prev,
                      showingOptions: false,
                    }))
                  }
                  className="w-full bg-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 text-center">
            <a
              href={`https://twitter.com/intent/tweet?text=${tweetText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-6 py-3 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors mt-4"
            >
              Share on Twitter
            </a>
          </div>

          {gameState.level === 3 && (
            <div className="mt-6 text-center animate-fade-in">
              <h3 className="text-xl font-bold text-emerald-600 mb-2">
                🎉 Congratulations! You&apos;ve Completed Remenguiny!
              </h3>
              <p className="text-gray-600">
                You&apos;ve mastered all levels of Remenguiny!
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Show welcome screen only if game hasn't started
  if (!gameState.gameStarted) {
    return (
      <div className="game-container">
        <div className="game-info">
          <h2 className="text-2xl font-bold mb-2">
            {gameState.level === 1
              ? "Welcome to Remenguiny"
              : `Ready for Level ${gameState.level}?`}
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            {gameState.level === 1
              ? "Start playing now! Connect your wallet to submit scores to the leaderboard."
              : "Keep going! You're doing great!"}
          </p>
          <button
            onClick={handleStartGame}
            className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors mb-4"
          >
            {gameState.level === 1 ? "Start Game" : "Continue Game"}
          </button>
          <LeaderboardDisplay refreshKey={gameState.leaderboardKey} />
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <NetworkCheck>
        {gameState.gameStarted && (
          <>
            <MiniLeaderboard level={gameState.level} />
            <CommentaryOverlay
              clicks={gameState.clicks}
              level={gameState.level}
              matches={matchCount}
            />
          </>
        )}

        <div className="game-info">
          <h2 className="text-2xl font-bold mb-2">Level {gameState.level}</h2>
          <div className="mb-2">Clicks: {gameState.clicks}</div>
          <div className="mb-4 text-gray-600">
            {gameState.level === 1
              ? "Find matching pairs of penguins. Click two tiles to reveal them."
              : gameState.level === 2
              ? "Find triplets of matching penguins. Watch out for yetis!"
              : "Final Challenge: Find all pairs while avoiding TWO yetis! Watch out - they'll reset your progress!"}
          </div>
          {!gameState.gameStarted && (
            <>
              <button
                onClick={handleStartGame}
                className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors mb-4"
              >
                Start Game
              </button>
              <LeaderboardDisplay refreshKey={gameState.leaderboardKey} />
            </>
          )}
        </div>

        {/* Add back the game grid */}
        {gameState.gameStarted && (
          <div
            className="game-grid"
            style={{
              gridTemplateColumns: `repeat(${
                LEVEL_CONFIG[gameState.level as GameLevel].cols
              }, 1fr)`,
            }}
          >
            {gameState.tiles.map((tile: Tile) => (
              <div
                key={tile.id}
                onClick={() => handleTileClick(tile.id)}
                data-wrong-attempts={gameState.wrongAttempts[tile.id] || 0}
                className={`game-tile 
                  ${tile.revealed || tile.matched ? "revealed" : ""} 
                  ${tile.matched ? "matched" : ""}
                  ${
                    !tile.matched && gameState.wrongAttempts[tile.id] > 2
                      ? "animate-wrong-match-severe"
                      : ""
                  }
                  ${
                    !tile.matched && gameState.wrongAttempts[tile.id] === 2
                      ? "animate-wrong-match"
                      : ""
                  }
                `}
              >
                {(tile.revealed || tile.matched) && (
                  <Image
                    src={`/images/penguin${tile.value}.png`}
                    alt={`Penguin ${tile.value}`}
                    width={150}
                    height={150}
                    className={`penguin-image ${tile.matched ? "matched" : ""}`}
                    priority={true}
                    loading="eager"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </NetworkCheck>

      {gameState.showYeti && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg text-center">
            <Image
              src="/images/penguin8.png"
              alt="Yeti"
              width={200}
              height={200}
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
              className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Continue Playing
            </button>
          </div>
        </div>
      )}

      {gameState.showCelebration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          {handleCelebrationActions()}
        </div>
      )}

      {renderHints()}
    </div>
  );
};

export default MemoryGame;
