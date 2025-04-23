// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// OpenZeppelin Ownable implementation
contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        _transferOwnership(_msgSender());
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// CYGAAR Distributor Contract
contract CygaarDistributor is Ownable {
    // Contract addresses
    address public cygaarToken;
    address public penguinGame;

    // Distribution state
    bool public distributionActive;
    uint256 public claimCount;
    mapping(uint256 => address) public claimers;

    // Events
    event DistributionActivated(bool active);
    event TokensClaimed(address indexed user, uint256 amount);

    // Modifiers
    modifier onlyGame() {
        require(msg.sender == penguinGame, "Only game contract can call");
        _;
    }

    modifier whenDistributionActive() {
        require(distributionActive, "Distribution is not active");
        _;
    }

    // Constructor
    constructor() {
        distributionActive = false;
        claimCount = 0;
    }

    // Initialization function (can only be called once)
    function initialize(address _cygaarToken, address _penguinGame) external onlyOwner {
        require(cygaarToken == address(0), "Already initialized");
        require(_cygaarToken != address(0), "Invalid token address");
        require(_penguinGame != address(0), "Invalid game address");

        cygaarToken = _cygaarToken;
        penguinGame = _penguinGame;
    }

    // Function to activate/deactivate distribution
    function setDistributionActive(bool _active) external onlyOwner {
        distributionActive = _active;
        emit DistributionActivated(_active);
    }

    // Function to claim tokens (called by users)
    function claimTokens() external whenDistributionActive {
        require(cygaarToken != address(0), "Not initialized");
        require(penguinGame != address(0), "Not initialized");

        // Add to claimers list
        claimers[claimCount] = msg.sender;
        claimCount++;

        // Calculate reward amount (example: 100 tokens)
        uint256 rewardAmount = 100 * 10**18; // 100 tokens with 18 decimals

        // Call token contract to mint tokens
        (bool success, ) = cygaarToken.call(
            abi.encodeWithSignature("mint(address,uint256)", msg.sender, rewardAmount)
        );
        require(success, "Token minting failed");

        emit TokensClaimed(msg.sender, rewardAmount);
    }
} 