/**
 *Submitted for verification at BscScan.com on 2025-05-24
*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBEP20 {
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function transfer(address recipient, uint256 amount)
        external
        returns (bool);

    function balanceOf(address account) external view returns (uint256);

    function decimals() external view returns (uint8);

    function allowance(address owner, address spender)
        external
        view
        returns (uint256);
}

contract RamiUniversity {
    address public immutable owner;
    IBEP20 public immutable token =
        IBEP20(0xB93235b024a3063e3cf56cAB9991f99C513bEe78);

    struct Course {
        uint256 id;
        uint256 price; // Price in RAMI tokens (already accounting for decimals)
        string title;
        string description;
        uint256 totalSold;
        bool exists;
    }

    struct Purchase {
        address user;
        uint256 timestamp;
        address referrer;
    }

    mapping(uint256 => Course) public courses;
    mapping(address => mapping(uint256 => bool)) public hasPurchased;
    mapping(address => uint256) public referralEarnings;
    mapping(uint256 => Purchase[]) public coursePurchases;

    uint256[] public courseIds;
    address public constant BURN_ADDRESS =
        0x000000000000000000000000000000000000dEaD;
    address public constant TREASURY =
        0x2CE64188Cb3b2B3746b0a426f17351e156bB0012;
    uint256 public allTimeProfit;

    event CourseAdded(uint256 indexed id, string title, uint256 price);
    event CoursePurchased(
        address indexed buyer,
        uint256 courseId,
        uint256 amount
    );
    event ReferralEarned(address indexed referrer, uint256 amount);
    event PurchaseRevoked(address indexed user, uint256 indexed courseId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Unauthorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addCourse(
        uint256 _id,
        string memory _title,
        string memory _description,
        uint256 _price
    ) external onlyOwner {
        require(!courses[_id].exists, "Course exists");
        require(_price > 0, "Invalid price");

        courses[_id] = Course(_id, _price, _title, _description, 0, true);
        courseIds.push(_id);
        emit CourseAdded(_id, _title, _price);
    }

    function purchaseCourse(uint256 _courseId, address _referrer) external {
        Course storage course = courses[_courseId];
        require(course.exists, "Course not found");
        require(!hasPurchased[msg.sender][_courseId], "Already purchased");

        // Directly use 18 decimals since we know the token uses 18
        uint256 price = course.price * 10**18; // Convert price to token units

        _processPayment(price, _referrer);

        hasPurchased[msg.sender][_courseId] = true;
        course.totalSold++;
        emit CoursePurchased(msg.sender, _courseId, price);
    }

    // block user purchase
    function revokePurchase(address _user, uint256 _courseId)
        external
        onlyOwner
    {
        require(courses[_courseId].exists, "Course not found");
        require(
            hasPurchased[_user][_courseId],
            "User never purchased this course"
        );

        // Revoke access
        hasPurchased[_user][_courseId] = false;

        // Update purchase records
        _removePurchaseRecord(_user, _courseId);

        // Update total sold count
        courses[_courseId].totalSold--;

        emit PurchaseRevoked(_user, _courseId);
    }

    // update purchase records
    function _removePurchaseRecord(address _user, uint256 _courseId) private {
        Purchase[] storage purchases = coursePurchases[_courseId];

        for (uint256 i = 0; i < purchases.length; i++) {
            if (purchases[i].user == _user) {
                // Swap with last element and pop
                purchases[i] = purchases[purchases.length - 1];
                purchases.pop();
                break;
            }
        }
    }

    function _processPayment(uint256 _amount, address _referrer) private {
        uint256 referralCut = _calculateReferral(_amount, _referrer);
        uint256 burnAmount = (_amount * 1) / 100;
        uint256 treasuryAmount = _amount - referralCut - burnAmount;

        require(
            token.transferFrom(msg.sender, address(this), _amount),
            "Payment failed"
        );

        if (referralCut > 0) {
            token.transfer(_referrer, referralCut);
            referralEarnings[_referrer] += referralCut;
            emit ReferralEarned(_referrer, referralCut);
        }

        token.transfer(BURN_ADDRESS, burnAmount);
        token.transfer(TREASURY, treasuryAmount);

        allTimeProfit += treasuryAmount;
    }

    function _calculateReferral(uint256 _amount, address _referrer)
        private
        pure
        returns (uint256)
    {
        return (_referrer != address(0)) ? (_amount * 20) / 100 : 0;
    }

    function getCourseCount() external view returns (uint256) {
        return courseIds.length;
    }

    function getAllCourses() external view returns (Course[] memory) {
        Course[] memory allCourses = new Course[](courseIds.length);
        for (uint256 i = 0; i < courseIds.length; i++) {
            allCourses[i] = courses[courseIds[i]];
        }
        return allCourses;
    }

    function getCoursePurchases(uint256 _courseId)
        external
        view
        returns (Purchase[] memory)
    {
        return coursePurchases[_courseId];
    }
}
