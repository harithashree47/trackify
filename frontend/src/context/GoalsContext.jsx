import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { goalsApi } from '../api';
import { useAuth } from './AuthContext.jsx';

const GoalsContext = createContext(undefined);

const GOALS_CACHE_KEY = 'trackify:goals';

export const useGoalsContext = () => {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return context;
};

const readCache = () => {
  try {
    const raw = localStorage.getItem(GOALS_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const writeCache = (goals) => {
  try {
    localStorage.setItem(GOALS_CACHE_KEY, JSON.stringify(goals));
  } catch {
    // Storage unavailable — ignore.
  }
};

const clearCache = () => {
  try {
    localStorage.removeItem(GOALS_CACHE_KEY);
  } catch {
    // Ignore storage errors.
  }
};

// Fetch the user's goals once and share them across every page, so navigating
// between Dashboard / Goals / Calendar never re-fetches or re-shows loaders.
// Repeat visits render instantly from a local cache (stale-while-revalidate)
// while the fresh copy is fetched in the background.
export const GoalsProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchedRef = useRef(false);
  const hasDataRef = useRef(false);

  const load = useCallback(async () => {
    if (!hasDataRef.current) setIsLoading(true);
    setError(null);
    try {
      const data = await goalsApi.getAll();
      setGoals(data);
      hasDataRef.current = data.length > 0;
      writeCache(data);
    } catch (err) {
      // Keep showing cached data on a failed background refresh; only surface
      // the error when there's nothing to display.
      if (!hasDataRef.current) {
        setError(err.message || 'Failed to load goals.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setGoals([]);
      setError(null);
      setIsLoading(false);
      hasDataRef.current = false;
      fetchedRef.current = false;
      clearCache();
      return;
    }

    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // Render instantly from the local cache while the fresh copy loads.
    const cached = readCache();
    if (cached) {
      hasDataRef.current = cached.length > 0;
      setGoals(cached);
      setIsLoading(false);
    }

    load();
  }, [isAuthenticated, load]);

  return (
    <GoalsContext.Provider value={{ goals, setGoals, isLoading, error, retry: load }}>
      {children}
    </GoalsContext.Provider>
  );
};