import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { pageTransition } from '../animations/presets';
import Navbar from '../components/Navbar';
import Icon from '../components/Icons';
import apiClient from '../utils/axiosClient';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { applyBackendSession } = useAuth();
  const [form, setForm] = useState({ display_name: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiClient.post('/api/auth/login', form);
      await applyBackendSession(response.data.session);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Incorrect display name or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-off">
      <Navbar />
      <motion.div {...pageTransition} className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-duo-blue rounded-3xl flex items-center justify-center shadow-blue">
              <Icon.User className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="font-display font-black text-3xl text-text-dark mb-2">Welcome Back</h1>
          <p className="font-body text-text-mid">Log in to see your challenges and XP</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-display font-bold text-text-dark mb-1.5">
                Custom Name <span className="text-duo-red">*</span>
              </label>
              <input
                type="text"
                value={form.display_name}
                onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
                placeholder="Your leaderboard name"
                className="input"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-display font-bold text-text-dark mb-1.5">
                Password <span className="text-duo-red">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Your password"
                  className="input pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-dark"
                >
                  {showPassword ? <Icon.EyeOff className="w-5 h-5" /> : <Icon.Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                'Logging in...'
              ) : (
                <>
                  <Icon.Rocket className="w-5 h-5" />
                  Log In
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center font-body text-text-mid mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-duo-blue font-bold hover:underline">Register here</Link>
        </p>
      </motion.div>
    </div>
  );
}
