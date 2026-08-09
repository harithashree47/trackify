import config from '../config.js';
import { getToken, handleApiResponse } from './session.js';

const API_URL = `${config.API_BASE_URL}/settings`;

const getAuthHeader = () => ({
  Authorization: `Bearer ${getToken()}`,
  'Content-Type': 'application/json',
});

export const settingsApi = {
  // Get reminder settings for current user
  get: async () => {
    const response = await fetch(API_URL, {
      headers: getAuthHeader(),
    });
    return handleApiResponse(response);
  },

  // Update reminder settings for current user
  update: async (payload) => {
    const response = await fetch(API_URL, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(payload),
    });
    return handleApiResponse(response);
  },
};
