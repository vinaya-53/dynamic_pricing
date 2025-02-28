import { NextRequest, NextResponse } from "next/server";
import { connectToDB, clientPromise } from "@/lib/mongodb";
import { Db, Document, ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "Missing userId" }, { status: 400 });
    }

    await connectToDB();
    const client = await clientPromise;
    const db: Db = client.db("dynamic_pricing");
    const usersCollection = db.collection<Document>("user");

    let query;
    if (ObjectId.isValid(userId) && userId.length === 24) {
      query = { _id: new ObjectId(userId) };
    } else {
      query = { user_id: userId };
    }

    const user = await usersCollection.findOne(query);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user_name: user.user_name,
      email: user.email,
      dashboards: user.dashboard ?? [],
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
