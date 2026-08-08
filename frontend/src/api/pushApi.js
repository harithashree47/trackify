import config from '../config.js';

const API_URL = `${config.API_BASE_URL}/push`;

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

export const pushApi = {
  // Get the server's VAPID public key
  getVapidPublicKey: async () => {
    const response = await fetch(`${API_URL}/vapid-public-key`);
    if (!response.ok) return { publicKey: '' };
    return response.json();
  },

  // Register the browser's push subscription on the server
  subscribe: async (subscription) => {
    const response = await fetch(`${API_URL}/subscribe`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(subscription),
    });
    return handleResponse(response);
  },

  // Remove the current user's push subscriptions from the server
  unsubscribe: async () => {
    const response = await fetch(`${API_URL}/unsubscribe`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return handleResponse(response);
  },
};
