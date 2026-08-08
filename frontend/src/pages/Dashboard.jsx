import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiCheckCircle, FiClock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { goalsApi } from '../api';
import { Navbar } from '../components/Navbar.jsx';
import { Button } from '../components/Button.jsx';

const CheckIcon = ({ className = 'h-3.5 w-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 13l4 4L19 7" />
  </svg>
);

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { info } = useToast();
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadGoals = async () => {
      try {
        const data = await goalsApi.getAll();
        setGoals(data);
      } catch (error) {
        console.error('Error fetching goals:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadGoals();
  }, []);

  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const stats = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter((g) => g.completed).length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, percentage };
  }, [goals]);

  const streak = useMemo(() => {
    let count = 0;
    const checkDate = new Date();
    while (true) {
      const ds = checkDate.toISOString().split('T')[0];
      const dayGoals = goals.filter((g) => g.createdAt.split('T')[0] === ds);
      if (dayGoals.length === 0) break;
      if (!dayGoals.every((g) => g.completed)) break;
      count++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return count;
  }, [goals]);

  const todayGoals = useMemo(() => {
    const t = goals.filter((g) => g.createdAt.split('T')[0] === todayString);
    return t.length > 0 ? t.slice(0, 4) : goals.slice(0, 4);
  }, [goals, todayString]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const ringRadius = 92;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (stats.percentage / 100) * ringCircumference;
  const miniOffset = 138.2 * (1 - stats.percentage / 100);

  const StatCard = ({ children }) => (
    <div className="flex items-center gap-4 rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {children}
    </div>
  );

  const StatIco = ({ color, children }) => (
    <div className={`flex h-[48px] w-[48px] flex-none items-center justify-center rounded-[16px] ${color}`}>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar onLogout={handleLogout} />

      <main className="mx-auto max-w-[1200px] px-6 py-5 sm:px-8">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-[22px] font-medium tracking-tight sm:text-[30px]"
            >
              Good morning, {user?.name?.split(' ')[0]}
              <motion.span
                className="inline-block"
                initial={{ opacity: 0, scale: 0, rotate: -30 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.3,
                  type: 'spring',
                  stiffness: 260,
                  damping: 12,
                }}
                whileHover={{ rotate: [0, -15, 15, 0], transition: { duration: 0.6 } }}
              >
                {' '}👋
              </motion.span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-1.5 text-sm font-medium text-slate-500"
            >
              {formattedDate} · {stats.pending} goals to complete today
            </motion.p>
          </div>
          <Button
            onClick={() => navigate('/goals')}
            leftIcon={<FiPlus className="h-4 w-4" />}
          >
            New Goal
          </Button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard>
            <div className="relative h-[52px] w-[52px] flex-none">
              <svg width="52" height="52" viewBox="0 0 52 52" className="-rotate-90">
                <circle cx="26" cy="26" r="22" fill="none" stroke="#EEF2F7" strokeWidth="6" />
                <circle cx="26" cy="26" r="22" fill="none" stroke="#2563EB" strokeWidth="6" strokeLinecap="round" strokeDasharray="138.2" strokeDashoffset={miniOffset} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[11.5px] font-extrabold text-slate-900">
                {stats.percentage}%
              </span>
            </div>
            <div>
              <small className="block text-[12.5px] font-semibold text-slate-500">Today's Progress</small>
              <b className="mt-0.5 block text-[24px] font-semibold tracking-tight text-slate-900">{stats.percentage}%</b>
              <span className="mt-0.5 inline-block text-[11.5px] font-bold text-green-600">↑ on track</span>
            </div>
          </StatCard>

          <StatCard>
            <StatIco color="bg-green-50 text-green-600">
              <FiCheckCircle className="h-6 w-6" />
            </StatIco>
            <div>
              <small className="block text-[12.5px] font-semibold text-slate-500">Completed Goals</small>
              <b className="mt-0.5 block text-[24px] font-semibold tracking-tight text-slate-900">{stats.completed}</b>
              <span className="mt-0.5 inline-block text-[11.5px] font-bold text-green-600">↑ great job</span>
            </div>
          </StatCard>

          <StatCard>
            <StatIco color="bg-amber-50 text-amber-600">
              <FiClock className="h-6 w-6" />
            </StatIco>
            <div>
              <small className="block text-[12.5px] font-semibold text-slate-500">Pending Goals</small>
              <b className="mt-0.5 block text-[24px] font-semibold tracking-tight text-slate-900">{stats.pending}</b>
              <span className="mt-0.5 inline-block text-[11.5px] font-bold text-slate-400">waiting on you</span>
            </div>
          </StatCard>

          <StatCard>
            <StatIco color="bg-orange-50 text-orange-500">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" stroke="none">
                <path d="M12 22c4.4 0 7-2.8 7-6.5 0-3-1.8-4.9-2.9-6.3-.3 1.4-1 2.3-1.6 2.6-.2-3-1.7-5.8-4.1-8 .3 3.6-1.2 5.6-2.6 6.9C6.3 12.5 5 14.2 5 15.5 5 19.2 7.6 22 12 22z" />
              </svg>
            </StatIco>
            <div>
              <small className="block text-[12.5px] font-semibold text-slate-500">Current Streak</small>
              <b className="mt-0.5 block text-[24px] font-semibold tracking-tight text-slate-900">{streak} day{streak === 1 ? '' : 's'}</b>
              <span className="mt-0.5 inline-block text-[11.5px] font-bold text-slate-400">keep going!</span>
            </div>
          </StatCard>
        </div>

        {/* Main grid */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.35fr]">
          {/* Overall Progress */}
          <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[17px] font-bold tracking-tight">Overall Progress</h3>
              <button
                onClick={() => navigate('/goals')}
                className="text-[12.5px] font-semibold text-blue-600 hover:underline"
              >
                View all →
              </button>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative h-[200px] w-[200px]">
                <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
                  <defs>
                    <linearGradient id="gradRing" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2563EB" />
                      <stop offset="100%" stopColor="#7C3AED" />
                    </linearGradient>
                  </defs>
                  <circle cx="100" cy="100" r={ringRadius} fill="none" stroke="#EEF2F7" strokeWidth="18" />
                  <motion.circle
                    cx="100"
                    cy="100"
                    r={ringRadius}
                    fill="none"
                    stroke="url(#gradRing)"
                    strokeWidth="18"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    initial={{ strokeDashoffset: ringCircumference }}
                    animate={{ strokeDashoffset: ringOffset }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <b className="text-[38px] font-semibold tracking-tight text-slate-900">{stats.percentage}%</b>
                  <span className="text-[13px] font-semibold text-slate-500">Complete</span>
                </div>
              </div>

              <div className="mt-5 grid w-full grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-2 py-3 text-center">
                  <b className="block text-[19px] font-semibold text-blue-600">{stats.completed}</b>
                  <small className="text-[11.5px] font-semibold text-slate-500">Completed</small>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-2 py-3 text-center">
                  <b className="block text-[19px] font-semibold text-amber-600">{stats.pending}</b>
                  <small className="text-[11.5px] font-semibold text-slate-500">Pending</small>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-2 py-3 text-center">
                  <b className="block text-[19px] font-semibold text-green-600">{streak}</b>
                  <small className="text-[11.5px] font-semibold text-slate-500">Day streak</small>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Goals */}
          <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[17px] font-bold tracking-tight">Today's Goals</h3>
              <button
                onClick={() => navigate('/goals')}
                className="text-[12.5px] font-semibold text-blue-600 hover:underline"
              >
                See all →
              </button>
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-[72px] animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />
                ))}
              </div>
            ) : todayGoals.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {todayGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`flex items-center gap-3.5 rounded-2xl border p-3.5 transition hover:shadow-md ${
                      goal.completed
                        ? 'border-green-200 bg-green-50'
                        : 'border-slate-200 bg-white hover:border-blue-200'
                    }`}
                  >
                    <span
                      className={`flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[9px] border-2 transition ${
                        goal.completed
                          ? 'border-transparent bg-gradient-to-br from-green-500 to-emerald-600 shadow-md shadow-green-500/40'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      {goal.completed && <CheckIcon className="h-3.5 w-3.5 text-white" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <b className={`block text-[14.5px] font-semibold ${goal.completed ? 'text-green-700 line-through opacity-85' : 'text-slate-900'}`}>
                        {goal.title}
                      </b>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-blue-50 text-blue-600">
                  <FiPlus className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No goals yet</h3>
                <p className="mt-1 text-sm text-slate-500">Start by adding your first goal</p>
                <Button
                  className="mt-5"
                  onClick={() => info('Click "Add Goal" to get started!')}
                  leftIcon={<FiPlus className="h-4 w-4" />}
                >
                  Add Your First Goal
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Add Goal button */}
      <motion.button
        onClick={() => navigate('/goals')}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.96 }}
        className="fixed bottom-9 right-9 z-50 flex items-center gap-2.5 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 px-6 py-4 text-sm font-bold text-white shadow-2xl shadow-blue-600/40"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25">
          <FiPlus className="h-3.5 w-3.5" />
        </span>
        Add Goal
      </motion.button>
    </div>
  );
};
