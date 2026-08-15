import { useGoalsContext } from '../context/GoalsContext.jsx';

// Goals are fetched once by the GoalsProvider and shared across all pages.
// The `enabled` option is kept for API compatibility; fetching is driven by
// the auth state inside the provider.
export const useGoals = ({ enabled = true } = {}) => {
  const { goals, setGoals, isLoading, error, retry } = useGoalsContext();
  return { goals, setGoals, isLoading, error, retry };
};