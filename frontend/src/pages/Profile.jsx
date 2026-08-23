import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiCheck,
  FiEdit2,
  FiCamera,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { authApi } from '../api';
import { resolveAssetUrl } from '../config.js';
import { Navbar } from '../components/Navbar.jsx';
import { Button } from '../components/Button.jsx';
import { Input } from '../components/Input.jsx';

const AVATAR_MAX_MB = 5;
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const Profile = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const { success, error } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const storedAvatar = resolveAssetUrl(user?.avatarUrl);
  const [avatarPreview, setAvatarPreview] = useState(storedAvatar);
  const avatarSrc = avatarPreview ?? storedAvatar;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null;

  const validate = () => {
    const errors = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const updated = await authApi.updateProfile({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
      });
      // Keep the whole app (navbar, drawer, cached session) in sync instantly.
      setUser((prev) => ({ ...prev, ...updated }));
      success('Profile updated successfully.');
      setIsEditing(false);
    } catch (err) {
      error(err.message || 'Could not update your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ name: user?.name || '', email: user?.email || '' });
    setFieldErrors({});
    setIsEditing(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    if (!AVATAR_TYPES.includes(file.type)) {
      error('Please choose a JPG, PNG, WEBP or GIF image.');
      return;
    }
    if (file.size > AVATAR_MAX_MB * 1024 * 1024) {
      error(`Image must be smaller than ${AVATAR_MAX_MB} MB.`);
      return;
    }

    // Instant local preview while the upload runs.
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    setIsUploadingAvatar(true);
    try {
      const updated = await authApi.uploadAvatar(file);
      setUser((prev) => ({ ...prev, ...updated }));
      success('Profile picture updated.');
    } catch (err) {
      setAvatarPreview(storedAvatar); // roll back the preview
      error(err.message || 'Could not upload your picture.');
    } finally {
      setIsUploadingAvatar(false);
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar onLogout={handleLogout} />

      <main className="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-center gap-2"
        >
          <motion.button
            onClick={() => navigate('/dashboard')}
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
            title="Back to Dashboard"
          >
            <FiArrowLeft className="h-4 w-4" />
          </motion.button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              My Profile
            </h1>
            <p className="text-[12px] font-medium text-slate-500">
              View and edit your personal details
            </p>
          </div>
        </motion.div>

        {/* Avatar card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="relative flex-none">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-xl font-bold text-white shadow-md shadow-blue-600/30 sm:h-20 sm:w-20 sm:text-2xl">
                {isUploadingAvatar && !avatarSrc ? (
                  <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={user?.name || 'Profile'}
                    className={`h-full w-full object-cover ${isUploadingAvatar ? 'opacity-60' : ''}`}
                  />
                ) : (
                  (isEditing ? form.name : user?.name)?.charAt(0).toUpperCase() || 'U'
                )}
              </div>

              {/* Camera badge — visible only while editing, opens the file picker */}
              {isEditing && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    title="Upload profile picture"
                    aria-label="Upload profile picture"
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-[2.5px] border-white bg-slate-900 text-white shadow-md transition hover:bg-blue-600 disabled:opacity-60"
                  >
                    {isUploadingAvatar ? (
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <FiCamera className="h-3.5 w-3.5" />
                    )}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={AVATAR_TYPES.join(',')}
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </>
              )}
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-[17px] font-extrabold text-slate-900">
                {user?.name}
              </h2>
              <p className="truncate text-[13px] text-slate-500">{user?.email}</p>
              {memberSince && (
                <p className="mt-0.5 text-[11.5px] text-slate-400">
                  Member since {memberSince}
                </p>
              )}
            </div>
          </div>
        </motion.section>

        {/* Details / edit form */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 flex-none items-center justify-center rounded-[14px] bg-blue-50 text-blue-600">
                <FiUser className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-slate-900">Personal details</h3>
                <p className="text-[12px] text-slate-500">
                  Your name shows up in reminders and greetings.
                </p>
              </div>
            </div>
            {!isEditing && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(true)}
                leftIcon={<FiEdit2 className="h-3.5 w-3.5" />}
              >
                Edit
              </Button>
            )}
          </div>

          {!isEditing ? (
            <dl className="space-y-4">
              <div className="flex items-center gap-3 rounded-[14px] bg-slate-50 px-4 py-3">
                <FiUser className="h-4 w-4 flex-none text-slate-400" />
                <div className="min-w-0">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Name
                  </dt>
                  <dd className="truncate text-[14px] font-semibold text-slate-900">
                    {user?.name}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[14px] bg-slate-50 px-4 py-3">
                <FiMail className="h-4 w-4 flex-none text-slate-400" />
                <div className="min-w-0">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Email
                  </dt>
                  <dd className="truncate text-[14px] font-semibold text-slate-900">
                    {user?.email}
                  </dd>
                </div>
              </div>
            </dl>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                leftIcon={<FiUser className="h-5 w-5" />}
                error={fieldErrors.name}
                required
                minLength={2}
                maxLength={60}
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                leftIcon={<FiMail className="h-5 w-5" />}
                error={fieldErrors.email}
                required
              />
              <p className="text-[12px] text-slate-500">
                Changing your email changes what you use to log in next time.
              </p>
              <div className="flex gap-3 pt-1">
                <Button type="submit" isLoading={isSaving} leftIcon={<FiCheck className="h-4 w-4" />}>
                  Save Changes
                </Button>
                <Button type="button" variant="secondary" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </motion.section>
      </main>
    </div>
  );
};
