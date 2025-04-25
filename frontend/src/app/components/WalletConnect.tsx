"use client";
import { useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter for navigation
import { ethers } from "ethers";

const WalletConnect = () => {
  const [address, setAddress] = useState<string | null>(null);
  const router = useRouter(); // Initialize the router

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();
      setAddress(walletAddress);

      // Navigate to the budget page after successful connection
      router.push("/budget");
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  return (
    <div className="p-4 bg-glass backdrop-blur-md rounded-lg shadow-lg">
      {address ? (
        <p className="text-black">Connected: {address}</p>
      ) : (
        <button
          onClick={connectWallet}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default WalletConnect;
