import { createContext, useContext, useState, useEffect } from 'react';
import { goalsApi } from '../services/api';

const GoalsContext = createContext(undefined);

export const useGoals = () => {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return context;
};

export const GoalsProvider = ({ children }) => {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGoals = async () => {
    try {
      setIsLoading(true);
      const data = await goalsApi.getAll();
      setGoals(data);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const addGoal = async (title, description, priority = 'medium') => {
    const newGoal = await goalsApi.create(title, description, priority);
    setGoals((prev) => [newGoal, ...prev]);
    return newGoal;
  };

  const updateGoal = async (id, title, description) => {
    const updatedGoal = await goalsApi.update(id, title, description);
    setGoals((prev) => prev.map((g) => (g.id === id ? updatedGoal : g)));
    return updatedGoal;
  };

  const toggleGoal = async (id) => {
    const updatedGoal = await goalsApi.toggleComplete(id);
    setGoals((prev) => prev.map((g) => (g.id === id ? updatedGoal : g)));
    return updatedGoal;
  };

  const deleteGoal = async (id) => {
    await goalsApi.delete(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <GoalsContext.Provider
      value={{
        goals,
        isLoading,
        fetchGoals,
        addGoal,
        updateGoal,
        toggleGoal,
        deleteGoal,
      }}
    >
      {children}
    </GoalsContext.Provider>
  );
};
