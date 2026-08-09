import config from '../config.js';
import { getToken, handleApiResponse } from './session.js';

const API_URL = `${config.API_BASE_URL}/goals`;

const getAuthHeader = () => ({
  Authorization: `Bearer ${getToken()}`,
  'Content-Type': 'application/json',
});

export const goalsApi = {
  // Get all goals for current user
  getAll: async () => {
    const response = await fetch(API_URL, {
      headers: getAuthHeader(),
    });
    const data = await handleApiResponse(response);
    return Array.isArray(data) ? data : data?.goals || [];
  },

  // Get a single goal
  getById: async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
      headers: getAuthHeader(),
    });
    return handleApiResponse(response);
  },

  // Create a new goal
  create: async (title, description, priority = 'medium') => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ title, description, priority }),
    });
    return handleApiResponse(response);
  },

  // Update a goal
  update: async (id, title, description) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: getAuthHeader(),
      body: JSON.stringify({ title, description }),
    });
    return handleApiResponse(response);
  },

  // Toggle goal completion
  toggleComplete: async (id) => {
    const response = await fetch(`${API_URL}/${id}/toggle`, {
      method: 'PATCH',
      headers: getAuthHeader(),
    });
    return handleApiResponse(response);
  },

  // Delete a goal
  delete: async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return handleApiResponse(response);
  },
};
