import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus,
  FiChevronLeft,
  FiChevronRight,
  FiTrash2,
  FiCheck,
  FiArrowLeft,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { goalsApi } from '../api';
import { Navbar } from '../components/Navbar.jsx';
import { Button } from '../components/Button.jsx';
import { Input } from '../components/Input.jsx';
import { Modal } from '../components/Modal.jsx';
import { StreakIndicator } from '../components/StreakIndicator.jsx';
import { FaCrown } from 'react-icons/fa';

const DAY_MS = 24 * 60 * 60 * 1000;

const QUOTES = [
  'Small steps every day lead to big results.',
  'Discipline is choosing what you want most over what you want now.',
  'A goal without a plan is just a wish.',
  'Don\'t watch the clock; do what it does. Keep going.',
  'The secret of getting ahead is getting started.',
  'You don\'t have to be great to start, but you have to start to be great.',
  'Success is the sum of small efforts, repeated day in and day out.',
  'Every accomplishment starts with the decision to try.',
  'Focus on progress, not perfection.',
  'The best time to plant a tree was 20 years ago. The second best time is now.',
  'Stay consistent, and your future self will thank you.',
  'Motivation gets you going, but habit keeps you growing.',
  'Do something today that your future self will thank you for.',
  'Great things are done by a series of small things brought together.',
  'Your only limit is your mind.',
];

const toDateStr = (date) => {
  const d = new Date(date);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
};

const shiftDay = (dateStr, offset) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + offset);
  return toDateStr(date);
};

const getDayNumber = (dateStr, startDateStr) => {
  if (!startDateStr) return 1;
  const diff =
    new Date(dateStr + 'T12:00:00') - new Date(startDateStr + 'T12:00:00');
  return Math.max(Math.floor(diff / DAY_MS) + 1, 1);
};

