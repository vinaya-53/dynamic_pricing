import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface ForecastComponentProps {
  selectedCategory: string;
}

const ForecastComponent: React.FC<ForecastComponentProps> = ({ selectedCategory }) => {
  const [chartData, setChartData] = useState<{ date: string; sales_unit: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!selectedCategory) return;

    const today = new Date();
    const startDate = today.toISOString().split("T")[0]; // Today
    const endDate = new Date(new Date().setMonth(today.getMonth() + 5)).toISOString().split("T")[0]; // +5 Months

    const fetchForecast = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://127.0.0.1:5000/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startDate, endDate, item: selectedCategory }),
        });

        if (!response.ok) throw new Error("Failed to fetch forecast");

        const data = await response.json();
        console.log("Forecast predictions:", data.predictions);

        if (data.predictions && Array.isArray(data.predictions)) {
          // Show only weekly data (every 7th entry)
          const weeklyData = data.predictions.filter((_, index) => index % 7 === 0);

          setChartData(
            weeklyData.map((d: any) => ({
              date: d.date,
              sales_unit: d["Predicted Sales"],
            }))
          );
        } else {
          throw new Error("Invalid forecast data format");
        }
      } catch (error) {
        console.error("Error fetching forecast:", error);
       
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [selectedCategory]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Demand Forecast for {selectedCategory} (Next 5 Months)</h2>

      <div className="border rounded-lg shadow-md p-4 bg-white max-w-3xl mx-auto">
        {loading ? (
          <p className="mt-4 text-gray-500">Loading forecast data...</p>
        ) : chartData.length > 0 ? (
          <div className="overflow-x-auto" style={{ width: "100%", height: "500px", whiteSpace: "nowrap" }}>
            <div style={{ width: `${chartData.length * 50}px`, height: "100%" }}> {/* Dynamic width */}
              <Line
                data={{
                  labels: chartData.map((d) => d.date),
                  datasets: [
                    {
                      label: `Predicted Sales (${selectedCategory})`,
                      data: chartData.map((d) => d.sales_unit),
                      borderColor: "blue",
                      borderWidth: 2,
                      pointBackgroundColor: "red",
                      pointRadius: 3,
                      fill: false,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 },
                    },
                    y: {
                      beginAtZero: true,
                    },
                  },
                  elements: {
                    line: { tension: 0.3 },
                  },
                }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-4 text-gray-500">No forecast data available.</p>
        )}
      </div>
    </div>
  );
};

export default ForecastComponent;
