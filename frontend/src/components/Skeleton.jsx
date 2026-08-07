import { cn } from '../utils/cn.js';

export const Skeleton = ({
  className,
  variant = 'text',
  width,
  height,
}) => {
  const baseStyles = 'animate-pulse bg-gray-200 rounded';

  const variants = {
    text: 'h-4',
    circle: 'rounded-full',
    rect: 'rounded-lg',
  };

  return (
    <div
      className={cn(baseStyles, variants[variant], className)}
      style={{
        width: width || (variant === 'circle' ? height : '100%'),
        height: height || (variant === 'circle' ? width : undefined),
      }}
    />
  );
};

export const GoalCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4 h-32 sm:h-36 flex flex-col">
      <div className="flex items-start gap-2 mb-2">
        <Skeleton variant="circle" width={20} height={20} />
        <Skeleton className="w-full h-4" />
      </div>
      <Skeleton className="w-full h-3 mb-2" />
      <Skeleton className="w-3/4 h-3 mb-3 flex-1" />
      <div className="flex gap-1 pt-2 border-t border-gray-100">
        <Skeleton className="flex-1 h-6" />
        <Skeleton className="flex-1 h-6" />
      </div>
    </div>
  );
};

export const DashboardCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <Skeleton className="w-20 h-4 mb-4" />
      <Skeleton className="w-32 h-8 mb-2" />
      <Skeleton className="w-24 h-4" />
    </div>
  );
};
