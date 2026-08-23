import config from '../config.js';
import {
  getToken,
  getStoredUser,
  setSession,
  clearSession,
  apiFetch,
  handleApiResponse,
} from './session.js';

const API_URL = `${config.API_BASE_URL}/auth`;

export const authApi = {
  login: async (email, password) => {
    const response = await apiFetch(`${API_URL}/login`, {
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
    const response = await apiFetch(`${API_URL}/register`, {
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

    const response = await apiFetch(
      `${config.API_BASE_URL}/users/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
      { retries: 1 }
    );

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

  // Updates the signed-in user's profile (name / email). Returns the fresh
  // profile and persists it so the session stays in sync everywhere.
  updateProfile: async ({ name, email }) => {
    const token = getToken();
    if (!token) {
      throw Object.assign(new Error('No session'), { status: 401 });
    }

    const response = await apiFetch(`${config.API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...(name !== undefined ? { name } : {}), ...(email !== undefined ? { email } : {}) }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Could not update your profile');
    }

    const result = await response.json();
    const user = result?.data ?? result;
    setSession({ token, user: { ...getStoredUser(), ...user } });
    return user;
  },

  // Uploads a new profile picture (multipart). Returns the fresh profile
  // with the new avatarUrl and persists it into the stored session.
  uploadAvatar: async (file) => {
    const token = getToken();
    if (!token) {
      throw Object.assign(new Error('No session'), { status: 401 });
    }

    // NOTE: no Content-Type header — the browser sets the multipart boundary.
    const body = new FormData();
    body.append('file', file);

    const response = await apiFetch(`${config.API_BASE_URL}/users/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Could not upload your picture');
    }

    const result = await response.json();
    const user = result?.data ?? result;
    setSession({ token, user: { ...getStoredUser(), ...user } });
    return user;
  },

  logout: async () => {
    clearSession();
  },
};
