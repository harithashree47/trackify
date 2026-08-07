import { motion } from 'framer-motion';
import { cn } from '../utils/cn.js';

/**
 * Animated checkbox with a smooth tick/untick stroke animation.
 * Mimics the clean, satisfying interaction found in premium task apps.
 */
export const Checkbox = ({
  checked,
  onChange,
  size = 'md',
  disabled = false,
  className,
}) => {
  const sizes = {
    sm: {
      box: 'w-5 h-5',
      icon: 'w-3 h-3',
      checkStroke: 3,
    },
    md: {
      box: 'w-6 h-6',
      icon: 'w-3.5 h-3.5',
      checkStroke: 3,
    },
    lg: {
      box: 'w-7 h-7',
      icon: 'w-4 h-4',
      checkStroke: 3,
    },
  };

  const current = sizes[size];

  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={checked ? 'Mark as incomplete' : 'Mark as complete'}
      whileHover={disabled ? undefined : { scale: 1.12 }}
      whileTap={disabled ? undefined : { scale: 0.88 }}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange?.();
      }}
      disabled={disabled}
      className={cn(
        'relative flex-shrink-0 rounded-md flex items-center justify-center',
        'border-2 transition-all duration-300 ease-out',
        current.box,
        checked
          ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-transparent shadow-md shadow-blue-500/30'
          : 'border-gray-300 bg-white hover:border-blue-500 group-hover:border-blue-400',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      {/* Tick mark with stroke draw animation */}
      <motion.svg
        className={cn(current.icon, 'text-white')}
        viewBox="0 0 24 24"
        fill="none"
        initial={false}
        animate={checked ? 'checked' : 'unchecked'}
      >
        <motion.path
          d="M5 13l4.5 4.5L19 7"
          stroke="currentColor"
          strokeWidth={current.checkStroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={{
            unchecked: {
              pathLength: 0,
              opacity: 0,
              transition: { duration: 0.15 },
            },
            checked: {
              pathLength: 1,
              opacity: 1,
              transition: { duration: 0.25, ease: 'easeOut' },
            },
          }}
        />
      </motion.svg>

      {/* Subtle spring scale when checked */}
      {checked && (
        <motion.span
          layoutId="checkbox-pop"
          className="absolute inset-0 rounded-md pointer-events-none"
          initial={{ scale: 0 }}
          animate={{ scale: 1, opacity: [0, 0.3, 0] }}
          transition={{ duration: 0.4 }}
          style={{ boxShadow: '0 0 0 8px rgba(59,130,246,0.15)' }}
        />
      )}
    </motion.button>
  );
};
