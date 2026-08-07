import { motion } from 'framer-motion';
import { cn } from '../utils/cn.js';
import { Logo } from './Logo.jsx';

const CheckIcon = ({ className = 'h-4 w-4' }) => (
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

const FloatCard = ({ className, children }) => (
  <motion.div
    animate={{ y: [0, -14, 0] }}
    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    className={cn(
      'absolute rounded-[22px] border border-white/20 bg-white/15 backdrop-blur-xl shadow-2xl shadow-black/40',
      className
    )}
  >
    {children}
  </motion.div>
);

export const AuthLayout = ({ children }) => {
  return (
    <div className="grid min-h-dvh overflow-x-clip lg:grid-cols-2">
      {/* Visual panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-blue-800 via-blue-600 to-purple-600 p-16 text-white lg:flex lg:flex-col lg:justify-center">
        {/* Blobs */}
        <span className="absolute -right-16 -top-20 h-[340px] w-[340px] rounded-full bg-blue-400/60 blur-[70px]" />
        <span className="absolute -left-10 -bottom-16 h-[280px] w-[280px] rounded-full bg-purple-400/60 blur-[70px]" />

        {/* Brand */}
        <Logo onDark className="relative z-10 mb-14" />

        {/* Copy */}
        <div className="relative z-10">
          <h1 className="max-w-[420px] text-[42px] font-extrabold leading-[1.12] tracking-tight">
            Turn daily goals into{' '}
            <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
              momentum
            </span>
            .
          </h1>
          <p className="mt-4 max-w-[400px] text-base leading-relaxed text-white/80">
            Plan your day, check things off, and watch your streak grow. A calm,
            focused home for your daily wins.
          </p>
        </div>

        {/* Floating cards */}
        <FloatCard className="left-[8%] top-[12%] flex rotate-2 items-center gap-2.5 px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-amber-400 to-orange-500">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 fill-white"
              stroke="none"
            >
              <path d="M12 22c4.4 0 7-2.8 7-6.5 0-3-1.8-4.9-2.9-6.3-.3 1.4-1 2.3-1.6 2.6-.2-3-1.7-5.8-4.1-8 .3 3.6-1.2 5.6-2.6 6.9C6.3 12.5 5 14.2 5 15.5 5 19.2 7.6 22 12 22z" />
            </svg>
          </span>
          <span className="text-[13px] font-bold">12-day streak</span>
        </FloatCard>

        <FloatCard className="-rotate-6 right-[9%] top-[26%] w-[118px] p-[18px]">
          <div className="mb-2 text-[11px] font-semibold text-white/75">
            Today's progress
          </div>
          <div className="relative mx-auto h-[82px] w-[82px]">
            <svg width="82" height="82" viewBox="0 0 82 82" className="-rotate-90">
              <circle cx="41" cy="41" r="34" stroke="rgba(255,255,255,.25)" strokeWidth="8" fill="none" />
              <circle cx="41" cy="41" r="34" stroke="#fff" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray="213.6" strokeDashoffset="72" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[26px] font-extrabold">
              68%
            </span>
          </div>
        </FloatCard>

        <FloatCard className="bottom-[16%] left-[6%] flex rotate-3 items-center gap-3 p-[18px]">
          <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-emerald-500/50">
            <CheckIcon className="h-5 w-5" />
          </span>
          <div>
            <b className="block text-[13px]">Daily goal completed</b>
            <small className="text-[11.5px] text-white/70">
              React Learning · just now
            </small>
          </div>
        </FloatCard>
      </div>

      {/* Form panel */}
      <div className="flex min-h-dvh min-w-0 overflow-y-auto bg-white px-6 py-8 sm:px-10">
        <div className="mx-auto w-full max-w-[420px]">
          <Logo
            className="mb-6 w-full pl-3 lg:hidden"
            markClassName="h-20 w-20 sm:h-24 sm:w-24"
            titleClassName="text-[32px] sm:text-[36px]"
          />
          {children}
        </div>
      </div>
    </div>
  );
};
