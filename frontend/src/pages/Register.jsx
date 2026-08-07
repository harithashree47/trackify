import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { authApi } from '../api';
import { Input } from '../components/Input.jsx';
import { Button } from '../components/Button.jsx';
import { AuthLayout } from '../components/AuthLayout.jsx';

export const Register = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { error, success } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authApi.register(
        formData.name,
        formData.email,
        formData.password
      );
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      setUser(result.user);
      success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      error(err.message || 'Failed to create account. Please try again.');
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
          Create Account
        </h2>
        <p className="mt-2 text-[14.5px] text-slate-500">
          Start tracking your daily goals today
        </p>

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="mb-[18px]">
            <Input
              type="text"
              label="Full Name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              leftIcon={<FiUser className="h-5 w-5" />}
              required
            />
          </div>

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
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              leftIcon={<FiLock className="h-5 w-5" />}
              required
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-[22px] w-full"
            isLoading={isLoading}
          >
            Create Account
          </Button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
};
