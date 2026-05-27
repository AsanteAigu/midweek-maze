import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Character roster ───────────────────────────────────────────────────────────
const ROSTER = [
  { id: 'kai',   name: 'Kai',   minutes: 1,  color: '#1CB0F6', bg: '#DFF4FF', label: '1 min'  },
  { id: 'ama',   name: 'Ama',   minutes: 2,  color: '#58CC02', bg: '#E8FFD4', label: '2 min'  },
  { id: 'doc',   name: 'Doc',   minutes: 5,  color: '#CE82FF', bg: '#F5E8FF', label: '5 min'  },
  { id: 'chief', name: 'Chief', minutes: 10, color: '#FF9600', bg: '#FFF0D4', label: '10 min' },
];

const TIME_LIMIT = 17;
const MAX_TRIES  = 3;
const CROSS_MS   = 2000;

// ── SVG Walking figure ─────────────────────────────────────────────────────────
function Figure({ color, bg, walking, size = 52 }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.5)}
      viewBox="0 0 44 66"
      style={{ overflow: 'visible' }}
    >
      {/* Body group bobs when walking */}
      <g className={walking ? 'walk-body' : ''}>
        {/* Head */}
        <circle cx="22" cy="11" r="10" fill={color} />
        {/* Eyes */}
        <circle cx="18.5" cy="10" r="2.2" fill="rgba(0,0,0,0.5)" />
        <circle cx="25.5" cy="10" r="2.2" fill="rgba(0,0,0,0.5)" />
        {/* Eye shine */}
        <circle cx="19.5" cy="8.8" r="0.9" fill="rgba(255,255,255,0.8)" />
        <circle cx="26.5" cy="8.8" r="0.9" fill="rgba(255,255,255,0.8)" />
        {/* Smile */}
        <path d="M18 15 Q22 18.5 26 15" stroke="rgba(0,0,0,0.35)" strokeWidth="1.8"
          fill="none" strokeLinecap="round" />

        {/* Torso */}
        <rect x="15" y="22" width="14" height="17" rx="5" fill={color} opacity="0.88" />
        {/* Torso sheen */}
        <rect x="17" y="24" width="5" height="7" rx="2" fill="rgba(255,255,255,0.25)" />

        {/* Left arm */}
        <g className={walking ? 'walk-arm-left' : ''}
          style={{ transformOrigin: '15px 26px' }}>
          <line x1="15" y1="26" x2="6"  y2="37" stroke={color} strokeWidth="5" strokeLinecap="round" />
          <circle cx="5.5" cy="38" r="3" fill={color} opacity="0.9" />
        </g>

        {/* Right arm */}
        <g className={walking ? 'walk-arm-right' : ''}
          style={{ transformOrigin: '29px 26px' }}>
          <line x1="29" y1="26" x2="38" y2="37" stroke={color} strokeWidth="5" strokeLinecap="round" />
          <circle cx="38.5" cy="38" r="3" fill={color} opacity="0.9" />
        </g>

        {/* Left leg */}
        <g className={walking ? 'walk-leg-left' : ''}
          style={{ transformOrigin: '19px 39px' }}>
          <line x1="19" y1="39" x2="14" y2="57" stroke={color} strokeWidth="5.5" strokeLinecap="round" />
          <ellipse cx="13" cy="58.5" rx="5" ry="3" fill={color} opacity="0.85" />
        </g>

        {/* Right leg */}
        <g className={walking ? 'walk-leg-right' : ''}
          style={{ transformOrigin: '25px 39px' }}>
          <line x1="25" y1="39" x2="30" y2="57" stroke={color} strokeWidth="5.5" strokeLinecap="round" />
          <ellipse cx="31" cy="58.5" rx="5" ry="3" fill={color} opacity="0.85" />
        </g>
      </g>

      {/* Ground shadow */}
      <ellipse cx="22" cy="65" rx="11" ry="3" fill={color} opacity="0.12" />
    </svg>
  );
}

