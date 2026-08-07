import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env?.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Mock data for development
const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=3B82F6&color=fff',
};

const mockGoals = [
  {
    id: '1',
    title: 'Office Work',
    description: 'Deep focus block for the project proposal',
    completed: true,
    priority: 'low',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'SQL Practice',
    description: 'Complete advanced JOIN exercises',
    completed: false,
    priority: 'high',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'React Learning',
    description: 'Finish the hooks chapter',
    completed: true,
    priority: 'medium',
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Workout',
    description: '30 min strength session',
    completed: false,
    priority: 'medium',
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Read book',
    description: 'Read 20 pages before bed',
    completed: false,
    priority: 'low',
    createdAt: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'Morning walk',
    description: '',
    completed: true,
    priority: 'low',
    createdAt: new Date().toISOString(),
  },
];

const daysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

mockGoals.push(
  { id: '7', title: 'REST API review', description: 'Refactor the endpoints', completed: true, priority: 'high', createdAt: daysAgo(1) },
  { id: '8', title: 'DSA practice', description: 'Solve 3 array problems', completed: false, priority: 'medium', createdAt: daysAgo(1) },
  { id: '9', title: 'UI polish', description: 'Fix the login page paddings', completed: true, priority: 'low', createdAt: daysAgo(2) },
  { id: '10', title: 'Team sync', description: 'Weekly standup notes', completed: true, priority: 'low', createdAt: daysAgo(2) },
  { id: '11', title: 'Backend tests', description: 'Add unit tests for auth', completed: false, priority: 'high', createdAt: daysAgo(3) },
  { id: '12', title: 'Reading', description: 'Finish chapter 4', completed: true, priority: 'medium', createdAt: daysAgo(3) }
);

// Auth API
export const authApi = {
  login: async (email, password) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (email === 'test@example.com' && password === 'password') {
      const token = 'mock-jwt-token-' + Date.now();
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(mockUser));
      return { token, user: mockUser };
    }
    throw new Error('Invalid credentials');
  },

  register: async (name, email, password) => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const token = 'mock-jwt-token-' + Date.now();
    const user = { ...mockUser, name, email };
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { token, user };
  },

  logout: async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// Goals API
export const goalsApi = {
  getAll: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockGoals;
  },

  getById: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const goal = mockGoals.find((g) => g.id === id);
    if (!goal) throw new Error('Goal not found');
    return goal;
  },

  create: async (title, description, priority = 'medium') => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newGoal = {
      id: String(Date.now()),
      title,
      description,
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    mockGoals.unshift(newGoal);
    return newGoal;
  },

  update: async (id, title, description) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = mockGoals.findIndex((g) => g.id === id);
    if (index === -1) throw new Error('Goal not found');
    mockGoals[index] = { ...mockGoals[index], title, description };
    return mockGoals[index];
  },

  toggleComplete: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const index = mockGoals.findIndex((g) => g.id === id);
    if (index === -1) throw new Error('Goal not found');
    mockGoals[index].completed = !mockGoals[index].completed;
    return mockGoals[index];
  },

  delete: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = mockGoals.findIndex((g) => g.id === id);
    if (index === -1) throw new Error('Goal not found');
    mockGoals.splice(index, 1);
    return { success: true };
  },
};

export default api;
