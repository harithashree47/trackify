import { motion } from 'framer-motion';
import { getMilestone } from '../utils/milestones.js';

const CONFETTI_COLORS = [
  '#fbbf24',
  '#f97316',
  '#ec4899',
  '#a855f7',
  '#22d3ee',
  '#34d399',
  '#60a5fa',
];

export const StreakIndicator = ({ streak, totalToday, isComplete }) => {
  if (!isComplete || totalToday === 0) return null;

  const milestone = getMilestone(streak);

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className="relative flex flex-col items-center gap-3 overflow-hidden py-2"
    >
      {/* Paper confetti burst on the reward */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{
              x: (Math.random() - 0.5) * 180,
              y: Math.random() * 120 + 20,
              opacity: 0,
              rotate: Math.random() * 360 - 180,
            }}
            transition={{
              duration: 1.4 + Math.random() * 0.6,
              delay: i * 0.04,
              ease: 'easeOut',
            }}
            className="absolute w-2.5 h-2.5 rounded-[2px]"
            style={{
              left: '50%',
              top: '30%',
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            }}
          />
        ))}
      </div>

      {/* Reward badge: glowing ring around the cup/star */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.15 }}
        className="relative"
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1], boxShadow: [
            '0 0 24px rgba(245,158,11,0.35)',
            '0 0 44px rgba(245,158,11,0.55)',
            '0 0 24px rgba(245,158,11,0.35)',
          ] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 shadow-xl"
        >
          <motion.span
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="text-5xl leading-none drop-shadow"
            role="img"
            aria-label={`${milestone.label} reward`}
          >
            {milestone.reward}
          </motion.span>
        </motion.div>
      </motion.div>

      {/* Streak Counter */}
      <div className="text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-4xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent leading-none"
        >
          {streak}
        </motion.p>
        <p className="text-sm font-bold text-amber-600 mt-1">
          Day Streak! 🔥
        </p>
      </div>

      {/* Milestone label */}
      <motion.p
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1 text-[12px] font-bold text-amber-800"
      >
        {milestone.label} · {milestone.reward}
      </motion.p>

      {/* Completion Info */}
      <p className="text-[15px] font-semibold text-gray-900">
        All {totalToday} goals completed today! 🎉
      </p>
    </motion.div>
  );
};