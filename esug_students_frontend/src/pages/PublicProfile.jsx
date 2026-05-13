import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { pageTransition, staggerContainer, staggerItem } from '../animations/presets';
import Navbar from '../components/Navbar';
import { CardSkeleton } from '../components/SkeletonLoader';
import XpBadge from '../components/XpBadge';
import Icon from '../components/Icons';
import { getAvatarUrl, COURSE_LABELS } from '../utils/avatar';
import apiClient from '../utils/axiosClient';

export default function PublicProfile() {
  const { displayName } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-profile', displayName],
    queryFn: () => apiClient.get(`/api/profile/${encodeURIComponent(displayName)}`).then((r) => r.data),
    staleTime: 60_000,
  });

  const profile = data?.profile;
  const history = data?.history || [];

  return (
    <div className="min-h-screen bg-surface-off">
      <Navbar />
      <motion.div {...pageTransition} className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {isLoading && (
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {error && (
          <div className="card text-center py-12">
            <Icon.User className="w-14 h-14 text-text-muted mx-auto mb-3" />
            <h1 className="font-display font-black text-xl text-text-dark">Student not found</h1>
            <p className="font-body text-text-mid mt-2">That display name doesn't match any registered student.</p>
            <Link to="/leaderboard" className="btn-primary inline-block mt-4 px-6 py-2">
              View Leaderboard
            </Link>
          </div>
        )}

        {!isLoading && profile && (
          <>
            <div className="card">
              <div className="flex items-start gap-5">
                <img
                  src={getAvatarUrl(profile.avatar_seed, 'adventurer', 96)}
                  alt={profile.display_name}
                  className="w-24 h-24 rounded-3xl border-4 border-surface-border bg-white shadow-card"
                />
                <div className="flex-1">
                  <h1 className="font-display font-black text-2xl text-text-dark">{profile.display_name}</h1>
                  {(profile.first_name || profile.last_name) && (
                    <p className="font-body text-sm text-text-mid">{profile.first_name} {profile.last_name}</p>
                  )}
                  <p className="font-body text-sm text-text-mid mt-0.5">
                    {COURSE_LABELS[profile.course]} · Level {profile.level}
                  </p>
                  <div className="mt-3">
                    <XpBadge xp={profile.total_xp || 0} size="md" />
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Icon.Star className="w-5 h-5 text-duo-yellow fill-duo-yellow" />
                <h2 className="font-display font-black text-xl text-text-dark">XP History</h2>
              </div>
              {history.length === 0 && (
                <div className="text-center py-8">
                  <Icon.Sparkles className="w-10 h-10 text-text-muted mx-auto mb-2" />
                  <p className="font-body text-text-mid text-sm">No XP earned yet</p>
                </div>
              )}
              <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2">
                {history.map((entry, i) => (
                  <motion.div key={i} variants={staggerItem}
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
          </>
        )}
      </motion.div>
    </div>
  );
}
