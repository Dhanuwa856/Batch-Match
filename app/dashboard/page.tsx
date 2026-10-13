'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../utils/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { Heart, Users, Sparkles, LogOut, UserCircle } from 'lucide-react';

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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (!user || authError) {
        setMessage('Your session has expired. Please open in Safari/Chrome and log in again.');
        setLoading(false);
        return;
      }

      if (user?.email) {
        const { data: currentStudent } = await supabase
          .from('students')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (currentStudent) {
          setCurrentUser(currentStudent);
          
          // 🚀 GENDER FILTERING LOGIC 🚀
          let query = supabase
            .from('students')
            .select('*')
            .neq('id', currentStudent.id)
            .order('name');
          
          // Database එකේ gender තියෙනවා නම් විතරක් filter කරනවා
          if (currentStudent.gender) {
            const targetGender = currentStudent.gender === 'Male' ? 'Female' : 'Male';
            query = query.eq('gender', targetGender);
          }
            
          const { data: otherStudents } = await query;
          setStudents(otherStudents || []);

          // මගේ Crushes
          const { data: myCrushes } = await supabase
            .from('crushes')
            .select('target_id')
            .eq('chooser_id', currentStudent.student_id);

          // මට තියෙන Crushes
          const { data: crushesOnMe } = await supabase
            .from('crushes')
            .select('chooser_id')
            .eq('target_id', currentStudent.student_id);

          const crushesOnMeIds = crushesOnMe?.map(c => c.chooser_id) || [];
          setAdmirersCount(crushesOnMeIds.length); 

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
          setMessage('Your university email was not found in the batch list.');
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-50 p-4 sm:p-6 md:p-8 relative overflow-hidden flex flex-col items-center">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <AnimatePresence>
        {showMatchPopup && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
          >
            <Confetti recycle={false} numberOfPieces={800} gravity={0.3} />
            <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center m-4 border border-white">
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="flex justify-center mb-4"
              >
                <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-xl" />
              </motion.div>
              <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">It's a Match! 🎉</h2>
              <p className="text-gray-600 mb-8 font-medium text-lg leading-snug">
                You and <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-purple-600">{mutualMatches.map(m => m.name).join(', ')}</span> have a secret crush on each other!
              </p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMatchPopup(false)}
                className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-lg transition-all"
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
        className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 pt-2 pb-20"
      >
        
        {/* Left Side: Send Interest (Takes more space on desktop) */}
        <motion.div variants={itemVariants} className="lg:col-span-7 bg-white/70 backdrop-blur-lg rounded-[2rem] shadow-xl p-6 sm:p-8 border border-white/50">
          {currentUser ? (
            <>
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-rose-100 to-purple-100 p-3 rounded-2xl">
                    <UserCircle className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Logged in as</p>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                      {currentUser.name}
                    </h1>
                  </div>
                </div>
                <button onClick={handleLogout} className="text-gray-400 hover:text-rose-500 transition-colors p-2 bg-white rounded-full shadow-sm hover:bg-rose-50">
                  <LogOut size={20} />
                </button>
              </div>
              
              <div className="bg-gradient-to-r from-rose-50 to-purple-50 p-5 rounded-2xl mb-8 border border-rose-100/50">
                <p className="text-gray-700 font-medium text-sm sm:text-base text-center leading-relaxed">
                  Select your secret crush. They won't know unless they select you back! 🤫
                </p>
              </div>

              <div className="relative mb-6">
                <select 
                  className="w-full p-4 sm:p-5 border-2 border-white/80 bg-white/50 backdrop-blur-sm rounded-2xl focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 text-gray-900 text-base font-bold appearance-none cursor-pointer transition-all shadow-sm relative z-10"
                  onChange={(e) => setSelectedCrush(e.target.value)}
                  value={selectedCrush}
                >
                  <option value="" disabled>✨ Select a batchmate...</option>
                  {students.map((student) => (
                    <option key={student.student_id} value={student.student_id} className="text-gray-900 font-medium text-base">
                      {student.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-gray-400 z-0">
                  <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: selectedCrush ? 1.01 : 1 }}
                whileTap={{ scale: selectedCrush ? 0.98 : 1 }}
                onClick={handleCrushSubmit}
                disabled={!selectedCrush}
                className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold py-4 sm:py-5 px-4 rounded-2xl shadow-lg shadow-rose-200 disabled:opacity-50 disabled:shadow-none flex justify-center items-center gap-2 transition-all text-lg"
              >
                <Heart size={22} className={selectedCrush ? "fill-white" : ""} /> 
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
            <div className="text-center py-10">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-rose-500 font-bold mb-6 text-lg px-4 leading-relaxed">
                {message || "Authentication Error: Please log in again."}
              </p>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-gray-900 text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-colors shadow-md"
              >
                Go back to Login Page
              </button>
            </div>
          )}
        </motion.div>

        {/* Right Side: Stats (Takes less space on desktop) */}
        <div className="lg:col-span-5 space-y-6">
          <motion.div variants={itemVariants} className="bg-white/70 backdrop-blur-lg rounded-[2rem] shadow-xl p-6 sm:p-8 flex items-center gap-5 border border-white/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200 rounded-bl-full opacity-20"></div>
            <motion.div 
              animate={{ y: [0, -5, 0] }} 
              transition={{ repeat: Infinity, duration: 4 }}
              className="bg-gradient-to-br from-purple-100 to-indigo-100 p-4 sm:p-5 rounded-2xl shadow-inner relative z-10"
            >
              <Users className="text-purple-600 w-8 h-8" />
            </motion.div>
            <div className="relative z-10">
              <h3 className="text-gray-500 text-xs sm:text-sm font-extrabold uppercase tracking-widest mb-1">Secret Admirers</h3>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700">{admirersCount}</p>
                <span className="text-sm sm:text-lg font-semibold text-gray-400">people</span>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white/70 backdrop-blur-lg rounded-[2rem] shadow-xl p-6 sm:p-8 border border-white/50 min-h-[220px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-200 rounded-bl-full opacity-20"></div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <Sparkles className="text-rose-500 w-6 h-6 sm:w-7 sm:h-7" />
              <h3 className="text-gray-900 font-extrabold text-lg sm:text-xl">Your Mutual Matches</h3>
            </div>
            
            <div className="relative z-10">
              {mutualMatches.length > 0 ? (
                <ul className="space-y-3">
                  {mutualMatches.map((match) => (
                    <motion.li 
                      whileHover={{ scale: 1.02, x: 5 }}
                      key={match.student_id} 
                      className="bg-white/80 p-4 rounded-2xl flex items-center gap-4 border border-rose-100 shadow-sm"
                    >
                      <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                      <span className="font-bold text-gray-900 text-base sm:text-lg">{match.name}</span>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <div className="h-32 flex flex-col items-center justify-center text-center px-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-400 font-medium mb-1 text-sm sm:text-base">No mutual matches yet.</p>
                  <p className="text-xs sm:text-sm text-gray-400">Keep sending those secret interests!</p>
                </div>
              )}
            </div>
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
      
      </motion.div>
    </div>
  );
}