import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiBell, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { settingsApi } from '../api';
import { Navbar } from '../components/Navbar.jsx';
import { Button } from '../components/Button.jsx';
import {
  enablePushNotifications,
  disablePushNotifications,
  getPushState,
} from '../pwa/pushNotifications.js';

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
  const [pushState, setPushState] = useState({
    supported: false,
    subscribed: false,
    permission: 'default',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isTogglingPush, setIsTogglingPush] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await settingsApi.get();
      const localTimezone = getLocalTimezone();
      if (data.timezone && data.timezone !== localTimezone) {
        settingsApi.update({ timezone: localTimezone }).catch(() => {});
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setLoadError(err.message || 'Could not load your settings.');
    } finally {
      setIsLoading(false);
    }

    try {
      setPushState(await getPushState());
    } catch (err) {
      console.error('Error reading push state:', err);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleEnablePush = async () => {
    setIsTogglingPush(true);
    try {
      await enablePushNotifications();
      await settingsApi
        .update({ timezone: getLocalTimezone() })
        .catch(() => {});
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
              Hourly reminders for unfinished goals
            </p>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-56 rounded-[20px] bg-white animate-pulse border border-slate-100" />
          </div>
        ) : loadError ? (
          <div className="rounded-[20px] border border-red-200 bg-red-50 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <FiRefreshCw className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-red-800">Couldn't load your settings</h3>
            <p className="mt-1 text-sm text-red-600">{loadError}</p>
            <Button
              className="mt-4"
              onClick={load}
              leftIcon={<FiRefreshCw className="h-4 w-4" />}
            >
              Try Again
            </Button>
          </div>
        ) : (
          <>
            {/* Notifications */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
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
                    Remind me hourly about unfinished goals.
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
                    Example: "🔔 You haven't completed 'Learn SQL' yet 💪"
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
