// Script to batch distribute CYGAAR tokens to all players

const { ethers } = require("ethers");

// Contract ABIs (simplified for this example)
const PENGUIN_GAME_ABI = [
  "function getUniquePlayersCount(uint8 level) external view returns (uint256)",
  "function getLeaderboard(uint8 level) external view returns (tuple(address player, uint32 score)[])",
  "function getPlayerLevelStats(address player, uint8 level) external view returns (uint32 bestScore, uint32 timesCompleted, uint64 lastCompletedAt)",
];

const CYGAAR_DISTRIBUTOR_ABI = [
  "function adminDistribute(address player) external",
  "function calculateRewards(address player) external view returns (uint256)",
  "function hasClaimed(address player) external view returns (bool)",
];

// Configuration (should be updated with the actual deployed addresses)
const config = {
  rpcUrl: "https://api.testnet.abs.xyz", // Abstract testnet
  penguinGameAddress: "0xB945d267eab7EfAe0b41253F50D690DBe712702C",
  distributorAddress: "0x...", // Update with actual distributor address
  privateKey: "", // Add owner/admin private key here
};

// Main function
async function batchDistributeTokens() {
  // Initialize provider and signer
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(config.privateKey, provider);

  // Connect to contracts
  const penguinGame = new ethers.Contract(
    config.penguinGameAddress,
    PENGUIN_GAME_ABI,
    wallet
  );
  const distributor = new ethers.Contract(
    config.distributorAddress,
    CYGAAR_DISTRIBUTOR_ABI,
    wallet
  );

  console.log("Starting batch distribution...");

  // Collect all unique players across all levels
  const uniquePlayers = new Set();

  // Process each level
  for (let level = 1; level <= 3; level++) {
    console.log(`Fetching players for level ${level}...`);

    // Get leaderboard for this level
    const leaderboard = await penguinGame.getLeaderboard(level);

    // Add all players to the unique set
    leaderboard.forEach((entry) => {
      uniquePlayers.add(entry.player);
    });

    console.log(`Found ${leaderboard.length} players for level ${level}`);
  }

  console.log(`Total unique players found: ${uniquePlayers.size}`);
  console.log("--------------------------------------");

  // Process distribution for each player
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const player of uniquePlayers) {
    try {
      // Check if player has already claimed
      const hasClaimed = await distributor.hasClaimed(player);

      if (hasClaimed) {
        console.log(`Skipping ${player} - already claimed`);
        skipCount++;
        continue;
      }

      // Calculate reward amount for reporting
      const rewardAmount = await distributor.calculateRewards(player);
      const rewardEth = ethers.utils.formatEther(rewardAmount);

      // Distribute tokens
      console.log(`Distributing ${rewardEth} CYGAAR to ${player}...`);
      const tx = await distributor.adminDistribute(player);
      await tx.wait();

      console.log(
        `Success: ${player} received ${rewardEth} CYGAAR (tx: ${tx.hash})`
      );
      successCount++;
    } catch (error) {
      console.error(`Error distributing to ${player}: ${error.message}`);
      errorCount++;
    }

    // Add a small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Print summary
  console.log("--------------------------------------");
  console.log("Distribution complete!");
  console.log(`Successfully distributed to: ${successCount} players`);
  console.log(`Skipped (already claimed): ${skipCount} players`);
  console.log(`Errors: ${errorCount} players`);
}

// Run the script
batchDistributeTokens()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
