import { ethers } from "ethers";
import BudgetAllocation from "./BudgetManager.json";
import WealthTransfer from "./WealthTransfer.json";

// Contract addresses (replace with actual deployed addresses)
export const budgetContractAddress =
  "0x9025798d5Fa4B679aA9bf059DdD806BBd7D5e97b";
export const transferContractAddress =
  "0xd4b0249Dca615ca47eC03Dba5Be9069C02488fd9";

// Extract only the ABI field from the JSON files
const BudgetABI = BudgetAllocation.abi;
const TransferABI = WealthTransfer.abi;

// Function to connect to the user's wallet

export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const provider = new ethers.BrowserProvider(
    window.ethereum as ethers.Eip1193Provider
  ); // Cast to Eip1193Provider
  await provider.send("eth_requestAccounts", []); // Request wallet connection
  return provider;
};

// Function to get the BudgetAllocation contract instance
export const getBudgetContract = async (provider: ethers.BrowserProvider) => {
  const signer = await provider.getSigner(); // Use await to resolve the Promise
  return new ethers.Contract(budgetContractAddress, BudgetABI, signer);
};

// Function to get the WealthTransfer contract instance
export const getTransferContract = async (provider: ethers.BrowserProvider) => {
  const signer = await provider.getSigner(); // Use await to resolve the Promise
  return new ethers.Contract(transferContractAddress, TransferABI, signer);
};
