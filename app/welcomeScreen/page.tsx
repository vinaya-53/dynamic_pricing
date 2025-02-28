"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <main className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-purple-600 to-indigo-500 text-white text-center p-6">
      <motion.h1
        className="text-5xl font-bold mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        Welcome to My App!
      </motion.h1>
      <motion.p
        className="text-lg mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        Discover a world of possibilities.
      </motion.p>
      <motion.button
        onClick={() => router.push("/login")}
        className="bg-white text-purple-600 font-bold px-6 py-3 rounded-full shadow-lg hover:bg-gray-200 transition"
        whileHover={{ scale: 1.05 }}
      >
        Get Started
      </motion.button>
    </main>
  );
}
