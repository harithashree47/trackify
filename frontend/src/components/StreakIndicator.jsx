import { motion } from 'framer-motion';

export const StreakIndicator = ({
  streak,
  totalToday,
  isComplete,
}) => {
  if (!isComplete || totalToday === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className="flex flex-col items-center gap-4"
    >
      {/* Treasure Emoji Animation */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="text-6xl"
      >
        💎
      </motion.div>

      {/* Streak Counter */}
      <div className="text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-5xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent"
        >
          {streak}
        </motion.p>
        <p className="text-sm font-medium text-gray-600 mt-1">Day Streak! 🔥</p>
      </div>

      {/* Confetti Animation */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
            }}
            animate={{
              x: (Math.random() - 0.5) * 100,
              y: Math.random() * 100 - 50,
              opacity: 0,
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.05,
              repeat: Infinity,
            }}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: '50%',
              top: '50%',
              background: ['#fbbf24', '#f97316', '#ec4899', '#a855f7'][
                i % 4
              ],
            }}
          />
        ))}
      </div>

      {/* Completion Info */}
      <p className="text-lg font-semibold text-gray-900">
        All {totalToday} goals completed today! 🎉
      </p>
    </motion.div>
  );
};