// ── Lantern SVG ────────────────────────────────────────────────────────────────
function Lantern({ size = 30 }) {
  return (
    <svg width={size} height={Math.round(size * 1.5)} viewBox="0 0 30 44">
      <circle cx="15" cy="28" r="13" fill="#FFC800" opacity="0.18" />
      <path d="M11 8 Q15 2 19 8" stroke="#B8860B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <polygon points="5,15 15,7 25,15" fill="#DAA520" />
      <rect x="7" y="15" width="16" height="22" rx="3" fill="#FFC800" opacity="0.92" />
      <rect x="9"  y="17" width="5" height="18" rx="1.5" fill="#FFE680" opacity="0.65" />
      <rect x="16" y="17" width="5" height="18" rx="1.5" fill="#FFE680" opacity="0.45" />
      <ellipse cx="15" cy="26" rx="3.5" ry="4.5" fill="#FF9600" opacity="0.9" />
      <ellipse cx="15" cy="27" rx="2"   ry="3"   fill="#FFE040" />
      <rect x="5" y="37" width="20" height="4" rx="2" fill="#B8860B" />
    </svg>
  );
}

// ── Character card (in zone) ───────────────────────────────────────────────────
function CharCard({ char, selected, canSelect, onClick, walking }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={!canSelect && !selected}
      whileHover={canSelect ? { scale: 1.05, y: -2 } : {}}
      whileTap={canSelect ? { scale: 0.95 } : {}}
      className={[
        'flex flex-col items-center gap-1 p-2.5 rounded-2xl border-2 transition-all select-none',
        selected
          ? 'border-duo-blue bg-duo-blue/10 shadow-[0_0_0_3px_rgba(28,176,246,0.3)]'
          : canSelect
          ? 'border-surface-border bg-white hover:border-duo-blue cursor-pointer'
          : 'border-surface-border bg-surface-off opacity-40 cursor-default',
      ].join(' ')}
    >
      <Figure color={char.color} bg={char.bg} walking={walking} size={44} />
      <span className="font-display font-black text-sm text-text-dark leading-none">{char.name}</span>
      <span className="font-mono text-xs leading-none font-bold" style={{ color: char.color }}>
        {char.label}
      </span>
    </motion.button>
  );
}

// ── Night sky + bridge (game board inner scene) ────────────────────────────────
function BridgeScene() {
  const stars = [
    { x: 14, y: 10 }, { x: 30, y: 5  }, { x: 52, y: 14 }, { x: 67, y: 7  },
    { x: 79, y: 12 }, { x: 89, y: 6  }, { x: 24, y: 20 }, { x: 44, y: 4  },
    { x: 62, y: 18 }, { x: 93, y: 9  },
  ];
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-end">
      {stars.map((s, i) => (
        <div key={i} className="star absolute rounded-full bg-white"
          style={{ width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2,
            top: `${s.y}%`, left: `${s.x}%` }} />
      ))}

      {/* Moon */}
      <div className="moon-pulse absolute rounded-full bg-yellow-50"
        style={{ width: 36, height: 36, top: '8%', right: '16%' }} />
      <div className="absolute rounded-full bg-yellow-100/35"
        style={{ width: 9, height: 9, top: 'calc(8% + 7px)', right: 'calc(16% + 6px)' }} />

      {/* Bridge */}
      <div className="bridge-sway w-full">
        <svg viewBox="0 0 200 60" className="w-full" style={{ height: 68 }}>
          {/* Canyon ledges */}
          <rect x="0"   y="42" width="26" height="18" fill="#1A3A1A" rx="2" />
          <rect x="174" y="42" width="26" height="18" fill="#1A3A1A" rx="2" />

          {/* Handrail rope (top) */}
          <path d="M24 14 Q100 22 176 14" stroke="#92651A" strokeWidth="2"
            fill="none" strokeLinecap="round" strokeDasharray="4 3" />
          {/* Main ropes */}
          <path d="M24 22 Q100 32 176 22" stroke="#92651A" strokeWidth="3.5"
            fill="none" strokeLinecap="round" />
          <path d="M24 27 Q100 37 176 27" stroke="#6B4A10" strokeWidth="2.5"
            fill="none" strokeLinecap="round" />

          {/* Planks */}
          {[0,1,2,3,4,5,6,7,8].map((i) => {
            const t   = (i + 1) / 10;
            const cx  = 24 + t * 152;
            const sag = Math.sin(t * Math.PI) * 8;
            const y   = 22 + sag;
            return (
              <g key={i}>
                <line x1={cx} y1={14 + sag * 0.6} x2={cx} y2={y - 1}
                  stroke="#92651A" strokeWidth="1.5" opacity="0.7" />
                <rect x={cx - 8} y={y - 1} width={16} height={8} rx="2"
                  fill={i % 3 === 1 ? '#5C3A0F' : '#7B4F18'}
                  stroke="#3A2408" strokeWidth="0.8" />
                <line x1={cx - 3} y1={y + 1} x2={cx - 3} y2={y + 7}
                  stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
                <line x1={cx + 3} y1={y + 1} x2={cx + 3} y2={y + 7}
                  stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
              </g>
            );
          })}

          {/* Anchor posts */}
          <rect x="18" y="10" width="8" height="36" rx="3" fill="#4A3000" />
          <rect x="174" y="10" width="8" height="36" rx="3" fill="#4A3000" />
        </svg>
      </div>
    </div>
  );
}

