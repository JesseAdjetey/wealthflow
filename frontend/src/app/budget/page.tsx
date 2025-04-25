"use client";

import { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { getBudgetContract } from "../utils/contract";
import { connectWallet } from "../utils/wallet";
import { useRouter } from "next/navigation";

ChartJS.register(ArcElement, Tooltip, Legend);

// Define the type for a sub-division
type SubDivision = {
  category: string;
  name: string;
  amount: string;
};

export default function Budget() {
  const [income, setIncome] = useState("");
  const [needs, setNeeds] = useState(0);
  const [wants, setWants] = useState(0);
  const [savings, setSavings] = useState(0);
  const [dailyNeedsLimit, setDailyNeedsLimit] = useState(0);
  const [dailyWantsLimit, setDailyWantsLimit] = useState(0);
  const [subDivisions, setSubDivisions] = useState<SubDivision[]>([
    { category: "Needs", name: "", amount: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [existingData, setExistingData] = useState(false);
  const router = useRouter();

  // Handle income input and calculate 50/30/20 split
  const handleIncomeChange = (value: string) => {
    setIncome(value);
    const incomeValue = parseFloat(value) || 0;

    // Calculate 50/30/20 split
    const calculatedNeeds = incomeValue * 0.5;
    const calculatedWants = incomeValue * 0.3;
    const calculatedSavings = incomeValue * 0.2;

    setNeeds(calculatedNeeds);
    setWants(calculatedWants);
    setSavings(calculatedSavings);

    // Calculate daily limits for Needs and Wants
    setDailyNeedsLimit(calculatedNeeds / 30);
    setDailyWantsLimit(calculatedWants / 30);
  };

  // Add a new sub-division slot
  const handleAddSubDivisionSlot = () => {
    setSubDivisions((prev) => [
      ...prev,
      { category: "Needs", name: "", amount: "" },
    ]);
  };

  // Handle sub-division input changes
  const handleSubDivisionChange = (
    index: number,
    field: keyof SubDivision,
    value: string
  ) => {
    const updatedSubDivisions = [...subDivisions];
    updatedSubDivisions[index][field] = value;
    setSubDivisions(updatedSubDivisions);
  };

  // Fetch existing budget data if available
  useEffect(() => {
    const checkExistingData = async () => {
      try {
        setLoading(true);
        const provider = await connectWallet();
        if (!provider) return;

        const budgetContract = await getBudgetContract(provider);

        // Get the signer and wallet address
        const signer = await provider.getSigner();
        const walletAddress = await signer.getAddress();

        // Fetch budget summary
        const [
          incomeValue,
          dailyLimit,
          needsAmount,
          wantsAmount,
          savingsAmount,
        ] = await budgetContract.getBudgetSummary(walletAddress);

        // If income is greater than 0, we have existing data
        if (parseFloat(incomeValue.toString()) > 0) {
          setExistingData(true);
          setIncome(incomeValue.toString());
          setNeeds(parseFloat(needsAmount.toString()));
          setWants(parseFloat(wantsAmount.toString()));
          setSavings(parseFloat(savingsAmount.toString()));

          // Fetch sub-divisions for each category
          const fetchSubDivisions = async (category: string) => {
            const [names, amounts, percentages, spent] =
              await budgetContract.getSubDivisions(category);

            return names.map((name: string, index: number) => ({
              category,
              name,
              amount: amounts[index].toString(),
            }));
          };

          const needsSubDivisions = await fetchSubDivisions("Needs");
          const wantsSubDivisions = await fetchSubDivisions("Wants");
          const savingsSubDivisions = await fetchSubDivisions("Savings");

          // Combine all sub-divisions
          const allSubDivisions = [
            ...needsSubDivisions,
            ...wantsSubDivisions,
            ...savingsSubDivisions,
          ];

          if (allSubDivisions.length > 0) {
            setSubDivisions(allSubDivisions);
          }
        }
      } catch (error) {
        console.error("Failed to check existing budget data:", error);
      } finally {
        setLoading(false);
        setDataFetched(true);
      }
    };

    checkExistingData();
  }, []);

  // Add all sub-divisions to the smart contract
  const handleAddSubDivisions = async () => {
    try {
      setLoading(true);
      const provider = await connectWallet();
      const budgetContract = await getBudgetContract(provider);

      // First set the initial budget if this is a new budget
      if (!existingData) {
        const incomeValue = parseFloat(income);
        if (isNaN(incomeValue) || incomeValue <= 0) {
          alert("Please enter a valid income amount.");
          setLoading(false);
          return;
        }

        const tx = await budgetContract.setInitialBudget(incomeValue);
        await tx.wait();
      }

      // Then add all sub-divisions
      for (const subDivision of subDivisions) {
        const { category, name, amount } = subDivision;
        const parsedAmount = parseFloat(amount);

        if (!name || parsedAmount <= 0) {
          alert("Please enter a valid name and amount for all sub-divisions.");
          setLoading(false);
          return;
        }

        // Save the sub-division to the smart contract
        const tx = await budgetContract.addSubDivision(
          category,
          name,
          parsedAmount
        );
        await tx.wait();
      }

      alert("Budget and sub-divisions saved successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to save budget data:", error);
      alert("An error occurred while saving the budget data.");
    } finally {
      setLoading(false);
    }
  };

  // Pie chart data
  const chartData = {
    labels: ["Needs (50%)", "Wants (30%)", "Savings (20%)"],
    datasets: [
      {
        data: [needs, wants, savings],
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
        position: "bottom" as const,
        labels: {
          font: {
            family: "serif",
            size: 14,
          },
        },
      },
    },
    maintainAspectRatio: false,
  };

  // If loading initial data, show loading screen
  if (loading && !dataFetched) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-2xl font-serif text-gray-800">
          Loading budget data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-6">
      <div className="max-w-6xl w-full bg-white/80 backdrop-blur-md shadow-xl rounded-3xl p-8">
        <h1 className="text-4xl font-serif font-bold text-gray-800 text-center mb-6">
          Budget Planner
        </h1>

        {/* Income Input */}
        <div className="mb-8">
          <label className="block text-lg font-serif text-gray-700 mb-2">
            Total Monthly Income
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium">
              $
            </span>
            <input
              type="number"
              value={income}
              onChange={(e) => handleIncomeChange(e.target.value)}
              className="w-full p-4 pl-8 rounded-lg border border-gray-300 bg-gray-50 text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-xl font-medium"
              placeholder="Enter your monthly income"
            />
          </div>
        </div>

        {/* Budget Visualization - Shown only when income is entered */}
        {parseFloat(income) > 0 && (
          <>
            {/* Budget Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="bg-gray-50 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
                <div className="p-4 bg-gradient-to-r from-teal-100 to-green-100">
                  <h3 className="text-lg font-serif text-gray-700">
                    Needs (50%)
                  </h3>
                  <p className="text-2xl font-bold text-gray-800">
                    ${needs.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Daily limit: ${dailyNeedsLimit.toFixed(2)}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600">
                    Essential expenses like housing, utilities, groceries, and
                    insurance
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
                <div className="p-4 bg-gradient-to-r from-blue-100 to-indigo-100">
                  <h3 className="text-lg font-serif text-gray-700">
                    Wants (30%)
                  </h3>
                  <p className="text-2xl font-bold text-gray-800">
                    ${wants.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Daily limit: ${dailyWantsLimit.toFixed(2)}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600">
                    Non-essential purchases like dining out, entertainment, and
                    subscriptions
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
                <div className="p-4 bg-gradient-to-r from-orange-100 to-amber-100">
                  <h3 className="text-lg font-serif text-gray-700">
                    Savings (20%)
                  </h3>
                  <p className="text-2xl font-bold text-gray-800">
                    ${savings.toFixed(2)}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600">
                    Emergency funds, investments, and financial goals
                  </p>
                </div>
              </div>
            </div>

            {/* Chart visualization */}
            <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-2xl font-serif font-bold text-gray-800 mb-4 text-center">
                Budget Allocation
              </h2>
              <div className="h-64">
                <Pie data={chartData} options={chartOptions} />
              </div>
            </div>
          </>
        )}

        {/* Sub-Division Form */}
        <div className="mb-8">
          <h2 className="text-2xl font-serif font-bold text-gray-800 mb-4">
            Budget Sub-Divisions
          </h2>
          <p className="text-gray-600 mb-6">
            Customize your budget by adding sub-divisions to each category
          </p>

          {subDivisions.map((subDivision, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fadeIn"
            >
              <div>
                <label className="block text-md font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={subDivision.category}
                  onChange={(e) =>
                    handleSubDivisionChange(index, "category", e.target.value)
                  }
                  className="w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="Needs">Needs</option>
                  <option value="Wants">Wants</option>
                  <option value="Savings">Savings</option>
                </select>
              </div>
              <div>
                <label className="block text-md font-medium text-gray-700 mb-2">
                  Sub-Division Name
                </label>
                <input
                  type="text"
                  value={subDivision.name}
                  placeholder="e.g., Rent, Groceries, Entertainment"
                  onChange={(e) =>
                    handleSubDivisionChange(index, "name", e.target.value)
                  }
                  className="w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-md font-medium text-gray-700 mb-2">
                  Monthly Amount ($)
                </label>
                <input
                  type="number"
                  value={subDivision.amount}
                  placeholder="Amount"
                  onChange={(e) =>
                    handleSubDivisionChange(index, "amount", e.target.value)
                  }
                  className="w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          ))}

          <button
            onClick={handleAddSubDivisionSlot}
            className="mt-4 px-6 py-3 bg-gray-600 text-white font-medium text-md rounded-lg shadow-md hover:bg-gray-700 transition flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add Another Sub-Division
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-gray-500 text-white font-medium text-lg rounded-lg shadow-md hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleAddSubDivisions}
            className="px-8 py-3 bg-blue-500 text-white font-medium text-lg rounded-lg shadow-md hover:bg-blue-600 transition flex items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Save Budget
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
