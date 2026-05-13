import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { pageTransition, staggerContainer, staggerItem, characterFloat, bounceIn } from '../animations/presets';
import Navbar from '../components/Navbar';
import { LeaderboardRowSkeleton } from '../components/SkeletonLoader';
import Icon from '../components/Icons';
import XpBadge from '../components/XpBadge';
import { getAvatarUrl, COURSE_LABELS } from '../utils/avatar';
import apiClient from '../utils/axiosClient';

function RankMedal({ rank }) {
  if (rank === 1) return <Icon.MedalGold className="w-8 h-8 flex-shrink-0" />;
  if (rank === 2) return <Icon.MedalSilver className="w-8 h-8 flex-shrink-0" />;
  if (rank === 3) return <Icon.MedalBronze className="w-8 h-8 flex-shrink-0" />;
  return <span className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface-off text-text-mid font-mono font-bold text-sm flex-shrink-0">#{rank}</span>;
}

export default function Landing() {
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['leaderboard-preview'],
    queryFn: () => apiClient.get('/api/leaderboard/alltime?limit=5').then((r) => r.data),
    staleTime: 60_000,
  });

  const top = leaderboardData?.leaderboard || [];

  return (
    <div className="min-h-screen bg-surface-off">
      <Navbar />

      <motion.div {...pageTransition}>
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-4 pt-12 pb-16">
          <div className="flex flex-col md:flex-row items-center gap-10">
            {/* Mascot */}
            <div className="flex flex-col items-center gap-4 md:w-1/2">
              <motion.div animate={characterFloat.animate}>
                <Icon.OwlMascot className="w-40 h-40 drop-shadow-xl" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="bg-white rounded-3xl border-2 border-surface-border shadow-card px-5 py-3 max-w-xs text-center"
              >
                <p className="font-display font-black text-duo-blue text-lg">Every Wednesday.</p>
                <p className="font-display font-black text-text-dark text-lg">New Challenge.</p>
              </motion.div>
            </div>

            {/* CTA */}
            <div className="md:w-1/2 text-center md:text-left">
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="font-display font-black text-4xl sm:text-5xl text-text-dark leading-tight mb-4"
              >
                Engineering challenges.<br />
                <span className="text-duo-blue">Epic</span> bragging rights.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="font-body text-text-mid text-lg mb-8"
              >
                Weekly quizzes and puzzles for ESUG engineering students. Earn XP, climb the leaderboard, and prove you're the best in your cohort.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start"
              >
                <Link to="/register" className="btn-primary text-base py-3 px-8 text-center flex items-center justify-center gap-2">
                  <Icon.Rocket className="w-5 h-5" />
                  Get Started — It's Free
                </Link>
                <Link to="/login" className="btn-secondary text-base py-3 px-8 text-center">
                  I Already Have an Account
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="flex gap-6 mt-8 justify-center md:justify-start"
              >
                {[
                  { label: 'New challenge', value: 'Every Wed' },
                  { label: 'Engineering courses', value: '5' },
                  { label: 'XP per challenge', value: '100+' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="font-display font-black text-2xl text-duo-blue">{stat.value}</p>
                    <p className="font-body text-xs text-text-muted">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Leaderboard Preview */}
        <section className="bg-white border-y-2 border-surface-border py-12">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Icon.Trophy className="w-6 h-6 text-duo-blue" />
                <h2 className="font-display font-black text-2xl text-text-dark">Top Students</h2>
              </div>
              <Link to="/leaderboard" className="flex items-center gap-1 font-display font-bold text-sm text-duo-blue hover:underline">
                View Full Leaderboard
                <Icon.ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <LeaderboardRowSkeleton key={i} />)
                : top.map((student, i) => (
                    <motion.div
                      key={student.id || i}
                      variants={staggerItem}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                        i === 0 ? 'border-rank-gold bg-yellow-50' :
                        i === 1 ? 'border-rank-silver bg-gray-50' :
                        i === 2 ? 'border-rank-bronze bg-orange-50' :
                        'border-surface-border bg-white hover:border-duo-blue/30'
                      }`}
                    >
                      <RankMedal rank={student.rank} />
                      <img
                        src={getAvatarUrl(student.avatar_seed, 'adventurer', 48)}
                        alt={student.display_name}
                        className="w-12 h-12 rounded-2xl border-2 border-surface-border bg-white"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-black text-text-dark truncate">{student.display_name}</p>
                        <p className="font-body text-xs text-text-mid truncate">
                          {COURSE_LABELS[student.course] || student.course} · Level {student.level}
                        </p>
                      </div>
                      <XpBadge xp={student.total_xp} size="sm" />
                    </motion.div>
                  ))}

              {!isLoading && top.length === 0 && (
                <div className="text-center py-10">
                  <Icon.Sparkles className="w-12 h-12 text-duo-blue mx-auto mb-3" />
                  <p className="font-display font-bold text-text-mid">No rankings yet — be the first to register!</p>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="font-display font-black text-3xl text-text-dark text-center mb-12">
            How it works
          </h2>
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            {[
              {
                icon: <Icon.Lightning className="w-10 h-10 text-duo-blue" />,
                title: 'New Challenge Every Week',
                desc: 'Every Wednesday at midnight, a fresh engineering puzzle drops. You have 7 days to submit your answer.',
              },
              {
                icon: <Icon.Trophy className="w-10 h-10 text-duo-yellow" />,
                title: 'Earn XP & Rank Up',
                desc: 'Correct answers earn you XP. Climb the all-time leaderboard and compete within your level and course.',
              },
              {
                icon: <Icon.Sparkles className="w-10 h-10 text-duo-blue" />,
                title: 'Your Custom Avatar',
                desc: 'Pick a unique avatar seed to generate your character. Change it anytime from your profile.',
              },
            ].map((feature) => (
              <motion.div key={feature.title} variants={staggerItem} className="card text-center">
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="font-display font-black text-lg text-text-dark mb-2">{feature.title}</h3>
                <p className="font-body text-text-mid text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Footer CTA */}
        <section className="bg-duo-blue py-12">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <p className="font-display font-black text-white text-3xl mb-2">Ready to compete?</p>
            <p className="font-body text-white/80 mb-6">Join ESUG engineering students on the platform.</p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-duo-blue font-display font-black px-8 py-3 rounded-2xl shadow-[0_4px_0_#0F8FC0] hover:opacity-90 active:translate-y-1 transition-all"
            >
              <Icon.AcademicCap className="w-5 h-5" />
              Register Now — Free
            </Link>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
