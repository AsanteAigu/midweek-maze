import axios from 'axios';

// Admin-only axios client — no Supabase auth interceptor needed.
// The admin secret is passed per-request via the x-admin-secret header.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Normalize error responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong — please try again';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
