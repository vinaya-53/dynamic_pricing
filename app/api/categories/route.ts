import { NextRequest, NextResponse } from "next/server";
import { Db } from "mongodb";
import { clientPromise } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db: Db = client.db("dynamic_pricing");
    const categories = await db.collection("product").find({}).toArray();

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
