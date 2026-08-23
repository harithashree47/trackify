import { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { cn } from '../utils/cn.js';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
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

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  // Always mounted; CSS transitions only. AnimatePresence around a
  // full-screen backdrop has left invisible click-blockers behind before,
  // which is how the hamburger menu appeared to "not work".
  return (
    <div
      className={cn(
        'fixed inset-0 z-[80]',
        !isOpen && 'pointer-events-none'
      )}
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
            'max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl bg-white shadow-2xl transition-all duration-200',
            sizes[size],
            isOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-5 scale-95 opacity-0'
          )}
        >
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            {title && (
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};
