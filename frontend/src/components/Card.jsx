import { motion } from 'framer-motion';
import { cn } from '../utils/cn.js';

export const Card = ({
  children,
  className,
  hover = false,
  ...props
}) => {
  return (
    <motion.div
      className={cn(
        'bg-white rounded-xl border border-gray-100 shadow-sm',
        hover &&
          'hover:shadow-md hover:border-gray-200 transition-all duration-300',
        className
      )}
      whileHover={hover ? { y: -2 } : undefined}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
