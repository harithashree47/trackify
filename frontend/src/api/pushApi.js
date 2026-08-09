import config from '../config.js';
import { getToken, handleApiResponse } from './session.js';

const API_URL = `${config.API_BASE_URL}/push`;

const getAuthHeader = () => ({
  Authorization: `Bearer ${getToken()}`,
  'Content-Type': 'application/json',
});

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
    return handleApiResponse(response);
  },

  // Remove the current user's push subscriptions from the server
  unsubscribe: async () => {
    const response = await fetch(`${API_URL}/unsubscribe`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return handleApiResponse(response);
  },
};
