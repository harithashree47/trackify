import { motion } from 'framer-motion';
import { getMilestone, getNextMilestone } from '../utils/milestones.js';

// Simple, neat streak card shown when every goal for today is done.
export const StreakIndicator = ({ streak, totalToday, isComplete }) => {
  if (!isComplete || totalToday === 0) return null;

  const milestone = getMilestone(streak);
  const next = getNextMilestone(streak);
  const daysToNext = next ? next.days - streak : 0;
  const progress = next
    ? Math.min(100, Math.round((streak / next.days) * 100))
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="rounded-[20px] border border-slate-100 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center gap-4">
        {/* Flame tile */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-2xl ring-1 ring-orange-100">
          🔥
        </div>

        <div className="min-w-0 flex-1">
          <p className="leading-none">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              {streak}{' '}
            </span>
            <span className="text-sm font-bold text-slate-500">Day Streak</span>
          </p>

          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full bg-orange-400"
            />
          </div>

          <p className="mt-1.5 truncate text-[11px] font-semibold text-slate-400">
            {next
              ? `${daysToNext} day${daysToNext === 1 ? '' : 's'} to ${
                  next.reward
                } ${next.label}`
              : 'Top tier reached 👑'}
          </p>
        </div>

        {/* Current tier */}
        <div className="shrink-0 text-center">
          <span className="block text-xl leading-none">{milestone.reward}</span>
          <span className="mt-1 block max-w-[80px] truncate text-[10px] font-bold text-slate-400">
            {milestone.label}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
