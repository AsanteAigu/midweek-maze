import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { pageTransition, scaleIn, bounceIn } from '../animations/presets';
import PageWrapper from '../components/PageWrapper';
import { CardSkeleton } from '../components/SkeletonLoader';
import XpBadge from '../components/XpBadge';
import Icon from '../components/Icons';
import apiClient from '../utils/axiosClient';
import GameRenderer from '../games/GameRenderer';


// ── Maze elapsed timer (counts up from when student opens the challenge) ──────
function useMazeTimer(challengeId, active) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!challengeId || !active) return;
    const key = `maze_start_${challengeId}`;
    if (!localStorage.getItem(key)) localStorage.setItem(key, String(Date.now()));
    function calc() { return Math.floor((Date.now() - parseInt(localStorage.getItem(key) || '0', 10)) / 1000); }
    setElapsed(calc());
    const id = setInterval(() => setElapsed(calc()), 1000);
    return () => clearInterval(id);
  }, [challengeId, active]);
  return elapsed;
}

// ── XP available display for maze challenges ───────────────────────────────────
function MazeXpDisplay({ xpReward, timeLimitSeconds, elapsedSeconds, compact = false }) {
  const limitMins = (timeLimitSeconds || 600) / 60;
  const xpPerMin = xpReward / limitMins;
  const elapsedMins = Math.floor(elapsedSeconds / 60);
  const xpNow = Math.max(0, Math.floor(xpReward - elapsedMins * xpPerMin));
  const pct = xpNow / xpReward;
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  if (compact) {
    const chipColor = pct > 0.5 ? 'text-duo-blue bg-duo-blue/10 border-duo-blue/30'
      : pct > 0.2 ? 'text-yellow-600 bg-yellow-50 border-yellow-300'
      : 'text-duo-red bg-duo-red/10 border-duo-red/30';
    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-mono font-bold ${chipColor}`}>
        <Icon.Zap className="w-3 h-3" />
        <span>{xpNow} XP</span>
        <span className="opacity-60">·</span>
        <span>{timeStr}</span>
      </div>
    );
  }

  const color = pct > 0.5 ? 'text-duo-blue border-duo-blue/30 bg-duo-blue/10'
    : pct > 0.2 ? 'text-yellow-600 border-yellow-300 bg-yellow-50'
    : 'text-duo-red border-duo-red/30 bg-duo-red/10';
  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl border-2 mb-6 ${color}`}>
      <Icon.Zap className="w-5 h-5 flex-shrink-0" />
      <div className="flex-1">
        <span className="font-display font-black text-lg">{xpNow} XP</span>
        <span className="font-body text-xs text-text-muted ml-1.5">available — solve faster for more</span>
      </div>
      <span className="font-mono text-xs text-text-muted flex-shrink-0">{timeStr}</span>
    </div>
  );
}

// ── Challenge image (top of page) ──────────────────────────────────────────────
function ChallengeImage({ url }) {
  if (!url) return null;
  return (
    <div className="rounded-2xl overflow-hidden border-2 border-surface-border mb-6">
      <img src={url} alt="Challenge material" className="w-full object-contain max-h-96 bg-white" />
      <div className="p-3 bg-surface-off border-t border-surface-border flex items-center gap-2">
        <Icon.Image className="w-4 h-4 text-text-mid" />
        <p className="font-display font-bold text-xs text-text-mid">Study this image carefully before answering</p>
      </div>
    </div>
  );
}

