import { Db, ObjectId } from "mongodb";
import {clientPromise} from "@/lib/mongodb"; // Ensure this path matches your project structure

// Define the Dashboard interface
interface Dashboard {
  dashboard_id: string;
  name: string;
  created_at: Date;
}

// Function to add a new dashboard to a user
export async function addDashboardToUser(userId: string, dashboardName: string) {
  try {
    const client = await clientPromise;
    const db: Db = client.db("dynamic_pricing");

    const newDashboard: Dashboard = {
      dashboard_id: new ObjectId().toString(), // Generates a unique ID as a string
      name: dashboardName,
      created_at: new Date(),
    };

    // Fetch the current user data
    const user = await db.collection("user").findOne({ _id: new ObjectId(userId) });

    if (!user) {
      throw new Error("User not found.");
    }

    // Ensure dashboards array exists
    const updatedDashboards = Array.isArray(user.dashboards) ? [...user.dashboards, newDashboard] : [newDashboard];

    // Update the user document with the modified dashboards array
    const result = await db.collection("user").updateOne(
      { _id: new ObjectId(userId) },
      { $set: { dashboards: updatedDashboards } }
    );

    if (result.modifiedCount === 0) {
      throw new Error("Dashboard was not added.");
    }

    return { success: true, message: "Dashboard added successfully", dashboard: newDashboard };
  } catch (error) {
    console.error("Error adding dashboard:", error);
    return { success: false, message: "error" };
  }
}
