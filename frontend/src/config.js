const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// In a production build a missing API URL would silently send every request
// to localhost — the #1 cause of "works on my PC, broken on my phone over
// Wi-Fi". Make that mistake impossible to miss in the console.
if (import.meta.env.PROD && !envApiBaseUrl) {
  console.error(
    '[Trackify] VITE_API_BASE_URL is not set for this build. ' +
      'The app is falling back to http://localhost:3000, which will NOT work ' +
      'on phones/other devices. Rebuild with VITE_API_BASE_URL set to the ' +
      'public https:// URL of the backend.'
  );
}

const config = {
  API_BASE_URL: envApiBaseUrl || 'http://localhost:3000',
};

export default config;
