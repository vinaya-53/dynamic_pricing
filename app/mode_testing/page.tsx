"use client"
import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ForecastComponent: React.FC = () => {
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [chartData, setChartData] = useState<{ date: string; sales_unit: number }[]>([]);

  // Fetch prediction from the backend
  const handlePrediction = async () => {
    if (!category || !startDate || !endDate) {
      alert("Please enter all fields.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, startDate, endDate }),
      });

      const data = await response.json();
      if (Array.isArray(data)) {
        setChartData(data); // Store entire dataset
      } else {
        alert("Error in prediction response");
      }
    } catch (error) {
      console.error("Error fetching prediction:", error);
      alert("Failed to get predictions. Check the backend.");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Sales Forecast</h2>

      <div className="mt-4">
        <label>Category:</label>
        <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="border p-2 ml-2" />
      </div>
      <div className="mt-2">
        <label>Start Date:</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border p-2 ml-2" />
      </div>
      <div className="mt-2">
        <label>End Date:</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border p-2 ml-2" />
      </div>

      <button onClick={handlePrediction} className="p-2 bg-green-500 text-white rounded mt-4">Predict</button>

      {chartData.length > 0 && (
        <div className="mt-4">
          <Line
            data={{
              labels: chartData.map((d) => d.date), // Extracting dates
              datasets: [
                {
                  label: `Predicted Sales for ${category}`,
                  data: chartData.map((d) => d.sales_unit), // Extracting sales values
                  borderColor: "blue",
                  borderWidth: 2,
                  pointBackgroundColor: "red",
                  pointRadius: 5,
                  fill: false,
                },
              ],
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ForecastComponent;
