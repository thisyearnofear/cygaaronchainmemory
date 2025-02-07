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
  "You've got this! Every click counts! 🐧",
  "Take your time, you're doing great! ✨",
  "Those matching skills are getting better! 🎯",
  "You're learning fast! Keep it up! 🌟",
  "Don't mind Cygaar, you're doing fine! 💪",
  "Focus and believe in yourself! 🎮",
  "That's the spirit! Keep going! 🚀",
  "Every master was once a beginner! 📚",
  "You're getting the hang of it! 🎯",
  "Practice makes perfect! 🌈",
  "Keep that concentration going! 🧠",
  "You're on the right track! 🛤️",
  "Each click brings you closer to victory! 🎯",
  "Your memory skills are growing stronger! 💪",
  "I believe in you, keep going! ⭐",
  "You're getting better with every match! 🌟",
  "That's the way to do it! 🎮",
  "You're a natural at this! 🏆",
  "Keep that focus going! 🧠",
  "You've got this rhythm down! 🎵",
  "WAGMI with those memory skills! 🚀",
  "Your brain is more liquid than a DEX! 💧",
  "Bullish on your progress! 📈",
  "You're as stable as a blue chip! 💎",
  "Staking your claim on the leaderboard! 🏆",
  "Your memory's stronger than cold storage! 🧊",
  "Building blocks of success, just like L2s! 🏗️",
  "More reliable than mainnet gas fees! ⛽",
  "Scaling better than zkSync! ⚡",
  "Your skills are mooning! 🌕",
  "Diamond hands, diamond mind! 💎🧠",
  "Proof of Memory in action! ✨",
] as const;

const LUCA_MATCH_COMMENTS = [
  "Nice match! Keep that momentum! 🚀",
  "You're crushing it! 🎮",
  "That's how it's done! 🎯",
] as const;

// Update and expand Cygaar's comments
const CYGAAR_GENERAL_COMMENTS = [
  "imagine taking this many clicks... my pet rock could do better 💀",
  "anon discovers memory game, gets rekt 📸",
  "ser... this is painful to watch 🫣",
  "ngmi with those memory skills fren 🥱",
  "maybe stick to finger painting? 🎨",
  "skill issue detected, initiating copium protocol 🤖",
  "anon pls... my grandma's goldfish plays better 🐠",
  "watching paint dry would be more exciting 🎯",
  "certified smol brain moment 🧠",
  "copium levels reaching ATH 📈",
  "have you tried turning your brain on and off again? 🔄",
  "memory.exe has stopped working 💻",
  "this is why we can't have nice things 🤦‍♂️",
  "my toaster has better memory than this 🍞",
  "even my pet rock's highscore is better than this 🪨",
  "ser... have you tried using your brain? 🤔",
  "watching paint dry would be more exciting 🎨",
  "certified smol brain moment 🧠",
  "anon discovers memory game, instantly regrets 📸",
  "this is peak comedy right here 🎭",
  "your memory is as reliable as eth gas fees ⛽",
  "ngmi with those memory skills fren 🥱",
  "maybe stick to rock paper scissors? ✂️",
  "404: memory not found 🔍",
  "have you considered a career in professional clicking? 🖱️",
  "this is why we can't have nice things 🤦‍♂️",
  "ngmi with that memory ser 📉",
  "more rugs than a carpet store 🤦‍♂️",
  "paper hands, paper brain 📜",
  "down bad worse than ICO investors 💸",
  "ser... have you tried turning your brain off and on? 🔄",
  "getting rekt harder than leverage traders 📊",
  "more lost than eth in a wrong address 💀",
  "your brain running on solana? 🐌",
  "getting rugged by your own memory 🏃‍♂️",
  "this is why we stick to hodling 💎",
  "more gas spent than an eth whale 🐋",
  "your brain needs a hard fork 🍴",
  "getting frontrun by a yeti 🦍",
  "ser... this is a casino 🎰",
  "few understand (your gameplay) 🤔",
  "probably nothing (your score) 👀",
  "more bearish than 2018 💔",
  "ngmi harder than safemoon 🌚",
] as const;

const CYGAAR_LEVEL2_COMMENTS = [
  "pfft... try finding triplets, pleb 😏",
  "triplets too hard for you? 🎯",
  "3 is more than 2, anon 🧮",
  "imagine getting rekt by triplets 💀",
  "yeti got your tongue? 🦍",
] as const;

