// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CygaarTestToken is ERC20, Ownable {
    // Mapping of addresses that can mint tokens
    mapping(address => bool) public minters;
    
    // Total supply cap
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10**18; // 1M tokens with 18 decimals

    constructor() ERC20("CYGAAR Test Token", "CYGAAR-TEST") {
        // Initial supply of 1M tokens to the deployer
        _mint(msg.sender, MAX_SUPPLY);
    }

    // Function to add a minter
    function addMinter(address _minter) external onlyOwner {
        minters[_minter] = true;
    }

    // Function to remove a minter
    function removeMinter(address _minter) external onlyOwner {
        minters[_minter] = false;
    }

    // Function to mint tokens (only callable by minters)
    function mint(address _to, uint256 _amount) external {
        require(minters[msg.sender], "Only minters can mint");
        require(totalSupply() + _amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(_to, _amount);
    }

    // Function to burn tokens
    function burn(uint256 _amount) external {
        _burn(msg.sender, _amount);
    }
} 