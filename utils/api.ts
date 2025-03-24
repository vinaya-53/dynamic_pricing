export async function fetchPredictions(features: number[][]) {
  try {
      const response = await fetch("http://127.0.0.1:8000/predict/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ features }),
      });
      const data = await response.json();
      return data.predictions;
  } catch (error) {
      console.error("Error fetching predictions:", error);
      return [];
  }
}
