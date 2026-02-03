// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RamicoinSubscription
 * @dev A smart contract for managing subscription purchases using RAMI tokens
 * @notice Users can purchase subscriptions to access premium content
 * @author Your Name/Company
 */

interface IERC20 {
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool success);
    function decimals() external view returns (uint8 decimals);
}

contract RamicoinSubscription {
    IERC20 public immutable ramiToken;
    address public immutable treasury;
    address public owner;
    uint256 public subscriptionPriceInTokens;
    uint256 public subscriptionPriceInWei;

    mapping(address => bool) public hasSubscribed;
    uint256 public totalSubscriptionsSold;
    uint256 public totalReaders;

    event Subscribed(address indexed user, uint256 amount);
    event PriceUpdated(
        uint256 oldPriceInTokens,
        uint256 newPriceInTokens,
        uint256 oldPriceInWei,
        uint256 newPriceInWei
    );
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    /**
     * @dev Initializes the contract with required parameters
     * @param _ramiToken Address of the RAMI BEP-20 token contract
     * @param _treasury Address where subscription payments will be sent
     * @param _initialPriceInTokens Initial subscription price in whole RAMI tokens
     * @notice Price is handled in whole tokens (e.g., 10 = 10 RAMI)
     */
    constructor(
        address _ramiToken,
        address _treasury,
        uint256 _initialPriceInTokens
    ) {
        require(_ramiToken != address(0), "Invalid token address");
        require(_treasury != address(0), "Invalid treasury address");
        require(_initialPriceInTokens > 0, "Price must be greater than 0");

        ramiToken = IERC20(_ramiToken);
        treasury = _treasury;
        owner = msg.sender;
        _setSubscriptionPrice(_initialPriceInTokens);
    }

    /**
     * @dev Allows users to purchase a subscription
     * @notice Transfers RAMI tokens from user to treasury and grants access
     * @custom:security Follows Checks-Effects-Interactions pattern
     */
    function purchaseSubscription() external {
        require(!hasSubscribed[msg.sender], "Already subscribed");

        // Store previous status to determine if this is a new reader
        bool wasAlreadySubscribed = hasSubscribed[msg.sender];

        // Update state (Checks-Effects)
        hasSubscribed[msg.sender] = true;
        totalSubscriptionsSold += 1;

        // Only increment unique readers count for new subscribers
        if (!wasAlreadySubscribed) {
            totalReaders += 1;
        }

        // Interaction: Transfer tokens
        bool success = ramiToken.transferFrom(
            msg.sender,
            treasury,
            subscriptionPriceInWei
        );

        // Revert all state changes if transfer fails
        if (!success) {
            hasSubscribed[msg.sender] = false;
            totalSubscriptionsSold -= 1;
            if (!wasAlreadySubscribed) {
                totalReaders -= 1;
            }
            revert("Token transfer failed");
        }

        emit Subscribed(msg.sender, subscriptionPriceInWei);
    }

    /**
     * @dev Allows owner to update the subscription price
     * @param _newPriceInTokens New price in whole RAMI tokens
     * @notice Only callable by contract owner
     */
    function updateSubscriptionPrice(
        uint256 _newPriceInTokens
    ) external onlyOwner {
        require(_newPriceInTokens > 0, "Price must be greater than 0");

        uint256 oldPriceInTokens = subscriptionPriceInTokens;
        uint256 oldPriceInWei = subscriptionPriceInWei;

        _setSubscriptionPrice(_newPriceInTokens);

        emit PriceUpdated(
            oldPriceInTokens,
            _newPriceInTokens,
            oldPriceInWei,
            subscriptionPriceInWei
        );
    }

    /**
     * @dev Internal function to set price with decimal conversion
     * @param _priceInTokens Price in whole RAMI tokens
     */
    function _setSubscriptionPrice(uint256 _priceInTokens) internal {
        subscriptionPriceInTokens = _priceInTokens;
        subscriptionPriceInWei = _priceInTokens * 10 ** 18;
    }

    /**
     * @dev Transfers contract ownership to a new address
     * @param _newOwner Address of the new owner
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        require(_newOwner != owner, "New owner cannot be current owner");

        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }

    /**
     * @dev Returns subscription price in whole tokens
     * @return uint256 Price in RAMI tokens
     */
    function getSubscriptionPriceInTokens() external view returns (uint256) {
        return subscriptionPriceInTokens;
    }

    /**
     * @dev Returns subscription price in wei units
     * @return uint256 Price in smallest token units
     */
    function getSubscriptionPriceInWei() external view returns (uint256) {
        return subscriptionPriceInWei;
    }

    /**
     * @dev Checks subscription status for an address
     * @param user Address to check
     * @return bool True if address has active subscription
     */
    function checkSubscription(address user) external view returns (bool) {
        return hasSubscribed[user];
    }

    /**
     * @dev Returns comprehensive subscription details
     * @return price Price in whole tokens
     * @return priceInWei Price in wei units
     * @return token Token contract address
     * @return subscriptionsSold Total purchases
     * @return uniqueReaders Unique subscribers
     */
    function getSubscriptionDetails()
        external
        view
        returns (
            uint256 price,
            uint256 priceInWei,
            address token,
            uint256 subscriptionsSold,
            uint256 uniqueReaders
        )
    {
        return (
            subscriptionPriceInTokens,
            subscriptionPriceInWei,
            address(ramiToken),
            totalSubscriptionsSold,
            totalReaders
        );
    }

    /**
     * @dev Returns statistics including caller's status
     * @return currentPrice Price in whole tokens
     * @return currentPriceInWei Price in wei units
     * @return totalSold Total purchases
     * @return uniqueSubscribers Unique subscribers
     * @return isSubscribed Caller's subscription status
     */
    function getStats()
        external
        view
        returns (
            uint256 currentPrice,
            uint256 currentPriceInWei,
            uint256 totalSold,
            uint256 uniqueSubscribers,
            bool isSubscribed
        )
    {
        return (
            subscriptionPriceInTokens,
            subscriptionPriceInWei,
            totalSubscriptionsSold,
            totalReaders,
            hasSubscribed[msg.sender]
        );
    }

    /**
     * @dev Returns current owner address
     * @return address Owner address
     */
    function getOwner() external view returns (address) {
        return owner;
    }
}
