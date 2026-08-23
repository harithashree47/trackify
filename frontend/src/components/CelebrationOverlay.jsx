import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';

// Clean, minimal success card shown center-screen. `celebration` is null or
// { id, type: 'goal' | 'perfect-day', streak? }. pointer-events-none so it
// never interrupts interaction; the parent clears it on a short timer.
export const CelebrationOverlay = ({ celebration }) => {
  const isPerfectDay = celebration?.type === 'perfect-day';

  return (
    <AnimatePresence>
      {celebration && (
        <motion.div
          key={celebration.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center px-6"
          aria-live="polite"
          role="status"
        >
          <motion.div
            initial={{ scale: 0.8, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 6, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 24 }}
            className="flex min-w-[250px] flex-col items-center gap-3 rounded-[28px] border border-slate-100 bg-white px-9 py-7 text-center shadow-[0_24px_70px_-20px_rgba(15,23,42,0.35)]"
          >
            {/* Icon */}
            <div className="relative flex items-center justify-center">
              {isPerfectDay ? (
                <motion.span
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 320,
                    damping: 14,
                    delay: 0.06,
                  }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-4xl ring-8 ring-amber-50/60"
                  role="img"
                  aria-label="Celebration"
                >
                  🎉
                </motion.span>
              ) : (
                <>
                  <motion.span
                    initial={{ scale: 0.5, opacity: 0.7 }}
                    animate={{ scale: 1.7, opacity: 0 }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-full bg-emerald-200"
                  />
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 360,
                      damping: 15,
                      delay: 0.05,
                    }}
                    className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-600 shadow-lg shadow-emerald-500/30"
                  >
                    <FiCheck className="h-7 w-7 text-white" strokeWidth={3} />
                  </motion.span>
                </>
              )}
            </div>

            {/* Text */}
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-extrabold tracking-tight text-slate-900">
                {isPerfectDay ? 'Perfect Day!' : 'Goal Completed!'}
              </h3>
              <p className="text-[13px] font-medium text-slate-500">
                {isPerfectDay ? 'All goals completed' : 'Nice work, keep going'}
              </p>
            </div>

            {/* Streak chip (perfect day only) */}
            {isPerfectDay && (
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.25 }}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-orange-600 ring-1 ring-slate-100"
              >
                🔥 {celebration.streak ?? 0} Day Streak
              </motion.span>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
