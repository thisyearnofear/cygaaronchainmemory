// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PenguinGame
 * @dev Main contract for the Penguin Memory Game with Abstract Wallet support
 */
contract PenguinGame {
    // Structs
    struct PlayerStats {
        uint256 highestLevel;
        uint256 totalGamesPlayed;
        uint256 totalClicks;
        mapping(uint256 => LevelStats) levelStats;
        uint256[] achievements;
        uint256 lastPlayedTimestamp;
    }

    struct LevelStats {
        uint256 bestScore;
        uint256 timesCompleted;
        uint256 lastCompletedAt;
    }

    struct LeaderboardEntry {
        address player;
        uint256 score;
    }

    struct GameSession {
        uint256 startTime;
        bytes32 levelHash;
        bool isComplete;
        uint256 clickCount;
        address actualPlayer;
    }

    // State variables
    address public owner;
    mapping(address => PlayerStats) public playerStats;
    mapping(uint256 => LeaderboardEntry[]) private levelLeaderboards;
    mapping(bytes32 => bool) private usedLevelHashes;
    mapping(address => GameSession) public activeSessions;
    mapping(address => address) public walletAssociations;
    uint256 private sessionCounter;

    // Constants
    uint256 public constant MAX_LEVEL = 3;
    uint256 public constant LEADERBOARD_SIZE = 10;
    uint256 public constant MIN_CLICKS_PER_LEVEL = 8;

    // Events
    event WalletAssociated(address indexed smartWallet, address indexed eoa);
    event GameStarted(address indexed player, uint256 level, uint256 timestamp);
    event LevelCompleted(address indexed player, uint256 level, uint256 clicks, uint256 timestamp);
    event NewHighScore(address indexed player, uint256 level, uint256 score, uint256 timestamp);
    event AchievementUnlocked(address indexed player, uint256 achievementId, uint256 timestamp);
    event ScoreSubmitted(address indexed player, uint256 level, uint256 clicks, uint256 timestamp);
    event Debug(string action, address sender, address actualPlayer, uint256 level);

    // Custom errors
    error InvalidLevel();
    error NoActiveSession();
    error SessionAlreadyExists();
    error LevelHashUsed();
    error InvalidClickCount();
    error Unauthorized();
    error InvalidProof();
    error InvalidWalletAssociation();
    error SessionInProgress(uint256 startTime);
    error InvalidLevelHash();
    error SessionNotStarted();

    // Constructor
    constructor() {
        owner = msg.sender;
    }

    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier validLevel(uint256 level) {
        if (level == 0 || level > MAX_LEVEL) revert InvalidLevel();
        _;
    }

    modifier hasActiveSession() {
        if (activeSessions[msg.sender].startTime == 0 || activeSessions[msg.sender].isComplete) revert NoActiveSession();
        _;
    }

    /**
     * @dev Associate a smart contract wallet with an EOA
     */
    function associateWallet(address eoa) external {
        if (walletAssociations[msg.sender] != address(0)) revert InvalidWalletAssociation();
        walletAssociations[msg.sender] = eoa;
        emit WalletAssociated(msg.sender, eoa);
    }

    /**
     * @dev Get the actual player address
     */
    function getActualPlayer(address wallet) public view returns (address) {
        address association = walletAssociations[wallet];
        return association != address(0) ? association : wallet;
    }

    /**
     * @dev Start a new game session
     */
    function startGame(uint256 level, bytes32 levelHash) external validLevel(level) {
        // Add validation for zero hash
        if (levelHash == bytes32(0)) revert InvalidLevelHash();
        
        // Check existing session with more detail
        GameSession storage currentSession = activeSessions[msg.sender];
        if (currentSession.startTime != 0 && !currentSession.isComplete) {
            emit Debug("SessionInProgress", msg.sender, currentSession.actualPlayer, level);
            revert SessionInProgress(currentSession.startTime);
        }

        address actualPlayer = getActualPlayer(msg.sender);
        
        // Add debug events
        emit Debug("StartGame", msg.sender, actualPlayer, level);
        
        // Check if level hash was used
        if (usedLevelHashes[levelHash]) {
            emit Debug("LevelHashUsed", msg.sender, actualPlayer, level);
            revert LevelHashUsed();
        }
        
        usedLevelHashes[levelHash] = true;
        activeSessions[msg.sender] = GameSession({
            startTime: block.timestamp,
            levelHash: levelHash,
            isComplete: false,
            clickCount: 0,
            actualPlayer: actualPlayer
        });

        playerStats[actualPlayer].totalGamesPlayed++;
        playerStats[actualPlayer].lastPlayedTimestamp = block.timestamp;
        emit GameStarted(actualPlayer, level, block.timestamp);
    }

    /**
     * @dev Submit a completed level
     */
    function submitScore(uint256 level, uint256 clicks, bytes calldata proof) external validLevel(level) hasActiveSession {
        address player = getActualPlayer(msg.sender);
        GameSession storage session = activeSessions[msg.sender];

        if (clicks < MIN_CLICKS_PER_LEVEL) revert InvalidClickCount();
        if (!verifyCompletion(level, clicks, proof)) revert InvalidProof();

        session.isComplete = true;
        session.clickCount = clicks;

        PlayerStats storage stats = playerStats[player];
        stats.totalClicks += clicks;

        if (level > stats.highestLevel) {
            stats.highestLevel = level;
            checkAndGrantAchievement(1);
        }

        LevelStats storage levelStats = stats.levelStats[level];
        levelStats.timesCompleted++;
        levelStats.lastCompletedAt = block.timestamp;

        if (levelStats.bestScore == 0 || clicks < levelStats.bestScore) {
            levelStats.bestScore = clicks;
            updateLeaderboard(level, player, clicks);
            emit NewHighScore(player, level, clicks, block.timestamp);
        }

        checkCompletionAchievements(level, clicks);
        emit ScoreSubmitted(player, level, clicks, block.timestamp);
    }

    // Internal functions
    function verifyCompletion(uint256 level, uint256 clicks, bytes calldata proof) internal pure returns (bool) {
        return true;
    }

    function updateLeaderboard(uint256 level, address player, uint256 score) internal {
        LeaderboardEntry[] storage leaderboard = levelLeaderboards[level];

        uint256 position = leaderboard.length;
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (score < leaderboard[i].score) {
                position = i;
                break;
            }
        }

        if (position < LEADERBOARD_SIZE) {
            if (leaderboard.length < LEADERBOARD_SIZE) {
                leaderboard.push(LeaderboardEntry(player, score));
            }

            for (uint256 i = leaderboard.length - 1; i > position; i--) {
                leaderboard[i] = leaderboard[i - 1];
            }

            leaderboard[position] = LeaderboardEntry(player, score);
        }
    }

    function getLeaderboard(uint256 level) external view validLevel(level) returns (LeaderboardEntry[] memory) {
        return levelLeaderboards[level];
    }

    function checkCompletionAchievements(uint256 level, uint256 clicks) internal {
        if (clicks <= MIN_CLICKS_PER_LEVEL) {
            checkAndGrantAchievement(2); // Perfect score achievement
        }

        if (block.timestamp - activeSessions[msg.sender].startTime < 60) {
            checkAndGrantAchievement(3); // Speed run achievement
        }

        if (level == MAX_LEVEL && playerStats[getActualPlayer(msg.sender)].highestLevel == MAX_LEVEL) {
            checkAndGrantAchievement(4); // Game completion achievement
        }
    }

    function checkAndGrantAchievement(uint256 achievementId) internal {
        address player = getActualPlayer(msg.sender);
        uint256[] storage achievements = playerStats[player].achievements;

        for (uint256 i = 0; i < achievements.length; i++) {
            if (achievements[i] == achievementId) {
                return;
            }
        }

        achievements.push(achievementId);
        emit AchievementUnlocked(player, achievementId, block.timestamp);
    }

    function getPlayerLevelStats(
        address player,
        uint256 level
    ) external view validLevel(level) returns (
        uint256 bestScore,
        uint256 timesCompleted,
        uint256 lastCompletedAt
    ) {
        LevelStats storage stats = playerStats[player].levelStats[level];
        return (
            stats.bestScore,
            stats.timesCompleted,
            stats.lastCompletedAt
        );
    }

    function getPlayerAchievements(address player) external view returns (uint256[] memory) {
        return playerStats[player].achievements;
    }
}