// ── Confirm modal ──────────────────────────────────────────────────────────────
function ConfirmModal({ onConfirm, onCancel, preview }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <motion.div {...scaleIn} className="bg-white rounded-3xl border-2 border-surface-border shadow-card-hover p-6 max-w-sm w-full">
        <div className="text-center mb-4">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 bg-duo-yellow/20 rounded-2xl flex items-center justify-center">
              <Icon.Warning className="w-8 h-8 text-duo-yellow-dark" />
            </div>
          </div>
          <h3 className="font-display font-black text-xl text-text-dark">Submit this answer?</h3>
          <p className="font-body text-text-mid text-sm mt-1">You only get one shot — make it count</p>
        </div>
        <div className="bg-surface-off rounded-2xl border-2 border-surface-border p-3 mb-6">
          <p className="font-mono text-sm text-text-dark break-words">{preview}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1 py-2.5">Let me check</button>
          <button onClick={onConfirm} className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2">
            <Icon.Rocket className="w-4 h-4" />
            Submit
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Ordering input ─────────────────────────────────────────────────────────────
function OrderingInput({ options, value, onChange }) {
  const [items, setItems] = useState(() => {
    if (value) {
      const parsed = value.split('|||');
      if (parsed.length === options.length && options.every((o) => parsed.includes(o))) return parsed;
    }
    return [...options];
  });

  function move(index, dir) {
    const next = [...items];
    const swap = dir === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setItems(next);
    onChange(next.join('|||'));
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={item} className="flex items-center gap-2">
          <span className="w-7 h-7 flex-shrink-0 rounded-lg bg-surface-off border border-surface-border font-mono text-xs font-bold text-text-muted flex items-center justify-center">
            {i + 1}
          </span>
          <div className="flex-1 bg-white border-2 border-surface-border rounded-xl px-3 py-2.5 font-body text-sm text-text-dark">
            {item}
          </div>
          <div className="flex flex-col gap-1">
            <button type="button" onClick={() => move(i, 'up')} disabled={i === 0}
              className="w-7 h-7 rounded-lg border border-surface-border bg-white flex items-center justify-center disabled:opacity-30 hover:border-duo-blue transition-colors">
              <Icon.ChevronUp className="w-3.5 h-3.5 text-text-mid" />
            </button>
            <button type="button" onClick={() => move(i, 'down')} disabled={i === items.length - 1}
              className="w-7 h-7 rounded-lg border border-surface-border bg-white flex items-center justify-center disabled:opacity-30 hover:border-duo-blue transition-colors">
              <Icon.ChevronDown className="w-3.5 h-3.5 text-text-mid" />
            </button>
          </div>
        </div>
      ))}
      <p className="font-body text-xs text-text-muted mt-1">Use the arrows to sort into the correct order</p>
    </div>
  );
}

// ── Fill-in-the-blank ──────────────────────────────────────────────────────────
function FillBlankInput({ questionText, value, onChange }) {
  const parts = (questionText || '').split('___');
  if (parts.length < 2) {
    return (
      <textarea value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer..." className="input resize-none min-h-[80px] font-mono text-sm" maxLength={500} />
    );
  }
  return (
    <p className="font-body text-text-dark text-base leading-relaxed">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="inline-block mx-1 border-b-2 border-duo-blue bg-transparent font-mono text-duo-blue text-center outline-none px-1 w-28"
              placeholder="___"
              maxLength={200}
            />
          )}
        </span>
      ))}
    </p>
  );
}

