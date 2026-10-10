'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-200 flex flex-col items-center justify-center p-4">
      
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="mb-8"
      >
        <div className="bg-white p-4 rounded-full shadow-lg">
          <Heart className="w-16 h-16 text-pink-500 fill-pink-500" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center max-w-md w-full bg-white rounded-2xl shadow-xl p-8"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          ITUM Secret Admirer
        </h1>
        <p className="text-gray-600 mb-8">
          Find out if your batchmate has a secret crush on you! 100% anonymous until it's a mutual match.
        </p>

        <button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition duration-300 transform hover:scale-105 shadow-md flex items-center justify-center gap-2">
          <span>Login with University Email</span>
        </button>
        
        <p className="text-xs text-gray-400 mt-4">
          *Your data is strictly confidential.
        </p>
      </motion.div>
    </div>
  );
}