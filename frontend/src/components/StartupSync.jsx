import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { syncPushSubscription } from '../pwa/pushNotifications.js';
import { startKeepWarm, stopKeepWarm } from '../utils/keepWarm.js';

// Runs one-time background tasks after a session is restored on startup.
// Renders nothing.
export const StartupSync = () => {
  const { user, isLoading } = useAuth();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (isLoading || !user || syncedRef.current) return;
    syncedRef.current = true;

    // The push subscription re-sync is not needed for rendering the first
    // screen. Defer it a few seconds so the critical startup requests
    // (session validation + goals) get the network first — this noticeably
    // speeds up cold starts on free-tier backends.
    //
    // Deliberately not cancelled on unmount: this component lives for the
    // whole app lifetime, and cancelling would break the sync under
    // StrictMode's development-time double-mount.
    setTimeout(() => {
      syncPushSubscription();
    }, 4000);
  }, [user, isLoading]);

  // Keep the backend warm while the app is open and signed in, so requests
  // never stall on a sleeping server mid-session.
  useEffect(() => {
    if (!user) {
      stopKeepWarm();
      return undefined;
    }
    startKeepWarm();
    return () => stopKeepWarm();
  }, [user]);

  return null;
};
