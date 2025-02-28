import { NextRequest, NextResponse } from 'next/server';
import { Db, Document, UpdateFilter } from 'mongodb';
import {clientPromise} from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  console.log("🔥 API HIT: /api/addDashboard");

  try {
    const body = await req.json();
    console.log("📩 Received Data:", body);

    if (!body.userId || !body.io_cost || !body.io_rating || !body.product || !body.category) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db: Db = client.db('dynamic_pricing');
    const usersCollection = db.collection<Document>('user');

    console.log("🔍 Checking if user exists...");
    const user = await usersCollection.findOne({ user_id: body.userId });

    if (!user) {
      console.log("❌ User not found!");
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    console.log("✅ User exists, updating dashboard...");
    
    // Ensure `dashboard` is an array before pushing data
    const updateData: UpdateFilter<Document> = Array.isArray(user.dashboard)
      ? { $push: { dashboard: { io_cost: body.io_cost, io_rating: body.io_rating, product: body.product,category: body.category, } as any } }
      : { $set: { dashboard: [{ io_cost: body.io_cost, io_rating: body.io_rating, product: body.product,category: body.category, }] } };

    const result = await usersCollection.updateOne(
      { user_id: body.userId },
      updateData
    );

    console.log("🛠 Update Result:", result);

    return NextResponse.json({ message: 'Dashboard added/updated successfully' }, { status: 201 });
  } catch (error) {
    console.error("🚨 Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