// ── Per-question answer widget ─────────────────────────────────────────────────
function QuestionAnswerInput({ question, value, onChange }) {
  const options = Array.isArray(question.options) ? question.options : [];

  switch (question.question_type) {
    case 'true_false':
      return (
        <div className="grid grid-cols-2 gap-3">
          {['True', 'False'].map((opt) => (
            <button key={opt} type="button" onClick={() => onChange(opt)}
              className={`py-4 rounded-2xl border-2 font-display font-black text-lg transition-all flex items-center justify-center gap-2 ${
                value === opt
                  ? opt === 'True'
                    ? 'border-duo-blue bg-duo-blue text-white'
                    : 'border-duo-red bg-duo-red text-white'
                  : 'border-surface-border bg-white text-text-dark hover:border-duo-blue'
              }`}
            >
              {opt === 'True' ? <Icon.Check className="w-5 h-5" /> : <Icon.XMark className="w-5 h-5" />}
              {opt}
            </button>
          ))}
        </div>
      );

    case 'multiple_choice':
      return (
        <div className="space-y-2">
          {options.map((opt) => (
            <button key={opt} type="button" onClick={() => onChange(opt)}
              className={`w-full text-left rounded-2xl border-2 px-4 py-3 font-display font-bold transition-all ${
                value === opt
                  ? 'border-duo-blue bg-duo-blue text-white shadow-blue'
                  : 'border-surface-border bg-white text-text-dark hover:border-duo-blue'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      );

    case 'image_mcq':
      return (
        <div className="space-y-3">
          {question.image_url && (
            <div className="rounded-2xl overflow-hidden border-2 border-surface-border">
              <img src={question.image_url} alt="Stimulus" className="w-full object-contain max-h-64 bg-white" />
            </div>
          )}
          <div className="space-y-2">
            {options.map((opt) => (
              <button key={opt} type="button" onClick={() => onChange(opt)}
                className={`w-full text-left rounded-2xl border-2 px-4 py-3 font-display font-bold transition-all ${
                  value === opt
                    ? 'border-duo-blue bg-duo-blue text-white shadow-blue'
                    : 'border-surface-border bg-white text-text-dark hover:border-duo-blue'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      );

    case 'image_guess':
      return (
        <div className="space-y-3">
          {question.image_url && (
            <div className="rounded-2xl overflow-hidden border-2 border-surface-border">
              <img src={question.image_url} alt="What is this?" className="w-full object-contain max-h-64 bg-white" />
            </div>
          )}
          <textarea value={value} onChange={(e) => onChange(e.target.value)}
            placeholder="Type your answer..." className="input resize-none min-h-[80px] font-mono text-sm" maxLength={500} />
        </div>
      );

    case 'image_only_mcq': {
      const imageOptions = options.filter((o) => o && typeof o === 'object');
      return (
        <div className="grid grid-cols-2 gap-3">
          {imageOptions.map((opt) => (
            <button key={opt.label} type="button" onClick={() => onChange(opt.label)}
              className={`rounded-2xl border-2 overflow-hidden transition-all ${
                value === opt.label
                  ? 'border-duo-blue ring-2 ring-duo-blue'
                  : 'border-surface-border hover:border-duo-blue'
              }`}
            >
              {opt.image_url && (
                <img src={opt.image_url} alt={opt.label} className="w-full object-cover h-28 bg-white" />
              )}
              <div className={`px-2 py-1.5 text-center font-display font-bold text-xs ${
                value === opt.label ? 'bg-duo-blue text-white' : 'bg-surface-off text-text-mid'
              }`}>
                {opt.label}
              </div>
            </button>
          ))}
        </div>
      );
    }

    case 'ordering':
      return <OrderingInput options={options} value={value} onChange={onChange} />;

    case 'fill_blank':
      return <FillBlankInput questionText={question.question_text} value={value} onChange={onChange} />;

    case 'text':
    default:
      return (
        <textarea value={value} onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer..." className="input resize-none min-h-[80px] font-mono text-sm" maxLength={500} />
      );
  }
}


// ── Countdown timer (pauses while tab is hidden) ───────────────────────────────
function useCountdown(challengeId, timeLimitSeconds, onExpire) {
  const [secsLeft, setSecsLeft] = useState(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!challengeId || !timeLimitSeconds) { setSecsLeft(null); return; }

    const key = `timer_start_${challengeId}`;
    const hiddenKey = `timer_hidden_${challengeId}`;

    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, String(Date.now()));
    }

    function getStartTime() {
      return parseInt(localStorage.getItem(key) || '0', 10);
    }

    function calcRemaining() {
      const elapsed = Math.floor((Date.now() - getStartTime()) / 1000);
      return Math.max(0, timeLimitSeconds - elapsed);
    }

    setSecsLeft(calcRemaining());

    const interval = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      const remaining = calcRemaining();
      setSecsLeft(remaining);
      if (remaining === 0 && !expiredRef.current) {
        expiredRef.current = true;
        clearInterval(interval);
        onExpire();
      }
    }, 1000);

    function handleVisibility() {
      if (document.visibilityState === 'hidden') {
        // Record when the tab was hidden
        localStorage.setItem(hiddenKey, String(Date.now()));
      } else {
        // Tab is visible again — push the start time forward by the time away
        const hiddenAt = parseInt(localStorage.getItem(hiddenKey) || '0', 10);
        if (hiddenAt) {
          const pausedMs = Date.now() - hiddenAt;
          localStorage.setItem(key, String(getStartTime() + pausedMs));
          localStorage.removeItem(hiddenKey);
        }
        const remaining = calcRemaining();
        setSecsLeft(remaining);
        if (remaining === 0 && !expiredRef.current) {
          expiredRef.current = true;
          clearInterval(interval);
          onExpire();
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [challengeId, timeLimitSeconds]); // eslint-disable-line react-hooks/exhaustive-deps

  return secsLeft;
}

function CountdownTimer({ secsLeft }) {
  if (secsLeft === null) return null;
  const mins = Math.floor(secsLeft / 60);
  const secs = secsLeft % 60;
  const isUrgent = secsLeft <= 60;
  const isExpired = secsLeft === 0;

  return (
    <div className={`flex items-center gap-1.5 font-mono font-bold text-sm px-3 py-1.5 rounded-full border-2 transition-colors ${
      isExpired
        ? 'bg-duo-red/20 border-duo-red text-duo-red'
        : isUrgent
        ? 'bg-duo-red/10 border-duo-red/50 text-duo-red animate-pulse'
        : 'bg-surface-off border-surface-border text-text-dark'
    }`}>
      <Icon.Clock className="w-4 h-4 flex-shrink-0" />
      {isExpired ? 'Time up!' : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}
    </div>
  );
}

// ── Format answer for display ──────────────────────────────────────────────────
function formatAnswerLabel(answerStr, challenge) {
  if (!answerStr) return '—';
  const qt = challenge?.question_type || challenge?.answer_mode || 'text';
  if (qt === 'ordering') {
    return answerStr.split('|||').map((item, i) => `${i + 1}. ${item}`).join('  →  ');
  }
  return answerStr;
}

// ── XP celebration card shown right after submit ───────────────────────────────
function SubmittedCard({ submission, challenge }) {
  const pending = submission.is_correct === null;
  const correct = submission.is_correct === true;

  return (
    <motion.div {...scaleIn} className="card text-center py-10">
      {/* Icon */}
      <div className="flex justify-center mb-4">
        {pending ? (
          <div className="w-20 h-20 bg-duo-yellow/20 rounded-3xl flex items-center justify-center">
            <Icon.Rocket className="w-10 h-10 text-duo-yellow-dark" />
          </div>
        ) : correct ? (
          <div className="w-20 h-20 bg-duo-blue rounded-3xl flex items-center justify-center shadow-blue">
            <Icon.Check className="w-10 h-10 text-white" />
          </div>
        ) : (
          <div className="w-20 h-20 bg-duo-red/20 rounded-3xl flex items-center justify-center">
            <Icon.XMark className="w-10 h-10 text-duo-red" />
          </div>
        )}
      </div>

      {/* Headline */}
      <h2 className="font-display font-black text-2xl text-text-dark mb-1">
        {pending ? 'Answer locked in!' : correct ? 'Correct answer!' : 'Not quite this time'}
      </h2>

      {/* XP line */}
      {pending ? (
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 bg-duo-yellow/15 border-2 border-duo-yellow/40 rounded-2xl px-4 py-2">
            <Icon.Zap className="w-5 h-5 text-duo-yellow-dark" />
            <span className="font-display font-black text-lg text-duo-yellow-dark">+{challenge.xp_reward} XP</span>
            <span className="font-body text-xs text-text-mid ml-1">if correct</span>
          </div>
        </div>
      ) : correct ? (
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 bg-duo-blue/15 border-2 border-duo-blue/40 rounded-2xl px-4 py-2">
            <Icon.Zap className="w-5 h-5 text-duo-blue" />
            <span className="font-display font-black text-lg text-duo-blue">+{submission.xp_earned} XP earned!</span>
          </div>
        </div>
      ) : (
        <p className="font-body text-text-mid text-sm mb-4">Keep going — next challenge drops Wednesday</p>
      )}

      {/* Subtext */}
      <p className="font-body text-text-mid text-sm mb-5">
        {pending
          ? 'Marking happens Wednesday at midnight when the window closes.'
          : correct
          ? 'Your XP has been added to your total. Check the leaderboard!'
          : 'Partial XP may still be awarded. Check back Wednesday.'}
      </p>

      {/* Answer bubble */}
      <div className="inline-block bg-surface-off rounded-2xl border-2 border-surface-border px-5 py-3 text-left max-w-xs w-full">
        <p className="font-body text-xs text-text-muted mb-1">Your answer</p>
        <p className="font-mono text-sm text-text-dark break-words">
          {formatAnswerLabel(submission.answer, challenge)}
        </p>
      </div>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Challenge() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const challengeId = searchParams.get('id');
  const [answer, setAnswer] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const autoSubmitRef = useRef(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['challenge', challengeId || 'current'],
    queryFn: () => {
      const endpoint = challengeId ? `/api/challenge/${challengeId}` : '/api/challenge/current';
      return apiClient.get(endpoint).then((r) => r.data);
    },
    staleTime: 30_000,
    retry: 1,
  });

  const challenge = data?.challenge;
  const submission = data?.submission;

  // Pre-fill ordering answer with default item order
  useEffect(() => {
    if (!challenge) return;
    const qt = challenge.question_type || challenge.answer_mode || 'text';
    if (qt === 'ordering' && Array.isArray(challenge.answer_options) && challenge.answer_options.length > 0) {
      setAnswer(challenge.answer_options.join('|||'));
    }
  }, [challenge?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitMutation = useMutation({
    mutationFn: (payload) => apiClient.post('/api/submit', payload),
    onSuccess: (response) => {
      const data = response?.data;
      const xpEarned = data?.submission?.xp_earned;
      if (xpEarned !== undefined) {
        toast.success(xpEarned > 0 ? `${xpEarned} XP earned!` : 'Submitted — no XP this time');
      } else {
        toast.success('Answer submitted — results drop Wednesday at midnight');
      }
      queryClient.invalidateQueries({ queryKey: ['challenge', challengeId || 'current'] });
      setShowModal(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setShowModal(false);
    },
  });

  const handleTimerExpire = useCallback(() => {
    if (autoSubmitRef.current || submission) return;
    autoSubmitRef.current = true;
    setTimedOut(true);
    setShowModal(false);
    const currentAnswer = answer.trim();
    if (currentAnswer && challenge) {
      toast('Time up! Submitting your answer...', { icon: '⏰' });
      submitMutation.mutate({ challenge_id: challenge.id, answer: currentAnswer });
    } else {
      toast.error("Time's up — no answer was submitted");
    }
  }, [answer, challenge, submission]); // eslint-disable-line react-hooks/exhaustive-deps

  // For non-maze challenges: existing countdown timer (time limit forces submission)
  const secsLeft = useCountdown(
    challenge?.challenge_type !== 'midweek_maze' ? challenge?.id : null,
    !submission ? (challenge?.time_limit_seconds || null) : null,
    handleTimerExpire,
  );

  // For maze: elapsed timer (counts up) — only active when no submission yet
  const mazeElapsed = useMazeTimer(
    challenge?.challenge_type === 'midweek_maze' ? challenge?.id : null,
    !submission,
  );

  // Calculate current XP available for maze
  function calcMazeXp() {
    if (!challenge) return 0;
    const limitMins = (challenge.time_limit_seconds || 600) / 60;
    const xpPerMin = challenge.xp_reward / limitMins;
    const elapsedMins = Math.floor(mazeElapsed / 60);
    return Math.max(0, Math.floor(challenge.xp_reward - elapsedMins * xpPerMin));
  }

  // Store elapsed in ref so postMessage handler always gets fresh value
  const mazeElapsedRef = useRef(0);
  useEffect(() => { mazeElapsedRef.current = mazeElapsed; }, [mazeElapsed]);

  // Listen for MAZE_COMPLETE postMessage from the game iframe
  useEffect(() => {
    if (!challenge || challenge.challenge_type !== 'midweek_maze' || submission) return;
    function handleMsg(event) {
      if (event.data?.type !== 'MAZE_COMPLETE') return;
      if (autoSubmitRef.current || submission) return;
      autoSubmitRef.current = true;
      const limitMins = (challenge.time_limit_seconds || 600) / 60;
      const xpPerMin = challenge.xp_reward / limitMins;
      const elapsedMins = Math.floor(mazeElapsedRef.current / 60);
      const xpEarned = Math.max(0, Math.floor(challenge.xp_reward - elapsedMins * xpPerMin));
      submitMutation.mutate({
        challenge_id: challenge.id,
        answer: challenge.game_slug || 'completed',
        xp_earned: xpEarned,
      });
    }
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, [challenge, submission]); // eslint-disable-line react-hooks/exhaustive-deps

  function getPreview() {
    if (!challenge) return '';
    if (challenge.challenge_type === 'midweek_maze') {
      const xp = calcMazeXp();
      return xp > 0 ? `Claim ${xp} XP for completing this maze` : 'Claim completion (0 XP — time limit passed)';
    }
    if (!answer) return '';
    return formatAnswerLabel(answer, challenge);
  }

  function handleSubmitAttempt(e) {
    e.preventDefault();
    if (!answer.trim()) {
      toast.error('Please answer the question before submitting');
      return;
    }
    setShowModal(true);
  }

  function handleConfirmSubmit() {
    if (challenge.challenge_type === 'midweek_maze') {
      submitMutation.mutate({
        challenge_id: challenge.id,
        answer: challenge.game_slug || 'completed',
        xp_earned: calcMazeXp(),
      });
    } else {
      submitMutation.mutate({ challenge_id: challenge.id, answer: answer.trim() });
    }
  }

  const typeLabel = { quiz: 'Quiz', puzzle: 'Puzzle', problem: 'Engineering Problem', midweek_maze: 'Midweek Maze' };
  const typeIcon = {
    quiz: <Icon.ClipboardList className="w-5 h-5" />,
    puzzle: <Icon.Target className="w-5 h-5" />,
    problem: <Icon.Wrench className="w-5 h-5" />,
    midweek_maze: <Icon.Dice className="w-5 h-5" />,
  };

  return (
    <PageWrapper>
      <motion.div {...pageTransition} className="max-w-2xl mx-auto">
        {isLoading && <div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>}

        {isError && (
          <div className="card text-center py-10 border-2 border-duo-red/30">
            <motion.div {...bounceIn}>
              <Icon.Warning className="w-12 h-12 text-duo-red mx-auto mb-3" />
              <h1 className="font-display font-black text-xl text-text-dark mb-2">Connection Error</h1>
              <p className="font-mono text-xs text-duo-red bg-duo-red/10 rounded-xl px-4 py-2 inline-block">{error?.message || 'Failed to load challenge'}</p>
            </motion.div>
          </div>
        )}

        {!isLoading && !isError && !challenge && (
          <div className="card text-center py-16">
            <motion.div {...bounceIn}>
              <Icon.Clock className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h1 className="font-display font-black text-2xl text-text-dark mb-3">No Challenge Right Now</h1>
              <p className="font-body text-text-mid">{data?.message || 'Next challenge drops Wednesday at midnight'}</p>
            </motion.div>
          </div>
        )}

        {!isLoading && challenge && (
          <>
            {/* Header */}
            <motion.div {...pageTransition} className="card mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="flex items-center gap-1 bg-duo-red text-white font-display font-bold text-xs px-2 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      LIVE
                    </span>
                    <span className="flex items-center gap-1 font-display font-bold text-xs text-text-mid bg-surface-off px-2 py-1 rounded-full">
                      {typeIcon[challenge.challenge_type]}
                      {typeLabel[challenge.challenge_type]}
                    </span>
                    <span className="font-mono text-xs text-text-muted">Week {challenge.week_number}</span>
                    {challenge.has_questions && challenge.questions?.length > 0 && (
                      <span className="flex items-center gap-1 font-display font-bold text-xs text-duo-purple bg-duo-purple/10 px-2 py-1 rounded-full">
                        <Icon.Target className="w-3.5 h-3.5" />
                        {challenge.questions.length} question{challenge.questions.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <h1 className="font-display font-black text-2xl text-text-dark">{challenge.title}</h1>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <XpBadge xp={challenge.xp_reward} size="md" />
                  {secsLeft !== null && <CountdownTimer secsLeft={secsLeft} />}
                </div>
              </div>
              <p className="font-body text-text-mid text-sm flex items-center gap-1">
                <Icon.Clock className="w-4 h-4" />
                Closes:&nbsp;
                <span className="font-semibold text-text-dark">
                  {new Date(challenge.closes_at).toLocaleDateString('en-GB', {
                    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </p>
            </motion.div>

            {/* Midweek Maze — inline game component with sticky timer in header */}
            {challenge.challenge_type === 'midweek_maze' && challenge.game_slug && (
              <motion.div {...pageTransition} className="card mb-6 p-0 overflow-hidden">
                {/* Header bar — game title + live timer */}
                <div className="flex items-center gap-2 px-4 py-3 bg-surface-off border-b border-surface-border">
                  <Icon.Dice className="w-4 h-4 text-duo-red" />
                  <span className="font-display font-bold text-sm text-text-dark">Interactive Game</span>
                  {!submission && (
                    <div className="ml-auto flex items-center gap-2">
                      <MazeXpDisplay
                        xpReward={challenge.xp_reward}
                        timeLimitSeconds={challenge.time_limit_seconds}
                        elapsedSeconds={mazeElapsed}
                        compact
                      />
                    </div>
                  )}
                  {submission && (
                    <span className="ml-auto font-mono text-xs text-duo-green font-bold">Submitted ✓</span>
                  )}
                </div>
                <GameRenderer slug={challenge.game_slug} />
              </motion.div>
            )}

            {/* Challenge image */}
            {challenge.challenge_type !== 'midweek_maze' && challenge.image_url && <ChallengeImage url={challenge.image_url} />}

            {/* Description — hidden for midweek_maze (game is self-explanatory) */}
            {challenge.challenge_type !== 'midweek_maze' && (
              <motion.div {...pageTransition} className="card mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Icon.ClipboardList className="w-5 h-5 text-duo-blue" />
                  <h2 className="font-display font-black text-lg text-text-dark">Challenge Description</h2>
                </div>
                <div className="font-body text-text-dark leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                  {challenge.description}
                </div>
                {challenge.hint && (
                  <div className="mt-4 p-3 rounded-2xl bg-duo-yellow/10 border-2 border-duo-yellow/30 flex gap-2">
                    <Icon.Info className="w-5 h-5 text-duo-yellow-dark flex-shrink-0 mt-0.5" />
                    <p className="font-display font-bold text-sm text-text-dark">
                      Hint: <span className="font-normal">{challenge.hint}</span>
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Answer section */}
            <motion.div {...pageTransition}>
              {submission ? (
                <SubmittedCard submission={submission} challenge={challenge} />
              ) : timedOut && !submission ? (
                <motion.div {...scaleIn} className="card text-center py-10 border-2 border-duo-red/30">
                  <Icon.Clock className="w-14 h-14 text-duo-red mx-auto mb-3" />
                  <h2 className="font-display font-black text-xl text-text-dark mb-2">Time's Up!</h2>
                  <p className="font-body text-text-mid text-sm">Your time limit expired. {submitMutation.isPending ? 'Submitting your last answer...' : 'No answer was submitted.'}</p>
                </motion.div>
              ) : challenge.challenge_type === 'midweek_maze' ? null : (
                // ── Single-question form (all 8 types) ─────────────────────
                <form onSubmit={handleSubmitAttempt} className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <Icon.Pencil className="w-5 h-5 text-duo-blue" />
                    <h2 className="font-display font-black text-lg text-text-dark">Your Answer</h2>
                  </div>
                  <QuestionAnswerInput
                    question={{
                      question_type: challenge.question_type || challenge.answer_mode || 'text',
                      options: challenge.answer_options || [],
                      image_url: null,
                      question_text: challenge.description,
                    }}
                    value={answer}
                    onChange={setAnswer}
                  />
                  <div className="flex items-center gap-1 text-xs text-text-muted mt-3 mb-4">
                    <Icon.Warning className="w-3.5 h-3.5" />
                    One submission only — cannot edit after submitting
                  </div>
                  <button type="submit" disabled={submitMutation.isPending} className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2 disabled:opacity-60">
                    <Icon.Rocket className="w-5 h-5" />
                    Submit Answer
                  </button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <ConfirmModal
            preview={getPreview()}
            onConfirm={handleConfirmSubmit}
            onCancel={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
