import config from '../config.js';

// Free-tier hosts (e.g. Render) sleep the backend after ~15 minutes without
// traffic. When that happens mid-session, the next request stalls for 30-60s
// while the server wakes up — which feels exactly like "the PWA is broken".
//
// While the app is open AND visible, ping the API with a lightweight HEAD
// request every few minutes so it stays warm during active use. The ping is
// skipped when the tab/app is hidden, so nothing runs in the background.
const PING_INTERVAL_MS = 9 * 60 * 1000; // Render sleeps after ~15 min idle

let timerId = null;

const ping = () => {
  // /docs is served by Swagger without touching the database.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  return fetch(`${config.API_BASE_URL}/docs`, {
    method: 'HEAD',
    signal: controller.signal,
  })
    .catch(() => {})
    .finally(() => clearTimeout(timer));
};

export const startKeepWarm = () => {
  if (timerId || typeof document === 'undefined') return;
  timerId = setInterval(() => {
    if (document.visibilityState === 'visible') ping();
  }, PING_INTERVAL_MS);
};

export const stopKeepWarm = () => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
};
