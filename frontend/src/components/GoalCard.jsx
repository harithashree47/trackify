import { motion } from 'framer-motion';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Card } from './Card.jsx';
import { Checkbox } from './Checkbox.jsx';
import { cn } from '../utils/cn.js';

export const GoalCard = ({
  goal,
  onToggle,
  onEdit,
  onDelete,
}) => {
  return (
    <Card
      hover
      className={cn(
        'group relative p-3 sm:p-4 transition-all duration-300 h-full flex flex-col',
        goal.completed && 'border-green-200 bg-green-50'
      )}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      whileHover={{ y: -2 }}
    >
      {/* Left accent bar for completed goals */}
      <motion.span
        initial={false}
        animate={{ scaleX: goal.completed ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-400 to-emerald-500 origin-left rounded-l-xl"
      />

      {/* Checkbox and Title */}
      <div className="flex items-center gap-2 mb-3 flex-1">
        <Checkbox
          checked={goal.completed}
          onChange={() => onToggle(goal.id)}
          size="sm"
        />
        <h3
          className={cn(
            'font-medium text-sm leading-tight flex-1 cursor-pointer transition-all duration-300 break-words',
            goal.completed ? 'line-through text-gray-400' : 'text-gray-900'
          )}
          onClick={() => onToggle(goal.id)}
          title={goal.title}
        >
          {goal.title}
        </h3>
      </div>

      {/* Action Buttons - Bottom */}
      <div className="flex gap-1 pt-2 border-t border-gray-100">
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          onClick={() => onEdit(goal)}
          className="flex-1 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors text-center flex items-center justify-center"
          aria-label="Edit goal"
          title="Edit"
        >
          <FiEdit2 className="w-3.5 h-3.5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          onClick={() => onDelete(goal)}
          className="flex-1 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors text-center flex items-center justify-center"
          aria-label="Delete goal"
          title="Delete"
        >
          <FiTrash2 className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </Card>
  );
};
