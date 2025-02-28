"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Signing up with:", formData);
    // Handle signup logic here
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 p-6">
      <h1 className="text-3xl font-bold text-purple-700 mb-6">Sign Up</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 border border-gray-300 rounded"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-4 border border-gray-300 rounded"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
        <button
          type="submit"
          className="w-full bg-purple-600 text-white font-bold p-3 rounded hover:bg-purple-700"
        >
          Sign Up
        </button>
      </form>
      <p className="mt-4 text-gray-600">
        Already have an account?{" "}
        <span
          className="text-purple-600 font-bold cursor-pointer hover:underline"
          onClick={() => router.push("/login")}
        >
          Login
        </span>
      </p>
    </main>
  );
}
