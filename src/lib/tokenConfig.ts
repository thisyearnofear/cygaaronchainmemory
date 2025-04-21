// CYGAAR Token Configuration
// Abstract Testnet Configuration

export const CYGAAR_ADDRESSES = {
  // The existing CYGAAR token contract address
  TOKEN_ADDRESS: "0x35EfA4699EdD7b468CBBf4FfF7B6e7AFC0A7aDa6",

  // The CYGAAR distributor contract address (will be set after deployment)
  DISTRIBUTOR_ADDRESS: "0xYourDistributorAddressHere",

  // The existing Penguin Game contract address
  PENGUIN_GAME_ADDRESS: "0xB945d267eab7EfAe0b41253F50D690DBe712702C",
};

// Default token rewards (matching with contract values)
export const TOKEN_REWARDS = {
  // Base reward for completing a level
  BASE_REWARD: 100,

  // Bonus for top 10 leaderboard positions
  TOP_LEADERBOARD_BONUS: 50,

  // Bonus for perfect scores (minimum clicks)
  PERFECT_SCORE_BONUS: 100,

  // Bonus for completing all 3 levels
  ALL_LEVELS_BONUS: 200,
};

// Total tokens in distribution
export const TOTAL_DISTRIBUTION = 1_000_000;

// Abstract Testnet Explorer URL
export const EXPLORER_URL = "https://sepolia.abscan.org/tx/";

// Abstract Testnet RPC URL
export const RPC_URL = "https://api.testnet.abs.xyz";

// Abstract Testnet Chain ID
export const CHAIN_ID = 11124;
