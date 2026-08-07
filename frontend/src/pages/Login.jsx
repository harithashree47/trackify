import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Input } from '../components/Input.jsx';
import { Button } from '../components/Button.jsx';
import { AuthLayout } from '../components/AuthLayout.jsx';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { error } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      error('Invalid email or password. Try test@example.com / password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-[28px] font-extrabold tracking-tight">
          Welcome back
        </h2>
        <p className="mt-2 text-[14.5px] text-slate-500">
          Sign in to continue to your goals
        </p>

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="mb-[18px]">
            <Input
              type="email"
              label="Email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              leftIcon={<FiMail className="h-5 w-5" />}
              required
            />
          </div>

          <div className="mb-2">
            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              leftIcon={<FiLock className="h-5 w-5" />}
              required
            />
          </div>

          <div className="mb-[22px] mt-4 flex items-center justify-between">
            <label className="flex cursor-pointer select-none items-center gap-2.5 text-[13.5px] font-medium">
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember((r) => !r)}
                className="peer sr-only"
              />
              <span className="flex h-5 w-5 items-center justify-center rounded-[7px] border-[1.6px] border-slate-200 bg-white transition peer-checked:border-blue-600 peer-checked:bg-blue-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3 w-3 text-white opacity-0 transition peer-checked:opacity-100"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </span>
              Remember me
            </label>
            <Link
              to="/login"
              className="text-[13.5px] font-semibold text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
            Sign in
          </Button>
        </form>

        <div className="my-[26px] flex items-center gap-[14px] text-[12.5px] font-medium text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          or continue with
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-slate-200 bg-white px-3 py-3 text-[13.5px] font-semibold text-slate-800 transition hover:bg-slate-50 hover:shadow-sm"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]">
              <path fill="#EA4335" d="M12 5.4c1.7 0 3.1.6 4.3 1.7l3.1-3.1C17.5 2.2 15 1.2 12 1.2 7.6 1.2 3.8 3.7 1.9 7.4l3.6 2.8C6.5 7.2 9 5.4 12 5.4z" />
              <path fill="#4285F4" d="M22.7 12.3c0-.8-.1-1.5-.2-2.1H12v4.1h6c-.3 1.4-1 2.6-2.2 3.4v2.8h3.4c2-1.9 3.5-4.6 3.5-8.2z" />
              <path fill="#34A853" d="M5.5 14.2c-.3-.8-.5-1.7-.5-2.7s.2-1.9.5-2.7L1.9 6C.7 8.2 0 10.6 0 13.2c0 2.6.7 5 1.9 6.9l3.6-2.9z" transform="translate(.3 .3)" />
              <path fill="#FBBC05" d="M12 23.2c2.9 0 5.4-1 7.2-2.7l-3.4-2.8c-1 .7-2.3 1.1-3.8 1.1-3 0-5.5-1.9-6.5-4.5l-3.6 2.8c1.9 3.7 5.7 6.1 10.1 6.1z" />
            </svg>
            Google
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-slate-200 bg-white px-3 py-3 text-[13.5px] font-semibold text-slate-800 transition hover:bg-slate-50 hover:shadow-sm"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-slate-900">
              <path d="M17.05 12.55c-.03-2.32 1.9-3.43 1.98-3.48-1.08-1.58-2.76-1.8-3.36-1.82-1.43-.15-2.79.84-3.51.84-.73 0-1.85-.82-3.04-.8-1.56.02-3 .91-3.81 2.32-1.63 2.82-.42 7 1.17 9.29.78 1.12 1.7 2.38 2.91 2.34 1.17-.05 1.61-.76 3.02-.76 1.41 0 1.81.76 3.04.74 1.26-.02 2.06-1.15 2.83-2.28.89-1.3 1.26-2.56 1.28-2.63-.03-.01-2.45-.94-2.47-3.72zM14.52 4.6c.65-.78 1.08-1.87.96-2.95-.93.04-2.05.62-2.72 1.4-.6.69-1.12 1.79-.98 2.84 1.03.08 2.08-.52 2.74-1.29z" />
            </svg>
            Apple
          </button>
        </div>

        <p className="mt-7 text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-bold text-blue-600 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
};
