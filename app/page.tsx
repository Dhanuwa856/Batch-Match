'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { createClient } from '../utils/supabase';

export default function Home() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Check if it's a valid campus email
    if (!email.endsWith('@itum.mrt.ac.lk')) {
      setMessage('Please enter a valid @itum.mrt.ac.lk email address 🚫');
      setLoading(false);
      return;
    }

    // Send Magic Link
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setMessage('Authentication Error: ' + error.message);
    } else {
      setMessage('Magic link sent! Please check your inbox (and spam folder) 💌');
      setEmail('');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-200 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="mb-8"
      >
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="bg-white p-5 rounded-full shadow-xl"
        >
          <Heart className="w-16 h-16 text-pink-500 fill-pink-500" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center max-w-md w-full bg-white rounded-3xl shadow-2xl p-8"
      >
        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
           Secret Admirer
        </h1>
        <p className="text-gray-500 mb-8 font-medium">
          Find out if your batchmate has a secret crush on you! 100% anonymous.
        </p>

        <form onSubmit={handleMagicLinkLogin} className="flex flex-col gap-5">
          <div className="relative">
            <input
              type="email"
              placeholder="e.g. 24it0500@itum.mrt.ac.lk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-100 text-center text-gray-800 font-semibold placeholder-gray-400 transition-all"
            />
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || !email}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 px-4 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
          >
            {loading ? 'Sending Secure Link...' : 'Login with Magic Link ✨'}
          </motion.button>
        </form>
        
        {message && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 font-semibold p-4 rounded-xl text-sm ${message.includes('Please') || message.includes('Error') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}
          >
            {message}
          </motion.p>
        )}
      </motion.div>
      {/* Footer Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-4 left-0 w-full text-center z-10"
      >
     
        <p className="text-gray-400 text-xs mt-1">
          © 2026 Secret Admirer. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}