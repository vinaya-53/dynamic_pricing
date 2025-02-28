import { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string; // Ensure this is in your .env.local file
const client = new MongoClient(uri);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { user_id, user_name, email, password } = req.body;

    // Connect to MongoDB
    await client.connect();
    const db = client.db("dynamic_pricing");
    const collection = db.collection("user");

    // Insert user data
    await collection.insertOne({
      user_id,
      user_name,
      email,
      password,
    });

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await client.close();
  }
}