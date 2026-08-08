import { motion } from 'framer-motion';
import { FiLogOut, FiSearch, FiSettings } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Logo } from './Logo.jsx';

export const Navbar = ({ onLogout }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-40 flex items-center gap-3 border-b border-slate-200/70 bg-white/75 px-4 py-3.5 backdrop-blur-xl sm:gap-4 sm:px-8"
    >
      <Logo />

      <div className="relative ml-2 hidden max-w-[380px] flex-1 md:block">
        <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search goals..."
          className="w-full rounded-xl border border-transparent bg-slate-100 py-2.5 pl-10 pr-4 text-[13.5px] outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
        />
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="hidden text-right leading-tight sm:block">
            <b className="block text-[13px] text-slate-900">{user?.name}</b>
            <small className="text-[11.5px] text-slate-500">{user?.email}</small>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-bold text-white shadow-md shadow-blue-600/30">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>

        <button
          onClick={() => navigate('/settings')}
          title="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-800"
        >
          <FiSettings className="h-[18px] w-[18px]" />
        </button>

        <button
          onClick={onLogout}
          title="Logout"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-red-50 hover:text-red-500"
        >
          <FiLogOut className="h-[18px] w-[18px]" />
        </button>
      </div>
    </motion.nav>
  );
};
