import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLogOut, FiSettings, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { resolveAssetUrl } from '../config.js';
import { Logo } from './Logo.jsx';
import { SideMenu } from './SideMenu.jsx';

const avatarBtnClass =
  'flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full border-2 border-white bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-bold text-white shadow-md shadow-blue-600/30';

export const Navbar = ({ onLogout }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const avatarUrl = resolveAssetUrl(user?.avatarUrl);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-40 flex items-center gap-2 border-b border-slate-200/70 bg-white/75 px-3 py-3 backdrop-blur-xl sm:gap-4 sm:px-8 sm:py-3.5"
    >
      {/* Mobile hamburger + drawer */}
      <SideMenu
        open={isMenuOpen}
        onOpen={() => setIsMenuOpen(true)}
        onClose={() => setIsMenuOpen(false)}
        onLogout={onLogout}
      />

      <Logo />

      <div className="ml-auto flex flex-none items-center gap-2 sm:gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="hidden text-right leading-tight sm:block">
            <b className="block text-[13px] text-slate-900">{user?.name}</b>
            <small className="text-[11.5px] text-slate-500">{user?.email}</small>
          </div>
          <button
            onClick={() => navigate('/profile')}
            title="My Profile"
            className={avatarBtnClass}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.name || 'Profile'}
                className="h-full w-full object-cover"
              />
            ) : (
              user?.name?.charAt(0).toUpperCase() || 'U'
            )}
          </button>
        </div>

        {/* On phones these live inside the hamburger drawer instead. */}
        <button
          onClick={() => navigate('/analytics')}
          title="Analytics"
          className="hidden h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-800 sm:flex"
        >
          <FiTrendingUp className="h-[18px] w-[18px]" />
        </button>

        <button
          onClick={() => navigate('/calendar')}
          title="Activity Calendar"
          className="hidden h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-800 sm:flex"
        >
          <FiCalendar className="h-[18px] w-[18px]" />
        </button>

        <button
          onClick={() => navigate('/settings')}
          title="Settings"
          className="hidden h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-800 sm:flex"
        >
          <FiSettings className="h-[18px] w-[18px]" />
        </button>

        <button
          onClick={onLogout}
          title="Logout"
          className="hidden h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-red-50 hover:text-red-500 sm:flex"
        >
          <FiLogOut className="h-[18px] w-[18px]" />
        </button>
      </div>
    </motion.nav>
  );
};
