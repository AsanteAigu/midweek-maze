import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { pageTransition, staggerContainer, staggerItem, scaleIn } from '../animations/presets';
import PageWrapper from '../components/PageWrapper';
import { CardSkeleton } from '../components/SkeletonLoader';
import AvatarPicker from '../components/AvatarPicker';
import XpBadge from '../components/XpBadge';
import Icon from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl, COURSE_LABELS } from '../utils/avatar';
import { supabase } from '../utils/supabaseClient';
import apiClient from '../utils/axiosClient';

export default function Profile() {
  const { student, updateStudent, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [form, setForm] = useState({
    display_name: student?.display_name || '',
    avatar_seed: student?.avatar_seed || '',
    show_real_name: student?.show_real_name || false,
    level: student?.level || 100,
    course: student?.course || 'computer_engineering',
  });

  const COURSE_OPTIONS = [
    { value: 'computer_engineering', label: 'Computer Engineering' },
    { value: 'agriculture_engineering', label: 'Agricultural Engineering' },
    { value: 'biomedical_engineering', label: 'Biomedical Engineering' },
    { value: 'material_engineering', label: 'Material Engineering' },
    { value: 'food_processing', label: 'Food Processing Engineering' },
  ];

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['xp-history'],
    queryFn: () => apiClient.get('/api/profile/xp-history').then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: submissionsData, isLoading: subLoading } = useQuery({
    queryKey: ['my-submissions'],
    queryFn: () => apiClient.get('/api/submit/me').then((r) => r.data),
    staleTime: 60_000,
  });

  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handlePasswordReset() {
    if (!student?.email) { toast.error('No email found on your account'); return; }
    setResetLoading(true);
    try {
      const redirectTo = `${window.location.origin}/update-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(student.email, { redirectTo });
      if (error) throw error;
      setResetSent(true);
      toast.success('Reset link sent — check your inbox');
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  }

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete('/api/profile'),
    onSuccess: async () => {
      toast.success('Account deleted');
      await logout();
      navigate('/');
    },
    onError: (err) => toast.error(err.message || 'Failed to delete account'),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => apiClient.patch('/api/profile', data),
    onSuccess: (res) => {
      updateStudent(res.data.student);
      setForm((p) => ({ ...p, ...res.data.student }));
      setEditMode(false);
      toast.success('Profile updated!');
      queryClient.invalidateQueries({ queryKey: ['xp-history'] });
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSave(e) {
    e.preventDefault();
    updateMutation.mutate(form);
  }

  const history = historyData?.history || [];
  const submissions = submissionsData?.submissions || [];

  return (
    <PageWrapper>
      <motion.div {...pageTransition} className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="card">
          <div className="flex items-start gap-5">
            <div className="relative">
              <img
                src={getAvatarUrl(form.avatar_seed || student?.avatar_seed, 'adventurer', 100)}
                alt={student?.display_name}
                className="w-24 h-24 rounded-3xl border-4 border-surface-border bg-white shadow-card"
              />
            </div>
            <div className="flex-1">
              <h1 className="font-display font-black text-2xl text-text-dark">{student?.display_name}</h1>
              <p className="font-body text-sm text-text-mid mt-0.5">
                {COURSE_LABELS[student?.course]} · Level {student?.level}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <XpBadge xp={student?.total_xp || 0} size="md" />
                <span className="font-mono text-xs text-text-muted">Student ID: {student?.student_id}</span>
              </div>
            </div>
            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center gap-1.5 text-sm px-3 py-2 ${editMode ? 'btn-secondary' : 'btn-primary'}`}
            >
              {editMode ? (
                <>
                  <Icon.XMark className="w-4 h-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Icon.Pencil className="w-4 h-4" />
                  Edit
                </>
              )}
            </button>
          </div>
        </div>

        {/* Edit Section */}
        {editMode && (
          <motion.div {...pageTransition} className="card">
            <h2 className="font-display font-black text-xl text-text-dark mb-5">Edit Profile</h2>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm font-display font-bold text-text-dark mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={form.display_name}
                  onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
                  className="input"
                  minLength={2}
                  maxLength={30}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-display font-bold text-text-dark mb-1.5">
                    Level
                  </label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm((p) => ({ ...p, level: Number(e.target.value) }))}
                    className="input"
                  >
                    {[100, 200, 300, 400].map((l) => (
                      <option key={l} value={l}>Level {l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-display font-bold text-text-dark mb-1.5">
                    Course
                  </label>
                  <select
                    value={form.course}
                    onChange={(e) => setForm((p) => ({ ...p, course: e.target.value }))}
                    className="input"
                  >
                    {COURSE_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-display font-bold text-text-dark mb-3">
                  Avatar
                </label>
                <AvatarPicker
                  seed={form.avatar_seed}
                  onSeedChange={(seed) => setForm((p) => ({ ...p, avatar_seed: seed }))}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-off border-2 border-surface-border">
                <div>
                  <p className="font-display font-bold text-text-dark">Show real name on leaderboard</p>
                  <p className="font-body text-xs text-text-mid">
                    {form.show_real_name ? 'On — your real name is visible' : 'Off — only your display name is shown'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, show_real_name: !p.show_real_name }))}
                  className={`relative flex-shrink-0 w-12 h-7 rounded-full transition-colors duration-200 ${form.show_real_name ? 'bg-duo-blue' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-200 ${form.show_real_name ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {updateMutation.isPending ? 'Saving...' : (
                  <>
                    <Icon.Check className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* XP History */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Icon.Star className="w-5 h-5 text-duo-yellow fill-duo-yellow" />
            <h2 className="font-display font-black text-xl text-text-dark">XP History</h2>
          </div>
          {historyLoading && <CardSkeleton />}
          {!historyLoading && history.length === 0 && (
            <div className="text-center py-8">
              <Icon.Sparkles className="w-10 h-10 text-text-muted mx-auto mb-2" />
              <p className="font-body text-text-mid text-sm">No XP earned yet — complete a challenge to start!</p>
            </div>
          )}
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2">
            {history.map((entry) => (
              <motion.div key={entry.id} variants={staggerItem}
                className="flex items-center justify-between p-3 rounded-2xl bg-surface-off border border-surface-border"
              >
                <div>
                  <p className="font-display font-bold text-sm text-text-dark">{entry.reason}</p>
                  <p className="font-mono text-xs text-text-muted">{new Date(entry.awarded_at).toLocaleDateString('en-GB')}</p>
                </div>
                <XpBadge xp={entry.xp_earned} size="sm" />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Submission History */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Icon.ClipboardList className="w-5 h-5 text-duo-blue" />
            <h2 className="font-display font-black text-xl text-text-dark">My Submissions</h2>
          </div>
          {subLoading && <CardSkeleton />}
          {!subLoading && submissions.length === 0 && (
            <div className="text-center py-8">
              <Icon.ClipboardList className="w-10 h-10 text-text-muted mx-auto mb-2" />
              <p className="font-body text-text-mid text-sm">No submissions yet</p>
            </div>
          )}
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2">
            {submissions.map((sub) => (
              <motion.div key={sub.id} variants={staggerItem}
                className="flex items-center justify-between p-3 rounded-2xl bg-surface-off border border-surface-border"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="font-display font-bold text-sm text-text-dark truncate">
                    Week {sub.challenges?.week_number} — {sub.challenges?.title}
                  </p>
                  <p className="font-mono text-xs text-text-muted truncate">Your answer: {sub.answer}</p>
                </div>
                <div className="flex-shrink-0">
                  {sub.is_correct === null ? (
                    <span className="flex items-center gap-1 bg-duo-yellow/20 text-duo-yellow-dark font-display font-bold text-xs px-2 py-1 rounded-full">
                      <Icon.Clock className="w-3 h-3" />
                      Pending
                    </span>
                  ) : sub.is_correct ? (
                    <span className="flex items-center gap-1 bg-duo-blue/10 text-duo-blue font-display font-bold text-xs px-2 py-1 rounded-full">
                      <Icon.Check className="w-3 h-3" />
                      Correct
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-duo-red/10 text-duo-red font-display font-bold text-xs px-2 py-1 rounded-full">
                      <Icon.XMark className="w-3 h-3" />
                      Incorrect
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
        {/* Change Password */}
        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <Icon.Key className="w-5 h-5 text-duo-blue" />
            <h2 className="font-display font-black text-lg text-text-dark">Change Password</h2>
          </div>
          <p className="font-body text-sm text-text-mid mb-4">
            We'll send a reset link to the email you registered with.
          </p>
          {resetSent ? (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-duo-blue/10 border border-duo-blue/20">
              <Icon.Check className="w-5 h-5 text-duo-blue flex-shrink-0" />
              <p className="font-display font-bold text-sm text-duo-blue">Reset link sent — check your inbox</p>
            </div>
          ) : (
            <button
              onClick={handlePasswordReset}
              disabled={resetLoading}
              className="btn-secondary flex items-center gap-2 px-4 py-2.5 disabled:opacity-60"
            >
              <Icon.Key className="w-4 h-4" />
              {resetLoading ? 'Sending...' : 'Send Reset Email'}
            </button>
          )}
        </div>

        {/* Danger Zone */}
        <div className="card border-2 border-duo-red/20">
          <div className="flex items-center gap-2 mb-1">
            <Icon.Warning className="w-5 h-5 text-duo-red" />
            <h2 className="font-display font-black text-lg text-duo-red">Danger Zone</h2>
          </div>
          <p className="font-body text-sm text-text-mid mb-4">
            Permanently delete your account and all your data. This cannot be undone.
          </p>
          <button
            onClick={() => { setShowDeleteModal(true); setDeleteConfirm(''); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-duo-red text-duo-red font-display font-bold text-sm hover:bg-duo-red hover:text-white transition-colors"
          >
            <Icon.XMark className="w-4 h-4" />
            Delete My Account
          </button>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <motion.div {...scaleIn} className="bg-white rounded-3xl border-2 border-duo-red/30 shadow-card-hover p-6 max-w-sm w-full">
              <div className="text-center mb-5">
                <div className="flex justify-center mb-3">
                  <div className="w-14 h-14 bg-duo-red/10 rounded-2xl flex items-center justify-center">
                    <Icon.Warning className="w-8 h-8 text-duo-red" />
                  </div>
                </div>
                <h3 className="font-display font-black text-xl text-text-dark">Delete account?</h3>
                <p className="font-body text-text-mid text-sm mt-1">
                  This will permanently erase your profile, XP, and all submissions.
                </p>
              </div>

              <div className="mb-5">
                <label className="block font-display font-bold text-sm text-text-dark mb-1.5">
                  Type <span className="text-duo-red">{student?.display_name}</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="input"
                  placeholder={student?.display_name}
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn-secondary flex-1 py-2.5"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteConfirm !== student?.display_name || deleteMutation.isPending}
                  className="flex-1 py-2.5 rounded-2xl border-2 border-duo-red bg-duo-red text-white font-display font-black disabled:opacity-40 hover:bg-red-600 transition-colors"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
