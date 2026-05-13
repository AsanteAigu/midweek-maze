import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { pageTransition, staggerContainer, staggerItem } from '../animations/presets';
import { LeaderboardRowSkeleton } from '../components/SkeletonLoader';
import Navbar from '../components/Navbar';
import XpBadge from '../components/XpBadge';
import Icon from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl, COURSE_LABELS } from '../utils/avatar';
import apiClient from '../utils/axiosClient';

const COURSES = [
  { value: '', label: 'All Courses' },
  { value: 'computer_engineering', label: 'Computer Eng.' },
  { value: 'agriculture_engineering', label: 'Agriculture Eng.' },
  { value: 'biomedical_engineering', label: 'Biomedical Eng.' },
  { value: 'material_engineering', label: 'Material Eng.' },
  { value: 'food_processing', label: 'Food Processing' },
];

const LEVELS = [
  { value: '', label: 'All Levels' },
  { value: '100', label: 'Level 100' },
  { value: '200', label: 'Level 200' },
  { value: '300', label: 'Level 300' },
  { value: '400', label: 'Level 400' },
];

function RankDisplay({ rank }) {
  if (rank === 1) return <Icon.MedalGold className="w-8 h-8 flex-shrink-0" />;
  if (rank === 2) return <Icon.MedalSilver className="w-8 h-8 flex-shrink-0" />;
  if (rank === 3) return <Icon.MedalBronze className="w-8 h-8 flex-shrink-0" />;
  return <span className="font-mono font-bold text-text-muted text-sm w-8 text-center flex-shrink-0">#{rank}</span>;
}

export default function Leaderboard() {
  const { student } = useAuth();
  const [tab, setTab] = useState('alltime');
  const [courseFilter, setCourseFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ page, limit: 20 });
  if (courseFilter) params.set('course', courseFilter);
  if (levelFilter) params.set('level', levelFilter);

  const { data: alltimeData, isLoading: alltimeLoading } = useQuery({
    queryKey: ['leaderboard-alltime', courseFilter, levelFilter, page],
    queryFn: () => apiClient.get(`/api/leaderboard/alltime?${params}`).then((r) => r.data),
    staleTime: 30_000,
    enabled: tab === 'alltime',
  });

  const { data: weeklyData, isLoading: weeklyLoading } = useQuery({
    queryKey: ['leaderboard-weekly'],
    queryFn: () => apiClient.get('/api/leaderboard/weekly').then((r) => r.data),
    staleTime: 30_000,
    enabled: tab === 'weekly',
  });

  const isLoading = tab === 'alltime' ? alltimeLoading : weeklyLoading;
  const rows = tab === 'alltime' ? (alltimeData?.leaderboard || []) : (weeklyData?.leaderboard || []);
  const pagination = alltimeData?.pagination;

  return (
    <div className="min-h-screen bg-surface-off">
      <Navbar />
      <motion.div {...pageTransition} className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 bg-duo-yellow rounded-2xl flex items-center justify-center shadow-yellow">
              <Icon.Trophy className="w-7 h-7 text-text-dark" />
            </div>
          </div>
          <h1 className="font-display font-black text-3xl text-text-dark mb-1">Leaderboard</h1>
          <p className="font-body text-text-mid">Who's on top this week?</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-2xl border-2 border-surface-border p-1.5">
          {[
            { id: 'alltime', label: 'All Time', icon: <Icon.Star className="w-4 h-4" /> },
            { id: 'weekly', label: 'This Week', icon: <Icon.Lightning className="w-4 h-4" /> },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-display font-bold text-sm transition-all ${
                tab === t.id ? 'bg-duo-blue text-white shadow-blue' : 'text-text-mid hover:text-text-dark'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        {tab === 'alltime' && (
          <div className="flex gap-3 mb-6 flex-wrap">
            <select value={courseFilter} onChange={(e) => { setCourseFilter(e.target.value); setPage(1); }} className="input flex-1 min-w-[140px] py-2 text-sm">
              {COURSES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={levelFilter} onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }} className="input w-[130px] py-2 text-sm">
              {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        )}

        {/* Weekly challenge label */}
        {tab === 'weekly' && weeklyData?.challenge && (
          <div className="card mb-4 flex items-center gap-3">
            <Icon.Lightning className="w-5 h-5 text-duo-blue flex-shrink-0" />
            <p className="font-display font-bold text-sm text-text-dark">
              Results for: Week {weeklyData.challenge.week_number} — {weeklyData.challenge.title}
            </p>
          </div>
        )}

        {/* Rows */}
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
          {isLoading && Array.from({ length: 10 }).map((_, i) => <LeaderboardRowSkeleton key={i} />)}

          {!isLoading && rows.map((row, i) => {
            const isMe = row.display_name === student?.display_name;
            const rank = row.rank || i + 1;
            return (
              <motion.div key={`${row.display_name}-${i}`} variants={staggerItem} layout
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                  rank === 1 ? 'border-rank-gold bg-yellow-50' :
                  rank === 2 ? 'border-rank-silver bg-gray-50' :
                  rank === 3 ? 'border-rank-bronze bg-orange-50' :
                  isMe ? 'border-duo-blue bg-duo-blue/10' :
                  'border-surface-border bg-white hover:border-duo-blue/30'
                }`}
              >
                <RankDisplay rank={rank} />
                <Link to={`/profile/${encodeURIComponent(row.display_name)}`}>
                  <img src={getAvatarUrl(row.avatar_seed, 'adventurer', 48)} alt={row.display_name}
                    className="w-12 h-12 rounded-2xl border-2 border-surface-border bg-white hover:scale-105 transition-transform" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link to={`/profile/${encodeURIComponent(row.display_name)}`}
                      className="font-display font-black text-text-dark hover:text-duo-blue transition-colors truncate">
                      {row.display_name}
                    </Link>
                    {isMe && (
                      <span className="bg-duo-blue text-white font-display font-bold text-xs px-2 py-0.5 rounded-full flex-shrink-0">You</span>
                    )}
                  </div>
                  <p className="font-body text-xs text-text-mid truncate">
                    {COURSE_LABELS[row.course] || row.course} · Level {row.level}
                  </p>
                </div>
                <XpBadge xp={tab === 'alltime' ? row.total_xp : row.xp_earned} size="sm" />
              </motion.div>
            );
          })}

          {!isLoading && rows.length === 0 && (
            <div className="card text-center py-12">
              <Icon.Sparkles className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="font-display font-bold text-text-mid">
                {tab === 'weekly' ? 'No scored challenges yet — check back after Wednesday' : 'No students yet — be the first'}
              </p>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {tab === 'alltime' && pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-3 mt-8">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
              className="btn-secondary px-4 py-2 text-sm flex items-center gap-1 disabled:opacity-40">
              <Icon.ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="font-body text-text-mid self-center text-sm">Page {pagination.page} of {pagination.pages}</span>
            <button disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}
              className="btn-secondary px-4 py-2 text-sm flex items-center gap-1 disabled:opacity-40">
              Next <Icon.ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Login prompt */}
        {!student && rows.length > 0 && (
          <div className="mt-6 card text-center bg-duo-blue/10 border-2 border-duo-blue/30">
            <div className="flex justify-center mb-2"><Icon.Lock className="w-6 h-6 text-duo-blue" /></div>
            <p className="font-display font-bold text-text-dark mb-3">Log in to see your rank and compete</p>
            <Link to="/register" className="btn-primary inline-block px-6 py-2">Join Now — Free</Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
