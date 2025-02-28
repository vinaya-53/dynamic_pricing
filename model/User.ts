import mongoose from "mongoose";

const DashboardSchema = new mongoose.Schema({
  io_cost: { type: Number, required: true },
  io_rating: { type: Number, required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
});

const UserSchema = new mongoose.Schema({
  _id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true, unique: true },
  user_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Should be hashed
  dashboard: [DashboardSchema], // ✅ Now supports multiple dashboard entries
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
