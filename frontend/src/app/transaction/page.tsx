"use client";

import { useState, useEffect } from "react";
import { connectWallet, getBudgetContract } from "../utils/contract";
import { useRouter } from "next/navigation";

type SubDivision = {
  name: string;
  amount: number;
  percentage: number;
  spent: number;
};

type BudgetSummary = {
  income: number;
  dailyLimit: number;
  needs: number;
  wants: number;
  savings: number;
  spentNeeds: number;
  spentWants: number;
  spentSavings: number;
};

export default function TransactionPage() {
  const [loading, setLoading] = useState(false);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(
    null
  );
  const [categories] = useState<string[]>(["Needs", "Wants", "Savings"]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [subDivisions, setSubDivisions] = useState<SubDivision[]>([]);
  const [selectedSubDivision, setSelectedSubDivision] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [generalAmount, setGeneralAmount] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    fetchBudgetSummary();
  }, []);

  const fetchBudgetSummary = async () => {
    try {
      setLoading(true);
      const provider = await connectWallet();
      const budgetContract = await getBudgetContract(provider);

      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();

      const [income, dailyLimit, needs, wants, savings] =
        await budgetContract.getBudgetSummary(walletAddress);

      const fetchSpent = async (category: string) => {
        const [_, __, ___, spent] = await budgetContract.getSubDivisions(
          category
        );
        return spent.reduce(
          (total: number, value: any) => total + parseFloat(value.toString()),
          0
        );
      };

      const spentNeeds = await fetchSpent("Needs");
      const spentWants = await fetchSpent("Wants");
      const spentSavings = await fetchSpent("Savings");

      setBudgetSummary({
        income: parseFloat(income.toString()),
        dailyLimit: parseFloat(dailyLimit.toString()),
        needs: parseFloat(needs.toString()),
        wants: parseFloat(wants.toString()),
        savings: parseFloat(savings.toString()),
        spentNeeds,
        spentWants,
        spentSavings,
      });
    } catch (error) {
      console.error("Failed to fetch budget summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubDivisions = async (category: string) => {
    try {
      setLoading(true);
      const provider = await connectWallet();
      const budgetContract = await getBudgetContract(provider);

      const [names, amounts, percentages, spent] =
        await budgetContract.getSubDivisions(category);

      const subDivisionsData = names.map((name: string, index: number) => ({
        name,
        amount: parseFloat(amounts[index].toString()),
        percentage: parseFloat(percentages[index].toString()),
        spent: parseFloat(spent[index].toString()),
      }));

      setSubDivisions(subDivisionsData);
    } catch (error) {
      console.error("Failed to fetch sub-divisions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpendFromSubDivision = async () => {
    try {
      if (!selectedCategory || !selectedSubDivision || !amount) {
        setFeedback(
          "Please select a category, sub-division, and enter an amount."
        );
        return;
      }
      setLoading(true);
      const provider = await connectWallet();
      const budgetContract = await getBudgetContract(provider);

      const tx = await budgetContract.spendFromSubDivision(
        selectedCategory,
        selectedSubDivision,
        parseFloat(amount)
      );
      await tx.wait();

      setFeedback("Transaction successful!");
      setAmount("");
      setSelectedSubDivision("");
      await fetchBudgetSummary();
      router.refresh(); // Reload the entire page
    } catch (error: any) {
      console.error("Error spending from sub-division:", error);
      setFeedback(error.reason || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSpendFromCategory = async () => {
    try {
      if (!selectedCategory || !amount) {
        setFeedback("Please select a category and enter an amount.");
        return;
      }
      setLoading(true);
      const provider = await connectWallet();
      const budgetContract = await getBudgetContract(provider);

      const tx = await budgetContract.spendFromCategory(
        selectedCategory,
        parseFloat(amount)
      );
      await tx.wait();

      setFeedback("Transaction successful!");
      setAmount("");
      await fetchBudgetSummary();
      router.refresh(); // Reload the entire page
    } catch (error: any) {
      console.error("Error spending from category:", error);
      setFeedback(error.reason || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSpendFromGeneral = async () => {
    try {
      if (!generalAmount) {
        setFeedback("Please enter an amount.");
        return;
      }
      setLoading(true);
      const provider = await connectWallet();
      const budgetContract = await getBudgetContract(provider);

      const tx = await budgetContract.spendFromGeneral(
        parseFloat(generalAmount)
      );
      await tx.wait();

      setFeedback("Transaction successful!");
      setGeneralAmount("");
      await fetchBudgetSummary();
      router.refresh(); // Reload the entire page
    } catch (error: any) {
      console.error("Error spending from general pool:", error);
      setFeedback(error.reason || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl text-black font-bold mb-4">Transaction Page</h1>

      {/* Budget Overview Section */}
<div className="bg-gray-100 p-4 rounded-lg shadow mb-6">
  <h2 className="text-lg text-black font-semibold mb-4 text-center">
    Budget Overview
  </h2>
  {budgetSummary ? (
    <div className="grid grid-cols-2 gap-4">
      {/* Total Monthly Income */}
      <div className="bg-white p-4 rounded-lg shadow text-center">
        <h3 className="text-sm font-semibold text-gray-600">Total Income</h3>
        <p className="text-lg font-bold text-gray-800">
          ₵{budgetSummary.income.toFixed(2)}
        </p>
      </div>

      {/* Daily Spending Limit */}
      <div className="bg-white p-4 rounded-lg shadow text-center">
        <h3 className="text-sm font-semibold text-gray-600">Daily Limit</h3>
        <p className="text-lg font-bold text-gray-800">
          ₵{budgetSummary.dailyLimit.toFixed(2)}
        </p>
      </div>

      {/* Remaining Needs */}
      <div className="bg-white p-4 rounded-lg shadow text-center">
        <h3 className="text-sm font-semibold text-gray-600">Remaining Needs</h3>
        <p className="text-lg font-bold text-gray-800">
          ₵{(budgetSummary.needs - budgetSummary.spentNeeds).toFixed(2)}
        </p>
      </div>

      {/* Spent on Needs */}
      <div className="bg-white p-4 rounded-lg shadow text-center">
        <h3 className="text-sm font-semibold text-gray-600">Spent on Needs</h3>
        <p className="text-lg font-bold text-gray-800">
          ₵{budgetSummary.spentNeeds.toFixed(2)}
        </p>
      </div>

      {/* Remaining Wants */}
      <div className="bg-white p-4 rounded-lg shadow text-center">
        <h3 className="text-sm font-semibold text-gray-600">Remaining Wants</h3>
        <p className="text-lg font-bold text-gray-800">
          ₵{(budgetSummary.wants - budgetSummary.spentWants).toFixed(2)}
        </p>
      </div>

      {/* Spent on Wants */}
      <div className="bg-white p-4 rounded-lg shadow text-center">
        <h3 className="text-sm font-semibold text-gray-600">Spent on Wants</h3>
        <p className="text-lg font-bold text-gray-800">
          ₵{budgetSummary.spentWants.toFixed(2)}
        </p>
      </div>

      {/* Remaining Savings */}
      <div className="bg-white p-4 rounded-lg shadow text-center">
        <h3 className="text-sm font-semibold text-gray-600">
          Remaining Savings
        </h3>
        <p className="text-lg font-bold text-gray-800">
          ₵{(budgetSummary.savings - budgetSummary.spentSavings).toFixed(2)}
        </p>
      </div>

      {/* Spent on Savings */}
      <div className="bg-white p-4 rounded-lg shadow text-center">
        <h3 className="text-sm font-semibold text-gray-600">Spent on Savings</h3>
        <p className="text-lg font-bold text-gray-800">
          ₵{budgetSummary.spentSavings.toFixed(2)}
        </p>
      </div>

      {/* Total Spent */}
      <div className="bg-white p-4 rounded-lg shadow text-center col-span-2">
        <h3 className="text-sm font-semibold text-gray-600">Total Spent</h3>
        <p className="text-lg font-bold text-gray-800">
          ₵
          {(
            budgetSummary.spentNeeds +
            budgetSummary.spentWants +
            budgetSummary.spentSavings
          ).toFixed(2)}
        </p>
      </div>

      {/* Total Remaining */}
      <div className="bg-white p-4 rounded-lg shadow text-center col-span-2">
        <h3 className="text-sm font-semibold text-gray-600">Total Remaining</h3>
        <p className="text-lg font-bold text-gray-800">
          ₵
          {(
            budgetSummary.needs +
            budgetSummary.wants +
            budgetSummary.savings -
            (budgetSummary.spentNeeds +
              budgetSummary.spentWants +
              budgetSummary.spentSavings)
          ).toFixed(2)}
        </p>
      </div>
    </div>
  ) : (
    <p className="text-center text-gray-600">Loading...</p>
  )}
</div>

      {/* Category & Sub-Division Selector */}
      <div className="mb-6">
        <label className="text-black block mb-2 font-semibold">
          Select Category
        </label>
        <select
          className="w-full p-2 border rounded"
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            fetchSubDivisions(e.target.value); // Call the fetchSubDivisions function
          }}
        >
          <option value="">-- Select Category --</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        {subDivisions.length > 0 && (
          <>
            <label className="block mt-4 mb-2 font-semibold">
              Select Sub-Division
            </label>
            <select
              className="w-full p-2 border rounded"
              value={selectedSubDivision}
              onChange={(e) => setSelectedSubDivision(e.target.value)}
            >
              <option value="">-- Select Sub-Division --</option>
              {subDivisions.map((sub) => (
                <option key={sub.name} value={sub.name}>
                  {sub.name} (₵{sub.amount.toFixed(2)} remaining)
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Shared Amount Input Field */}
      <div className="mb-6">
        <label className="text-black block mb-2 font-semibold">Enter Amount (₵)</label>
        <input
          type="number"
          className="w-full p-2 border rounded"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <div className="flex gap-4 mt-4">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={!selectedSubDivision}
            onClick={handleSpendFromSubDivision}
          >
            Spend from Sub-Division
          </button>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={!selectedCategory || !!selectedSubDivision}
            onClick={handleSpendFromCategory}
          >
            Spend from Category
          </button>
        </div>
      </div>

      {/* General Pool Spending Section */}
      <div className="bg-red-100 p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold text-red-600">
          General Pool Spending
        </h2>
        <p className="text-sm text-red-600 mb-4">
          ⚠️ Spending from the general pool will auto-adjust all your budget
          categories. Consider using category/sub-division spending instead.
        </p>
        <input
          type="number"
          className="w-full p-2 border rounded mb-4"
          value={generalAmount}
          onChange={(e) => setGeneralAmount(e.target.value)}
        />
        <button
          className="bg-red-500 text-white px-4 py-2 rounded"
          onClick={handleSpendFromGeneral}
        >
          Spend from General Pool
        </button>
      </div>

      {/* Feedback/Status Area */}
      {feedback && <p className="text-center text-red-500 mb-4">{feedback}</p>}
    </div>
  );
}
