// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CygaarToken
 * @dev ERC20 Token for the Penguin Memory Game
 */
contract CygaarToken {
    // Token details
    string public name = "CYGAAR";
    string public symbol = "CYGAAR";
    uint8 public decimals = 18;
    uint256 private _totalSupply;
    
    // Owner and minter addresses
    address public owner;
    mapping(address => bool) public minters;
    
    // Balances and allowances
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    
    // Custom errors
    error Unauthorized();
    error InsufficientBalance();
    error InsufficientAllowance();
    error ZeroAddress();
    
    // Constructor
    constructor() {
        owner = msg.sender;
        minters[msg.sender] = true;
    }
    
    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }
    
    modifier onlyMinter() {
        if (!minters[msg.sender]) revert Unauthorized();
        _;
    }
    
    // View functions
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }
    
    function allowance(address owner_, address spender) external view returns (uint256) {
        return _allowances[owner_][spender];
    }
    
    // Transfer functions
    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (_allowances[from][msg.sender] < amount) revert InsufficientAllowance();
        
        _approve(from, msg.sender, _allowances[from][msg.sender] - amount);
        _transfer(from, to, amount);
        return true;
    }
    
    // Internal transfer implementation
    function _transfer(address from, address to, uint256 amount) internal {
        if (from == address(0) || to == address(0)) revert ZeroAddress();
        if (_balances[from] < amount) revert InsufficientBalance();
        
        _balances[from] -= amount;
        _balances[to] += amount;
        
        emit Transfer(from, to, amount);
    }
    
    // Internal approve implementation
    function _approve(address owner_, address spender, uint256 amount) internal {
        if (owner_ == address(0) || spender == address(0)) revert ZeroAddress();
        
        _allowances[owner_][spender] = amount;
        emit Approval(owner_, spender, amount);
    }
    
    // Minting function - only called by authorized minters
    function mint(address to, uint256 amount) external onlyMinter returns (bool) {
        if (to == address(0)) revert ZeroAddress();
        
        _totalSupply += amount;
        _balances[to] += amount;
        
        emit Transfer(address(0), to, amount);
        return true;
    }
    
    // Owner functions for managing minters
    function addMinter(address minter) external onlyOwner {
        if (minter == address(0)) revert ZeroAddress();
        minters[minter] = true;
        emit MinterAdded(minter);
    }
    
    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        owner = newOwner;
    }
} 