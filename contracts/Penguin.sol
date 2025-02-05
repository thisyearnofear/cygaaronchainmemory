// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PenguinGameMainnet {
    struct PlayerStats {
        uint32 highestLevel;
        uint32 totalGamesPlayed;
        uint32 totalClicks;
        uint64 lastPlayedTimestamp;
        mapping(uint256 => LevelStats) levelStats;
    }

    struct LevelStats {
        uint32 bestScore;
        uint32 timesCompleted;
        uint64 lastCompletedAt;
    }

    struct LeaderboardEntry {
        address player;
        uint32 score;
    }

    address public immutable owner;
    mapping(address => PlayerStats) public playerStats;
    mapping(uint8 => LeaderboardEntry[]) private levelLeaderboards;
    mapping(address => address) public walletAssociations;

    uint8 public constant MAX_LEVEL = 3;
    uint16 public constant LEADERBOARD_SIZE = 100;
    uint8 public constant MIN_CLICKS_PER_LEVEL = 8;

    event GameStarted(address indexed player, uint8 level);
    event LevelCompleted(address indexed player, uint8 level, uint32 clicks);
    event NewHighScore(address indexed player, uint8 level, uint32 score);
    event WalletAssociated(address indexed smartWallet, address indexed eoa);
    event ScoreSubmitted(address indexed player, uint8 level, uint32 score);
    event LeaderboardUpdated(uint8 level, uint256 entries);

    error InvalidLevel();
    error InvalidClicks();
    error Unauthorized();
    error InvalidWalletAssociation();

    constructor() { owner = msg.sender; }

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier validLevel(uint8 level) {
        if (level == 0 || level > MAX_LEVEL) revert InvalidLevel();
        _;
    }

    function associateWallet(address eoa) external {
        if (walletAssociations[msg.sender] != address(0)) revert InvalidWalletAssociation();
        walletAssociations[msg.sender] = eoa;
        emit WalletAssociated(msg.sender, eoa);
    }

    function getActualPlayer(address wallet) public view returns (address) {
        address association = walletAssociations[wallet];
        return association != address(0) ? association : wallet;
    }

    function startGame(uint8 level, bytes32) external validLevel(level) {
        emit GameStarted(getActualPlayer(msg.sender), level);
    }

    function submitScore(uint8 level, uint32 clicks, bytes calldata) external validLevel(level) {
        if (clicks < MIN_CLICKS_PER_LEVEL) revert InvalidClicks();
        
        address player = getActualPlayer(msg.sender);
        PlayerStats storage stats = playerStats[player];
        stats.totalGamesPlayed++;
        stats.totalClicks += clicks;
        stats.lastPlayedTimestamp = uint64(block.timestamp);
        
        if (level > stats.highestLevel) stats.highestLevel = level;
        
        LevelStats storage levelStats = stats.levelStats[level];
        if (levelStats.bestScore == 0 || clicks < levelStats.bestScore) {
            levelStats.bestScore = clicks;
            updateLeaderboard(level, player, clicks);
            emit NewHighScore(player, level, clicks);
        }
        
        levelStats.timesCompleted++;
        levelStats.lastCompletedAt = uint64(block.timestamp);

        emit ScoreSubmitted(player, level, clicks);
        emit LevelCompleted(player, level, clicks);
    }

    function updateLeaderboard(uint8 level, address player, uint32 score) internal {
        LeaderboardEntry[] storage board = levelLeaderboards[level];
        uint256 insertPos = board.length;

        for (uint256 i = 0; i < board.length; i++) {
            if (score < board[i].score) {
                insertPos = i;
                break;
            }
        }

        if (insertPos < LEADERBOARD_SIZE) {
            if (board.length < LEADERBOARD_SIZE) board.push(LeaderboardEntry(player, score));
            for (uint256 i = (board.length < LEADERBOARD_SIZE ? board.length - 1 : LEADERBOARD_SIZE - 1); i > insertPos; i--) {
                board[i] = board[i - 1];
            }
            board[insertPos] = LeaderboardEntry(player, score);
            emit LeaderboardUpdated(level, board.length);
        }
    }

    function getLeaderboard(uint8 level) external view validLevel(level) returns (LeaderboardEntry[] memory) {
        LeaderboardEntry[] storage board = levelLeaderboards[level];
        LeaderboardEntry[] memory result = new LeaderboardEntry[](board.length);
        for (uint256 i = 0; i < board.length; i++) result[i] = board[i];
        return result;
    }

    function getPlayerBestScore(address player, uint8 level) external view validLevel(level) returns (uint32) {
        return playerStats[getActualPlayer(player)].levelStats[level].bestScore;
    }

    function getUniquePlayersCount(uint8 level) external view validLevel(level) returns (uint256) {
        return levelLeaderboards[level].length;
    }

    function withdraw() external onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }
}
