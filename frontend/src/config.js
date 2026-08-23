const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// The API base URL comes from the environment ONLY — no hardcoded fallback.
// In a production build a missing API URL would silently send every request
// to localhost — the #1 cause of "works on my PC, broken on my phone over
// Wi-Fi". Make that mistake impossible to miss in the console.
if (!envApiBaseUrl) {
  console.error(
    '[Trackify] VITE_API_BASE_URL is not set. Add it to frontend/.env ' +
      '(e.g. VITE_API_BASE_URL="https://your-backend.onrender.com") and rebuild.'
  );
}

const config = {
  API_BASE_URL: envApiBaseUrl || '',
};

// Uploaded assets (profile pictures) are served by the backend at paths like
// /uploads/avatars/x.png. Prefix them with the API origin so they resolve no
// matter which host the PWA itself is served from.
export const resolveAssetUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${config.API_BASE_URL}${path}`;
};

export default config;
