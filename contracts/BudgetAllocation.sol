// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/// @title WealthFlow Budget Manager
/// @notice This contract allows users to define budgets, categorize them, create subdivisions, and safely spend from them with daily limits.
contract BudgetManager {
    /// Sub-division within a category (e.g., Rent under Needs)
    struct SubDivision {
        string name;                   // Name of the sub-division (e.g., "Groceries")
        uint256 amount;               // Target allocation (fixed)
        uint256 spent;                // Amount spent so far
        uint256 percentageOfCategory; // Percentage of its parent category
    }

    /// Category (e.g., Needs, Wants, Savings)
    struct Category {
        uint256 amount;                        // Total allocated to the category
        uint256 spent;                         // Total spent from the category
        mapping(string => SubDivision) subDivisions; // Named mapping of sub-divisions
        string[] subDivisionKeys;              // Helper array for frontend retrieval
    }

    /// Main budget struct per user
    struct UserBudget {
        uint256 totalIncome;                   // Total income for the budget cycle
        uint256 dailyLimit;                    // Auto-calculated daily limit
        uint256 dailySpent;                    // Amount spent today
        uint256 lastSpendDate;                 // Last day a transaction was made
        mapping(string => Category) categories;// Mapping of categories (e.g., Needs)
        string[] categoryKeys;                 // Helper array for frontend
        bool strictMode;                       // If true, prevents spending over daily limit
    }

    /// Maps wallet addresses to their respective budgets
    mapping(address => UserBudget) public userBudgets;

    /// Event to log all spending transactions
    event TransactionMade(
        address indexed user,
        string category,
        string subDivision,
        uint256 amount,
        uint256 timestamp
    );

    /// Sets up the user's income and base budget structure with Needs/Wants/Savings
    function setInitialBudget(uint256 income) external {
        require(income > 0, "Income must be greater than zero");

        UserBudget storage budget = userBudgets[msg.sender];
        budget.totalIncome = income;
        budget.dailyLimit = income / 30; // Simple daily limit calculation
        budget.strictMode = true;

        // Basic 50/30/20 division
        uint256 needsAmt = (income * 50) / 100;
        uint256 wantsAmt = (income * 30) / 100;
        uint256 savingsAmt = income - (needsAmt + wantsAmt);

        budget.categories["Needs"].amount = needsAmt;
        budget.categories["Wants"].amount = wantsAmt;
        budget.categories["Savings"].amount = savingsAmt;

        budget.categoryKeys.push("Needs");
        budget.categoryKeys.push("Wants");
        budget.categoryKeys.push("Savings");
    }

    /// Add a new sub-division within a category (e.g., Rent in Needs)
    function addSubDivision(string memory category, string memory subName, uint256 amount) external {
        require(bytes(category).length > 0, "Missing category");
        require(bytes(subName).length > 0, "Missing sub-division name");

        Category storage cat = userBudgets[msg.sender].categories[category];
        require(cat.amount >= amount, "Amount exceeds category budget");

        uint256 percentage = (amount * 100) / cat.amount;
        cat.subDivisions[subName] = SubDivision(subName, amount, 0, percentage);
        cat.subDivisionKeys.push(subName);
    }

    /// Spend from a specific sub-division (safe if within allocated funds)
    function spendFromSubDivision(string memory category, string memory subName, uint256 amount) public {
        UserBudget storage budget = userBudgets[msg.sender];
        Category storage cat = budget.categories[category];
        SubDivision storage sd = cat.subDivisions[subName];

        require(sd.amount - sd.spent >= amount, "Insufficient sub-division funds");
        _enforceDailyLimit(budget, amount);

        sd.spent += amount;
        cat.spent += amount;

        emit TransactionMade(msg.sender, category, subName, amount, block.timestamp);
    }

    /// Spend from a main category (e.g., from entire "Wants")
    function spendFromCategory(string memory category, uint256 amount) public {
        UserBudget storage budget = userBudgets[msg.sender];
        Category storage cat = budget.categories[category];

        require(cat.amount - cat.spent >= amount, "Insufficient category funds");
        _enforceDailyLimit(budget, amount);

        cat.spent += amount;

        emit TransactionMade(msg.sender, category, "", amount, block.timestamp);
    }

    /// Spend from general pool and proportionally adjust all categories
    function spendFromGeneral(uint256 amount) public {
        UserBudget storage budget = userBudgets[msg.sender];

        uint256 needsAvailable = budget.categories["Needs"].amount - budget.categories["Needs"].spent;
        uint256 wantsAvailable = budget.categories["Wants"].amount - budget.categories["Wants"].spent;
        uint256 savingsAvailable = budget.categories["Savings"].amount - budget.categories["Savings"].spent;

        uint256 totalAvailable = needsAvailable + wantsAvailable + savingsAvailable;
        require(totalAvailable >= amount, "Insufficient funds in total budget");

        _enforceDailyLimit(budget, amount);

        uint256 totalAllocated = budget.categories["Needs"].amount + budget.categories["Wants"].amount + budget.categories["Savings"].amount;

        uint256 needsShare = (budget.categories["Needs"].amount * amount) / totalAllocated;
        uint256 wantsShare = (budget.categories["Wants"].amount * amount) / totalAllocated;
        uint256 savingsShare = amount - (needsShare + wantsShare); // remainder

        budget.categories["Needs"].spent += needsShare;
        budget.categories["Wants"].spent += wantsShare;
        budget.categories["Savings"].spent += savingsShare;

        emit TransactionMade(msg.sender, "General", "", amount, block.timestamp);
    }

    /// Internal function to enforce daily spending caps
    function _enforceDailyLimit(UserBudget storage budget, uint256 amount) internal {
        if (budget.strictMode) {
            // Reset daily spent if 24hrs have passed
            if (block.timestamp > budget.lastSpendDate + 1 days) {
                budget.dailySpent = 0;
                budget.lastSpendDate = block.timestamp;
            }
            require(budget.dailySpent + amount <= budget.dailyLimit, "Daily limit exceeded");
        }

        budget.dailySpent += amount;
    }

    /// Get summary of user's budget (for frontend)
    function getBudgetSummary(address user) external view returns (
        uint256 income,
        uint256 dailyLimit,
        uint256 needs,
        uint256 wants,
        uint256 savings
    ) {
        UserBudget storage b = userBudgets[user];
        return (
            b.totalIncome,
            b.dailyLimit,
            b.categories["Needs"].amount,
            b.categories["Wants"].amount,
            b.categories["Savings"].amount
        );
    }

    /// Returns the details of all sub-divisions in a category
    function getSubDivisions(string memory category)
        external
        view
        returns (string[] memory names, uint256[] memory amounts, uint256[] memory percentages, uint256[] memory spent)
    {
        Category storage cat = userBudgets[msg.sender].categories[category];
        uint256 count = cat.subDivisionKeys.length;

        names = new string[](count);
        amounts = new uint256[](count);
        percentages = new uint256[](count);
        spent = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            string memory key = cat.subDivisionKeys[i];
            SubDivision storage sd = cat.subDivisions[key];
            names[i] = sd.name;
            amounts[i] = sd.amount;
            percentages[i] = sd.percentageOfCategory;
            spent[i] = sd.spent;
        }

        return (names, amounts, percentages, spent);
    }

    /// Enable or disable strict spending rules
    function toggleStrictMode(bool state) external {
        userBudgets[msg.sender].strictMode = state;
    }
}
