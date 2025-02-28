import { NextResponse } from "next/server";
import { connectToDB, clientPromise } from "@/lib/mongodb";
import { Db } from "mongodb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productName = searchParams.get("product");
    const category = searchParams.get("category");

    if (!productName || !category) {
      return NextResponse.json({ error: "Missing product or category" }, { status: 400 });
    }

    // Connect to MongoDB
    await connectToDB();
    const client = await clientPromise;
    const db: Db = client.db("dynamic_pricing");

    // ✅ Fetch product details including weights
    const productDoc = await db.collection("product").findOne(
      { category, "products.product_name": productName }, 
      { projection: { "products.$": 1, d_weight: 1, p_weight: 1, r_weight: 1 } } // Fetch weights
    );

    if (!productDoc || !productDoc.products) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const productDetails = productDoc.products[0];
    const { d_weight, p_weight, r_weight } = productDoc; // Extract weights

    // ✅ Fetch demand score from "demand_score" collection
    const demandScoreDoc = await db.collection("demand_score").findOne({ product_name: productName });
    const demandScore = demandScoreDoc ? demandScoreDoc.demand_score : 50; // Default to 50 if missing

    return NextResponse.json({ productDetails, demandScore, d_weight, p_weight, r_weight });
  } catch (error) {
    console.error("❌ Error fetching product data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
