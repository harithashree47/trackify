import config from '../config.js';

const API_URL = `${config.API_BASE_URL}/settings`;

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

export const settingsApi = {
  // Get reminder settings for current user
  get: async () => {
    const response = await fetch(API_URL, {
      headers: getAuthHeader(),
    });
    return handleResponse(response);
  },

  // Update reminder settings for current user
  update: async (payload) => {
    const response = await fetch(API_URL, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },
};
