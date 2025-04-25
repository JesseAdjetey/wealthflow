"use client";

import { useRouter } from "next/navigation";
import WalletConnect from "../app/components/WalletConnect";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-6">
      <div className="max-w-4xl w-full bg-white/80 backdrop-blur-md shadow-xl rounded-3xl p-8 text-center">
        <h1 className="text-5xl font-serif font-bold text-gray-800 mb-6">
          Welcome to Wealth Flow
        </h1>

        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Your decentralized personal finance solution for smart budget
          management.
        </p>

        <div className="flex flex-col items-center space-y-6">
          <WalletConnect />
        </div>
      </div>
    </div>
  );
}
