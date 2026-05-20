import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { pageTransition, staggerContainer, staggerItem, characterFloat } from '../animations/presets';
import PageWrapper from '../components/PageWrapper';
import { CardSkeleton, LeaderboardRowSkeleton } from '../components/SkeletonLoader';
import XpBadge from '../components/XpBadge';
import Icon from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl, COURSE_LABELS } from '../utils/avatar';
import apiClient from '../utils/axiosClient';

function CountdownTimer({ closesAt }) {
  const diff = new Date(closesAt) - new Date();
  if (diff <= 0) return <span className="text-duo-red font-display font-bold">Closed</span>;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return (
    <span className="font-mono font-bold text-duo-blue text-sm flex items-center gap-1">
      <Icon.Clock className="w-4 h-4" />
      {days > 0 ? `${days}d ` : ''}{hours}h {mins}m remaining
    </span>
  );
}

export default function Dashboard() {
  const { student } = useAuth();

  const { data: challengeData, isLoading: challengeLoading } = useQuery({
    queryKey: ['active-challenges'],
    queryFn: () => apiClient.get('/api/challenge/active').then((r) => r.data),
    staleTime: 30_000,
  });

  const { data: leaderboardData, isLoading: lbLoading } = useQuery({
    queryKey: ['leaderboard-preview'],
    queryFn: () => apiClient.get('/api/leaderboard/alltime?limit=5').then((r) => r.data),
    staleTime: 60_000,
  });

  const challenges = challengeData?.challenges || [];
  const submissions = challengeData?.submissions || {};
  const topStudents = leaderboardData?.leaderboard || [];

  const typeIcon = {
    quiz: <Icon.ClipboardList className="w-7 h-7 text-duo-blue" />,
    puzzle: <Icon.Target className="w-7 h-7 text-duo-purple" />,
    problem: <Icon.Wrench className="w-7 h-7 text-duo-orange" />,
  };

  return (
    <PageWrapper>
      {/* Greeting */}
      <motion.div {...pageTransition} className="mb-6">
        <div className="flex items-center gap-3">
          <motion.div animate={characterFloat.animate} className="flex-shrink-0">
            <img
              src={getAvatarUrl(student?.avatar_seed, 'adventurer', 80)}
              alt={student?.display_name}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-surface-border bg-white shadow-card"
            />
          </motion.div>
          <div className="min-w-0">
            <h1 className="font-display font-black text-xl sm:text-2xl text-text-dark truncate">
              Welcome back, {student?.display_name}
            </h1>
            <p className="font-body text-text-mid text-xs sm:text-sm truncate">
              {COURSE_LABELS[student?.course]} · Level {student?.level}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats row */}
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-3 gap-3">
            <motion.div variants={staggerItem} className="card text-center px-2 py-4">
              <div className="flex justify-center mb-1.5"><Icon.Star className="w-6 h-6 text-duo-yellow fill-duo-yellow" /></div>
              <p className="font-mono font-black text-lg sm:text-2xl text-text-dark">{student?.total_xp || 0}</p>
              <p className="font-body text-xs text-text-muted mt-0.5">Total XP</p>
            </motion.div>
            <motion.div variants={staggerItem} className="card text-center px-2 py-4">
              <div className="flex justify-center mb-1.5"><Icon.AcademicCap className="w-6 h-6 text-duo-blue" /></div>
              <p className="font-display font-black text-sm sm:text-base text-text-dark leading-tight line-clamp-2">
                {COURSE_LABELS[student?.course] || '—'}
              </p>
              <p className="font-body text-xs text-text-muted mt-0.5">Course</p>
            </motion.div>
            <motion.div variants={staggerItem} className="card text-center px-2 py-4">
              <div className="flex justify-center mb-1.5"><Icon.ChartBar className="w-6 h-6 text-duo-purple" /></div>
              <p className="font-mono font-black text-lg sm:text-2xl text-text-dark">{student?.level || '—'}</p>
              <p className="font-body text-xs text-text-muted mt-0.5">Level</p>
            </motion.div>
          </motion.div>

          {/* Challenge Cards */}
          <motion.div {...pageTransition} className="space-y-4">
            {challengeLoading ? (
              <CardSkeleton />
            ) : challenges.length > 0 ? (
              challenges.map((challenge) => {
                const submission = submissions[challenge.id] || null;
                return (
                  <div key={challenge.id} className={`card border-2 ${submission ? 'border-duo-blue/40 bg-blue-50' : 'border-duo-blue/30'}`}>
                    <div className="flex items-start justify-between mb-4 gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="flex items-center gap-1 bg-duo-red text-white font-display font-bold text-xs px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            LIVE
                          </span>
                          <span className="font-mono text-xs text-text-muted">Week {challenge.week_number}</span>
                        </div>
                        <h2 className="font-display font-black text-lg sm:text-xl text-text-dark leading-snug">{challenge.title}</h2>
                      </div>
                      <div className="flex-shrink-0">{typeIcon[challenge.challenge_type]}</div>
                    </div>

                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      <XpBadge xp={challenge.xp_reward} size="md" />
                      <CountdownTimer closesAt={challenge.closes_at} />
                    </div>

                    {submission ? (
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-duo-blue/10 border border-duo-blue/20">
                        <Icon.Check className="w-6 h-6 text-duo-blue flex-shrink-0" />
                        <div>
                          <p className="font-display font-bold text-duo-blue">Answer submitted</p>
                          <p className="font-body text-xs text-text-mid">Results update Wednesday at midnight</p>
                        </div>
                      </div>
                    ) : (
                      <Link to={`/challenge?id=${challenge.id}`} className="btn-primary flex items-center justify-center gap-2 py-3">
                        <Icon.Lightning className="w-5 h-5" />
                        Go to Challenge
                      </Link>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="card text-center py-10">
                <Icon.Clock className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <h2 className="font-display font-black text-xl text-text-dark mb-2">No active challenge</h2>
                <p className="font-body text-text-mid text-sm">
                  {challengeData?.message || 'Next challenge drops Wednesday at midnight'}
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right — leaderboard */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon.Trophy className="w-5 h-5 text-duo-blue" />
              <h2 className="font-display font-black text-lg text-text-dark">Leaderboard</h2>
            </div>
            <Link to="/leaderboard" className="font-body text-xs text-duo-blue font-bold hover:underline flex items-center gap-1">
              See all <Icon.ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {lbLoading
              ? Array.from({ length: 5 }).map((_, i) => <LeaderboardRowSkeleton key={i} />)
              : topStudents.map((s, i) => (
                  <div key={s.id || i}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                      s.display_name === student?.display_name
                        ? 'border-duo-blue bg-duo-blue/10'
                        : 'border-surface-border bg-white hover:border-duo-blue/30'
                    }`}
                  >
                    <span className="font-mono font-bold text-text-muted text-sm w-6 text-center">#{s.rank}</span>
                    <img src={getAvatarUrl(s.avatar_seed, 'adventurer', 36)} alt={s.display_name} className="w-9 h-9 rounded-xl border border-surface-border" />
                    <p className="font-display font-bold text-sm text-text-dark flex-1 truncate">{s.display_name}</p>
                    <span className="font-mono font-bold text-xs text-duo-blue">{s.total_xp} XP</span>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
