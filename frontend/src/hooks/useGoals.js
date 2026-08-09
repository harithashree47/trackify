import { useState, useCallback, useEffect } from 'react';
import { goalsApi } from '../api';

export const useGoals = () => {
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
    load();
  }, [load]);

  return { goals, setGoals, isLoading, error, retry: load };
};
