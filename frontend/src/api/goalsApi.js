import config from '../config.js';

const API_URL = `${config.API_BASE_URL}/goals`;

const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

const handleResponse = async (response) => {
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed: ${response.status}`);
  }

  return response.json();
};

export const goalsApi = {
  // Get all goals for current user
  getAll: async () => {
    const response = await fetch(API_URL, {
      headers: getAuthHeader(),
    });
    const data = await handleResponse(response);
    return Array.isArray(data) ? data : data?.goals || [];
  },

  // Get a single goal
  getById: async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
      headers: getAuthHeader(),
    });
    return handleResponse(response);
  },

  // Create a new goal
  create: async (title, description, priority = 'medium') => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ title, description, priority }),
    });
    return handleResponse(response);
  },

  // Update a goal
  update: async (id, title, description) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: getAuthHeader(),
      body: JSON.stringify({ title, description }),
    });
    return handleResponse(response);
  },

  // Toggle goal completion
  toggleComplete: async (id) => {
    const response = await fetch(`${API_URL}/${id}/toggle`, {
      method: 'PATCH',
      headers: getAuthHeader(),
    });
    return handleResponse(response);
  },

  // Delete a goal
  delete: async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return handleResponse(response);
  },
};
