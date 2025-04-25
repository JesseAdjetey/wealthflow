import { ethers } from "ethers";

export const connectWallet = async () => {
  if (!window.ethereum) throw new Error("MetaMask is not installed");
  const provider = new ethers.BrowserProvider(window.ethereum as any); // Use BrowserProvider
  await provider.send("eth_requestAccounts", []); // Request accounts from MetaMask
  return provider;
};
