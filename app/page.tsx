import { redirect } from "next/navigation";

export default function Home() {
  redirect("/welcomeScreen"); // Redirect to the Welcome page first
  return null; // No UI needed, just redirection
}