// ── Result screens ─────────────────────────────────────────────────────────────
function ResultScreen({ phase, elapsed, triesLeft, log, onRetry, onReset }) {
  if (phase === 'won') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="card text-center">
        <div className="w-20 h-20 bg-duo-green rounded-3xl flex items-center justify-center mx-auto mb-4
          shadow-[0_6px_24px_rgba(88,204,2,0.35)]">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="font-display font-black text-3xl text-text-dark mb-1">All Across!</h2>
        <div className="inline-flex items-center gap-1.5 bg-duo-yellow/20 border-2 border-duo-yellow/40
          rounded-2xl px-5 py-2 mb-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E6AC00" strokeWidth="2.5">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 3.5" strokeLinecap="round" />
          </svg>
          <span className="font-display font-black text-xl text-duo-yellow-dark">{elapsed} min used</span>
        </div>
        <p className="text-text-mid text-sm mb-5">
          {elapsed <= 15 ? 'Optimal crossing!' : elapsed === 17 ? 'Right on the limit!' : 'Great teamwork!'}
        </p>
        <div className="bg-surface-off rounded-2xl border border-surface-border p-3 mb-5 text-left">
          <p className="font-mono text-xs text-text-muted uppercase tracking-wider mb-2">Move summary</p>
          {log.map((e, i) => (
            <p key={i} className="font-mono text-xs text-text-mid">{i + 1}. {e}</p>
          ))}
        </div>
        <button onClick={onReset} className="btn-primary w-full py-3 text-base">Play Again</button>
      </motion.div>
    );
  }

  if (phase === 'lost') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="card text-center">
        <div className="w-20 h-20 bg-duo-red/15 rounded-3xl flex items-center justify-center mx-auto mb-4
          border-2 border-duo-red/30">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" strokeWidth="3">
            <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" />
          </svg>
        </div>
        <h2 className="font-display font-black text-3xl text-text-dark mb-1">Over the Limit!</h2>
        <p className="text-text-mid mb-1 font-body">
          {elapsed} min total — the limit is {TIME_LIMIT} min
        </p>
        <p className="text-text-muted text-sm mb-5">
          {triesLeft} {triesLeft === 1 ? 'try' : 'tries'} remaining
        </p>
        <button onClick={onRetry} className="btn-primary w-full py-3 text-base">Try Again</button>
      </motion.div>
    );
  }

  if (phase === 'gameover') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="card text-center">
        <div className="w-20 h-20 bg-surface-off rounded-3xl flex items-center justify-center mx-auto mb-4
          border-2 border-surface-border">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#AFAFAF" strokeWidth="2">
            <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="font-display font-black text-2xl text-text-dark mb-2">No More Tries</h2>
        <p className="text-text-mid text-sm mb-5 font-body">
          The crossing needs exactly 17 minutes. Think carefully about who carries the lantern back.
        </p>
        <div className="bg-duo-blue/5 rounded-2xl border-2 border-duo-blue/20 p-4 mb-5 text-left">
          <p className="font-display font-bold text-xs text-duo-blue uppercase tracking-wider mb-3">
            Optimal 17-min solution
          </p>
          {[
            'Kai + Ama cross forward    →  2 min   (total 2)',
            'Kai returns                →  1 min   (total 3)',
            'Doc + Chief cross forward  → 10 min   (total 13)',
            'Ama returns                →  2 min   (total 15)',
            'Kai + Ama cross forward    →  2 min   (total 17)',
          ].map((line, i) => (
            <p key={i} className="font-mono text-xs text-text-mid leading-relaxed">{i + 1}. {line}</p>
          ))}
        </div>
        <button onClick={onReset} className="btn-primary w-full py-3 text-base">Start Over</button>
      </motion.div>
    );
  }
  return null;
}

