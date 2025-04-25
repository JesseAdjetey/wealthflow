// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IBudgetAllocation {
    struct Budget {
        uint256 income;
        uint256 needs;
        uint256 wants;
        uint256 savings;
        uint256 emergencyFund;
        bool strictMode;
    }

    function userBudgets(address user) external view returns (Budget memory);
}

contract WealthTransfer {
    IBudgetAllocation public budgetContract;

    mapping(address => uint256) public totalSent;

    event TransferExecuted(address indexed from, address indexed to, uint256 amount, string category);
    event EmergencyTransfer(address indexed from, address indexed to, uint256 amount);

    constructor(address _budgetContract) {
        budgetContract = IBudgetAllocation(_budgetContract);
    }

    modifier withinBudget(string memory category, uint256 amount) {
        IBudgetAllocation.Budget memory budget = budgetContract.userBudgets(msg.sender);

        if (keccak256(bytes(category)) == keccak256(bytes("needs"))) {
            require(amount <= budget.needs, "Exceeds needs budget");
        } else if (keccak256(bytes(category)) == keccak256(bytes("wants"))) {
            require(amount <= budget.wants, "Exceeds wants budget");
        } else if (keccak256(bytes(category)) == keccak256(bytes("savings"))) {
            require(amount <= budget.savings, "Exceeds savings budget");
        } else {
            revert("Invalid category");
        }

        _;
    }

    function transferTo(address payable recipient, uint256 amount, string memory category)
        public
        payable
        withinBudget(category, amount)
    {
        IBudgetAllocation.Budget memory budget = budgetContract.userBudgets(msg.sender);

        if (budget.strictMode) {
            require(msg.value == amount, "Insufficient ETH sent");
        }

        totalSent[msg.sender] += amount;

        recipient.transfer(amount);
        emit TransferExecuted(msg.sender, recipient, amount, category);
    }

    function emergencyTransfer(address payable recipient, uint256 amount) public payable {
        IBudgetAllocation.Budget memory budget = budgetContract.userBudgets(msg.sender);

        require(!budget.strictMode, "Strict mode active - cannot perform emergency transfer");
        require(amount <= budget.emergencyFund, "Exceeds emergency fund");

        require(msg.value == amount, "Insufficient ETH sent");
        recipient.transfer(amount);

        emit EmergencyTransfer(msg.sender, recipient, amount);
    }

    // Fallback to receive ETH
    receive() external payable {}
}
