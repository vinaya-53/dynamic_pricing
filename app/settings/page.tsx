"use client";

import { useState } from "react";

export default function Settings() {
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const userId = "example@gmail.com"; // Placeholder, replace with dynamic userId if needed

  const addCategory = async () => {
    if (!category) {
      setMessage("⚠️ Please enter a category.");
      return;
    }

    const response = await fetch("/api/newcategory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: category, email: userId }),
    });

    const data = await response.json();
    if (response.ok) {
      setMessage(
        "✅ Requested successfully! It may take 2-3 weeks to collect data and update. We will email you when it's ready."
      );
      setCategory("");
    } else {
      setMessage(data.error || "❌ Failed to add category. Please try again.");
    }
  };

  return (
    
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Settings</h2>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        
        <input
          type="text"
          placeholder="Enter category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <button
          onClick={addCategory}
          className="mt-4 w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition"
        >
          + Request Category
        </button>

        {message && (
          <p className="mt-4 text-sm text-gray-700 bg-gray-200 p-3 rounded-md">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
