const styles = {
  high: 'bg-red-50 text-red-600',
  medium: 'bg-amber-50 text-amber-600',
  low: 'bg-blue-50 text-blue-600',
};

export const PriorityBadge = ({ priority = 'medium' }) => {
  const label = priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Medium';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-bold ${styles[priority] || styles.medium}`}
    >
      {label}
    </span>
  );
};
