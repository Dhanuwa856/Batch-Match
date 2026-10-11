'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../utils/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { Heart, Users, Sparkles, LogOut } from 'lucide-react';

export default function Dashboard() {
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedCrush, setSelectedCrush] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [mutualMatches, setMutualMatches] = useState<any[]>([]);
  const [showMatchPopup, setShowMatchPopup] = useState(false);
  const [admirersCount, setAdmirersCount] = useState(0); 

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email) {
        const { data: currentStudent } = await supabase
          .from('students')
          .select('*')
          .eq('email', user.email)
          .single();

        if (currentStudent) {
          setCurrentUser(currentStudent);
          
          const { data: otherStudents } = await supabase
            .from('students')
            .select('*')
            .neq('id', currentStudent.id)
            .order('name');
            
          setStudents(otherStudents || []);

          // 1. My Crushes
          const { data: myCrushes } = await supabase
            .from('crushes')
            .select('target_id')
            .eq('chooser_id', currentStudent.student_id);

          // 2. Secret Admirers
          const { data: crushesOnMe } = await supabase
            .from('crushes')
            .select('chooser_id')
            .eq('target_id', currentStudent.student_id);

          const crushesOnMeIds = crushesOnMe?.map(c => c.chooser_id) || [];
          setAdmirersCount(crushesOnMeIds.length); 

          // 3. Mutual Matches 
          const myCrushIds = myCrushes?.map(c => c.target_id) || [];
          const mutualIds = myCrushIds.filter(id => crushesOnMeIds.includes(id));

          if (mutualIds.length > 0) {
            const { data: matchDetails } = await supabase
              .from('students')
              .select('*')
              .in('student_id', mutualIds);
              
            if (matchDetails) {
              setMutualMatches(matchDetails);
              setShowMatchPopup(true); 
            }
          }
        } else {
          setMessage('Your account was not found in the batch list.');
        }
      }
      setLoading(false);
    }

    loadData();
  }, []);

  const handleCrushSubmit = async () => {
    if (!selectedCrush) return;
    
    const { error } = await supabase
      .from('crushes')
      .insert([
        { chooser_id: currentUser.student_id, target_id: selectedCrush }
      ]);

    if (error) {
      if (error.code === '23505') {
        setMessage("You've already sent a secret interest to this person! 😉");
      } else {
        setMessage('An error occurred. Please try again.');
      }
    } else {
      setMessage('Interest sent successfully! Your secret is safe 🤫');
      setSelectedCrush('');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) return (
    <div className="min-h-screen bg-pink-50 flex items-center justify-center">
      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }}>
        <Heart className="w-12 h-12 text-pink-500 fill-pink-500" />
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100 p-4 md:p-8 relative overflow-hidden flex flex-col items-center">
      
      {/* Mutual Match Popup */}
      <AnimatePresence>
        {showMatchPopup && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <Confetti recycle={false} numberOfPieces={600} gravity={0.2} />
            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center m-4 border-4 border-pink-100">
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex justify-center mb-4"
              >
                <Heart className="w-24 h-24 text-red-500 fill-red-500" />
              </motion.div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">It's a Match! 🎉</h2>
              <p className="text-gray-600 mb-8 font-medium">
                You and <span className="font-extrabold text-pink-600 text-lg">{mutualMatches.map(m => m.name).join(', ')}</span> have a secret crush on each other!
              </p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMatchPopup(false)}
                className="bg-gray-900 text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-colors shadow-lg"
              >
                Awesome!
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 pt-4"
      >
        
        {/* Left Side: Send Interest */}
        <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-xl p-8 border border-white/50">
          {currentUser ? (
            <>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Logged in as</p>
                  <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                    {currentUser.name} 👋
                  </h1>
                </div>
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors p-2 bg-gray-50 rounded-full hover:bg-red-50">
                  <LogOut size={20} />
                </button>
              </div>
              
              <div className="bg-pink-50 p-4 rounded-2xl mb-6">
                <p className="text-gray-700 font-medium text-sm text-center">
                  Select your secret crush from the batch list. They won't know unless they select you back!
                </p>
              </div>

              <div className="relative mb-6">
                <select 
                  /* මෙතනට අලුතින් relative, z-10 සහ text-base (16px) එකතු කළා */
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-100 text-gray-900 text-base font-bold bg-white appearance-none cursor-pointer transition-all relative z-10"
                  onChange={(e) => setSelectedCrush(e.target.value)}
                  value={selectedCrush}
                >
                  {/* පලවෙනි option එකට disabled දැම්මා iPhone වලට ලේසි වෙන්න */}
                  <option value="" disabled>✨ Select a batchmate...</option>
                  
                  {students.map((student) => (
                    <option key={student.student_id} value={student.student_id} className="text-gray-900 font-medium text-base">
                      {student.name}
                    </option>
                  ))}
                </select>
                
                {/* ඊතලය select box එකට යටින් තියන්න z-0 දැම්මා */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 z-0">
                  <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: selectedCrush ? 1.02 : 1 }}
                whileTap={{ scale: selectedCrush ? 0.98 : 1 }}
                onClick={handleCrushSubmit}
                disabled={!selectedCrush}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 px-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-all"
              >
                <Heart size={20} className={selectedCrush ? "fill-white" : ""} /> 
                Send Secret Interest
              </motion.button>

              {message && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 text-center font-bold text-sm p-4 rounded-xl ${message.includes('error') ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-700'}`}
                >
                  {message}
                </motion.p>
              )}
            </>
          ) : (
            <p className="text-red-500 font-bold text-center">{message}</p>
          )}
        </motion.div>

        {/* Right Side: Stats */}
        <div className="space-y-6">
          
          {/* Secret Admirers Count Card */}
          <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-xl p-6 flex items-center gap-5 border-l-8 border-purple-500">
            <motion.div 
              animate={{ y: [0, -5, 0] }} 
              transition={{ repeat: Infinity, duration: 4 }}
              className="bg-purple-100 p-5 rounded-2xl"
            >
              <Users className="text-purple-600 w-8 h-8" />
            </motion.div>
            <div>
              <h3 className="text-gray-500 text-sm font-extrabold uppercase tracking-widest mb-1">Secret Admirers</h3>
              <div className="flex items-baseline gap-2">
                <p className="text-5xl font-black text-gray-900">{admirersCount}</p>
                <span className="text-lg font-semibold text-gray-400">people</span>
              </div>
              <p className="text-xs text-gray-400 mt-1 font-medium">Their identities remain hidden!</p>
            </div>
          </motion.div>

          {/* Mutual Matches List Card */}
          <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-xl p-6 border-l-8 border-pink-500 min-h-[200px]">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="text-pink-500 w-7 h-7" />
              <h3 className="text-gray-900 font-extrabold text-xl">Your Mutual Matches</h3>
            </div>
            
            {mutualMatches.length > 0 ? (
              <ul className="space-y-3">
                {mutualMatches.map((match) => (
                  <motion.li 
                    whileHover={{ scale: 1.02, x: 5 }}
                    key={match.student_id} 
                    className="bg-gradient-to-r from-pink-50 to-white p-4 rounded-xl flex items-center gap-4 border border-pink-100 shadow-sm"
                  >
                    <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                    <span className="font-bold text-gray-900 text-lg">{match.name}</span>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center text-center px-4">
                <p className="text-gray-400 font-medium mb-2">No mutual matches yet.</p>
                <p className="text-sm text-gray-300">Keep sending those secret interests!</p>
              </div>
            )}
          </motion.div>

        </div>
      </motion.div>
      {/* Footer Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-4 left-0 w-full text-center z-10"
      >
     
        <p className="text-gray-400 text-xs mt-1">
          © 2026     Secret Admirer. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}