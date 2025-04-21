// Script to deploy CYGAAR token and distributor contracts on Abstract

const { Wallet } = require("zksync-ethers");
const { HardhatRuntimeEnvironment } = require("hardhat/types");
const { Deployer } = require("@matterlabs/hardhat-zksync");
const { vars } = require("hardhat/config");

// An example of a deploy script that will deploy and call a simple contract.
async function main(hre) {
  console.log(`Running deploy script for CYGAAR tokens`);

  // Initialize the wallet using your private key.
  const wallet = new Wallet(vars.get("DEPLOYER_PRIVATE_KEY"));
  const deployer = new Deployer(hre, wallet);

  // Step 1: Deploy the CYGAAR token contract
  console.log(`Deploying CYGAAR token contract...`);
  const cygaarTokenArtifact = await deployer.loadArtifact("CygaarToken");
  const cygaarToken = await deployer.deploy(cygaarTokenArtifact);
  const tokenAddress = await cygaarToken.getAddress();
  console.log(`CYGAAR token deployed to: ${tokenAddress}`);

  // Wait a moment before deploying the distributor
  await new Promise((r) => setTimeout(r, 2000));

  // Step 2: Deploy the CygaarDistributor contract
  console.log(`Deploying CYGAAR distributor contract...`);
  const distributorArtifact = await deployer.loadArtifact("CygaarDistributor");
  const distributor = await deployer.deploy(distributorArtifact);
  const distributorAddress = await distributor.getAddress();
  console.log(`CYGAAR distributor deployed to: ${distributorAddress}`);

  // Wait a moment before initializing
  await new Promise((r) => setTimeout(r, 2000));

  // Step 3: Initialize the distributor with the token and game contract addresses
  console.log(`Initializing distributor...`);
  const PENGUIN_GAME_ADDRESS = "0xB945d267eab7EfAe0b41253F50D690DBe712702C";
  const initTx = await distributor.initialize(
    tokenAddress,
    PENGUIN_GAME_ADDRESS
  );
  await initTx.wait();
  console.log(`Distributor initialized with:
  - Token: ${tokenAddress}
  - Game: ${PENGUIN_GAME_ADDRESS}`);

  // Step 4: Grant the distributor contract minting permissions
  console.log(`Setting up minting permissions...`);
  const mintTx = await cygaarToken.addMinter(distributorAddress);
  await mintTx.wait();
  console.log(`Minter role granted to distributor: ${distributorAddress}`);

  // Step 5: Activate distribution
  console.log(`Activating token distribution...`);
  const activateTx = await distributor.setDistributionActive(true);
  await activateTx.wait();
  console.log(`Distribution activated`);

  console.log(`
=========== DEPLOYMENT SUMMARY ===========
CYGAAR Token:       ${tokenAddress}
CYGAAR Distributor: ${distributorAddress}
Game Contract:      ${PENGUIN_GAME_ADDRESS}
Distribution:       ACTIVE
=========================================

Next steps:
1. Run verification commands for both contracts
2. Test token distribution with a few accounts
3. Execute batch distribution when ready
`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
module.exports = main;

if (require.main === module) {
  const { run } = require("hardhat");

  run("deploy-zksync", {
    script: __filename,
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
