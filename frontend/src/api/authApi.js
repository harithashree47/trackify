import config from '../config.js';
import {
  getToken,
  setSession,
  clearSession,
  handleApiResponse,
} from './session.js';

const API_URL = `${config.API_BASE_URL}/auth`;

export const authApi = {
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }

    const result = await response.json();
    setSession(result);
    return result;
  },

  register: async (name, email, password) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Registration failed');
    }

    const result = await response.json();
    setSession(result);
    return result;
  },

  // Validates the stored token against the backend and returns the current
  // user profile. Used during app startup to restore the saved session.
  me: async () => {
    const token = getToken();
    if (!token) {
      throw Object.assign(new Error('No session'), { status: 401 });
    }

    const response = await fetch(`${config.API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw Object.assign(new Error('Session expired'), {
        status: response.status,
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed: ${response.status}`);
    }

    const result = await response.json();
    return result?.data ?? result;
  },

  logout: async () => {
    clearSession();
  },
};
