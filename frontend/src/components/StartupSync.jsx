import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { syncPushSubscription } from '../pwa/pushNotifications.js';

// Runs one-time background tasks after a session is restored on startup.
// Renders nothing.
export const StartupSync = () => {
  const { user, isLoading } = useAuth();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (isLoading || !user || syncedRef.current) return;
    syncedRef.current = true;
    syncPushSubscription();
  }, [user, isLoading]);

  return null;
};
