// Shared session persistence helpers.
//
// The keys must stay exactly as they were so already logged-in users keep
// their existing sessions across this update.

import config from '../config.js';

export const TOKEN_KEY = 'token';
export const USER_KEY = 'user';

export const AUTH_EXPIRED_EVENT = 'trackify:auth-expired';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setSession = ({ token, user }) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Storage unavailable (private mode / full) — session lives in memory.
  }
};

export const clearSession = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // Ignore storage errors.
  }
};

// Called when an authenticated API call proves the token is invalid/expired
// (HTTP 401 from the Trackify API). It clears the persisted session and
// notifies the AuthProvider (via a window event) so the app navigates to
// /login without a hard page reload. Logout remains the only intentional user
// action that clears the session. Note: only a genuine 401 triggers this —
// transient 403/5xx responses from proxies/CDN in front of the API must never
// log the user out.
export const emitAuthExpired = () => {
  clearSession();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
  }
};

// ---------------------------------------------------------------------------
// Network layer: timeouts + limited retries for idempotent requests.
//
// - Every request is bounded by an AbortController timeout so a flaky Wi-Fi or
//   mobile connection can never hang a screen forever.
// - GET requests are retried once on network failures/timeouts or when the
//   host returns 502/503/504 (e.g. while a sleeping free-tier backend wakes
//   up). Mutating requests are never retried automatically to avoid duplicate
//   side effects.
// ---------------------------------------------------------------------------

const GET_TIMEOUT_MS = 30_000; // covers a cold-starting Render backend
const SUBMIT_TIMEOUT_MS = 45_000;

const toFriendlyNetworkError = (err) => {
  if (err && err.name === 'AbortError') {
    return new Error(
      'The server took too long to respond. Check your connection and try again.'
    );
  }
  return new Error(
    'Cannot reach the server. Check your internet connection and try again.'
  );
};

const RETRYABLE_STATUSES = new Set([502, 503, 504]);

/**
 * fetch() with a hard timeout and one automatic retry for safe requests.
 * Returns the raw Response so `handleApiResponse` keeps handling errors.
 */
export const apiFetch = async (url, options = {}, { retries = 0 } = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  const canRetry = method === 'GET' && retries > 0;
  const timeoutMs = method === 'GET' ? GET_TIMEOUT_MS : SUBMIT_TIMEOUT_MS;

  const fetchOptions = { ...options };
  if (method === 'GET' && !fetchOptions.cache) {
    fetchOptions.cache = 'no-store';
  }

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    fetchOptions.signal = controller.signal;

    try {
      const response = await fetch(url, fetchOptions);

      // Retry transient gateway errors (sleeping/waking backend) for GETs.
      if (
        canRetry &&
        attempt < retries &&
        RETRYABLE_STATUSES.has(response.status)
      ) {
        lastError = null;
        continue;
      }

      return response;
    } catch (err) {
      lastError = err;
      if (!canRetry || attempt >= retries) break;
    } finally {
      clearTimeout(timer);
    }
  }

  throw toFriendlyNetworkError(lastError);
};

const API_ORIGIN = (() => {
  try {
    return new URL(config.API_BASE_URL).origin;
  } catch {
    return config.API_BASE_URL;
  }
})();

// Shared response handling for authenticated API calls.
export const handleApiResponse = async (response) => {
  if (!response.ok && response.url && !response.url.startsWith(API_ORIGIN)) {
    // Response did not come from our API (proxy/CDN interception) — surface a
    // plain error instead of touching the session.
    throw Object.assign(new Error(`Request failed: ${response.status}`), {
      status: response.status,
    });
  }

  if (response.status === 401) {
    emitAuthExpired();
    throw Object.assign(new Error('Session expired'), { status: 401 });
  }

  if (!response.ok) {
    // A 403 here would mean insufficient role permissions — it does NOT mean
    // the token is bad, so the session stays intact. CDN/WAF 403 pages also
    // land here without logging the user out.
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed: ${response.status}`);
  }

  return response.json();
};