// ── App ────────────────────────────────────────────────────────────────────────
const INITIAL_CHARS = ROSTER.map((r) => ({ ...r, side: 'start' }));

export default function App() {
  const [chars,     setChars]     = useState(INITIAL_CHARS);
  const [lantern,   setLantern]   = useState('start');
  const [elapsed,   setElapsed]   = useState(0);
  const [triesLeft, setTriesLeft] = useState(MAX_TRIES);
  const [selected,  setSelected]  = useState([]);
  const [crossing,  setCrossing]  = useState([]);
  const [phase,     setPhase]     = useState('intro');
  const [log,       setLog]       = useState([]);
  const [error,     setError]     = useState('');

  const startChars = chars.filter((c) => c.side === 'start');
  const endChars   = chars.filter((c) => c.side === 'end');

  function toggleSelect(id) {
    if (crossing.length > 0) return;
    const char = chars.find((c) => c.id === id);
    if (char.side !== lantern) {
      setError('The lantern is on the other side — you cannot move from here.');
      return;
    }
    setError('');
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2)  return [prev[1], id];
      return [...prev, id];
    });
  }

  const executeCross = useCallback(() => {
    if (selected.length === 0) { setError('Select 1 or 2 people to cross.'); return; }
    setError('');

    const moving     = chars.filter((c) => selected.includes(c.id));
    const crossTime  = Math.max(...moving.map((c) => c.minutes));
    const fromSide   = lantern;
    const toSide     = lantern === 'start' ? 'end' : 'start';
    const newElapsed = elapsed + crossTime;

    setCrossing(selected);
    setSelected([]);

    setTimeout(() => {
      const updated = chars.map((c) =>
        selected.includes(c.id) ? { ...c, side: toSide } : c
      );
      setChars(updated);
      setLantern(toSide);
      setElapsed(newElapsed);
      setCrossing([]);

      const names  = moving.map((c) => c.name).join(' + ');
      const dir    = fromSide === 'start' ? 'crossed over' : 'returned';
      const entry  = `${names} ${dir}  (+${crossTime} min → ${newElapsed} min)`;
      const newLog = [...log, entry];
      setLog(newLog);

      // Time check MUST run first — 19 min with everyone across is still a failure
      if (newElapsed > TIME_LIMIT) {
        const newTries = triesLeft - 1;
        setTriesLeft(newTries);
        setPhase(newTries <= 0 ? 'gameover' : 'lost');
      } else if (updated.every((c) => c.side === 'end')) {
        setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*');
      }
    }, CROSS_MS);
  }, [chars, selected, lantern, elapsed, log, triesLeft]);

  function retry() {
    setChars(INITIAL_CHARS);
    setLantern('start');
    setElapsed(0);
    setSelected([]);
    setCrossing([]);
    setLog([]);
    setError('');
    setPhase('playing');
  }
  function resetAll() { retry(); setTriesLeft(MAX_TRIES); }

  const isAnimating   = crossing.length > 0;
  const selectionCost = selected.length > 0
    ? Math.max(...chars.filter((c) => selected.includes(c.id)).map((c) => c.minutes))
    : null;

  const timeColor = elapsed > 14 ? '#FF4B4B' : elapsed > 10 ? '#FF9600' : '#58CC02';

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">

      {/* ── Page header ───────────────────────────────────────── */}
      <div className="w-full max-w-xl mb-6">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">
          Interactive Puzzle
        </p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark">
          Canyon Crossing
        </h1>
        <p className="text-center text-text-mid text-sm mt-1.5">
          Four surveyors. One lantern. One rope bridge. Get everyone across in {TIME_LIMIT} minutes.
        </p>

        {/* HUD bar — white card matching Midweek Maze style */}
        <div className="flex items-center justify-between mt-4 bg-surface-card rounded-2xl
          border border-surface-border shadow-card px-5 py-3">

          {/* Timer */}
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke={timeColor} strokeWidth="2.2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-mono font-bold text-xl" style={{ color: timeColor }}>
              {elapsed}
              <span className="text-sm font-normal text-text-muted"> / {TIME_LIMIT} min</span>
            </span>
          </div>

          {/* Tries */}
          <div className="flex items-center gap-2">
            <span className="text-text-muted text-xs font-body">Tries</span>
            <div className="flex gap-1.5">
              {Array.from({ length: MAX_TRIES }).map((_, i) => (
                <div key={i} className="w-3.5 h-3.5 rounded-full transition-all"
                  style={{ background: i < triesLeft ? '#1CB0F6' : '#E5E5E5' }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Playing ───────────────────────────────────────────── */}
      {phase === 'playing' && (
        <div className="w-full max-w-xl flex flex-col gap-4">

          {/* Game board — white card containing night scene */}
          <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card overflow-hidden">

            {/* Zone label strip */}
            <div className="flex justify-between items-center px-5 py-2.5
              border-b border-surface-border bg-surface-off">
              <span className="font-display font-black text-xs text-duo-green uppercase tracking-widest">
                Base Camp
              </span>
              <span className="font-mono text-xs text-text-muted">bridge</span>
              <span className="font-display font-black text-xs text-duo-blue uppercase tracking-widest">
                Field Site
              </span>
            </div>

            {/* Night scene */}
            <div
              className="relative"
              style={{
                background: 'linear-gradient(180deg, #050D1E 0%, #071A10 100%)',
                minHeight: 240,
              }}
            >
              {/* 3-column layout: start | bridge | end */}
              <div className="grid grid-cols-3 h-full" style={{ minHeight: 240 }}>

                {/* START zone */}
                <div className="flex flex-col items-center justify-end gap-2 pb-4 px-2 pt-6 z-10 relative">
                  <div className="flex flex-wrap justify-center gap-2">
                    {startChars.map((char) => {
                      const isCrossing = crossing.includes(char.id);
                      return (
                        <motion.div key={char.id}
                          animate={isCrossing ? { x: 80, opacity: 0 } : { x: 0, opacity: 1 }}
                          transition={{ duration: CROSS_MS / 1000, ease: 'easeInOut' }}>
                          <CharCard char={char}
                            selected={selected.includes(char.id)}
                            canSelect={!isAnimating && char.side === lantern}
                            onClick={() => toggleSelect(char.id)}
                            walking={isCrossing} />
                        </motion.div>
                      );
                    })}
                  </div>
                  {lantern === 'start' && (
                    <div className="lantern-float mt-1"><Lantern size={26} /></div>
                  )}
                </div>

                {/* Bridge */}
                <div className="relative z-0" style={{ minHeight: 200 }}>
                  <BridgeScene />
                  {/* Crossing figures shown on bridge */}
                  <div className="absolute inset-x-0 bottom-14 flex justify-center gap-2 z-20">
                    {crossing.map((id) => {
                      const char = chars.find((c) => c.id === id);
                      if (!char) return null;
                      return (
                        <motion.div key={id}
                          initial={{ x: lantern === 'start' ? -30 : 30, opacity: 0.5 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ duration: CROSS_MS / 1000, ease: 'easeInOut' }}>
                          <Figure color={char.color} bg={char.bg} walking size={36} />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* END zone */}
                <div className="flex flex-col items-center justify-end gap-2 pb-4 px-2 pt-6 z-10 relative">
                  <div className="flex flex-wrap justify-center gap-2">
                    {endChars.map((char) => {
                      const isReturning = crossing.includes(char.id);
                      return (
                        <motion.div key={char.id}
                          animate={isReturning ? { x: -80, opacity: 0 } : { x: 0, opacity: 1 }}
                          transition={{ duration: CROSS_MS / 1000, ease: 'easeInOut' }}>
                          <CharCard char={char}
                            selected={selected.includes(char.id)}
                            canSelect={!isAnimating && char.side === lantern}
                            onClick={() => toggleSelect(char.id)}
                            walking={isReturning} />
                        </motion.div>
                      );
                    })}
                  </div>
                  {lantern === 'end' && (
                    <div className="lantern-float mt-1"><Lantern size={26} /></div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status strip */}
          <div className="bg-surface-card rounded-2xl border border-surface-border shadow-card
            px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-xs text-text-mid font-body flex-1">
              Lantern at{' '}
              <span className="font-bold text-text-dark">
                {lantern === 'start' ? 'Base Camp' : 'Field Site'}
              </span>
              {selected.length > 0 && (
                <>
                  {' '}— Sending{' '}
                  <span className="font-bold" style={{ color: '#1CB0F6' }}>
                    {chars.filter((c) => selected.includes(c.id)).map((c) => c.name).join(' + ')}
                  </span>
                  {' '}
                  <span className="font-mono" style={{ color: selectionCost >= 8 ? '#FF9600' : '#777' }}>
                    ({selectionCost} min)
                  </span>
                </>
              )}
            </p>
            <AnimatePresence>
              {error && (
                <motion.p key="err"
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="text-xs text-duo-red font-body text-right max-w-[160px] flex-shrink-0">
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Cross button */}
          <motion.button
            onClick={executeCross}
            disabled={isAnimating || selected.length === 0}
            whileTap={!isAnimating && selected.length > 0 ? { scale: 0.97, y: 1 } : {}}
            className={[
              'w-full py-4 rounded-2xl font-display font-black text-lg transition-all',
              isAnimating || selected.length === 0
                ? 'bg-surface-off border-2 border-surface-border text-text-muted cursor-not-allowed'
                : 'bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer',
            ].join(' ')}
          >
            {isAnimating
              ? 'Crossing...'
              : selected.length > 0
              ? `Cross the Bridge  (+${selectionCost} min)`
              : 'Select people to cross'}
          </motion.button>

          {/* Move log */}
          {log.length > 0 && (
            <div className="bg-surface-card rounded-2xl border border-surface-border shadow-card p-4">
              <p className="font-display font-bold text-xs text-text-muted uppercase tracking-wider mb-2">
                Move Log
              </p>
              <div className="space-y-1">
                {log.map((entry, i) => (
                  <p key={i} className="font-mono text-xs text-text-mid">{i + 1}. {entry}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Result screens ─────────────────────────────────────── */}
      <AnimatePresence>
        {(phase === 'won' || phase === 'lost' || phase === 'gameover') && (
          <div className="w-full max-w-xl">
            <ResultScreen phase={phase} elapsed={elapsed} triesLeft={triesLeft}
              log={log} onRetry={retry} onReset={resetAll} />
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <p className="mt-10 text-text-muted text-xs font-mono text-center">
        ISAG Interactive Games — Canyon Crossing
      </p>
    </div>
  );
}