// Update and expand comments for Level 3
const LEVEL3_COMMENTS = [
  "Double the yetis, double the fun! 🦍🦍",
  "Keep those pairs coming! 🎯",
  "Yetis to the left of me, yetis to the right... 👀",
  "Memory master in training! 🧠",
  "Those yetis look extra grumpy today... 😅",
  "Remember where those yetis are! 🗺️",
  "Steady hands, steady mind! 🎮",
  "One pair at a time... you got this! 🎲",
  "The yetis are watching your every move... 👁️",
  "Almost there, don't let the yetis win! 🎯",
  "This is the final boss of memory games! 🏰",
  "Show those yetis who's boss! 💪",
] as const;

const LEVEL3_YETI_COMMENTS = [
  "Two yetis?! This is getting serious! 🦍",
  "Double trouble with these yetis! ⚠️",
  "Watch your step, twice the yetis! 🚨",
  "One yeti was bad enough... 😱",
  "The dynamic duo strikes again! 🦍🦍",
  "These yetis mean business! 💪",
] as const;

const LEVEL3_PROGRESS_COMMENTS = [
  "You're getting good at this! 🌟",
  "Keep that momentum going! 🚀",
  "The yetis can't stop you! 💪",
  "Memory skills over 9000! 📈",
  "You're making this look easy! 🎮",
  "The leaderboard awaits! 🏆",
] as const;

// Add to your existing comments array
const PROMOTIONAL_COMMENTS = [
  {
    image: "/images/penguin10.png",
    name: "Luca",
    comment: "Did you hear? Top 3 players win CryptoTester NFTs! 🏆",
    priority: true,
  },
  {
    image: "/images/penguin9.png",
    name: "Cygaar",
    comment: "imagine not tweeting for free $CYGAAR... ngmi 💀",
    priority: true,
  },
  {
    image: "/images/penguin10.png",
    name: "Luca",
    comment: "Tweet your score for a chance at the $CYGAAR airdrop! 🎉",
    priority: true,
  },
] as const;

// Helper functions outside component
const getRandomComment = (comments: readonly string[]) =>
  comments[Math.floor(Math.random() * comments.length)];

const getRandomBoolean = () => Math.random() > 0.5;

// Add type for getComment function
type GetCommentFunction = () => CommentaryType | null;

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
    const [isRightSide, setIsRightSide] = useState(true);
    const [isVisible, setIsVisible] = useState(true);

    const getComment: GetCommentFunction = useCallback(() => {
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

        // Regular gameplay comments with better pacing
        if (clicks > 6 && clicks % 8 === 0) {
          // Changed from 12 to 8 for more frequent comments
          const isLuca = Math.random() > 0.4; // 60% Luca, 40% Cygaar for better balance
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
              "Welcome to the final challenge! Find all pairs, but beware of TWO yetis!",
            priority: true,
          };
        }

        if (clicks > 6 && clicks % 8 === 0) {
          const commentType = Math.floor(Math.random() * 3); // 0, 1, or 2
          const isLuca = getRandomBoolean();

          return {
            image: isLuca ? "/images/penguin10.png" : "/images/penguin9.png",
            name: isLuca ? "Luca" : "Cygaar",
            comment: getRandomComment(
              commentType === 0
                ? LEVEL3_COMMENTS
                : commentType === 1
                ? LEVEL3_YETI_COMMENTS
                : LEVEL3_PROGRESS_COMMENTS
            ),
            priority: true,
          };
        }

        // Add special comments for match streaks
        if (matches > 0 && matches % 2 === 0) {
          return {
            image: "/images/penguin10.png",
            name: "Luca",
            comment: "Great memory! Keep those pairs coming! 🎯",
            priority: true,
          };
        }
      }

      // Add to your getComment function
      if (clicks === 1 || clicks === 20 || clicks === 40) {
        return PROMOTIONAL_COMMENTS[
          Math.floor(Math.random() * PROMOTIONAL_COMMENTS.length)
        ];
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
        setIsVisible(true);
        setLastCommentAt({
          clicks,
          matches,
          timestamp: Date.now(),
        });
      }
    }, [clicks, matches, getComment, getRandomPosition]);

    if (!currentComment || !isVisible) return null;

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
          flexDirection: isRightSide ? "row" : "row-reverse",
        }}
      >
        <div
          className={`bg-white/90 p-4 rounded-lg shadow-lg relative speech-bubble group ${
            isRightSide ? "speech-bubble-right" : "speech-bubble-left"
          }`}
          onClick={() => setIsRightSide(!isRightSide)}
        >
          <button
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
            }}
          >
            ✕
          </button>
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
