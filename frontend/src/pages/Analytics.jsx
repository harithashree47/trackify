import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiCalendar, FiTarget, FiAward, FiStar, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useGoals } from '../hooks/useGoals.js';
import { Navbar } from '../components/Navbar.jsx';
import { LuckyBox } from '../components/LuckyBox.jsx';
import { calculateStreak } from '../utils/streak.js';
import { 
  calculateWeeklyStreak, 
  calculateMonthlyStreak, 
  calculateGoalSpecificStreaks 
} from '../utils/analytics.js';

export const Analytics = () => {
  const navigate = useNavigate();
  const { goals, isLoading } = useGoals();

  const stats = useMemo(() => {
    if (!goals.length) {
      return { total: 0, completed: 0, dailyStreak: 0, weeklyStreak: 0, monthlyStreak: 0, specificStreaks: [] };
    }

    const completed = goals.filter(g => g.completed).length;
    const dailyStreak = calculateStreak(goals);
    const weeklyStreak = calculateWeeklyStreak(goals);
    const monthlyStreak = calculateMonthlyStreak(goals);
    const specificStreaks = calculateGoalSpecificStreaks(goals);

    return {
      total: goals.length,
      completed,
      dailyStreak,
      weeklyStreak,
      monthlyStreak,
      specificStreaks
    };
  }, [goals]);

  const StatCard = ({ icon, label, value, subtitle, color, delay }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white rounded-[20px] p-5 border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-none ${color}`}>
        {icon}
      </div>
      <div>
        <h4 className="text-slate-500 text-[13px] font-bold tracking-wide uppercase">{label}</h4>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-3xl font-black text-slate-800 tracking-tight">{value}</span>
          {subtitle && <span className="text-xs font-semibold text-slate-400">{subtitle}</span>}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-4"
        >
          <motion.button
            onClick={() => navigate('/dashboard')}
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
            title="Back to Dashboard"
          >
            <FiArrowLeft className="h-4 w-4" />
          </motion.button>
          
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              Analytics
            </h1>
            <p className="text-[11px] font-medium text-slate-500">
              Track your progress and consistency
            </p>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Lucky Box Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <LuckyBox streak={stats.dailyStreak} />
            </motion.div>

            {/* High-level Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard 
                icon={<FiTrendingUp />} 
                label="Daily Streak" 
                value={stats.dailyStreak} 
                subtitle="days"
                color="bg-orange-100 text-orange-600"
                delay={0.1}
              />
              <StatCard 
                icon={<FiCalendar />} 
                label="Weekly Streak" 
                value={stats.weeklyStreak} 
                subtitle="weeks"
                color="bg-blue-100 text-blue-600"
                delay={0.2}
              />
              <StatCard 
                icon={<FiAward />} 
                label="Monthly Streak" 
                value={stats.monthlyStreak} 
                subtitle="months"
                color="bg-purple-100 text-purple-600"
                delay={0.3}
              />
            </div>

            {/* Goal-specific streaks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-[20px] border border-slate-200 p-5 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200/50">
                  <FiTarget className="text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">Recurring Habits</h3>
                  <p className="text-[12px] text-slate-500 font-medium">Your consistency across specific goals</p>
                </div>
              </div>

              {stats.specificStreaks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stats.specificStreaks.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-emerald-50/30 hover:border-emerald-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="text-emerald-500 bg-emerald-100/50 p-1.5 rounded-lg">
                          <FiStar className="fill-emerald-200 w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-700 capitalize text-sm">{item.title}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-extrabold text-emerald-600">{item.streak}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Days</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-slate-500 text-sm font-medium">
                    You don't have any specific goal streaks yet.<br/> Add and complete the exact same goal daily to build a streak!
                  </p>
                </div>
              )}
            </motion.div>

          </div>
        )}
      </main>
    </div>
  );
};
