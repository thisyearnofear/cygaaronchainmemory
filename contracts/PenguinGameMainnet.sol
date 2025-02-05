// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PenguinGameMainnet
 * @dev Optimized mainnet contract for the Penguin Memory Game
 */
contract PenguinGameMainnet {
    // Structs with optimized packing
    struct PlayerStats {
        uint32 highestLevel;      // Max level is 3, so uint32 is plenty
        uint32 totalGamesPlayed;
        uint32 totalClicks;
        uint64 lastPlayedTimestamp;
        mapping(uint256 => LevelStats) levelStats;
        uint256[] achievements;
    }

    struct LevelStats {
        uint32 bestScore;         // Lowest click count
        uint32 timesCompleted;
        uint64 lastCompletedAt;
    }

    struct LeaderboardEntry {
        address player;
        uint32 score;            // Using uint32 for score to save gas
    }

    struct GameSession {
        uint64 startTime;
        bytes32 levelHash;
        bool isComplete;
        uint32 clickCount;
    }

    // State variables
    address public immutable owner;
    mapping(address => PlayerStats) public playerStats;
    mapping(uint256 => LeaderboardEntry[]) private levelLeaderboards;
    mapping(bytes32 => bool) private usedLevelHashes;
    mapping(address => GameSession) public activeSessions;

    // Constants
    uint8 public constant MAX_LEVEL = 3;
    uint8 public constant LEADERBOARD_SIZE = 10;
    uint8 public constant MIN_CLICKS_PER_LEVEL = 8;

    // Events
    event GameStarted(address indexed player, uint8 level, uint64 timestamp);
    event LevelCompleted(address indexed player, uint8 level, uint32 clicks, uint64 timestamp);
    event NewHighScore(address indexed player, uint8 level, uint32 score);
    event AchievementUnlocked(address indexed player, uint256 achievementId);

    // Custom errors for gas optimization
    error InvalidLevel();
    error NoActiveSession();
    error SessionExists();
    error HashUsed();
    error InvalidClicks();
    error Unauthorized();
    error InvalidProof();

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier validLevel(uint8 level) {
        if (level == 0 || level > MAX_LEVEL) revert InvalidLevel();
        _;
    }

    /**
     * @dev Start a new game session
     */
    function startGame(uint8 level, bytes32 levelHash) external validLevel(level) {
        if (usedLevelHashes[levelHash]) revert HashUsed();
        if (activeSessions[msg.sender].startTime != 0 && 
            !activeSessions[msg.sender].isComplete) revert SessionExists();

        usedLevelHashes[levelHash] = true;
        activeSessions[msg.sender] = GameSession({
            startTime: uint64(block.timestamp),
            levelHash: levelHash,
            isComplete: false,
            clickCount: 0
        });

        emit GameStarted(msg.sender, level, uint64(block.timestamp));
    }

    /**
     * @dev Submit score for current game session
     */
    function submitScore(uint8 level, uint32 clicks, bytes calldata proof) 
        external 
        validLevel(level) 
    {
        GameSession storage session = activeSessions[msg.sender];
        if (session.startTime == 0 || session.isComplete) revert NoActiveSession();
        if (clicks < MIN_CLICKS_PER_LEVEL) revert InvalidClicks();
        
        // Verify the proof matches the level hash
        if (keccak256(proof) != session.levelHash) revert InvalidProof();

        session.isComplete = true;
        session.clickCount = clicks;

        // Update player stats
        PlayerStats storage stats = playerStats[msg.sender];
        stats.totalGamesPlayed++;
        stats.totalClicks += clicks;
        stats.lastPlayedTimestamp = uint64(block.timestamp);

        if (level > stats.highestLevel) {
            stats.highestLevel = level;
        }

        // Update level specific stats
        LevelStats storage levelStats = stats.levelStats[level];
        if (levelStats.bestScore == 0 || clicks < levelStats.bestScore) {
            levelStats.bestScore = clicks;
            updateLeaderboard(level, clicks);
            emit NewHighScore(msg.sender, level, clicks);
        }

        levelStats.timesCompleted++;
        levelStats.lastCompletedAt = uint64(block.timestamp);

        emit LevelCompleted(msg.sender, level, clicks, uint64(block.timestamp));
    }

    /**
     * @dev Update leaderboard with new score
     */
    function updateLeaderboard(uint8 level, uint32 score) internal {
        LeaderboardEntry[] storage board = levelLeaderboards[level];
        
        // Find position for new score
        uint256 pos = board.length;
        for (uint256 i = 0; i < board.length; i++) {
            if (score < board[i].score) {
                pos = i;
                break;
            }
        }

        // Insert new score if it qualifies
        if (pos < LEADERBOARD_SIZE) {
            if (board.length < LEADERBOARD_SIZE) {
                board.push(LeaderboardEntry(msg.sender, score));
            }
            
            // Shift existing entries
            for (uint256 i = board.length - 1; i > pos; i--) {
                board[i] = board[i - 1];
            }
            board[pos] = LeaderboardEntry(msg.sender, score);
        }
    }

    /**
     * @dev Get leaderboard for a specific level
     */
    function getLeaderboard(uint8 level) 
        external 
        view 
        validLevel(level) 
        returns (LeaderboardEntry[] memory) 
    {
        return levelLeaderboards[level];
    }

    /**
     * @dev Get player stats for a specific level
     */
    function getPlayerLevelStats(address player, uint8 level)
        external
        view
        validLevel(level)
        returns (uint32 bestScore, uint32 timesCompleted, uint64 lastCompletedAt)
    {
        LevelStats storage stats = playerStats[player].levelStats[level];
        return (stats.bestScore, stats.timesCompleted, stats.lastCompletedAt);
    }

    /**
     * @dev Emergency function to handle stuck funds
     */
    function withdraw() external onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }
} 