/**
 *Submitted for verification at BscTrace on 2025-08-28
 */

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

// IERC20 Interface
interface IERC20 {
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);

    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

// Ownable Contract
abstract contract Ownable {
    address private _owner;

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    constructor(address initialOwner) {
        _transferOwnership(initialOwner);
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function _checkOwner() internal view virtual {
        require(owner() == msg.sender, "Caller is not the owner");
    }

    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "New owner is the zero address");
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// ReentrancyGuard Contract
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        require(_status != _ENTERED, "Reentrant call");
        _status = _ENTERED;
    }

    function _nonReentrantAfter() private {
        _status = _NOT_ENTERED;
    }

    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == _ENTERED;
    }
}

/**
 * @title RamicoinStaking
 * @dev A contract for staking RAMICOIN tokens to earn USDT rewards.
 * Features include configurable lock periods, minimum stakes, and secure reward distribution.
 * Owner functions allow for USDT reward deposits and management of burn/reserve pools.
 * Includes robust safety features like reentrancy guards and recovery functions for accidental transfers.
 */
contract RamicoinStaking is Ownable, ReentrancyGuard {
    // --- Immutable State Variables ---
    IERC20 public immutable usdt; // The reward token (BSC USDT with 18 decimals)
    IERC20 public immutable ramicoin; // The core - staking token

    // --- Pool Balances ---
    uint256 public totalStakedRami; // Total RAMICOIN staked by all users
    uint256 public usdtPool; // USDT allocated for staker rewards
    uint256 public burnPool; // USDT allocated for burning (1%)
    uint256 public reservePool; // USDT allocated for reserves (4%)

    // --- Staking Configuration ---
    uint256 public lockPeriod = 48 hours; // Default lock period for staked tokens
    uint256 public minStakeAmount = 100 * 10 ** 18; // Minimum stake amount (100 RAMI in wei)

    // --- Reward Tracking ---
    // Accumulated rewards per staked token, scaled by 1e18 for precision
    uint256 public rewardPerToken;
    // Tracks the reward debt for each staker to calculate their share
    mapping(address => uint256) public stakerRewardDebt;
    // Tracks the accumulated pending rewards for each staker, ready to be claimed
    mapping(address => uint256) public pendingRewards;

    // --- Staker Information ---
    struct Staker {
        uint256 stakedAmount; // The amount of RAMICOIN the user has staked
        uint256 lastStakeTime; // The timestamp of the user's most recent stake action
    }
    // Mapping from user address to their staker information
    mapping(address => Staker) public ramicoinStakers;

    // --- Events ---
    event BurnPoolWithdrawn(uint256 amount, address to, uint256 day);
    event ReservePoolWithdrawn(uint256 amount, address to, uint256 day);
    event USDTDeposited(uint256 amount, uint256 day);
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event Claimed(address indexed user, uint256 amount, uint256 day);
    event LockPeriodUpdated(uint256 newPeriod, uint256 day);
    event MinStakeUpdated(uint256 newMin, uint256 day);

    // --- Constructor ---
    /**
     * @dev Initializes the contract by setting the token addresses and transferring ownership.
     * @param _usdt The address of the USDT token contract.
     * @param _ramicoin The address of the RAMICOIN token contract.
     */
    constructor(address _usdt, address _ramicoin) Ownable(msg.sender) {
        require(_usdt != address(0), "USDT: Cannot be zero address");
        require(_ramicoin != address(0), "RAMI: Cannot be zero address");
        usdt = IERC20(_usdt);
        ramicoin = IERC20(_ramicoin);
    }

    // --- Configuration Functions (Owner Only) ---
    /**
     * @dev Allows the owner to set a new staking lock period.
     * @param _newPeriod The new lock period in seconds. Must be 30 days or less.
     */
    function setRamicoinStakingLockPeriod(
        uint256 _newPeriod
    ) external onlyOwner {
        require(_newPeriod <= 30 days, "Lock period too long");
        lockPeriod = _newPeriod;
        emit LockPeriodUpdated(_newPeriod, _getCurrentDay());
    }

    /**
     * @dev Allows the owner to set a new minimum stake amount.
     * @param _newMin The new minimum stake amount in wei. Must be at least 100 RAMI.
     */
    function setMinRamicoinStake(uint256 _newMin) external onlyOwner {
        require(_newMin >= 100 * 10 ** 18, "min. staking amount: 100 RAMI");
        minStakeAmount = _newMin;
        emit MinStakeUpdated(_newMin, _getCurrentDay());
    }

    // --- Fallback Functions ---
    /**
     * @dev Prevents the contract from receiving BNB directly.
     */
    receive() external payable {
        revert("Direct BNB transfers are not allowed");
    }

    /**
     * @dev Prevents calling non-existent functions.
     */
    fallback() external {
        revert("Direct token transfers are not allowed");
    }

    // --- Internal Helper Functions ---
    /**
     * @dev Internal function to get the current day based on timestamp.
     * @return The current day number since the Unix epoch.
     */
    function _getCurrentDay() internal view returns (uint256) {
        return block.timestamp / 1 days;
    }

    // --- Pool Management (Owner Only) ---
    /**
     * @dev Allows the owner to withdraw the entire burn pool.
     * @param to The address to send the burned funds to.
     */
    function withdrawBurnPool(address to) external onlyOwner nonReentrant {
        require(burnPool > 0, "Burn pool is empty");
        require(to != address(0), "Cannot be zero address");

        uint256 amount = burnPool;
        burnPool = 0;

        require(usdt.transfer(to, amount), "Transfer failed");
        emit BurnPoolWithdrawn(amount, to, _getCurrentDay());
    }

    /**
     * @dev Allows the owner to withdraw the entire reserve pool.
     * @param to The address to send the reserve funds to.
     */
    function withdrawReservePool(address to) external onlyOwner nonReentrant {
        require(reservePool > 0, "Reserve pool is empty");
        require(to != address(0), "Cannot be zero address");

        uint256 amount = reservePool;
        reservePool = 0;

        require(usdt.transfer(to, amount), "Transfer failed");
        emit ReservePoolWithdrawn(amount, to, _getCurrentDay());
    }

    // --- Reward Distribution (Owner Only) ---
    /**
     * @dev Allows the owner to deposit USDT into the reward pools.
     * 95% goes to stakers, 4% to reserves, 1% to burn.
     * Updates the global rewardPerToken state variable.
     * @param amount The amount of USDT (in wei) to deposit.
     */
    function depositUSDT(uint256 amount) external onlyOwner {
        require(amount > 0, "Deposit must be greater than zero");
        uint256 contractBalanceBefore = usdt.balanceOf(address(this));
        require(
            usdt.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        // Robust check: ensures at least 'amount' was received, but allows for more (e.g., dust, airdrops)
        uint256 contractBalanceAfter = usdt.balanceOf(address(this));
        require(
            contractBalanceAfter >= contractBalanceBefore + amount,
            "USDT deposit failed"
        );

        // Allocate the deposited USDT to the respective pools
        uint256 burnAmount = (amount * 1) / 100; // 1% to burn
        uint256 reserveAmount = (amount * 4) / 100; // 4% to reserve
        uint256 stakerAmount = amount - (burnAmount + reserveAmount); // 95% to stakers

        burnPool += burnAmount;
        reservePool += reserveAmount;
        usdtPool += stakerAmount;

        // Distribute the staker rewards proportionally to the total stake
        if (totalStakedRami > 0) {
            rewardPerToken += (stakerAmount * 1e18) / totalStakedRami;
        }

        emit USDTDeposited(amount, _getCurrentDay());
    }

    // --- User Functions ---
    /**
     * @dev Allows a user to stake RAMICOIN tokens.
     * @param amount The amount of RAMICOIN (in wei) to stake. Must be >= minStakeAmount.
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake zero tokens");
        require(amount >= minStakeAmount, "min. staking amount: 100 RAMI");
        uint256 allowance = ramicoin.allowance(msg.sender, address(this));
        require(
            allowance >= amount,
            "Allowance too low, approve contract first"
        );
        require(
            ramicoin.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        _accumulateRewards(msg.sender); // Harvest any pending rewards before updating stake

        // Update staker's details
        Staker storage user = ramicoinStakers[msg.sender];
        user.stakedAmount += amount;
        user.lastStakeTime = block.timestamp;
        totalStakedRami += amount;

        // Update the user's reward debt to their new stake's share of the rewards
        stakerRewardDebt[msg.sender] =
            (user.stakedAmount * rewardPerToken) /
            1e18;

        emit Staked(msg.sender, amount);
    }

    /**
     * @dev Allows a user to unstake RAMICOIN tokens after the lock period has expired.
     * @param amount The amount of RAMICOIN (in wei) to unstake.
     */
    function unstake(uint256 amount) external nonReentrant {
        Staker storage user = ramicoinStakers[msg.sender];
        require(user.stakedAmount >= amount, "Not enough staked balance");
        require(
            block.timestamp >= user.lastStakeTime + lockPeriod,
            "Tokens are locked"
        );

        _accumulateRewards(msg.sender); // Harvest any pending rewards before updating stake

        user.stakedAmount -= amount;
        totalStakedRami -= amount;
        stakerRewardDebt[msg.sender] =
            (user.stakedAmount * rewardPerToken) /
            1e18;

        require(ramicoin.transfer(msg.sender, amount), "Transfer failed");
        emit Unstaked(msg.sender, amount);
    }

    /**
     * @dev Internal function to calculate and accumulate a user's pending rewards since their last action.
     * @param userAddress The address of the user to accumulate rewards for.
     */
    function _accumulateRewards(address userAddress) internal {
        Staker storage user = ramicoinStakers[userAddress];
        uint256 pending = (user.stakedAmount * rewardPerToken) /
            1e18 -
            stakerRewardDebt[userAddress];

        if (pending > 0) {
            pendingRewards[userAddress] += pending;
            stakerRewardDebt[userAddress] =
                (user.stakedAmount * rewardPerToken) /
                1e18;
        }
    }

    /**
     * @dev Allows a user to claim their accumulated USDT rewards.
     */
    function claim() external nonReentrant {
        Staker storage user = ramicoinStakers[msg.sender];
        require(user.stakedAmount > 0, "No staking history found");

        _accumulateRewards(msg.sender); // Ensure all rewards are up-to-date

        uint256 rewardAmount = pendingRewards[msg.sender];
        require(rewardAmount > 0, "No rewards to claim");

        pendingRewards[msg.sender] = 0;
        require(usdt.transfer(msg.sender, rewardAmount), "Transfer failed");

        emit Claimed(msg.sender, rewardAmount, _getCurrentDay());
    }

    /**
     * @dev Returns the total claimable USDT rewards for a given user.
     * This includes both accumulated and un-accumulated rewards.
     * @param userAddress The address of the user to check.
     * @return The total amount of USDT (in wei) the user can currently claim.
     */
    function getPendingRewards(
        address userAddress
    ) public view returns (uint256) {
        Staker storage user = ramicoinStakers[userAddress];
        uint256 newlyAccrued = (user.stakedAmount * rewardPerToken) /
            1e18 -
            stakerRewardDebt[userAddress];
        uint256 totalClaimable = pendingRewards[userAddress] + newlyAccrued;
        return totalClaimable;
    }

    // --- Recovery Functions (Owner Only) ---
    /**
     * @dev Recovers excess USDT or RAMICOIN sent directly to the contract (outside of staking/deposits).
     * @param tokenAddress The token to recover (must be USDT or RAMICOIN).
     * @param to The address to send the recovered tokens to.
     */
    function recoverMainTokens(
        address tokenAddress,
        address to
    ) external onlyOwner nonReentrant {
        require(to != address(0), "Cannot send to zero address");
        require(
            tokenAddress == address(usdt) || tokenAddress == address(ramicoin),
            "Can only recover USDT or RAMICOIN"
        );

        IERC20 token = IERC20(tokenAddress);
        uint256 totalContractBalance = token.balanceOf(address(this));
        uint256 allocatedBalance;

        if (tokenAddress == address(usdt)) {
            allocatedBalance = usdtPool + burnPool + reservePool;
        } else {
            allocatedBalance = totalStakedRami;
        }

        require(
            totalContractBalance > allocatedBalance,
            "No excess tokens to recover"
        );
        uint256 excessAmount = totalContractBalance - allocatedBalance;

        require(token.transfer(to, excessAmount), "Transfer failed");
    }

    /**
     * @dev Recovers any other BEP-20 token sent to the contract by mistake.
     * @param tokenAddress The token address to recover.
     * @param to The address to send the recovered tokens to.
     */
    function recoverAnyToken(
        address tokenAddress,
        address to
    ) external onlyOwner nonReentrant {
        require(to != address(0), "Cannot send to zero address");

        require(
            tokenAddress != address(usdt) && tokenAddress != address(ramicoin),
            "Use recoverMainTokens() for USDT/RAMI"
        );

        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No token balance to recover");

        require(token.transfer(to, balance), "Transfer failed");
    }

    /**
     * @dev Recovers BNB sent to the contract by mistake.
     * @param to The address to send the recovered BNB to.
     */
    function recoverBNB(address payable to) external onlyOwner nonReentrant {
        require(to != address(0), "Cannot send to zero address");
        uint256 balance = address(this).balance;
        require(balance > 0, "No BNB balance to recover");

        (bool success, ) = to.call{value: balance}("");
        require(success, "BNB transfer failed");
    }
}
