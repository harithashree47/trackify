import { motion } from 'framer-motion';
import { FiCalendar, FiX } from 'react-icons/fi';

export const DateRangePicker = ({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onReset,
}) => {
  const isActive = fromDate || toDate;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
    >
      <div className="flex items-center gap-2 text-gray-700">
        <FiCalendar className="w-4 h-4" />
        <span className="text-sm font-medium">Filter by Date</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 flex-1">
        <div className="flex-1">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="From date"
          />
        </div>

        <div className="hidden sm:flex items-center justify-center text-gray-400 px-2">
          →
        </div>

        <div className="flex-1">
          <input
            type="date"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="To date"
          />
        </div>
      </div>

      {isActive && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReset}
          className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiX className="w-4 h-4" />
          Clear
        </motion.button>
      )}
    </motion.div>
  );
};
