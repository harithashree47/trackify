import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiX,
  FiHome,
  FiTarget,
  FiCalendar,
  FiBell,
  FiUser,
  FiLogOut,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { resolveAssetUrl } from '../config.js';
import { Logo } from './Logo.jsx';

const MENU_ITEMS = [
  { label: 'Dashboard', icon: FiHome, to: '/dashboard' },
  { label: 'Goals', icon: FiTarget, to: '/goals' },
  { label: 'Calendar', icon: FiCalendar, to: '/calendar' },
  { label: 'Notifications & Settings', icon: FiBell, to: '/settings' },
  { label: 'My Profile', icon: FiUser, to: '/profile' },
];

const itemClass = (active) =>
  `flex w-full items-center gap-3 rounded-[14px] px-3.5 py-3 text-left text-[13.5px] font-semibold transition ${
    active
      ? 'bg-blue-600/10 text-blue-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

// Slide-in navigation drawer for mobile. The trigger button is rendered by
// this component (visible below the sm breakpoint only), so the desktop
// layout stays exactly as it was. The drawer is always mounted inside its
// portal and uses plain CSS transitions — no animation-library presence
// tracking — so opening/closing is fully deterministic.
export const SideMenu = ({ open, onOpen, onClose, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const avatarUrl = resolveAssetUrl(user?.avatarUrl);

  // Close automatically whenever the route changes.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const go = (to) => {
    onClose();
    if (location.pathname !== to) navigate(to);
  };

  return (
    <>
      {/* Trigger — mobile only, minimal two-line glyph */}
      <button
        type="button"
        onClick={onOpen}
        aria-label="Open menu"
        title="Menu"
        className="-ml-1 flex h-10 w-10 flex-none flex-col items-start justify-center gap-[5px] pl-[11px] text-slate-700 transition active:scale-90 sm:hidden"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <span className="block h-[2px] w-[18px] rounded-full bg-current" />
        <span className="block h-[2px] w-[11px] rounded-full bg-blue-600" />
      </button>

      {createPortal(
        <div
          className={`fixed inset-0 z-[60] sm:hidden ${
            open ? '' : 'pointer-events-none'
          }`}
          aria-hidden={!open}
        >
          {/* Backdrop */}
          <div
            onClick={onClose}
            className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-200 ${
              open ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Drawer panel */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className={`absolute inset-y-0 left-0 flex w-[280px] max-w-[82vw] flex-col rounded-r-[28px] bg-white transition-transform duration-300 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] ${
              open ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <Logo />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                title="Close menu"
                className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
              >
                <FiX className="h-[18px] w-[18px]" />
              </button>
            </div>

            {/* User chip */}
            <button
              type="button"
              onClick={() => go('/profile')}
              className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-50"
            >
              <span className="flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-bold text-white shadow-md shadow-blue-600/30">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user?.name || 'Profile'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || 'U'
                )}
              </span>
              <span className="min-w-0 leading-tight">
                <b className="block truncate text-[13.5px] text-slate-900">
                  {user?.name}
                </b>
                <small className="block truncate text-[12px] text-slate-500">
                  {user?.email}
                </small>
              </span>
            </button>

            {/* Links */}
            <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 pb-4">
              {MENU_ITEMS.map(({ label, icon: Icon, to }) => {
                const active = location.pathname === to;
                return (
                  <button
                    key={to}
                    type="button"
                    onClick={() => go(to)}
                    className={itemClass(active)}
                  >
                    <Icon
                      className={`h-[18px] w-[18px] flex-none ${
                        active ? 'text-blue-700' : 'text-slate-400'
                      }`}
                    />
                    {label}
                  </button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="border-t border-slate-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="flex w-full items-center gap-3 rounded-[14px] px-3.5 py-3 text-left text-[13.5px] font-semibold text-red-500 transition hover:bg-red-50"
              >
                <FiLogOut className="h-[18px] w-[18px] flex-none" />
                Logout
              </button>
            </div>
          </aside>
        </div>,
        document.body
      )}
    </>
  );
};
