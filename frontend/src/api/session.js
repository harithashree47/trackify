// Shared session persistence helpers.
//
// The keys must stay exactly as they were so already logged-in users keep
// their existing sessions across this update.

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

// Called when any authenticated API call returns 401/403. It clears the
// persisted session and notifies the AuthProvider (via a window event) so the
// app navigates to /login without a hard page reload. Logout remains the only
// intentional user action that clears the session; this only handles an
// expired/invalid token so the user is not left staring at a broken page.
export const emitAuthExpired = () => {
  clearSession();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
  }
};

// Shared response handling for authenticated API calls.
export const handleApiResponse = async (response) => {
  if (response.status === 401 || response.status === 403) {
    emitAuthExpired();
    throw Object.assign(new Error('Unauthorized'), { status: response.status });
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed: ${response.status}`);
  }

  return response.json();
};
