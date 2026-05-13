import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import apiClient from '../utils/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadStudentProfile();
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadStudentProfile();
      } else {
        setStudent(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadStudentProfile() {
    try {
      const response = await apiClient.get('/api/auth/me');
      setStudent(response.data.student);
    } catch {
      setStudent(null);
    } finally {
      setLoading(false);
    }
  }

  async function applyBackendSession(nextSession) {
    if (!nextSession?.access_token || !nextSession?.refresh_token) {
      await loadStudentProfile();
      return;
    }

    const { data, error } = await supabase.auth.setSession({
      access_token: nextSession.access_token,
      refresh_token: nextSession.refresh_token,
    });

    if (error) throw error;

    setSession(data.session);
    await loadStudentProfile();
  }

  async function logout() {
    await supabase.auth.signOut();
    setStudent(null);
    setSession(null);
  }

  function updateStudent(updates) {
    setStudent((prev) => ({ ...prev, ...updates }));
  }

  return (
    <AuthContext.Provider value={{ student, session, loading, logout, updateStudent, loadStudentProfile, applyBackendSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
