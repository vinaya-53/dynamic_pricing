"use client";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 p-6">
      <h1 className="text-3xl font-bold text-purple-700 mb-6">Login</h1>
      <AuthForm />
      <p className="mt-4 text-gray-600">
        Don’t have an account?{" "}
        <span
          className="text-purple-600 font-bold cursor-pointer hover:underline"
          onClick={() => router.push("/signup")}
        >
          Sign Up
        </span>
      </p>
    </main>
  );
}
