import axios from 'axios';

/**
 * Preconfigured Axios instance for all API calls.
 * Base URL is injected from the Vite environment variable at build time.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001',
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ── Request interceptor: attach JWT if present ────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 globally ────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      // Phase 7: redirect to /login
    }
    return Promise.reject(error);
  }
);

export default apiClient;
