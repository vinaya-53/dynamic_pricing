import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";

const SalesChart = () => {
  const [labels, setLabels] = useState<string[]>([]);
  const [salesData, setSalesData] = useState<number[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/predict/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        features: [[0.1, 0.2, ..., 0.65]], // Replace with real feature values
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setLabels(data.months);
        setSalesData(data.predictions);
      })
      .catch((err) => console.error("Error fetching data:", err));
  }, []);

  return (
    <div>
      <h2>Sales Prediction for Next 5 Months</h2>
      <Line
        data={{
          labels: labels,
          datasets: [
            {
              label: "Predicted Sales",
              data: salesData,
              borderColor: "purple",
              backgroundColor: "rgba(75,192,192,0.2)",
              fill: true,
            },
          ],
        }}
      />
    </div>
  );
};

export default SalesChart;
