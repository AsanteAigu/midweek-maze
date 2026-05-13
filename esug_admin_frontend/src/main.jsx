import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

// Admin app — no AuthProvider or Supabase session needed.
// Authentication is handled by the admin secret key lock screen.

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#FFFFFF',
              color: '#3C3C3C',
              borderRadius: '16px',
              border: '2px solid #E5E5E5',
              fontFamily: '"Nunito", sans-serif',
              fontWeight: '700',
              padding: '12px 16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            },
            success: {
              iconTheme: { primary: '#1CB0F6', secondary: '#FFFFFF' },
            },
            error: {
              iconTheme: { primary: '#FF4B4B', secondary: '#FFFFFF' },
            },
          }}
        />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
