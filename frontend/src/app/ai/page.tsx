"use client";

import { useState } from "react";

export default function WealthAI() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      // Some sample financial advice responses
      const responses = [
        "Based on your current spending patterns, I recommend allocating an additional 5% of your income to your emergency fund.",
        "Your 'Dining Out' expenses have increased by 15% compared to last month. Consider setting a stricter budget for this category.",
        "You're doing well with your savings goal! At this rate, you'll reach your target in approximately 7 months.",
        "I notice you haven't allocated any budget for healthcare. It's advisable to set aside at least 3-5% of your income for medical expenses.",
        "Your current debt-to-income ratio is healthy. Keep maintaining this balance for optimal financial health.",
      ];

      // Pick a random response
      const randomResponse =
        responses[Math.floor(Math.random() * responses.length)];
      setResponse(randomResponse);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-6">
      <div className="max-w-4xl w-full bg-white/80 backdrop-blur-md shadow-xl rounded-3xl p-8">
        <h1 className="text-4xl font-serif font-bold text-gray-800 mb-6">
          Wealth AI Assistant
        </h1>

        <p className="text-gray-600 mb-8">
          Ask questions about your budget, get personalized financial advice, or
          seek insights on your spending patterns.
        </p>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask something about your finances..."
              className="flex-1 p-4 rounded-l-lg border border-gray-300 bg-gray-50 text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white p-4 rounded-r-lg hover:bg-blue-600 transition"
              disabled={loading}
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5"
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
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>
        </form>

        {response && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg animate-fadeIn">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">{response}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12">
          <h2 className="text-2xl font-serif font-bold text-gray-800 mb-4">
            Quick Insights
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-md font-medium text-gray-800 mb-2">
                Budget Health
              </h3>
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                  <div
                    className="bg-green-500 h-2.5 rounded-full"
                    style={{ width: "85%" }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-600">85%</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-md font-medium text-gray-800 mb-2">
                Savings Rate
              </h3>
              <div className="flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                  <div
                    className="bg-blue-500 h-2.5 rounded-full"
                    style={{ width: "23%" }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-600">23%</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-md font-medium text-gray-800 mb-2">
                Top Expense
              </h3>
              <p className="text-gray-600">Housing: 32% of total spending</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-md font-medium text-gray-800 mb-2">
                Financial Goal
              </h3>
              <p className="text-gray-600">Emergency Fund: 60% complete</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
