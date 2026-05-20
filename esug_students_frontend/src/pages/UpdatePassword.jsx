import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../utils/supabaseClient';
import { pageTransition } from '../animations/presets';
import Navbar from '../components/Navbar';
import Icon from '../components/Icons';

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase recovers the session from the URL hash automatically.
    // The PASSWORD_RECOVERY event fires once it's done.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });

    // In case the page loads after the hash has already been consumed
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated! Please log in again.');
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
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
              <Icon.Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="font-display font-black text-3xl text-text-dark mb-2">Set New Password</h1>
          <p className="font-body text-text-mid">Choose a strong password for your account</p>
        </div>

        {!ready ? (
          <div className="card text-center py-10">
            <Icon.Clock className="w-12 h-12 text-text-muted mx-auto mb-3 animate-pulse" />
            <p className="font-body text-text-mid">Verifying reset link…</p>
          </div>
        ) : (
          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-display font-bold text-text-dark mb-1.5">
                  New Password <span className="text-duo-red">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pr-12"
                    minLength={8}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-dark"
                  >
                    {showPassword ? <Icon.EyeOff className="w-5 h-5" /> : <Icon.Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="font-body text-xs text-text-muted mt-1">At least 8 characters</p>
              </div>

              <div>
                <label className="block text-sm font-display font-bold text-text-dark mb-1.5">
                  Confirm Password <span className="text-duo-red">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? 'Updating…' : (
                  <>
                    <Icon.Check className="w-5 h-5" />
                    Set New Password
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
