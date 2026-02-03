// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title RamicoinTreasury
 * @dev A smart contract to hold and manage Ramicoin subscription profits
 * @notice Owner can withdraw tokens and ETH at any time
 * @author Your Name/Company
 */

interface IERC20 {
    function transfer(
        address to,
        uint256 amount
    ) external returns (bool success);

    function balanceOf(address account) external view returns (uint256);
}

contract RamicoinTreasury {
    address public owner;

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
    event TokensWithdrawn(
        address indexed token,
        address indexed to,
        uint256 amount
    );
    event EtherWithdrawn(address indexed to, uint256 amount);
    event TokensReceived(
        address indexed token,
        address indexed from,
        uint256 amount
    );
    event EtherReceived(address indexed from, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    /**
     * @dev Initializes the contract setting the deployer as the initial owner
     */
    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), owner);
    }

    /**
     * @dev Allows the contract to receive ETH
     */
    receive() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    /**
     * @dev Fallback function to receive ETH
     */
    fallback() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    /**
     * @dev Withdraws ERC20 tokens from the treasury
     * @param _token Address of the token contract
     * @param _to Address to send tokens to
     * @param _amount Amount of tokens to withdraw
     * @notice Only callable by owner
     */
    function withdrawTokens(
        address _token,
        address _to,
        uint256 _amount
    ) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(_to != address(0), "Invalid recipient address");
        require(_amount > 0, "Amount must be greater than 0");

        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(address(this));
        require(balance >= _amount, "Insufficient token balance");

        bool success = token.transfer(_to, _amount);
        require(success, "Token transfer failed");

        emit TokensWithdrawn(_token, _to, _amount);
    }

    /**
     * @dev Withdraws all tokens of a specific type from the treasury
     * @param _token Address of the token contract
     * @param _to Address to send tokens to
     * @notice Only callable by owner
     */
    function withdrawAllTokens(address _token, address _to) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(_to != address(0), "Invalid recipient address");

        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");

        bool success = token.transfer(_to, balance);
        require(success, "Token transfer failed");

        emit TokensWithdrawn(_token, _to, balance);
    }

    /**
     * @dev Withdraws ETH from the treasury
     * @param _to Address to send ETH to
     * @param _amount Amount of ETH to withdraw in wei
     * @notice Only callable by owner
     */
    function withdrawEther(
        address payable _to,
        uint256 _amount
    ) external onlyOwner {
        require(_to != address(0), "Invalid recipient address");
        require(_amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= _amount, "Insufficient ETH balance");

        (bool success, ) = _to.call{value: _amount}("");
        require(success, "ETH transfer failed");

        emit EtherWithdrawn(_to, _amount);
    }

    /**
     * @dev Withdraws all ETH from the treasury
     * @param _to Address to send ETH to
     * @notice Only callable by owner
     */
    function withdrawAllEther(address payable _to) external onlyOwner {
        require(_to != address(0), "Invalid recipient address");
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");

        (bool success, ) = _to.call{value: balance}("");
        require(success, "ETH transfer failed");

        emit EtherWithdrawn(_to, balance);
    }

    /**
     * @dev Transfers ownership of the treasury to a new account
     * @param _newOwner Address of the new owner
     * @notice Only callable by current owner
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        require(_newOwner != owner, "New owner cannot be current owner");

        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }

    /**
     * @dev Returns the balance of a specific token in the treasury
     * @param _token Address of the token contract
     * @return uint256 Token balance
     */
    function getTokenBalance(address _token) external view returns (uint256) {
        return IERC20(_token).balanceOf(address(this));
    }

    /**
     * @dev Returns the ETH balance of the treasury
     * @return uint256 ETH balance in wei
     */
    function getEtherBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Returns the current owner address
     * @return address Owner address
     */
    function getOwner() external view returns (address) {
        return owner;
    }

    /**
     * @dev Emergency function to approve token spending (if needed for migrations)
     * @param _token Token address
     * @param _spender Spender address
     * @param _amount Amount to approve
     * @notice Only callable by owner
     */
    function approveTokenSpending(
        address _token,
        address _spender,
        uint256 _amount
    ) external onlyOwner {
        require(_token != address(0), "Invalid token address");
        require(_spender != address(0), "Invalid spender address");

        // Some tokens require approval before transferFrom can be called
        // This is useful if you need to migrate funds to a new treasury
        IERC20(_token).transfer(_spender, _amount);
    }
}
