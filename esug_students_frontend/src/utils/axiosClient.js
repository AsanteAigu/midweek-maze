import axios from 'axios';
import { supabase } from './supabaseClient';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from Supabase session to every request
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
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
