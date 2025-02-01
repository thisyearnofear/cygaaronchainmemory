import React, { memo, useEffect, useState, useCallback } from "react";
import Image from "next/image";

interface CommentaryOverlayProps {
  clicks: number;
  level: number;
  matches?: number;
}

interface CommentaryType {
  image: string;
  name: string;
  comment: string;
  priority: boolean;
}

// Move constants outside component to prevent recreation
const LUCA_EARLY_COMMENTS = [
  "You've got this! 🐧",
  "Great start, keep going! ✨",
  "Look at those matching skills! 🎯",
  "You're a natural at this! 🌟",
] as const;

const LUCA_MATCH_COMMENTS = [
  "Nice match! Keep that momentum! 🚀",
  "You're crushing it! 🎮",
  "That's how it's done! 🎯",
] as const;

// Update and expand Cygaar's comments
const CYGAAR_GENERAL_COMMENTS = [
  "imagine taking this many clicks 🥱",
  "my grandma could do better... and she's a penguin 🐧",
  "ser... are you even trying? 💀",
  "ngmi with those moves 😴",
  "skill issue detected 📸",
  "anon pls... 🫣",
  "maybe try candy crush instead? 🍬",
] as const;

const CYGAAR_LEVEL2_COMMENTS = [
  "pfft... try finding triplets, pleb 😏",
  "triplets too hard for you? 🎯",
  "3 is more than 2, anon 🧮",
  "imagine getting rekt by triplets 💀",
  "yeti got your tongue? 🦍",
] as const;

// Update and expand comments for Level 3
const LEVEL3_PAIR_COMMENTS = [
  "Find those pairs first! 👀",
  "Two by two, that's how we do! 🎯",
  "Pairs before triplets, smart strategy! 🧠",
] as const;

const LEVEL3_TRIPLET_COMMENTS = [
  "Now for the triplets! 🎲",
  "Three's company! 🎯",
  "Triple or nothing! 🎲",
] as const;

const LEVEL3_YETI_DODGE = [
  "Careful with those yetis! 🦍",
  "Yetis are getting restless! ⚠️",
  "Watch your step! 🚨",
] as const;

// Helper functions outside component
const getRandomComment = (comments: readonly string[]) =>
  comments[Math.floor(Math.random() * comments.length)];

const getRandomBoolean = () => Math.random() > 0.5;

const CommentaryOverlay: React.FC<CommentaryOverlayProps> = memo(
  function CommentaryOverlay({ clicks, level, matches = 0 }) {
    const [key, setKey] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [currentComment, setCurrentComment] = useState<CommentaryType | null>(
      null
    );
    const [lastCommentAt, setLastCommentAt] = useState({
      clicks: 0,
      matches: 0,
      timestamp: 0,
    });

    const getComment = useCallback(() => {
      const now = Date.now();
      const timeSinceLastComment = now - lastCommentAt.timestamp;
      const minimumInterval = 5000;

      if (timeSinceLastComment < minimumInterval) return null;

      // Level 1 Commentary Logic
      if (level === 1) {
        // Early game encouragement
        if (clicks === 6) {
          return {
            image: "/images/penguin10.png",
            name: "Luca",
            comment: getRandomComment(LUCA_EARLY_COMMENTS),
            priority: true,
          };
        }

        // First match celebration
        if (matches === 1 && lastCommentAt.matches === 0) {
          return {
            image: "/images/penguin10.png",
            name: "Luca",
            comment: getRandomComment(LUCA_MATCH_COMMENTS),
            priority: true,
          };
        }

        // Regular gameplay comments
        if (clicks > 6 && clicks % 12 === 0) {
          const isLuca = getRandomBoolean();
          return {
            image: isLuca ? "/images/penguin10.png" : "/images/penguin9.png",
            name: isLuca ? "Luca" : "Cygaar",
            comment: isLuca
              ? getRandomComment(LUCA_EARLY_COMMENTS)
              : getRandomComment(CYGAAR_GENERAL_COMMENTS),
            priority: true,
          };
        }
      }

      // Level 2 Commentary Logic
      if (level === 2 && clicks > 0 && clicks % 15 === 0) {
        const useLevel2Comment = clicks < 30 || getRandomBoolean();
        return {
          image: "/images/penguin9.png",
          name: "Cygaar",
          comment: useLevel2Comment
            ? getRandomComment(CYGAAR_LEVEL2_COMMENTS)
            : getRandomComment(CYGAAR_GENERAL_COMMENTS),
          priority: true,
        };
      }

      // Level 3 Commentary Logic
      if (level === 3) {
        if (clicks === 6) {
          return {
            image: "/images/penguin10.png",
            name: "Luca",
            comment:
              "Welcome to the final challenge! Find pairs first, then triplets!",
            priority: true,
          };
        }

        // Phase-specific comments
        if (clicks > 6 && clicks % 10 === 0) {
          const isLuca = getRandomBoolean();
          if (isLuca) {
            return {
              image: "/images/penguin10.png",
              name: "Luca",
              comment: getRandomComment(
                gameState.phase === "pairs"
                  ? LEVEL3_PAIR_COMMENTS
                  : LEVEL3_TRIPLET_COMMENTS
              ),
              priority: true,
            };
          } else {
            return {
              image: "/images/penguin9.png",
              name: "Cygaar",
              comment: getRandomComment(LEVEL3_YETI_DODGE),
              priority: true,
            };
          }
        }
      }

      return null;
    }, [clicks, level, matches, lastCommentAt]);

    const getRandomPosition = useCallback(() => {
      const viewportWidth = Math.min(window.innerWidth, 800);
      const viewportHeight = window.innerHeight;
      const safeX = Math.floor(Math.random() * (viewportWidth - 300) + 150);
      const safeY = Math.floor(Math.random() * (viewportHeight - 200) + 100);

      return {
        x: (safeX / viewportWidth) * 100,
        y: (safeY / viewportHeight) * 100,
      };
    }, []);

    useEffect(() => {
      const newComment = getComment();
      if (newComment?.priority) {
        setPosition(getRandomPosition());
        setKey((prev) => prev + 1);
        setCurrentComment(newComment);
        setLastCommentAt({
          clicks,
          matches,
          timestamp: Date.now(),
        });
      }
    }, [clicks, matches, getComment, getRandomPosition]);

    if (!currentComment) return null;

    return (
      <div
        key={key}
        className="fixed flex items-end gap-3 animate-pop-in z-[100]"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: "translate(-50%, -50%)",
          maxWidth: "calc(100vw - 40px)",
          maxHeight: "calc(100vh - 40px)",
        }}
      >
        <div className="bg-white/90 p-4 rounded-lg shadow-lg relative speech-bubble">
          <div className="text-sm font-bold mb-1">{currentComment.name}</div>
          <div className="text-sm">{currentComment.comment}</div>
        </div>
        <Image
          src={currentComment.image}
          alt={currentComment.name}
          width={70}
          height={70}
          className="rounded-full animate-bounce-gentle"
          priority
        />
      </div>
    );
  }
);

export default CommentaryOverlay;
