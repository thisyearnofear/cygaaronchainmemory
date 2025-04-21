import { ethers } from "ethers";

export const CygaarDistributor = {
  abi: [
    "function initialize(address,address)",
    "function setDistributionActive(bool)",
    "function distributionActive() view returns(bool)",
    "function penguinGame() view returns(address)",
    "function cygaarToken() view returns(address)",
    "function claimCount() view returns(uint256)",
    "function claimers(uint256) view returns(address)",
    "function claimTokens()",
  ],
  bytecode: "0x...", // This will be filled in during deployment
};
