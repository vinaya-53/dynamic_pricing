import { NextRequest, NextResponse } from "next/server";
import { Db } from "mongodb";
import { clientPromise } from "@/lib/mongodb";

// Constants for dynamic pricing calculations
const ALPHA_LASSO = 0.01;
const MIN_PROFIT_MARGIN = 0.15;
const MIN_DEMAND = 0;
const MAX_DEMAND = 100;

// Function to normalize demand score to a 1-5 range
const normalizeDemandScore = (rawDemand: number): number => {
  return Math.max(1, Math.min(5, 1 + ((rawDemand - MIN_DEMAND) / (MAX_DEMAND - MIN_DEMAND)) * 4));
};

// Function to compute price score
const computePriceScore = (userPrice: number, avgPrice: number): number => {
  if (avgPrice === 0 || userPrice === 0) return 3;
  const ratio = userPrice / avgPrice;
  return Math.max(1, Math.min(5, 3 + Math.log2(ratio)));
};

// Function to ensure a minimum profit margin
const enforceProfitMargin = (suggestedPrice: number, costPrice: number): number => {
  return Math.max(suggestedPrice, costPrice * (1 + MIN_PROFIT_MARGIN));
};

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db: Db = client.db("dynamic_pricing");

    // Fetch all users and products
    const users = await db.collection("user").find({}).toArray();
    const products = await db.collection("product").find({}).toArray();

    const pricingDetails = users.map(user => {
      let totalScore = 0;
      let priceList: number[] = [];

      const dashboardData = (user.dashboard || []).map((dash: any) => {
        const productDetails = products.find((p: any) => p.products.some((pr: any) => pr.product_name === dash.product));
        
        if (productDetails) {
          const matchedProduct = productDetails.products.find((pr: any) => pr.product_name === dash.product);
          if (!matchedProduct) return null;

          const demandScore = normalizeDemandScore(matchedProduct.d_weight || 0);
          const priceScore = computePriceScore(dash.io_cost, matchedProduct.product_costs.reduce((a: number, b: number) => a + b, 0) / matchedProduct.product_costs.length);
          const ratingScore = Math.max(1, Math.min(5, dash.io_rating));

          // Dynamic price calculation
          const dynamicPrice = enforceProfitMargin(
            (priceScore * 0.7 + ratingScore * 0.2 + demandScore * 0.1) * matchedProduct.product_costs.reduce((a: number, b: number) => a + b, 0) / matchedProduct.product_costs.length,
            dash.io_cost
          );

          totalScore += priceScore + ratingScore + demandScore;
          priceList.push(dynamicPrice);

          return {
            product_name: dash.product,
            io_cost: dash.io_cost,
            io_rating: dash.io_rating,
            demand_score: demandScore,
            price_score: priceScore,
            rating_score: ratingScore,
            dynamic_price: dynamicPrice.toFixed(2),
          };
        }
        return null;
      }).filter(Boolean);

      return {
        user_id: user.user_id,
        user_name: user.user_name,
        email: user.email,
        totalScore: totalScore.toFixed(2),
        priceRange: {
          min: priceList.length ? Math.min(...priceList).toFixed(2) : "N/A",
          max: priceList.length ? Math.max(...priceList).toFixed(2) : "N/A",
        },
        dashboard: dashboardData,
      };
    });

    return NextResponse.json(pricingDetails);
  } catch (error) {
    console.error("Error calculating pricing data:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
