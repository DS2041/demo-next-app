/**
 *Submitted for verification at BscTrace on 2025-12-30
 */

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);
    function decimals() external view returns (uint8);
}

// Minimal ReentrancyGuard implementation
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

/**
 * @title ChessChallenge
 * @dev Single-file ChessChallenge contract with integrated winner verification and multi-token support
 */
contract ChessChallenge is ReentrancyGuard {
    // Constants
    uint256 public constant ORDER_EXPIRY_TIME = 48 hours;
    uint256 public constant HOST_FEE_PERCENT = 10;
    uint256 public constant WINNER_SHARE_PERCENT = 90;
    uint256 public constant DEFAULT_MINIMUM_BET = 1e18; // 1 token (18 decimals)

    // constant
    address public constant DRAW_ADDRESS =
        0x000000000000000000000000000000000000dEaD;

    // Storage
    address public owner;
    address public hostFeeWallet;
    address public gameServer;
    uint256 public orderCounter;

    // Multi-token support
    address[] public supportedTokens;
    mapping(address => bool) public isTokenSupported;
    mapping(address => uint256) public tokenMinimumBet;

    // Game orders
    mapping(uint256 => GameOrder) public gameOrders;

    // Winner verification
    mapping(uint256 => address) public winners;
    mapping(uint256 => bool) public gameResolved;
    mapping(uint256 => string) public gameProofs;

    // Room code mapping
    mapping(string => uint256) public roomCodeToOrderId;
    mapping(uint256 => string) public orderIdToRoomCode;

    // Statistics
    GlobalStats public globalStats;
    mapping(address => UserGlobalStats) public userGlobalStats;
    mapping(address => mapping(address => UserTokenStats))
        public userTokenStats;
    mapping(address => TokenGlobalStats) public tokenGlobalStats;

    // Admin management
    mapping(address => bool) public admins;

    // Structs
    struct GlobalStats {
        uint256 allTimeGamesHosted;
        uint256 allTimeGamesCompleted;
        uint256 allTimeGamesExpired;
        uint256 allTimeGamesCancelled;
        uint256 totalRevenueVolume;
        uint256 totalProfitsGenerated;
    }

    struct GameOrder {
        uint256 orderId;
        address creator;
        address token;
        uint256 amount;
        uint256 createdAt;
        uint256 expiresAt;
        address accepter;
        address winner;
        uint8 status; // 0: Active, 1: Completed, 2: Expired, 3: Cancelled
        bool creatorWithdrawn;
        bool accepterWithdrawn;
        string roomCode;
    }

    struct UserGlobalStats {
        uint256 totalPlayedGames;
        uint256 totalWon;
        uint256 totalLost;
        uint256 totalDraw;
        uint256 totalCreatedOrders;
        uint256 totalCompletedOrders;
    }

    struct TokenGlobalStats {
        uint256 totalVolume;
        uint256 totalGames;
        uint256 totalFeesCollected;
    }

    struct UserTokenStats {
        uint256 totalVolume;
        uint256 totalEarned;
        uint256 gamesPlayed;
        uint256 gamesWon;
        uint256 gamesLost;
    }

    // Events
    event OrderCreated(
        uint256 indexed orderId,
        address indexed creator,
        address token,
        uint256 amount,
        uint256 expiresAt,
        string roomCode
    );
    event OrderAccepted(uint256 indexed orderId, address indexed accepter);
    event OrderCancelled(uint256 indexed orderId, address indexed creator);
    event OrderExpired(uint256 indexed orderId);
    event CreatorWithdrawn(
        uint256 indexed orderId,
        address indexed creator,
        uint256 amount
    );
    event GameCompleted(
        uint256 indexed orderId,
        address indexed winner,
        address token,
        uint256 winnerAmount,
        uint256 hostFee
    );
    event UserStatsUpdated(address indexed user);
    event TokenStatsUpdated(address indexed user, address indexed token);
    event TokenGlobalStatsUpdated(
        address indexed token,
        uint256 totalVolume,
        uint256 totalGames
    );
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
    event Paused(address indexed account);
    event Unpaused(address indexed account);
    event TokenAdded(address indexed token, uint256 minBet);
    event TokenRemoved(address indexed token);
    event RoomCodeLinked(uint256 indexed orderId, string roomCode);
    event WinnerDeclared(
        uint256 indexed orderId,
        address indexed winner,
        string proof
    );
    event GameServerUpdated(
        address indexed oldServer,
        address indexed newServer
    );
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    event GameDraw(
        uint256 indexed orderId,
        address indexed creator,
        address indexed accepter,
        uint256 refundAmount
    );

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "ChessChallenge: Not owner");
        _;
    }

    modifier onlyAdmin() {
        require(
            admins[msg.sender] || msg.sender == owner,
            "ChessChallenge: Not admin"
        );
        _;
    }

    modifier onlyGameServer() {
        require(msg.sender == gameServer, "ChessChallenge: Not game server");
        _;
    }

    modifier validOrder(uint256 _orderId) {
        require(
            _orderId > 0 && _orderId < orderCounter,
            "ChessChallenge: Invalid order ID"
        );
        _;
    }

    modifier validToken(address _token) {
        require(
            isTokenSupported[_token],
            "ChessChallenge: Token not supported"
        );
        _;
    }

    /**
     * @dev Constructor to initialize the contract
     * @param _hostFeeWallet Wallet to receive platform fees
     * @param _gameServer Address of the game server for winner verification
     */
    constructor(address _hostFeeWallet, address _gameServer) {
        require(
            _hostFeeWallet != address(0),
            "ChessChallenge: Invalid host fee wallet"
        );
        require(
            _gameServer != address(0),
            "ChessChallenge: Invalid game server"
        );

        owner = msg.sender;
        hostFeeWallet = _hostFeeWallet;
        gameServer = _gameServer;
        admins[msg.sender] = true;
        orderCounter = 1;

        globalStats = GlobalStats(0, 0, 0, 0, 0, 0);
    }

    /**
     * @dev Add a supported token for ChessChallenge
     * @param _token Token contract address
     * @param _minBet Minimum bet amount for this token
     */
    function addSupportedToken(
        address _token,
        uint256 _minBet
    ) external onlyOwner {
        require(_token != address(0), "ChessChallenge: Invalid token address");
        require(
            !isTokenSupported[_token],
            "ChessChallenge: Token already supported"
        );

        uint8 tokenDecimals = IERC20(_token).decimals();
        require(
            tokenDecimals == 18,
            "ChessChallenge: Token must have 18 decimals"
        );

        supportedTokens.push(_token);
        isTokenSupported[_token] = true;
        tokenMinimumBet[_token] = _minBet;

        emit TokenAdded(_token, _minBet);
    }

    /**
     * @dev Remove a supported token (disable new orders)
     * @param _token Token contract address to remove
     */
    function removeSupportedToken(address _token) external onlyOwner {
        require(
            isTokenSupported[_token],
            "ChessChallenge: Token not supported"
        );
        isTokenSupported[_token] = false;
        emit TokenRemoved(_token);
    }

    /**
     * @dev Create a new ChessChallenge order with specified token
     * @param _token Token address to use for ChessChallenge
     * @param _amount Amount of tokens to stake
     * @param _roomCode Unique room code for the game
     */
    function createOrder(
        address _token,
        uint256 _amount,
        string calldata _roomCode
    ) external validToken(_token) nonReentrant {
        require(
            _amount >= tokenMinimumBet[_token],
            "ChessChallenge: Below minimum bet"
        );
        require(_amount > 0, "ChessChallenge: Amount must be greater than 0");
        require(
            bytes(_roomCode).length > 0,
            "ChessChallenge: Room code cannot be empty"
        );
        require(
            roomCodeToOrderId[_roomCode] == 0,
            "ChessChallenge: Room code already used"
        );

        IERC20 token = IERC20(_token);
        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= _amount, "ChessChallenge: Insufficient allowance");

        require(
            token.transferFrom(msg.sender, address(this), _amount),
            "ChessChallenge: Token transfer failed"
        );

        uint256 orderId = orderCounter++;
        uint256 expiresAt = block.timestamp + ORDER_EXPIRY_TIME;

        gameOrders[orderId] = GameOrder({
            orderId: orderId,
            creator: msg.sender,
            token: _token,
            amount: _amount,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            accepter: address(0),
            winner: address(0),
            status: 0,
            creatorWithdrawn: false,
            accepterWithdrawn: false,
            roomCode: _roomCode
        });

        // Link room code to order ID
        roomCodeToOrderId[_roomCode] = orderId;
        orderIdToRoomCode[orderId] = _roomCode;

        // Update statistics
        userGlobalStats[msg.sender].totalCreatedOrders++;
        globalStats.allTimeGamesHosted++;

        emit OrderCreated(
            orderId,
            msg.sender,
            _token,
            _amount,
            expiresAt,
            _roomCode
        );
        emit RoomCodeLinked(orderId, _roomCode);
    }

    /**
     * @dev Accept an existing ChessChallenge order
     * @param _orderId ID of the order to accept
     */
    function acceptOrder(
        uint256 _orderId
    ) external validOrder(_orderId) nonReentrant {
        GameOrder storage order = gameOrders[_orderId];

        require(order.status == 0, "ChessChallenge: Order not active");
        require(
            order.accepter == address(0),
            "ChessChallenge: Order already accepted"
        );
        require(
            msg.sender != order.creator,
            "ChessChallenge: Cannot accept own order"
        );
        require(
            block.timestamp < order.expiresAt,
            "ChessChallenge: Order expired"
        );

        IERC20 token = IERC20(order.token);
        uint256 allowance = token.allowance(msg.sender, address(this));
        require(
            allowance >= order.amount,
            "ChessChallenge: Insufficient allowance"
        );

        require(
            token.transferFrom(msg.sender, address(this), order.amount),
            "ChessChallenge: Token transfer failed"
        );

        order.accepter = msg.sender;

        // Update user statistics
        userGlobalStats[msg.sender].totalPlayedGames++;
        userTokenStats[msg.sender][order.token].gamesPlayed++;
        userTokenStats[msg.sender][order.token].totalVolume += order.amount;

        emit OrderAccepted(_orderId, msg.sender);
        emit TokenStatsUpdated(msg.sender, order.token);
    }

    /**
     * @dev Complete game and distribute winnings
     * @param _orderId ID of the game to complete
     */
    /**
     * @dev Complete game and distribute winnings OR handle draw refunds
     * @param _orderId ID of the game to complete
     */
    function completeGame(
        uint256 _orderId
    ) external validOrder(_orderId) nonReentrant {
        GameOrder storage order = gameOrders[_orderId];

        require(order.status == 0, "ChessChallenge: Order not active");
        require(
            order.accepter != address(0),
            "ChessChallenge: Order not accepted yet"
        );
        require(gameResolved[_orderId], "ChessChallenge: Game not resolved");
        require(
            msg.sender == order.creator || msg.sender == order.accepter,
            "ChessChallenge: Not a game participant"
        );

        IERC20 token = IERC20(order.token);

        // CHECK IF IT'S A DRAW (winner is DRAW_ADDRESS)
        if (winners[_orderId] == DRAW_ADDRESS) {
            order.status = 1;
            order.creatorWithdrawn = true;
            order.accepterWithdrawn = true;

            // ============ COMPLETE STATISTICS UPDATE FOR DRAWS ============
            userGlobalStats[order.creator].totalDraw++;
            userGlobalStats[order.accepter].totalDraw++;
            userGlobalStats[order.creator].totalCompletedOrders++; // Creator's order completed
            userTokenStats[order.creator][order.token].gamesPlayed++;
            userTokenStats[order.accepter][order.token].gamesPlayed++;
            userTokenStats[order.creator][order.token].totalVolume += order
                .amount;
            userTokenStats[order.accepter][order.token].totalVolume += order
                .amount;
            globalStats.allTimeGamesCompleted++;
            tokenGlobalStats[order.token].totalGames++;

            // Emit events for statistics updates
            emit TokenGlobalStatsUpdated(
                order.token,
                tokenGlobalStats[order.token].totalVolume,
                tokenGlobalStats[order.token].totalGames
            );
            emit UserStatsUpdated(order.creator);
            emit UserStatsUpdated(order.accepter);
            emit TokenStatsUpdated(order.creator, order.token);
            emit TokenStatsUpdated(order.accepter, order.token);
            // ============ END STATISTICS UPDATE ============

            // DRAW: Return both stakes (full refund, no fees)
            require(
                token.transfer(order.creator, order.amount),
                "ChessChallenge: Creator refund failed"
            );
            require(
                token.transfer(order.accepter, order.amount),
                "ChessChallenge: Accepter refund failed"
            );

            emit GameDraw(
                _orderId,
                order.creator,
                order.accepter,
                order.amount
            );
        } else {
            // WIN/LOSS: Original logic
            require(
                isVerifiedWinner(_orderId, msg.sender),
                "ChessChallenge: Not the verified winner"
            );

            address winner = msg.sender;
            uint256 totalAmount = order.amount * 2;
            uint256 hostFee = (totalAmount * HOST_FEE_PERCENT) / 100;
            uint256 winnerAmount = totalAmount - hostFee;

            order.status = 1;
            order.winner = winner;

            // Mark the winner as having withdrawn
            if (winner == order.creator) {
                order.creatorWithdrawn = true;
            } else {
                order.accepterWithdrawn = true;
            }

            // Update statistics (calls the original _updateStatistics function)
            _updateStatistics(_orderId, winner, totalAmount, hostFee);

            // Transfer winnings and fees
            require(
                token.transfer(winner, winnerAmount),
                "ChessChallenge: Winner transfer failed"
            );
            require(
                token.transfer(hostFeeWallet, hostFee),
                "ChessChallenge: Fee transfer failed"
            );

            emit GameCompleted(
                _orderId,
                winner,
                order.token,
                winnerAmount,
                hostFee
            );
        }
    }

    /**
     * @dev Cancel an unaccepted order
     * @param _orderId ID of the order to cancel
     */
    function cancelOrder(
        uint256 _orderId
    ) external validOrder(_orderId) nonReentrant {
        GameOrder storage order = gameOrders[_orderId];

        require(
            msg.sender == order.creator,
            "ChessChallenge: Not order creator"
        );
        require(order.status == 0, "ChessChallenge: Order not active");
        require(
            order.accepter == address(0),
            "ChessChallenge: Order already accepted"
        );
        require(!order.creatorWithdrawn, "ChessChallenge: Already withdrawn");

        order.status = 3;
        order.creatorWithdrawn = true;

        require(
            IERC20(order.token).transfer(order.creator, order.amount),
            "ChessChallenge: Refund failed"
        );

        globalStats.allTimeGamesCancelled++;

        emit OrderCancelled(_orderId, msg.sender);
        emit CreatorWithdrawn(_orderId, msg.sender, order.amount);
    }

    /**
     * @dev Withdraw funds from expired order
     * @param _orderId ID of the expired order
     */
    function withdrawFromExpiredOrder(
        uint256 _orderId
    ) external validOrder(_orderId) nonReentrant {
        GameOrder storage order = gameOrders[_orderId];

        require(
            order.status == 0 || order.status == 2,
            "ChessChallenge: Invalid order state"
        );
        require(order.accepter == address(0), "ChessChallenge: Order accepted");
        require(
            block.timestamp >= order.expiresAt,
            "ChessChallenge: Order not expired yet"
        );
        require(
            msg.sender == order.creator,
            "ChessChallenge: Not order creator"
        );
        require(!order.creatorWithdrawn, "ChessChallenge: Already withdrawn");

        if (order.status == 0) {
            order.status = 2;
            globalStats.allTimeGamesExpired++;
        }
        order.creatorWithdrawn = true;

        require(
            IERC20(order.token).transfer(order.creator, order.amount),
            "ChessChallenge: Withdrawal failed"
        );

        emit CreatorWithdrawn(_orderId, msg.sender, order.amount);
    }

    /**
     * @dev Declare winner for a specific game (only game server)
     * @param _orderId ID of the game
     * @param _winner Address of the winner
     * @param _proof Proof of the win
     */
    function declareWinner(
        uint256 _orderId,
        address _winner,
        string calldata _proof
    ) external onlyGameServer {
        require(
            !gameResolved[_orderId],
            "ChessChallenge: Game already resolved"
        );
        require(
            _winner != address(0),
            "ChessChallenge: Invalid winner address"
        );

        winners[_orderId] = _winner;
        gameResolved[_orderId] = true;
        gameProofs[_orderId] = _proof;

        // Update game order if it exists and is active
        if (_orderId < orderCounter && gameOrders[_orderId].status == 0) {
            gameOrders[_orderId].winner = _winner;
        }

        emit WinnerDeclared(_orderId, _winner, _proof);
    }

    /**
     * @dev Internal function to update statistics after game completion
     */
    function _updateStatistics(
        uint256 _orderId,
        address _winner,
        uint256 _totalAmount,
        uint256 _hostFee
    ) private {
        GameOrder storage order = gameOrders[_orderId];
        address loser = (_winner == order.creator)
            ? order.accepter
            : order.creator;

        // Update global stats
        userGlobalStats[_winner].totalWon++;
        userGlobalStats[loser].totalLost++;
        userGlobalStats[order.creator].totalCompletedOrders++;

        // Update token-specific stats for winner
        userTokenStats[_winner][order.token].gamesWon++;
        userTokenStats[_winner][order.token].totalEarned += (_totalAmount -
            _hostFee);
        userTokenStats[_winner][order.token].totalVolume += order.amount;

        // Update token-specific stats for loser
        userTokenStats[loser][order.token].gamesLost++;
        userTokenStats[loser][order.token].totalVolume += order.amount;

        // Update global platform stats
        globalStats.allTimeGamesCompleted++;
        globalStats.totalRevenueVolume += _totalAmount;
        globalStats.totalProfitsGenerated += _hostFee;

        // Update token global stats
        tokenGlobalStats[order.token].totalVolume += _totalAmount;
        tokenGlobalStats[order.token].totalGames++;
        tokenGlobalStats[order.token].totalFeesCollected += _hostFee;

        emit TokenGlobalStatsUpdated(
            order.token,
            tokenGlobalStats[order.token].totalVolume,
            tokenGlobalStats[order.token].totalGames
        );
        emit UserStatsUpdated(_winner);
        emit UserStatsUpdated(loser);
        emit TokenStatsUpdated(_winner, order.token);
        emit TokenStatsUpdated(loser, order.token);
    }

    /**
     * @dev Check if an address is the verified winner for an order
     */
    function isVerifiedWinner(
        uint256 _orderId,
        address _claimant
    ) public view returns (bool) {
        return gameResolved[_orderId] && winners[_orderId] == _claimant;
    }

    /**
     * @dev Get winner details for an order
     */
    function getWinnerDetails(
        uint256 _orderId
    )
        external
        view
        returns (address winner, bool resolved, string memory proof)
    {
        return (
            winners[_orderId],
            gameResolved[_orderId],
            gameProofs[_orderId]
        );
    }

    /**
     * @dev Check if a game ended in a draw
     * @param _orderId ID of the game order
     * @return True if the game is a draw
     */
    function isGameDraw(uint256 _orderId) external view returns (bool) {
        require(
            _orderId > 0 && _orderId < orderCounter,
            "ChessChallenge: Invalid order ID"
        );
        return gameResolved[_orderId] && winners[_orderId] == DRAW_ADDRESS;
    }

    /**
     * @dev Check if a room code game ended in a draw
     * @param _roomCode Room code of the game
     * @return True if the game is a draw
     */
    function isRoomCodeDraw(
        string calldata _roomCode
    ) external view returns (bool) {
        uint256 orderId = roomCodeToOrderId[_roomCode];
        require(orderId != 0, "ChessChallenge: Room code not found");
        return gameResolved[orderId] && winners[orderId] == DRAW_ADDRESS;
    }

    /**
     * @dev Get game result type
     * @param _orderId ID of the game order
     * @return resultType 0: Not resolved, 1: Win/Loss, 2: Draw
     */
    function getGameResultType(uint256 _orderId) external view returns (uint8) {
        require(
            _orderId > 0 && _orderId < orderCounter,
            "ChessChallenge: Invalid order ID"
        );

        if (!gameResolved[_orderId]) {
            return 0; // Not resolved
        } else if (winners[_orderId] == DRAW_ADDRESS) {
            return 2; // Draw
        } else {
            return 1; // Win/Loss
        }
    }

    /**
     * @dev Get room code game result type
     * @param _roomCode Room code of the game
     * @return resultType 0: Not resolved, 1: Win/Loss, 2: Draw
     */
    function getRoomCodeResultType(
        string calldata _roomCode
    ) external view returns (uint8) {
        uint256 orderId = roomCodeToOrderId[_roomCode];
        require(orderId != 0, "ChessChallenge: Room code not found");

        if (!gameResolved[orderId]) {
            return 0; // Not resolved
        } else if (winners[orderId] == DRAW_ADDRESS) {
            return 2; // Draw
        } else {
            return 1; // Win/Loss
        }
    }

    /**
     * @dev Get order ID by room code
     */
    function getOrderIdByRoomCode(
        string calldata _roomCode
    ) external view returns (uint256) {
        uint256 orderId = roomCodeToOrderId[_roomCode];
        require(orderId != 0, "ChessChallenge: Room code not found");
        return orderId;
    }

    /**
     * @dev Get room code by order ID
     */
    function getRoomCodeByOrderId(
        uint256 _orderId
    ) external view validOrder(_orderId) returns (string memory) {
        string memory roomCode = orderIdToRoomCode[_orderId];
        require(
            bytes(roomCode).length > 0,
            "ChessChallenge: Room code not found for order"
        );
        return roomCode;
    }

    /**
     * @dev Get detailed information about an order
     */
    function getOrderDetails(
        uint256 _orderId
    )
        external
        view
        validOrder(_orderId)
        returns (
            uint256 orderId,
            address creator,
            address token,
            uint256 amount,
            uint256 expiresAt,
            uint8 status,
            address accepter,
            address winner,
            string memory roomCode
        )
    {
        GameOrder memory order = gameOrders[_orderId];
        return (
            order.orderId,
            order.creator,
            order.token,
            order.amount,
            order.expiresAt,
            order.status,
            order.accepter,
            order.winner,
            order.roomCode
        );
    }

    /**
     * @dev Get user global statistics
     */
    function getUserGlobalStats(
        address _user
    )
        external
        view
        returns (
            uint256 totalPlayedGames,
            uint256 totalWon,
            uint256 totalLost,
            uint256 totalDraw,
            uint256 totalCreatedOrders,
            uint256 totalCompletedOrders
        )
    {
        UserGlobalStats memory stats = userGlobalStats[_user];
        return (
            stats.totalPlayedGames,
            stats.totalWon,
            stats.totalLost,
            stats.totalDraw,
            stats.totalCreatedOrders,
            stats.totalCompletedOrders
        );
    }

    /**
     * @dev Get user token-specific statistics
     */
    function getUserTokenStats(
        address _user,
        address _token
    )
        external
        view
        returns (
            uint256 totalVolume,
            uint256 totalEarned,
            uint256 gamesPlayed,
            uint256 gamesWon,
            uint256 gamesLost
        )
    {
        UserTokenStats memory stats = userTokenStats[_user][_token];
        return (
            stats.totalVolume,
            stats.totalEarned,
            stats.gamesPlayed,
            stats.gamesWon,
            stats.gamesLost
        );
    }

    /**
     * @dev Get global platform statistics
     */
    function getGlobalStats()
        external
        view
        returns (
            uint256 allTimeGamesHosted,
            uint256 allTimeGamesCompleted,
            uint256 allTimeGamesExpired,
            uint256 allTimeGamesCancelled,
            uint256 totalRevenueVolume,
            uint256 totalProfitsGenerated
        )
    {
        return (
            globalStats.allTimeGamesHosted,
            globalStats.allTimeGamesCompleted,
            globalStats.allTimeGamesExpired,
            globalStats.allTimeGamesCancelled,
            globalStats.totalRevenueVolume,
            globalStats.totalProfitsGenerated
        );
    }

    /**
     * @dev Get global statistics for a specific token
     */
    function getTokenGlobalStats(
        address _token
    )
        external
        view
        returns (
            uint256 totalVolume,
            uint256 totalGames,
            uint256 totalFeesCollected
        )
    {
        TokenGlobalStats memory stats = tokenGlobalStats[_token];
        return (stats.totalVolume, stats.totalGames, stats.totalFeesCollected);
    }

    /**
     * @dev Get list of active order IDs
     */
    function getActiveOrders() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i < orderCounter; i++) {
            if (
                gameOrders[i].status == 0 &&
                gameOrders[i].accepter == address(0)
            ) {
                activeCount++;
            }
        }

        uint256[] memory activeOrders = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i < orderCounter; i++) {
            if (
                gameOrders[i].status == 0 &&
                gameOrders[i].accepter == address(0)
            ) {
                activeOrders[index] = i;
                index++;
            }
        }
        return activeOrders;
    }

    // ============ ADMIN FUNCTIONS ============

    function addAdmin(address _admin) external onlyOwner {
        require(_admin != address(0), "ChessChallenge: Invalid admin");
        require(_admin != owner, "ChessChallenge: Owner is already admin");
        admins[_admin] = true;
        emit AdminAdded(_admin);
    }

    function removeAdmin(address _admin) external onlyOwner {
        require(_admin != owner, "ChessChallenge: Cannot remove owner");
        admins[_admin] = false;
        emit AdminRemoved(_admin);
    }

    function updateHostFeeWallet(address _newWallet) external onlyOwner {
        require(_newWallet != address(0), "ChessChallenge: Invalid wallet");
        hostFeeWallet = _newWallet;
    }

    function updateGameServer(address _newGameServer) external onlyOwner {
        require(
            _newGameServer != address(0),
            "ChessChallenge: Invalid game server"
        );
        require(
            _newGameServer != gameServer,
            "ChessChallenge: Same game server"
        );
        emit GameServerUpdated(gameServer, _newGameServer);
        gameServer = _newGameServer;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(
            _newOwner != address(0),
            "ChessChallenge: New owner is zero address"
        );
        require(
            _newOwner != owner,
            "ChessChallenge: New owner same as current"
        );
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }
}
