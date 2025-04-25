require("dotenv").config();
const { ethers } = require("ethers"); // Use ethers directly for JsonRpcProvider
const hardhat = require("hardhat"); // Use Hardhat for contract deployment

console.log("RPC_URL:", process.env.RPC_URL);
console.log("PRIVATE_KEY:", process.env.PRIVATE_KEY);

async function main() {
  // Create a provider and wallet using ethers.js (v6 syntax)
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("Deploying contracts with:", wallet.address);

  // Use Hardhat's ethers to get contract factories
  const BudgetFactory = await hardhat.ethers.getContractFactory(
    "BudgetManager",
    wallet
  );
  const budgetContract = await BudgetFactory.deploy();
  await budgetContract.waitForDeployment();
  console.log("✅ BudgetAllocation deployed at:", budgetContract.target);

  const TransferFactory = await hardhat.ethers.getContractFactory(
    "WealthTransfer",
    wallet
  );
  const transferContract = await TransferFactory.deploy(budgetContract.target);
  await transferContract.waitForDeployment();
  console.log("✅ WealthTransfer deployed at:", transferContract.target);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
