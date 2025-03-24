import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  try {
    const { csvData, category } = req.body;

    // API URL
    const API_URL = "http://localhost:8000/predict/";

    // Send request to FastAPI backend
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv_data: csvData, category }),
    });

    if (!response.ok) throw new Error("Prediction failed.");

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Prediction error:", error);
    return res.status(500).json({ message: "Error fetching predictions" });
  }
}
