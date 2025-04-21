// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CygaarToken.sol";

/**
 * @title CygaarDistributor
 * @dev Contract to distribute CYGAAR tokens based on Penguin Memory Game achievements
 */
contract CygaarDistributor {
    // Token contract
    CygaarToken public cygaarToken;
    
    // Penguin Game contract interface
    IPenguinGame public penguinGame;
    
    // Distribution parameters
    struct RewardParams {
        uint256 baseReward;              // Base reward for completing a level
        uint256 topLeaderboardBonus;     // Bonus for top 10 players
        uint256 perfectScoreBonus;       // Bonus for getting a perfect score (minimum clicks)
        uint256 allLevelsCompletionBonus; // Bonus for completing all 3 levels
    }
    
    RewardParams public rewardParams;
    
    // Claiming mechanism
    mapping(address => bool) public hasClaimed;
    mapping(address => uint256) public claimedAmount;
    
    // Events
    event RewardClaimed(address indexed player, uint256 amount);
    event RewardParametersUpdated(uint256 baseReward, uint256 leaderboardBonus, uint256 perfectBonus, uint256 completionBonus);
    event DistributorInitialized(address tokenAddress, address gameAddress);
    
    // Custom errors
    error Unauthorized();
    error AlreadyClaimed();
    error NothingToClaim();
    error FailedToMint();
    error InvalidAddress();
    error InvalidParameters();
    
    // State variables
    address public owner;
    bool public distributionActive;
    uint256 public totalDistributed;
    
    // Modifier
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }
    
    constructor() {
        owner = msg.sender;
        
        // Set default reward parameters
        rewardParams = RewardParams({
            baseReward: 100 * 10**18,           // 100 CYGAAR per completed level
            topLeaderboardBonus: 50 * 10**18,   // 50 CYGAAR bonus for top leaderboard
            perfectScoreBonus: 100 * 10**18,    // 100 CYGAAR for perfect scores
            allLevelsCompletionBonus: 200 * 10**18 // 200 CYGAAR for completing all levels
        });
    }
    
    /**
     * @dev Initialize the distributor with token and game contract addresses
     * @param _tokenAddress Address of the CYGAAR token contract
     * @param _gameAddress Address of the Penguin Game contract
     */
    function initialize(address _tokenAddress, address _gameAddress) external onlyOwner {
        if (_tokenAddress == address(0) || _gameAddress == address(0)) revert InvalidAddress();
        
        cygaarToken = CygaarToken(_tokenAddress);
        penguinGame = IPenguinGame(_gameAddress);
        
        emit DistributorInitialized(_tokenAddress, _gameAddress);
    }
    
    /**
     * @dev Update reward parameters
     */
    function updateRewardParameters(
        uint256 _baseReward,
        uint256 _leaderboardBonus,
        uint256 _perfectBonus,
        uint256 _completionBonus
    ) external onlyOwner {
        rewardParams = RewardParams({
            baseReward: _baseReward,
            topLeaderboardBonus: _leaderboardBonus,
            perfectScoreBonus: _perfectBonus,
            allLevelsCompletionBonus: _completionBonus
        });
        
        emit RewardParametersUpdated(_baseReward, _leaderboardBonus, _perfectBonus, _completionBonus);
    }
    
    /**
     * @dev Enable or disable token distribution
     */
    function setDistributionActive(bool _active) external onlyOwner {
        distributionActive = _active;
    }
    
    /**
     * @dev Calculate rewards for a player based on their gameplay
     * @param player Address of the player
     * @return totalReward Total reward amount in CYGAAR tokens
     */
    function calculateRewards(address player) public view returns (uint256 totalReward) {
        // Get player's stats for each level
        uint256 reward = 0;
        bool allLevelsCompleted = true;
        
        for (uint8 level = 1; level <= 3; level++) {
            (uint32 bestScore, uint32 timesCompleted, ) = penguinGame.getPlayerLevelStats(player, level);
            
            // If the player has completed this level
            if (timesCompleted > 0) {
                // Add base reward for completing the level
                reward += rewardParams.baseReward;
                
                // Check if player has a top score on the leaderboard
                if (isInTopLeaderboard(player, level)) {
                    reward += rewardParams.topLeaderboardBonus;
                }
                
                // Check if player achieved a perfect score (minimum clicks)
                if (isPerfectScore(bestScore, level)) {
                    reward += rewardParams.perfectScoreBonus;
                }
            } else {
                allLevelsCompleted = false;
            }
        }
        
        // Bonus for completing all levels
        if (allLevelsCompleted) {
            reward += rewardParams.allLevelsCompletionBonus;
        }
        
        return reward;
    }
    
    /**
     * @dev Check if a player's score is in the top 10 of leaderboard for a level
     */
    function isInTopLeaderboard(address player, uint8 level) public view returns (bool) {
        IPenguinGame.LeaderboardEntry[] memory leaderboard = penguinGame.getLeaderboard(level);
        
        // Check if player is in the top 10
        for (uint256 i = 0; i < leaderboard.length && i < 10; i++) {
            if (leaderboard[i].player == player) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * @dev Check if a score is considered perfect (minimum clicks for the level)
     */
    function isPerfectScore(uint32 score, uint8 level) public pure returns (bool) {
        if (level == 1 && score <= 16) return true;  // Perfect for level 1
        if (level == 2 && score <= 24) return true;  // Perfect for level 2
        if (level == 3 && score <= 30) return true;  // Perfect for level 3
        return false;
    }
    
    /**
     * @dev Allow players to claim their earned CYGAAR tokens
     */
    function claimRewards() external {
        if (!distributionActive) revert Unauthorized();
        if (hasClaimed[msg.sender]) revert AlreadyClaimed();
        
        uint256 reward = calculateRewards(msg.sender);
        if (reward == 0) revert NothingToClaim();
        
        // Mark as claimed to prevent double claims
        hasClaimed[msg.sender] = true;
        claimedAmount[msg.sender] = reward;
        totalDistributed += reward;
        
        // Mint tokens to the player
        bool success = cygaarToken.mint(msg.sender, reward);
        if (!success) revert FailedToMint();
        
        emit RewardClaimed(msg.sender, reward);
    }
    
    /**
     * @dev Allow admin to distribute tokens to a specific player
     * @param player Address of the player
     */
    function adminDistribute(address player) external onlyOwner {
        if (player == address(0)) revert InvalidAddress();
        if (hasClaimed[player]) revert AlreadyClaimed();
        
        uint256 reward = calculateRewards(player);
        if (reward == 0) revert NothingToClaim();
        
        // Mark as claimed
        hasClaimed[player] = true;
        claimedAmount[player] = reward;
        totalDistributed += reward;
        
        // Mint tokens to the player
        bool success = cygaarToken.mint(player, reward);
        if (!success) revert FailedToMint();
        
        emit RewardClaimed(player, reward);
    }
    
    /**
     * @dev Allow admin to reset a player's claim status
     * @param player Address of the player
     */
    function resetClaim(address player) external onlyOwner {
        hasClaimed[player] = false;
    }
    
    /**
     * @dev Transfer ownership of the contract
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        owner = newOwner;
    }
}

/**
 * @title IPenguinGame
 * @dev Interface for the Penguin Game contract
 */
interface IPenguinGame {
    struct LeaderboardEntry {
        address player;
        uint32 score;
    }
    
    function getLeaderboard(uint8 level) external view returns (LeaderboardEntry[] memory);
    
    function getPlayerLevelStats(address player, uint8 level) external view returns (
        uint32 bestScore,
        uint32 timesCompleted,
        uint64 lastCompletedAt
    );
} 