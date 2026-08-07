import { cn } from '../utils/cn.js';
import logoImg from '../assets/logo1.png';

export const LogoMark = ({ className }) => (
  <span
    className={cn(
      'flex h-10 w-10 flex-none items-center justify-center overflow-hidden sm:h-16 sm:w-16',
      className
    )}
  >
    <img
      src={logoImg}
      alt="Trackify logo"
      className="h-full w-full scale-[1.35] object-contain"
    />
  </span>
);

export const Logo = ({ className, onDark = false, markClassName, titleClassName }) => (
  <div className={cn('flex items-center gap-0', className)}>
    <LogoMark className={markClassName} />
    <span
      className={cn(
        '-ml-1 text-[19px] font-extrabold tracking-tight sm:text-[26px]',
        titleClassName,
        onDark
          ? 'text-white'
          : 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'
      )}
    >
      Trackify
    </span>
  </div>
);
