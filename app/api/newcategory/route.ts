import { NextResponse } from "next/server";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI || "your-mongodb-connection-string";

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri);
};

// ✅ Define Schema and explicitly set `email` as required
const CategorySchema = new mongoose.Schema(
  { 
    name: { type: String, required: true },
    email: { type: String, required: true } // Make sure email is required
  },
  { versionKey: false }
);

const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);

export async function POST(req: Request) {
    try {
      await connectDB();
      const body = await req.json();

      console.log("📩 Received Request Body:", body); // Log received data

      const { name, email } = body;

      if (!name || !email) {
        return NextResponse.json({ error: "Category name and email are required" }, { status: 400 });
      }

      const newCategory = new Category({ name, email });
      await newCategory.save();

      console.log("✅ Successfully Saved in DB:", newCategory); // Log saved document

      return NextResponse.json({ message: "Category added successfully", category: newCategory }, { status: 201 });
    } catch (error) {
      console.error("❌ Error saving category:", error);
      return NextResponse.json({ error: "Error adding category" }, { status: 500 });
    }
}
