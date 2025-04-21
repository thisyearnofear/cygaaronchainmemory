// Script to deploy CYGAAR test token and distributor contracts on Abstract Testnet

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Load environment variables (create a .env file with these variables)
require("dotenv").config();

// Configuration
const config = {
  rpcUrl: "https://api.testnet.abs.xyz", // Abstract testnet RPC
  privateKey: process.env.PRIVATE_KEY, // Your deployer wallet private key
  penguinGameAddress: "0xB945d267eab7EfAe0b41253F50D690DBe712702C", // Existing game contract
};

// Contract addresses will be populated during deployment
const addresses = {
  token: null,
  distributor: null,
};

// Function to compile contracts using Solc
async function compileContracts() {
  console.log("Compiling contracts...");

  const solc = require("solc");

  // Read contract sources
  const tokenSource = fs.readFileSync(
    path.resolve(__dirname, "../CygaarTestToken.sol"),
    "utf8"
  );
  const distributorSource = fs.readFileSync(
    path.resolve(__dirname, "../CygaarDistributor.sol"),
    "utf8"
  );

  // Prepare input for solc compiler
  const input = {
    language: "Solidity",
    sources: {
      "CygaarTestToken.sol": { content: tokenSource },
      "CygaarDistributor.sol": { content: distributorSource },
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"],
        },
      },
    },
  };

  // Compile contracts
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  return {
    tokenAbi: output.contracts["CygaarTestToken.sol"].CygaarTestToken.abi,
    tokenBytecode:
      output.contracts["CygaarTestToken.sol"].CygaarTestToken.evm.bytecode
        .object,
    distributorAbi:
      output.contracts["CygaarDistributor.sol"].CygaarDistributor.abi,
    distributorBytecode:
      output.contracts["CygaarDistributor.sol"].CygaarDistributor.evm.bytecode
        .object,
  };
}

// Function to deploy contracts
async function deployContracts(
  tokenAbi,
  tokenBytecode,
  distributorAbi,
  distributorBytecode
) {
  console.log("Deploying contracts...");

  // Connect to provider and create wallet
  const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(config.privateKey, provider);

  // Get wallet info
  const balance = await wallet.getBalance();
  console.log(`Deploying from address: ${wallet.address}`);
  console.log(`Account balance: ${ethers.utils.formatEther(balance)} ETH`);

  // Deploy token contract
  console.log("\n1. Deploying CYGAAR Test Token contract...");
  const tokenFactory = new ethers.ContractFactory(
    tokenAbi,
    tokenBytecode,
    wallet
  );
  const tokenContract = await tokenFactory.deploy();
  await tokenContract.deployed();

  console.log(`CYGAAR Test Token deployed to: ${tokenContract.address}`);
  addresses.token = tokenContract.address;

  // Deploy distributor contract
  console.log("\n2. Deploying CYGAAR Distributor contract...");
  const distributorFactory = new ethers.ContractFactory(
    distributorAbi,
    distributorBytecode,
    wallet
  );
  const distributorContract = await distributorFactory.deploy();
  await distributorContract.deployed();

  console.log(`CYGAAR Distributor deployed to: ${distributorContract.address}`);
  addresses.distributor = distributorContract.address;

  return { tokenContract, distributorContract };
}

// Function to initialize contracts
async function initializeContracts(tokenContract, distributorContract) {
  console.log("\n3. Initializing Distributor contract...");

  // Initialize distributor contract with token and game addresses
  const initTx = await distributorContract.initialize(
    addresses.token,
    config.penguinGameAddress
  );
  await initTx.wait();

  console.log("Distributor initialized with:");
  console.log(`- Token contract: ${addresses.token}`);
  console.log(`- Game contract: ${config.penguinGameAddress}`);

  // Add distributor as a minter
  console.log("\n4. Granting minter role to distributor...");
  const addMinterTx = await tokenContract.addMinter(addresses.distributor);
  await addMinterTx.wait();

  console.log(`Minter role granted to: ${addresses.distributor}`);

  // Activate distribution
  console.log("\n5. Activating distribution...");
  const activateTx = await distributorContract.setDistributionActive(true);
  await activateTx.wait();

  console.log("Distribution activated");
}