export const Goals = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { success, error } = useToast();
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const quote = useMemo(
    () => QUOTES[Math.floor(Math.random() * QUOTES.length)],
    []
  );

  useEffect(() => {
    const loadGoals = async () => {
      try {
        const data = await goalsApi.getAll();
        setGoals(data);
      } catch (err) {
        console.error('Error fetching goals:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadGoals();
  }, []);

  const todayString = toDateStr(new Date());
  const [selectedDate, setSelectedDate] = useState(todayString);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dayGoals = useMemo(
    () =>
      goals
        .filter((g) => toDateStr(g.createdAt) === selectedDate)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [goals, selectedDate]
  );

  const completedCount = dayGoals.filter((g) => g.completed).length;
  const totalCount = dayGoals.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;
  const allComplete = totalCount > 0 && completedCount === totalCount;
  const isToday = selectedDate === todayString;
  const isFuture = selectedDate > todayString;

  const calculateStreak = useMemo(() => {
    let streak = 0;
    let checkDate = new Date(todayString);

    while (true) {
      const dateStr = toDateStr(checkDate);
      const dayGoalsList = goals.filter((g) => toDateStr(g.createdAt) === dateStr);
      if (dayGoalsList.length === 0) break;
      if (!dayGoalsList.every((g) => g.completed)) break;
      streak++;
      checkDate = new Date(checkDate.getTime() - DAY_MS);
    }
    return streak;
  }, [goals, todayString]);

  const dayLabel = () => {
    if (isToday) return 'Today';
    if (selectedDate === shiftDay(todayString, -1)) return 'Yesterday';
    return new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const dateSubLabel = () =>
    new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  const startDate = useMemo(() => {
    if (goals.length === 0) return null;
    return goals.map((g) => toDateStr(g.createdAt)).sort()[0];
  }, [goals]);

  const dayNumber = getDayNumber(selectedDate, startDate);

  const handleOpenAddModal = () => {
    setTitle('');
    setIsAddModalOpen(true);
  };

  const handleOpenDeleteModal = (goal) => {
    setSelectedGoal(goal);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsAddModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedGoal(null);
    setTitle('');
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      error('Please enter a goal title');
      return;
    }
    setIsSubmitting(true);
    try {
      const newGoal = await goalsApi.create(title.trim(), '');
      setGoals((prev) => [newGoal, ...prev]);
      success('Goal added successfully!');
      handleCloseModals();
      setSelectedDate(todayString);
    } catch (err) {
      error(err.message || 'Failed to add goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!selectedGoal) return;
    setIsSubmitting(true);
    try {
      await goalsApi.delete(selectedGoal.id);
      setGoals((prev) => prev.filter((g) => g.id !== selectedGoal.id));
      success('Goal deleted successfully!');
      handleCloseModals();
    } catch (err) {
      error('Failed to delete goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleGoal = async (id) => {
    try {
      const goal = dayGoals.find((g) => g.id === id);
      const updatedGoal = await goalsApi.toggleComplete(id);
      setGoals((prev) => prev.map((g) => (g.id === id ? updatedGoal : g)));
      if (goal && !goal.completed) {
        success('Goal completed! 🎉');
      }
    } catch (err) {
      error('Failed to update goal status.');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const progressLabel = () => {
    if (totalCount === 0) return 'No goals yet';
    if (allComplete) return `All ${totalCount} done! 🎉`;
    return `${totalCount - completedCount} remaining`;
  };

  // Crown animation variants
  const crownVariants = {
    animate: {
      y: [0, -8, 0, -5, 0],
      rotate: [0, 6, -6, 4, -4, 0],
      scale: [1, 1.08, 0.95, 1.05, 1],
      transition: {
        duration: 3.5,
        repeat: Infinity,
        ease: "easeInOut",
        times: [0, 0.2, 0.4, 0.6, 0.8, 1]
      }
    }
  };

  const numberVariants = {
    animate: {
      scale: [1, 1.02, 0.98, 1.01, 1],
      transition: {
        duration: 3.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar onLogout={handleLogout} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Daily Quote Announcement Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-4 flex items-center gap-2 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 px-3 py-2.5 shadow-sm"
        >
          <span className="shrink-0 text-base">💡</span>
          <div className="relative flex-1 overflow-hidden">
            <div className="animate-marquee flex w-max items-center">
              <p className="whitespace-nowrap px-4 text-[14px] font-semibold tracking-tight text-amber-800 sm:text-[15px]">
                {quote}
              </p>
              <p
                aria-hidden="true"
                className="whitespace-nowrap px-4 text-[14px] font-semibold tracking-tight text-amber-800 sm:text-[15px]"
              >
                {quote}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Day Navigation Header with Back Arrow Integrated */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => navigate('/dashboard')}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
              title="Back to Dashboard"
            >
              <FiArrowLeft className="h-4 w-4" />
            </motion.button>

            <div className="flex items-center justify-between gap-2 flex-1">
              <button
                onClick={() => setSelectedDate(shiftDay(selectedDate, -1))}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm border border-slate-200 transition hover:text-blue-600 hover:border-blue-200 hover:shadow-md"
                title="Previous day"
              >
                <FiChevronLeft className="h-4 w-4" />
              </button>

              <div className="text-center flex-1 min-w-0">
                {/* Crown Above Day Count */}
                <motion.div 
                  className="flex flex-col items-center justify-center mb-0.5"
                  initial={{ scale: 0.3, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: 0.1
                  }}
                >
                  <motion.div
                    variants={crownVariants}
                    animate="animate"
                    className="mb-0.5"
                  >
                    <FaCrown className="h-6 w-6 text-amber-400 drop-shadow-lg" />
                  </motion.div>

                  <motion.span
                    variants={numberVariants}
                    animate="animate"
                    className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 tracking-tight leading-none"
                  >
                    {dayNumber}
                  </motion.span>

                  <span className="text-[11px] font-bold tracking-wide text-amber-500/80 mt-0.5">
                    Day {dayNumber}
                  </span>
                </motion.div>
                
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
                  {dayLabel()}
                </h1>
                <p className="text-[11px] font-medium text-slate-500">
                  {dateSubLabel()}
                </p>
              </div>

              <button
                onClick={() => setSelectedDate(shiftDay(selectedDate, 1))}
                disabled={isFuture || isToday}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm border border-slate-200 transition enabled:hover:text-blue-600 enabled:hover:border-blue-200 enabled:hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                title="Next day"
              >
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Add Goal Button - Top */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="mb-4"
        >
          <button
            onClick={handleOpenAddModal}
            className="w-full flex items-center justify-center gap-2 rounded-[20px] bg-gradient-to-br from-blue-600 to-indigo-600 text-white py-3 px-4 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <FiPlus className="h-5 w-5" />
            Add Goal for {dayLabel()}
          </button>
        </motion.div>

        {/* Progress Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className={`mb-4 rounded-[20px] p-4 sm:p-5 text-white shadow-xl ${
            allComplete
              ? 'bg-gradient-to-br from-emerald-500 to-green-600'
              : 'bg-gradient-to-br from-blue-600 to-indigo-600'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                Completed
              </p>
              <div className="mt-0.5 flex items-end gap-1.5">
                <span className="text-4xl font-black leading-none">
                  {completedCount}
                </span>
                <span className="text-xl font-bold text-white/70">
                  / {totalCount}
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold text-white/90">
                {progressLabel()}
              </p>
            </div>

            <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/30">
              {allComplete ? (
                <FiCheck className="h-7 w-7" />
              ) : (
                <span className="text-2xl font-black">
                  {Math.round(progress * 100)}
                  <span className="text-xs font-bold">%</span>
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/25">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="h-full rounded-full bg-white"
            />
          </div>
        </motion.div>

        {/* Streak celebration when today is complete */}
        {isToday && allComplete && (
          <div className="relative mb-4 rounded-[20px] bg-white p-4 shadow-lg border border-slate-100 overflow-hidden">
            <StreakIndicator
              streak={calculateStreak}
              totalToday={totalCount}
              isComplete={allComplete}
            />
          </div>
        )}

        {/* Goals List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[52px] rounded-[18px] bg-white animate-pulse border border-slate-100"
              />
            ))}
          </div>
        ) : totalCount > 0 ? (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {dayGoals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-3 rounded-[18px] border-2 px-4 py-2.5 shadow-sm transition-all duration-300 group ${
                    goal.completed
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-md'
                  }`}
                >
                  <motion.button
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleToggleGoal(goal.id)}
                    className={`flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                      goal.completed
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-500'
                        : 'border-slate-300 group-hover:border-blue-400'
                    }`}
                    title={goal.completed ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {goal.completed && (
                      <motion.svg
                        className="h-3 w-3 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <path d="M5 13l4.5 4.5L19 7" />
                      </motion.svg>
                    )}
                  </motion.button>

                  <div className="min-w-0 flex-1">
                    <h3
                      className={`text-sm font-semibold cursor-pointer transition-all duration-300 ${
                        goal.completed
                          ? 'line-through text-slate-400'
                          : 'text-slate-900'
                      }`}
                      onClick={() => handleToggleGoal(goal.id)}
                    >
                      {goal.title}
                    </h3>
                  </div>

                  {goal.completed && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="hidden sm:inline-flex items-center px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full whitespace-nowrap"
                    >
                      ✓ Done
                    </motion.span>
                  )}

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => handleOpenDeleteModal(goal)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-[20px] flex items-center justify-center mx-auto mb-4">
              <FiCheck className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1.5">
              No goals for {dayLabel().toLowerCase()}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              {isToday
                ? 'Plan your day by adding a goal below.'
                : 'This day has no goals yet. Add one to build your streak!'}
            </p>
          </motion.div>
        )}
      </main>

      {/* Add Goal Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseModals}
        title="Add New Goal"
        size="md"
      >
        <form onSubmit={handleAddGoal} className="space-y-4">
          <Input
            label="Goal Title"
            placeholder="e.g., Exercise, Read, Study..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleCloseModals}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Goal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModals}
        title="Delete Goal"
        size="sm"
      >
        <div className="text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiTrash2 className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1.5">
            Delete this goal?
          </h3>
          <p className="text-sm text-gray-600 mb-5">
            "{selectedGoal?.title}" will be permanently deleted.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={handleCloseModals}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteGoal}
              isLoading={isSubmitting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};