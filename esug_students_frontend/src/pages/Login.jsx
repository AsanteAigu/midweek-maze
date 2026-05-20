import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { pageTransition, scaleIn } from '../animations/presets';
import Navbar from '../components/Navbar';
import Icon from '../components/Icons';
import apiClient from '../utils/axiosClient';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { applyBackendSession } = useAuth();
  const [form, setForm] = useState({ display_name: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

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

  async function handleForgotPassword(e) {
    e.preventDefault();
    setResetLoading(true);
    try {
      const redirectTo = `${window.location.origin}/update-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), { redirectTo });
      if (error) throw error;
      setResetSent(true);
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setResetLoading(false);
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

        <AnimatePresence mode="wait">
          {!showForgot ? (
            <motion.div key="login" {...scaleIn}>
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
                      className="input"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-display font-bold text-text-dark">
                        Password <span className="text-duo-red">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="text-xs font-display font-bold text-duo-blue hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
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
                    {loading ? 'Logging in...' : (
                      <>
                        <Icon.Rocket className="w-5 h-5" />
                        Log In
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div key="forgot" {...scaleIn}>
              <div className="card">
                {resetSent ? (
                  <div className="text-center py-4">
                    <div className="flex justify-center mb-3">
                      <div className="w-14 h-14 bg-duo-blue/10 rounded-2xl flex items-center justify-center">
                        <Icon.Check className="w-8 h-8 text-duo-blue" />
                      </div>
                    </div>
                    <h2 className="font-display font-black text-xl text-text-dark mb-2">Check your inbox</h2>
                    <p className="font-body text-sm text-text-mid mb-5">
                      A reset link has been sent to <span className="font-bold text-text-dark">{resetEmail}</span>. Click it to set a new password.
                    </p>
                    <button
                      onClick={() => { setShowForgot(false); setResetSent(false); setResetEmail(''); }}
                      className="btn-secondary w-full py-2.5"
                    >
                      Back to Login
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-5">
                      <button
                        type="button"
                        onClick={() => setShowForgot(false)}
                        className="text-text-muted hover:text-text-dark"
                      >
                        <Icon.ArrowLeft className="w-5 h-5" />
                      </button>
                      <h2 className="font-display font-black text-xl text-text-dark">Reset Password</h2>
                    </div>
                    <p className="font-body text-sm text-text-mid mb-5">
                      Enter the email address you registered with and we'll send you a reset link.
                    </p>
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div>
                        <label className="block text-sm font-display font-bold text-text-dark mb-1.5">
                          Email Address <span className="text-duo-red">*</span>
                        </label>
                        <input
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="input"
                          required
                          autoFocus
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {resetLoading ? 'Sending...' : (
                          <>
                            <Icon.Key className="w-4 h-4" />
                            Send Reset Link
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center font-body text-text-mid mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-duo-blue font-bold hover:underline">Register here</Link>
        </p>
      </motion.div>
    </div>
  );
}
