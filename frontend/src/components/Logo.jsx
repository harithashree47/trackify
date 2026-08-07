import { cn } from '../utils/cn.js';

export const LogoMark = ({ className }) => (
  <span
    className={cn(
      'relative flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/40 ring-1 ring-white/20',
      className
    )}
  >
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="8.4"
        stroke="rgba(255,255,255,.4)"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M8.2 12.4l2.5 2.6 5-5.4"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

export const Logo = ({ className }) => (
  <div className={cn('flex items-center gap-2.5', className)}>
    <LogoMark />
    <span className="text-[16px] font-extrabold tracking-tight">Trackify</span>
  </div>
);
