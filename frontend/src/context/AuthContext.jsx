import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api';
import {
  getStoredUser,
  getToken,
  setSession,
  clearSession,
  AUTH_EXPIRED_EVENT,
} from '../api/session.js';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      const storedUser = getStoredUser();

      if (!token || !storedUser) {
        setIsLoading(false);
        return;
      }

      // Restore the cached profile immediately so the app never flashes a
      // blank/empty state while the session is being validated.
      setUser(storedUser);
      setIsLoading(false);

      try {
        // Validate the saved token against the backend and fetch the freshest
        // user profile in the background, so the app renders instantly even
        // when the backend is slow. Every later API request uses this token.
        const freshUser = await authApi.me();
        setSession({ token, user: freshUser });
        setUser(freshUser);
      } catch (err) {
        if (err?.status === 401 || err?.status === 403) {
          // The stored token is expired/invalid — only then drop the session.
          clearSession();
          setUser(null);
        }
        // Network/offline errors keep the cached session; the pages handle
        // their own error/retry states.
      }
    };

    initAuth();

    // A 401 from any API call (expired token) notifies us so the app can move
    // to /login cleanly without a full page reload.
    const handleAuthExpired = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await authApi.login(email, password);
    setSession(result);
    setUser(result.user);
    return result;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const result = await authApi.register(name, email, password);
    setSession(result);
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
