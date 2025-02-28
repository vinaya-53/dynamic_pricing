import { auth } from "@/lib/firebase";
import { getAuth } from "firebase-admin/auth";

export async function getAuthUser(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.split("Bearer ")[1];

    if (!token) {
      return null;
    }

    const decodedToken = await getAuth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying auth token:", error);
    return null;
  }
}
