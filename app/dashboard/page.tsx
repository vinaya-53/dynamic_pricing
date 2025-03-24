"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Plus, Edit, LogOut , Settings} from "lucide-react";
import ForecastComponent from "../../components/ForecastComponent";
import { Product, Category } from "@/model/product";
import { Doughnut } from "react-chartjs-2";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  Title,
  Legend,
} from "chart.js";
import { LineChart, Tooltip,Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
ChartJS.register(CategoryScale, LinearScale, ArcElement, Title, Legend);

const Dashboard = () => {
  interface DashboardEntry {
    product: string;
    io_cost: number;
    io_rating: number;
    category: string;
    dynamic_price?: number;
    price_score?: number;
    rating_score?: number;
    demand_score?: number;
  }
  interface UserPricingData {
  user_id: string;
  user_name: string;
  email: string;
  dashboard: DashboardEntry[];
}
interface PredictionData {
  date: string;
  sales: number;
}


  const [dashboards, setDashboards] = useState<DashboardEntry[]>([]);
  const [activeDashboard, setActiveDashboard] = useState<DashboardEntry | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<DashboardEntry | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newDashboard, setNewDashboard] = useState({ product: '',category: '', io_cost: '', io_rating: '' });
  const [isRightMenuOpen, setIsRightMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);// Store categories
  const [selectedCategory, setSelectedCategory] = useState(""); // Selected category
  const [products, setProducts] = useState<Product[]>([]); // Products based on category
  const [pricingData, setPricingData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const [category, setCategory] = useState("SEAFOOD");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [features, setFeatures] = useState(new Array(63).fill(0.1));
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem("userId", currentUser.uid);
        fetchDashboards(currentUser.uid);
      } else {
        setUser(null);
        localStorage.removeItem("userId");
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/categories"); // Adjust API endpoint
        const data = await response.json();
        console.log(data);
        setCategories(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);
  // === Fetch Dashboards ===
  const fetchDashboards = async (userId: string) => {
    try {
      const response = await fetch(`/api/dashboard?userId=${userId}`);
      const data = await response.json();
      userId=data.email;
      console.log("here : ",userId);
     
      setDashboards(data.dashboards);
      setUserId(data.email);
    } catch (error) {
      console.error("❌ Error fetching dashboards:", error);
    }
  };
  console.log("here : ",userId);
  // === Fetch Product Data ===
  const fetchProductData = async (product: string, category: string) => {
    try {
      const response = await fetch(`/api/products?category=${category}&product=${product}`);
      return await response.json();
    } catch (error) {
      console.error("❌ Error fetching product data:", error);
      return {};
    }
  };
  
  
  const handleNewDashboardSubmit = async () => {
    if (!newDashboard.product || !newDashboard.io_cost || !newDashboard.io_rating) {
      alert("⚠ All fields are required!");
      return;
    }

    try {
      const response = await fetch("/api/addDashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newDashboard,
          io_cost: Number(newDashboard.io_cost), 
          io_rating: Number(newDashboard.io_rating),
          userId: user?.uid,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("✅ Dashboard successfully created!");
        setDashboards([...dashboards, data.dashboard]); 
        setIsFormOpen(false);
        setNewDashboard({ product: "",  category: "",io_cost: "", io_rating: "" });
      } else {
        alert("❌ Failed to create dashboard.");
      }
    } catch (error) {
      console.error("❌ Error adding dashboard:", error);
      alert("❌ An error occurred.");
    }
  };
 
  const fetchPredictions = async (category: string) => {
    try {
      const response = await axios.post("http://127.0.0.1:8000/predict/", { category });
      const { future_dates, predictions } = response.data;
     
      // Define type explicitly
      interface PredictionData {
        date: string;
        sales: number;
      }
  
      // Ensure valid data & sorting
      const formattedData: PredictionData[] = future_dates
        .map((date: string, index: number): PredictionData => ({
          date,
          sales: parseFloat(predictions[index]?.toFixed(2)), // Convert string to number
        }))
        .filter((item: PredictionData) => !isNaN(item.sales)) // Remove invalid values
        .sort((a: PredictionData, b: PredictionData) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Ensure chronological order
  
      setPredictions(formattedData);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "An error occurred");
    }
  };
  
  

  const handleCancel = () => {
    setNewDashboard({ category: "", product: "", io_cost: "", io_rating: "" });
    setIsModalOpen(false); // Fully close modal
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(
        (dashboards ?? [])
          .filter((d) => d && d.product) // Ensure d is not undefined/null and has product
          .map((d) => d.product) // Extract product safely
      );
      return;
    }
  
    const uniqueProducts = Array.from(
      new Set(
        (dashboards ?? [])
          .filter((d) => d && d.product) // Ensure no undefined/null entries
          .map((d) => d.product) // Extract product safely
      )
    );
  
    setFilteredProducts(
      uniqueProducts.filter((product) =>
        product.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, dashboards]);


  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");// Redirect to login page after sign-out
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // === Handle Product Selection ===
  const handleProductSelection = async (dashboard: DashboardEntry) => {
    setActiveDashboard(dashboard);
  
    if (!user) {
      console.warn("⚠ No user logged in!");
      return;
    }
  
    const { product, io_cost, io_rating, category } = dashboard;
  
    // ✅ Fetch product details & demand score
    const { productDetails, demandScore,d_weight, p_weight, r_weight } = await fetchProductData(product, category);
    const priceWeight = p_weight ?? 0.7;
    const ratingWeight = r_weight ?? 0.2;
    const demandWeight = d_weight ?? 0.1;
    const noise =0.01;
    console.log("weights",priceWeight,demandWeight,ratingWeight);
    console.log("📦 Product Details:", productDetails);
    console.log("📈 Raw Demand Score from DB:", demandScore);
  
    // ✅ Fetch competitor pricing & rating
    const competitorPrices = productDetails.product_costs?.length ? productDetails.product_costs : [io_cost];
    const competitorRatings = productDetails.ratings?.length ? productDetails.ratings : [io_rating];
  
    console.log("💰 Competitor Prices:", competitorPrices);
    console.log("⭐ Competitor Ratings:", competitorRatings);
  
    // ✅ Compute average competitor price
    const avgCompetitorPrice =
      competitorPrices.reduce((sum: number, price: number) => sum + price, 0) / competitorPrices.length;
  
    console.log("📊 Average Competitor Price:", avgCompetitorPrice);
    const avgCompetitorRating =
      competitorRatings.reduce((sum: number, rating: number) => sum + rating, 0) / competitorRatings.length;
  
    console.log("📊 Average Competitor Price:", avgCompetitorPrice);
    const ratingScore = Math.max(1, Math.min(5, 3 + Math.log2(io_rating / avgCompetitorRating)));

    // ✅ Compute price score correctly
    const computePriceScore = (userPrice: number, competitorAvgPrice: number) => {
      if (competitorAvgPrice === 0) return 3; // Default mid-score if no competitor data
      return Math.max(1, Math.min(5, 3 + Math.log2(userPrice / competitorAvgPrice)));
    };
  
    const priceScore = computePriceScore(io_cost, avgCompetitorPrice);
    console.log("📊 Price Score:", priceScore);
  
    console.log("📊 Rating Score:", ratingScore);
  
    // ✅ Normalize demand score between 0-5
    const normalizeDemandScore = (rawScore: number, minDemand: number, maxDemand: number) => {
      if (maxDemand === minDemand) return 2.5; // Avoid division by zero
      return 1 + ((rawScore - minDemand) / (maxDemand - minDemand)) * 4;
    };
  
    // Fetch min/max demand scores dynamically from the DB
    const fetchMinMaxDemand = async () => {
      try {
        const response = await fetch(`/api/demand_score_range`);
        const data = await response.json();
        return { min: data.minDemand, max: data.maxDemand };
      } catch (error) {
        console.error("❌ Error fetching min/max demand score:", error);
        return { min: 0, max: 100 }; // Default range if error
      }
    };
  
    const { min, max } = await fetchMinMaxDemand();
    const normalizedDemandScore = normalizeDemandScore(demandScore, min, max);
  
    console.log("🎯 Normalized Demand Score (0-5):", normalizedDemandScore);
  
    // ✅ Compute suggested price
    const marketValue =  (avgCompetitorPrice *
    ((priceWeight * priceScore + ratingWeight * ratingScore + demandWeight * normalizedDemandScore) / 5))+noise;
   /* let suggestedPrice = Math.max(marketValue, io_cost * 1.15);*/
   let suggestedPrice = marketValue;
    console.log("💵 Suggested Price:", suggestedPrice);
  
    // ✅ Update UI
    setSelectedProduct({
      ...dashboard,
      dynamic_price: parseFloat(suggestedPrice.toFixed(2)),
      price_score: parseFloat(priceScore.toFixed(2)),
      rating_score: parseFloat(ratingScore.toFixed(2)),
      demand_score: parseFloat(normalizedDemandScore.toFixed(2)), // ✅ Now properly normalized
    });
    await fetchPredictions(dashboard.category); 
  };
  
  

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg h-screen p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Menu</h1>
          <button 
        onClick={() => setIsModalOpen(true)} 
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        Add Dashboard
      </button>

      {/* Pop-up Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-100 p-6 rounded-lg shadow-xl w-96 border border-gray-300">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96 border border-gray-300">
            <h2 className="text-lg font-semibold mb-4">Add New Dashboard</h2>

            {/* Category Dropdown */}
            <select
              value={newDashboard.category}
              onChange={(e) => {
                const selectedCategory = e.target.value;
                setNewDashboard({ ...newDashboard, category: selectedCategory, product: "" });

                // Update product list based on selected category
                const selectedCategoryData = categories.find(cat => cat.category === selectedCategory);
                setProducts(selectedCategoryData?.products || []);
              }}
              className="w-full p-2 mb-2 border rounded"
            >
              <option value="">-- Select Category --</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.category}>
                  {cat.category}
                </option>
              ))}
            </select>

            {/* Product Dropdown */}
            <select
              value={newDashboard.product}
              onChange={(e) => setNewDashboard({ ...newDashboard, product: e.target.value })}
              className="w-full p-2 mb-2 border rounded"
              disabled={!newDashboard.category}
            >
              <option value="">-- Select Product --</option>
              {products.map((product) => (
                <option key={product.product_id} value={product.product_name}>
                  {product.product_name}
                </option>
              ))}
            </select>

            {/* Cost Input */}
            <input
              type="number"
              placeholder="Cost"
              value={newDashboard.io_cost}
              onChange={(e) => setNewDashboard({ ...newDashboard, io_cost: e.target.value })}
              className="w-full p-2 mb-2 border rounded"
            />

            {/* Rating Input */}
            <input
              type="number"
              step="0.1"
              placeholder="Rating"
              value={newDashboard.io_rating}
              onChange={(e) => setNewDashboard({ ...newDashboard, io_rating: e.target.value })}
              className="w-full p-2 mb-2 border rounded"
            />

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <button 
                onClick={handleNewDashboardSubmit} 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Submit
              </button>
              <button 
                onClick={handleCancel} 
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

          {/* Dashboard List */}
          <div className="space-y-2 mt-4">
            {dashboards.length > 0 ? (
              dashboards.map((dashboard) => (
                <button
                  key={dashboard?.product}
                  className={`w-full text-left p-2 rounded transition ${
                    activeDashboard?.product === dashboard?.product
                      ? "bg-purple-500 text-white"
                      : "hover:bg-gray-200"
                  }`}
                  onClick={() => handleProductSelection(dashboard)}
                >
                  {dashboard?.product}
                </button>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No dashboards available.</p>
            )}
          </div>
        </div>

        {/* Bottom Section: Logout & Settings */}
        <div className="space-y-4">
          <button
            className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-200 transition"
            onClick={() => router.push(`/settings`)}

          >
            ⚙️ Settings
          </button>

          <button
            className="w-full flex items-center gap-2 p-2 rounded text-red-600 hover:bg-red-100 transition"
            onClick={handleLogout}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

        <div className="flex flex-row items-start">
          {/* Left Section: Sales Forecast Graph */}
          <div className="flex-1 bg-white p-6 shadow-md rounded-lg">
            <h2 className="text-xl font-bold mb-4">Sales Forecast</h2>
            {predictions.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={predictions}>
                  <XAxis dataKey="date" tickFormatter={(tick) => tick.substring(5)} />
                  <YAxis domain={['auto', 'auto']} padding={{ top: 10, bottom: 10 }} />

                  <Tooltip />
                  <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">No predictions available.</p>
            )}
          </div>

          {/* Right Section: Score Donut Charts */}
          {selectedProduct && (
            <div className="flex flex-col gap-6 ml-6">
              {/* Price Score Donut */}
              <div className="w-40 h-40 relative">
                <Doughnut
                  data={{
                    labels: ["Price Score", "Remaining"],
                    datasets: [
                      {
                        data: [selectedProduct?.price_score ?? 0, 5 - (selectedProduct?.price_score ?? 0)],
                        backgroundColor: ["#3b82f6", "#e5e7eb"],
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "70%",
                    plugins: { tooltip: { enabled: false } },
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-blue-600 font-bold text-lg">
                  {selectedProduct?.price_score?.toFixed(1) ?? "N/A"}
                </div>
                <p className="text-center mt-2 text-blue-600 font-semibold">Price Score</p>
              </div>

              {/* Rating Score Donut */}
              <div className="w-40 h-40 relative">
                <Doughnut
                  data={{
                    labels: ["Rating Score", "Remaining"],
                    datasets: [
                      {
                        data: [selectedProduct?.rating_score ?? 0, 5 - (selectedProduct?.rating_score ?? 0)],
                        backgroundColor: ["#f59e0b", "#e5e7eb"],
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "70%",
                    plugins: { tooltip: { enabled: false } },
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-yellow-600 font-bold text-lg">
                  {selectedProduct?.rating_score?.toFixed(1) ?? "N/A"}
                </div>
                <p className="text-center mt-2 text-yellow-600 font-semibold">Rating Score</p>
              </div>

              {/* Demand Score Donut */}
              <div className="w-40 h-40 relative">
                <Doughnut
                  data={{
                    labels: ["Demand Score", "Remaining"],
                    datasets: [
                      {
                        data: [selectedProduct?.demand_score ?? 0, 5 - (selectedProduct?.demand_score ?? 0)],
                        backgroundColor: ["#10b981", "#e5e7eb"],
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "70%",
                    plugins: { tooltip: { enabled: false } },
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-green-600 font-bold text-lg">
                  {selectedProduct?.demand_score?.toFixed(1) ?? "N/A"}
                </div>
                <p className="text-center mt-2 text-green-600 font-semibold">Demand Score</p>
              </div>
            </div>
          )}
        </div>

        {/* Product & Pricing Details */}
        {selectedProduct && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-2">📦 Product Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <p><strong>Product:</strong> {selectedProduct.product ?? "N/A"}</p>
              <p><strong>Category:</strong> {selectedProduct.category ?? "N/A"}</p>
              <p><strong>Cost:</strong> ₹{selectedProduct.io_cost?.toFixed(2) ?? "N/A"}</p>
              <p><strong>Suggested Price:</strong> ₹{selectedProduct.dynamic_price?.toFixed(2) ?? "N/A"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


export default Dashboard;