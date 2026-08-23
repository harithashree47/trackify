import { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { getNextMilestone } from '../utils/milestones.js';
import { cn } from '../utils/cn.js';

// Simple, neat "Perfect Day" dialog with light entrance animations:
// staggered fade-ups, spring-popping badge, counting streak number.
export const StreakModal = ({ isOpen, onClose, streak, totalToday }) => {
  const [displayStreak, setDisplayStreak] = useState(streak ?? 0);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Escape closes
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Count the streak number up when the dialog opens
  useEffect(() => {
    if (!isOpen) {
      setDisplayStreak(0);
      return undefined;
    }
    const target = streak ?? 0;
    const controls = animate(0, target, {
      duration: 0.9,
      delay: 0.35,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayStreak(Math.round(v)),
    });
    return () => controls.stop();
  }, [isOpen, streak]);

  const next = getNextMilestone(streak ?? 0);
  const daysToNext = next ? next.days - (streak ?? 0) : 0;
  const progress = next
    ? Math.min(100, Math.round(((streak ?? 0) / next.days) * 100))
    : 100;

  // Shared staggered entrance
  const item = {
    hidden: { opacity: 0, y: 12 },
    show: (i) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, delay: 0.1 + i * 0.09, ease: 'easeOut' },
    }),
  };

  return (
    <div
      className={cn('fixed inset-0 z-[80]', !isOpen && 'pointer-events-none')}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Panel */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            'relative w-full max-w-[340px] rounded-[24px] bg-white px-6 pb-7 pt-8 text-center shadow-2xl transition-all duration-200',
            isOpen
              ? 'translate-y-0 scale-100 opacity-100'
              : 'translate-y-5 scale-95 opacity-0'
          )}
        >
          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3.5 top-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <FiX className="h-4 w-4" />
          </button>

          {/* Badge - spring pop with gently floating emoji */}
          <motion.div
            initial={{ scale: 0, rotate: -25 }}
            animate={
              isOpen
                ? { scale: 1, rotate: 0 }
                : { scale: 0, rotate: -25 }
            }
            transition={{ type: 'spring', stiffness: 300, damping: 14 }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-100"
          >
            <motion.span
              animate={{ y: [0, -3, 0], rotate: [0, -6, 6, 0] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.6,
              }}
              className="text-3xl"
              role="img"
              aria-label="Celebration"
            >
              🎉
            </motion.span>
          </motion.div>

          <motion.h3
            custom={1}
            variants={item}
            initial="hidden"
            animate={isOpen ? 'show' : 'hidden'}
            className="mt-4 text-lg font-extrabold tracking-tight text-slate-900"
          >
            Perfect Day!
          </motion.h3>

          <motion.p
            custom={2}
            variants={item}
            initial="hidden"
            animate={isOpen ? 'show' : 'hidden'}
            className="mt-1 text-sm font-medium text-slate-500"
          >
            All {totalToday} goal{totalToday === 1 ? '' : 's'} completed
          </motion.p>

          {/* Streak summary */}
          <motion.div
            custom={3}
            variants={item}
            initial="hidden"
            animate={isOpen ? 'show' : 'hidden'}
            className="mt-6"
          >
            <p className="leading-none">
              <span className="text-2xl font-black tracking-tight text-slate-900">
                {displayStreak}{' '}
              </span>
              <span className="text-sm font-bold text-slate-500">
                Day Streak 🔥
              </span>
            </p>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <motion.div
                initial={{ width: 0 }}
                animate={isOpen ? { width: `${progress}%` } : { width: 0 }}
                transition={{ duration: 0.7, delay: 0.55, ease: 'easeOut' }}
                className="h-full rounded-full bg-orange-400"
              />
            </div>

            <p className="mt-2 truncate text-[11px] font-semibold text-slate-400">
              {next
                ? `${daysToNext} day${daysToNext === 1 ? '' : 's'} to ${
                    next.reward
                  } ${next.label}`
                : 'Top tier reached 👑'}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