// Function to check contract state
async function verifyContractState(tokenContract, distributorContract) {
  console.log("\n6. Verifying contract state...");

  // Check token supply
  const totalSupply = await tokenContract.totalSupply();
  console.log(
    `Total supply: ${ethers.utils.formatEther(totalSupply)} CYGAAR-TEST`
  );

  // Check token owner balance
  const owner = await tokenContract.owner();
  const ownerBalance = await tokenContract.balanceOf(owner);
  console.log(
    `Owner (${owner}) balance: ${ethers.utils.formatEther(
      ownerBalance
    )} CYGAAR-TEST`
  );

  // Check if distributor is a minter
  const isMinter = await tokenContract.minters(addresses.distributor);
  console.log(`Distributor is minter: ${isMinter}`);

  // Check if distribution is active
  const isActive = await distributorContract.distributionActive();
  console.log(`Distribution active: ${isActive}`);

  // Check penguin game contract
  const gameAddress = await distributorContract.penguinGame();
  console.log(`Game contract: ${gameAddress}`);

  // Check token contract
  const tokenAddress = await distributorContract.cygaarToken();
  console.log(`Token contract: ${tokenAddress}`);
}

// Save deployment info to file
function saveDeploymentInfo() {
  console.log("\n7. Saving deployment info...");

  const deploymentInfo = {
    network: config.rpcUrl,
    addresses: addresses,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.resolve(__dirname, "../deployment-info.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment info saved to deployment-info.json");
}

// Generate frontend config
function generateFrontendConfig() {
  console.log("\n8. Generating frontend config...");

  // Create a config file for the frontend
  const frontendConfig = `// Auto-generated by deployment script
// Last updated: ${new Date().toISOString()}

export const CYGAAR_ADDRESSES = {
  TOKEN_ADDRESS: "${addresses.token}",
  DISTRIBUTOR_ADDRESS: "${addresses.distributor}",
  PENGUIN_GAME_ADDRESS: "${config.penguinGameAddress}",
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
`;

  fs.writeFileSync(
    path.resolve(__dirname, "../../src/lib/tokenConfig.ts"),
    frontendConfig
  );

  console.log("Frontend config generated at src/lib/tokenConfig.ts");
}

// Main function
async function main() {
  try {
    console.log("=== CYGAAR TESTNET DEPLOYMENT ===\n");

    // Validate that private key is provided
    if (!config.privateKey) {
      throw new Error(
        "Private key is required. Set the PRIVATE_KEY environment variable."
      );
    }

    // Compile contracts
    const { tokenAbi, tokenBytecode, distributorAbi, distributorBytecode } =
      await compileContracts();

    // Deploy contracts
    const { tokenContract, distributorContract } = await deployContracts(
      tokenAbi,
      tokenBytecode,
      distributorAbi,
      distributorBytecode
    );

    // Initialize contracts
    await initializeContracts(tokenContract, distributorContract);

    // Verify contract state
    await verifyContractState(tokenContract, distributorContract);

    // Save deployment info
    saveDeploymentInfo();

    // Generate frontend config
    generateFrontendConfig();

    console.log("\n=== DEPLOYMENT SUMMARY ===");
    console.log(`CYGAAR Test Token: ${addresses.token}`);
    console.log(`CYGAAR Distributor: ${addresses.distributor}`);
    console.log(`Penguin Game: ${config.penguinGameAddress}`);
    console.log("\nNext steps:");
    console.log("1. Verify contracts on the Abstract testnet explorer");
    console.log("2. Test token claiming with a few addresses");
    console.log("3. Update the frontend with the new contract addresses");
  } catch (error) {
    console.error("Error during deployment:", error);
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
