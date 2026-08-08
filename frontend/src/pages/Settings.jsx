import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiBell } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { settingsApi } from '../api';
import { Navbar } from '../components/Navbar.jsx';
import { Button } from '../components/Button.jsx';
import { Input } from '../components/Input.jsx';
import {
  enablePushNotifications,
  disablePushNotifications,
  getPushState,
} from '../pwa/pushNotifications.js';

const DEFAULT_SETTINGS = {
  workStart: '09:00',
  workEnd: '18:00',
  freeStart: '18:00',
  freeEnd: '22:00',
  timezone: 'UTC',
};

const getLocalTimezone = () => {
  try {
    return (
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    );
  } catch {
    return 'UTC';
  }
};

export const Settings = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { success, error } = useToast();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [pushState, setPushState] = useState({
    supported: false,
    subscribed: false,
    permission: 'default',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingPush, setIsTogglingPush] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await settingsApi.get();
        setSettings({
          ...DEFAULT_SETTINGS,
          ...data,
          timezone: data.timezone || getLocalTimezone(),
        });
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setIsLoading(false);
      }

      try {
        setPushState(await getPushState());
      } catch (err) {
        console.error('Error reading push state:', err);
      }
    };
    load();
  }, []);

  const handleFieldChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await settingsApi.update({
        workStart: settings.workStart,
        workEnd: settings.workEnd,
        freeStart: settings.freeStart,
        freeEnd: settings.freeEnd,
        timezone: getLocalTimezone(),
      });
      setSettings((prev) => ({ ...prev, timezone: getLocalTimezone() }));
      success('Reminder settings saved!');
    } catch (err) {
      error(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnablePush = async () => {
    setIsTogglingPush(true);
    try {
      await enablePushNotifications();
      setPushState((prev) => ({ ...prev, subscribed: true, permission: 'granted' }));
      success('Notifications enabled! You will get a reminder for unfinished goals.');
    } catch (err) {
      error(err.message || 'Could not enable notifications.');
    } finally {
      setIsTogglingPush(false);
    }
  };

  const handleDisablePush = async () => {
    setIsTogglingPush(true);
    try {
      await disablePushNotifications();
      setPushState((prev) => ({ ...prev, subscribed: false }));
      success('Notifications disabled.');
    } catch (err) {
      error('Could not disable notifications.');
    } finally {
      setIsTogglingPush(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const previewReminder = () => {
    const [h, m] = settings.freeStart.split(':').map(Number);
    const [eh, em] = settings.freeEnd.split(':').map(Number);
    const freeStart = h * 60 + m;
    const freeEnd = eh * 60 + em;
    if (!Number.isFinite(freeStart) || !Number.isFinite(freeEnd) || freeEnd <= freeStart) {
      return '—';
    }
    const offset = Math.min(60, Math.floor((freeEnd - freeStart) / 2));
    const reminder = freeStart + offset;
    const rh = Math.floor(reminder / 60);
    const rm = reminder % 60;
    const period = rh >= 12 ? 'PM' : 'AM';
    const displayHour = rh % 12 === 0 ? 12 : rh % 12;
    return `${displayHour}:${String(rm).padStart(2, '0')} ${period}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar onLogout={handleLogout} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
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
              Settings
            </h1>
            <p className="text-[12px] font-medium text-slate-500">
              Smart reminder preferences
            </p>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-64 rounded-[20px] bg-white animate-pulse border border-slate-100" />
            <div className="h-40 rounded-[20px] bg-white animate-pulse border border-slate-100" />
          </div>
        ) : (
          <>
            {/* Reminder Schedule */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4 rounded-[20px] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-[14px] bg-blue-50 text-blue-600">
                  <FiClock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-slate-900">
                    Work & Free Time
                  </h2>
                  <p className="text-[12.5px] text-slate-500">
                    Goal reminders are scheduled automatically during your free time.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    type="time"
                    label="Work starts at"
                    value={settings.workStart}
                    onChange={(e) => handleFieldChange('workStart', e.target.value)}
                    required
                  />
                  <Input
                    type="time"
                    label="Work ends at"
                    value={settings.workEnd}
                    onChange={(e) => handleFieldChange('workEnd', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    type="time"
                    label="Free time starts at"
                    value={settings.freeStart}
                    onChange={(e) => handleFieldChange('freeStart', e.target.value)}
                    required
                  />
                  <Input
                    type="time"
                    label="Free time ends at"
                    value={settings.freeEnd}
                    onChange={(e) => handleFieldChange('freeEnd', e.target.value)}
                    required
                  />
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3">
                  <p className="text-[12.5px] font-semibold text-slate-600">
                    Your timezone:{' '}
                    <span className="font-bold text-slate-900">
                      {getLocalTimezone()}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-slate-500">
                    Reminders are sent at{' '}
                    <span className="font-bold text-blue-600">
                      {previewReminder()}
                    </span>{' '}
                    on the same day you create a goal.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" isLoading={isSaving}>
                    Save Settings
                  </Button>
                </div>
              </form>
            </motion.section>

            {/* Notifications */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="mb-4 rounded-[20px] border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-[14px] bg-indigo-50 text-indigo-600">
                  <FiBell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-slate-900">
                    Notifications
                  </h2>
                  <p className="text-[12.5px] text-slate-500">
                    Get a push notification for unfinished goals, even when the app
                    is closed.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-slate-800">
                    {pushState.supported
                      ? pushState.subscribed
                        ? 'Notifications are enabled on this device.'
                        : pushState.permission === 'denied'
                          ? 'Notifications are blocked in your browser.'
                          : 'Notifications are not enabled on this device.'
                      : 'Push notifications are not supported by this browser.'}
                  </p>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    Example: "🔔 You haven't completed 'Learn SQL' yet. Don't
                    forget to finish today's goal!"
                  </p>
                </div>

                <div className="flex-none">
                  {pushState.subscribed ? (
                    <Button
                      variant="secondary"
                      onClick={handleDisablePush}
                      isLoading={isTogglingPush}
                    >
                      Disable Notifications
                    </Button>
                  ) : (
                    <Button
                      onClick={handleEnablePush}
                      isLoading={isTogglingPush}
                      disabled={!pushState.supported}
                    >
                      Enable Notifications
                    </Button>
                  )}
                </div>
              </div>
            </motion.section>
          </>
        )}
      </main>
    </div>
  );
};
