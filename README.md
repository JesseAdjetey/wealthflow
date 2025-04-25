# WealthFlow

## 🔐 Description

**WealthFlow** is a secure, AI-powered decentralized budgeting and transaction application built on **Swellchain**. Unlike traditional budgeting tools that only monitor your spending, WealthFlow **enforces financial discipline** directly through smart contracts — ensuring you stick to your plan.

At its core, WealthFlow is a powerful budgeting framework that helps users **create, manage, and interact with their money in real-time**, through a system of categorized allocations, smart spending controls, and rule-based blockchain enforcement. Designed for **everyday users**, not just blockchain geeks, WealthFlow makes Web3 finance intuitive, practical, and accessible to all.

---

## 🌟 App Highlights

- **Not just a budget tracker — a budgeting engine**
- **Not just a spending tool — a spending enforcer**
- AI-powered, blockchain-secured, and human-friendly
- Built on Swellchain using smart contracts deployed via Ankr RPC
- Accessible even to users with zero blockchain knowledge

---

## 🧭 Current Frontend Pages

### 🔹 Budget Screen
- Input your total monthly income  
- Automatically generate a 50/30/20 base framework  
- Create and name sub-divisions under Needs, Wants, and Savings  
- View structure of your budget in real time

### 🔹 Dashboard
- Visual breakdown of your budget  
- Interactive pie charts and bar graphs  
- Drill down into sub-division spending insights under each category

### 🔹 Transaction Page
- Spend directly from a category or a specific sub-division  
- Strictly enforces daily limits and allocation boundaries  
- Separate “General Pool” transaction option with safety warnings and auto-reallocation logic  
- Fully connected to smart contracts for real-time enforcement

### 🔹 Wealth AI (Assistant)
- Conversational interface for interacting with your budget  
- Ask questions like “Can I afford ₵100 for lunch?” or “How’s my savings doing?”  
- Plan new sub-divisions or savings goals via chat  
- Suggests budget optimizations and lets you transact directly

---

## 💡 Budgeting Concepts

### 🧠 Enforceable Budgeting
Traditional apps suggest budgets. WealthFlow **enforces them**. Categories and sub-divisions have fixed allocations. Users can't overspend due to smart contract protections — especially in **Strict Mode**.

### 🔄 Multi-Level Budgeting
WealthFlow supports:
- **Top-level categories**: Needs, Wants, Savings  
- **Custom sub-divisions**: “Groceries”, “Netflix”, “Emergency Fund”, etc.

### 📈 Flexible Budgeting Models
The current iteration supports the **50/30/20 model**, but the architecture is designed to **support multiple frameworks** in the future:
- Zero-based budgeting  
- Envelope budgeting  
- Reverse budgeting  
- Emergency-first planning

---

## 🔧 Smart Contract Architecture

| Function | Purpose |
|----------|---------|
| `setInitialBudget()` | Input monthly income and auto-allocate 50/30/20 |
| `addSubDivision()` | Create named sub-buckets under categories |
| `spendFromSubDivision()` | Deduct from specific sub-division only |
| `spendFromCategory()` | Spend from main category without affecting sub-divisions |
| `spendFromGeneral()` | Danger-mode spending: rebalances budget proportionally |
| `_enforceDailyLimit()` | Prevents exceeding daily spending cap |
| `getBudgetSummary()` | Returns income, daily cap, and category balances |
| `getSubDivisions()` | Fetches all sub-divisions dynamically for frontend use |

---

## 📚 Data Structure Overview

```solidity
struct SubDivision {
  string name;
  uint256 amount;
  uint256 spent;
  uint256 percentageOfCategory;
}
```

```solidity
struct Category {
  uint256 amount;
  uint256 spent;
  mapping(string => SubDivision) subDivisions;
  string[] subDivisionKeys;
}
```

```solidity
struct UserBudget {
  uint256 totalIncome;
  uint256 dailyLimit;
  uint256 dailySpent;
  uint256 lastSpendDate;
  mapping(string => Category) categories;
  string[] categoryKeys;
  bool strictMode;
}
```

---

## 📡 System Architecture

```
Frontend (React + Tailwind + Ethers.js)
       ↓
Smart Contracts (Solidity on Swell via Ankr)
       ↓
TransactionMade Events (read by frontend or Graph)
```

---

## 🔒 Security Design

- No overspending possible in `strictMode`  
- Every transaction must pass daily limit checks  
- No private data stored on-chain  
- MetaMask required for secure signature of all spend actions  
- Open event logs allow for transparency and auditing

---

## 🎯 Vision & Impact

- To create the **first budgeting dApp that manages and enforces financial control**  
- To make **Web3 budgeting mainstream** — by being user-friendly for **non-crypto users**  
- To become the **financial super app of the decentralized future**

WealthFlow bridges the gap between **Web2 usability** and **Web3 power** — empowering people to **own their money, their rules, and their future**.

