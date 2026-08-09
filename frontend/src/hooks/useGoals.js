import { useState, useCallback, useEffect } from 'react';
import { goalsApi } from '../api';

// `enabled` is used to delay fetching until the auth session has been restored
// on startup, so protected pages never briefly render an empty/default state.
export const useGoals = ({ enabled = true } = {}) => {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await goalsApi.getAll();
      setGoals(data);
    } catch (err) {
      setError(err.message || 'Failed to load goals.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    load();
  }, [load, enabled]);

  return { goals, setGoals, isLoading, error, retry: load };
};
