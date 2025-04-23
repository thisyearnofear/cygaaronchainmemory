// CYGAAR Token Configuration
// Abstract Testnet Configuration

import { abstractTestnet } from "./chains";

export const CYGAAR_ADDRESSES = {
  // The test CYGAAR token contract address
  TOKEN_ADDRESS: "0x8a24191DED3dF3E06a5F05E93FEFF79452a52f86",

  // The CYGAAR distributor contract address
  DISTRIBUTOR_ADDRESS: "0x6E2b55aA7aCdD234C39CE8470D7656Da738e3AFe",

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
export const EXPLORER_URL = abstractTestnet.blockExplorers.default.url + "/tx/";

// Abstract Testnet RPC URL
export const RPC_URL = abstractTestnet.rpcUrls.default.http[0];

// Abstract Testnet Chain ID
export const CHAIN_ID = abstractTestnet.id;
