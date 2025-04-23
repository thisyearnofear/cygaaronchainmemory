export const CygaarTestToken = {
  abi: [
    "function totalSupply() view returns(uint256)",
    "function balanceOf(address) view returns(uint256)",
    "function transfer(address,uint256) returns(bool)",
    "function mint(address,uint256)",
    "function burn(uint256)",
    "function addMinter(address)",
    "function removeMinter(address)",
    "function minters(address) view returns(bool)",
  ],
  bytecode: "0x...", // This will be filled in during deployment
};
