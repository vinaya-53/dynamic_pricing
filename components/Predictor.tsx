import { useState } from "react";

export default function Predictor() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setCsvFile(file);
  };

  const handlePredict = async () => {
    if (!csvFile || !category) {
      alert("Please upload a CSV file and select a category.");
      return;
    }

    setLoading(true);

    const reader = new FileReader();
    reader.readAsDataURL(csvFile);
    reader.onload = async () => {
      const base64Csv = reader.result?.toString().split(",")[1];

      try {
        const response = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvData: base64Csv, category }),
        });

        if (!response.ok) throw new Error("Failed to get predictions.");
        
        const { forecast } = await response.json();
        setPredictions(forecast);
      } catch (error) {
        console.error("Error fetching predictions:", error);
      } finally {
        setLoading(false);
      }
    };
  };

  return (
    <div className="p-5 border rounded-lg bg-white shadow-md">
      <h2 className="text-xl font-bold mb-3">Sales Prediction</h2>

      <input type="file" accept=".csv" onChange={handleFileUpload} className="mb-2" />
      <input
        type="text"
        placeholder="Enter category (e.g., BEAUTY)"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="border p-2 rounded w-full mb-2"
      />
      
      <button onClick={handlePredict} disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded">
        {loading ? "Predicting..." : "Predict Sales"}
      </button>

      {predictions.length > 0 && (
        <div className="mt-5">
          <h3 className="text-lg font-semibold">Prediction Results:</h3>
          <table className="table-auto w-full mt-2 border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2">Date</th>
                <th className="border px-4 py-2">Predicted Sales</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((p, index) => (
                <tr key={index} className="border">
                  <td className="border px-4 py-2">{p.date}</td>
                  <td className="border px-4 py-2">{p.predicted_sales.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
