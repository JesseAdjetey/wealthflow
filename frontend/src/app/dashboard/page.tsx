"use client";

import { useEffect, useState } from "react";
import { getBudgetContract } from "../utils/contract";
import { connectWallet } from "../utils/wallet";
import { useRouter } from "next/navigation";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

type SubDivision = {
  name: string;
  amount: number;
  percentage: number;
  spent: number;
};

type Category = {
  name: string;
  totalAmount: number;
  spent: number;
  subDivisions: SubDivision[];
};

export default function Dashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [income, setIncome] = useState(0);
  const router = useRouter();

  // Fetch data from the smart contract
  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      const provider = await connectWallet();
      if (!provider) {
        router.push("/"); // Redirect to home if wallet not connected
        return;
      }
      
      const budgetContract = await getBudgetContract(provider);

      // Get the signer and wallet address
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();

      // Fetch budget summary
      const [incomeValue, dailyLimit, needsAmount, wantsAmount, savingsAmount] =
        await budgetContract.getBudgetSummary(walletAddress);

      // Set income
      setIncome(parseFloat(incomeValue.toString()));

      // Convert values to numbers if necessary
      const needsAmountNumber = parseFloat(needsAmount.toString());
      const wantsAmountNumber = parseFloat(wantsAmount.toString());
      const savingsAmountNumber = parseFloat(savingsAmount.toString());

      // Fetch sub-divisions for each category
      const fetchSubDivisions = async (category: string) => {
        const [names, amounts, percentages, spent] =
          await budgetContract.getSubDivisions(category);

        return names.map((name: string, index: number) => ({
          name,
          amount: parseFloat(amounts[index].toString()),
          percentage: parseFloat(percentages[index].toString()),
          spent: parseFloat(spent[index].toString()),
        }));
      };

      const needsSubDivisions = await fetchSubDivisions("Needs");
      const wantsSubDivisions = await fetchSubDivisions("Wants");
      const savingsSubDivisions = await fetchSubDivisions("Savings");

      // Set categories with fetched data
      setCategories([
        {
          name: "Needs",
          totalAmount: needsAmountNumber,
          spent: needsSubDivisions.reduce(
            (sum: number, sub: SubDivision) => sum + sub.spent,
            0
          ),
          subDivisions: needsSubDivisions,
        },
        {
          name: "Wants",
          totalAmount: wantsAmountNumber,
          spent: wantsSubDivisions.reduce(
            (sum: number, sub: SubDivision) => sum + sub.spent,
            0
          ),
          subDivisions: wantsSubDivisions,
        },
        {
          name: "Savings",
          totalAmount: savingsAmountNumber,
          spent: savingsSubDivisions.reduce(
            (sum: number, sub: SubDivision) => sum + sub.spent,
            0
          ),
          subDivisions: savingsSubDivisions,
        },
      ]);
    } catch (error) {
      console.error("Failed to fetch budget data:", error);
      alert("An error occurred while fetching budget data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, []);

  // Navigate to the transaction page
  const handleGoToTransactions = () => {
    router.push("/transaction");
  };

  // Navigate to edit budget
  const handleEditBudget = () => {
    router.push("/budget");
  };

  // Calculate the percentage spent
  const calculatePercentage = (spent: number, total: number) => {
    if (total === 0) return 0;
    return (spent / total) * 100;
  };

  // Get appropriate color class based on percentage spent
  const getSpendingColorClass = (spent: number, total: number) => {
    const percentage = calculatePercentage(spent, total);
    if (percentage < 50) return "text-green-600";
    if (percentage < 85) return "text-amber-500";
    return "text-red-500";
  };

  // Get progress bar color
  const getProgressBarColor = (spent: number, total: number) => {
    const percentage = calculatePercentage(spent, total);
    if (percentage < 50) return "bg-green-500";
    if (percentage < 85) return "bg-amber-500";
    return "bg-red-500";
  };

  // Prepare pie chart data
  const pieData = {
    labels: categories.map(cat => `${cat.name} (${(cat.totalAmount / income * 100).toFixed(0)}%)`),
    datasets: [
      {
        data: categories.map(cat => cat.totalAmount),
        backgroundColor: ["#9CD5C9", "#BDC2FF", "#FFD1A3"],
        hoverBackgroundColor: ["#7BC0B4", "#A2A8FF", "#FFBC7A"],
        borderWidth: 1,
        borderColor: "#ffffff",
      },
    ],
  };

  // Chart options
  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            family: 'serif',
            size: 12
          }
        }
      }
    },
    maintainAspectRatio: false
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-2xl font-serif text-gray-800 flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading dashboard...
        </div>
      </div>
    );
  }

  // Check if no budget data
  if (income === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-md shadow-xl rounded-3xl p-8 text-center">
          <h1 className="text-3xl font-serif font-bold text-gray-800 mb-4">
            No Budget Found
          </h1>
          <p className="text-gray-600 mb-8">
            You need to set up your budget first before accessing the dashboard.
          </p>
          <button
            onClick={() => router.push("/budget")}
            className="px-6 py-3 bg-blue-500 text-white font-medium text-lg rounded-lg shadow-md hover:bg-blue-600 transition"
          >
            Create Budget
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-6">
      <div className="max-w-6xl w-full bg-white/80 backdrop-blur-md shadow-xl rounded-3xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-gray-800">
            Budget Dashboard
          </h1>
          <div className="flex space-x-3">
            <button
              onClick={handleEditBudget}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793a2 2 0 012.828 0zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
              </svg>
              Edit Budget
            </button>
            <button
              onClick={handleGoToTransactions}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              New Transaction
            </button>
          </div>
        </div>

        {/* Income Summary */}
        <div className="bg-gray-50 rounded-lg shadow-md overflow-hidden mb-8 animate-fadeIn">
          <div className="p-4 bg-gradient-to-r from-blue-100 to-purple-100">
            <h2 className="text-xl font-serif font-bold text-gray-800">Total Monthly Income</h2>
            <p className="text-3xl font-bold text-gray-800">${income.toFixed(2)}</p>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left column: Pie chart */}
          <div className="bg-white rounded-lg shadow-md p-4 animate-fadeIn">
            <h2 className="text-xl font-serif font-bold text-gray-800 mb-4 text-center">Budget Allocation</h2>
            <div className="h-64">
              <Pie data={pieData} options={chartOptions} />
            </div>
          </div>

          {/* Middle and right columns: Categories breakdown */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((category, index) => (
              <div 
                key={category.name} 
                className="bg-white rounded-lg shadow-md overflow-hidden animate-fadeIn"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`p-4 ${
                  category.name === "Needs" 
                    ? "bg-gradient-to-r from-teal-100 to-green-100" 
                    : category.name === "Wants" 
                      ? "bg-gradient-to-r from-blue-100 to-indigo-100" 
                      : "bg-gradient-to-r from-orange-100 to-amber-100"
                }`}>
                  <h2 className="text-lg font-serif font-bold text-gray-800">{category.name}</h2>
                  <div className="flex justify-between items-end">
                    <p className="text-2xl font-bold text-gray-800">
                      ${category.totalAmount.toFixed(2)}
                    </p>
                    <p className={`text-sm font-medium ${getSpendingColorClass(category.spent, category.totalAmount)}`}>
                      ${category.spent.toFixed(2)} spent
                    </p>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="px-4 py-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div 
                      className={`h-2.5 rounded-full ${getProgressBarColor(category.spent, category.totalAmount)}`}
                      style={{ width: `${Math.min(calculatePercentage(category.spent, category.totalAmount), 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 text-right">
                    {Math.min(calculatePercentage(category.spent, category.totalAmount), 100).toFixed(1)}% used
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed breakdown by category */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <div 
              key={category.name} 
              className="bg-white rounded-lg shadow-md p-5 animate-fadeIn"
              style={{ animationDelay: `${(index + 3) * 100}ms` }}
            >
              <h2 className="text-xl font-serif font-bold text-gray-800 mb-4">
                {category.name} Breakdown
              </h2>
              
              {category.subDivisions.length === 0 ? (
                <p className="text-gray-500 italic">No sub-divisions defined</p>
              ) : (
                <div className="space-y-4">
                  {category.subDivisions.map((sub, idx) => (
                    <div key={idx} className="animate-slideIn" style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className="flex justify-between mb-1">
                        <h3 className="text-md font-medium text-gray-700">{sub.name}</h3>
                        <p className={`text-sm ${getSpendingColorClass(sub.spent, sub.amount)}`}>
                          ${sub.spent.toFixed(2)} / ${sub.amount.toFixed(2)}
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressBarColor(sub.spent, sub.amount)}`}
                          style={{ width: `${Math.min(calculatePercentage(sub.spent, sub.amount), 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{sub.percentage.toFixed(0)}% of {category.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );}