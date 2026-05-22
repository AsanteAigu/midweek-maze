import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Each puzzle: show an expression like "(4 × 5) mod 6 = ?"
// Unique twist: mod clock — a circle divided into M sectors, dot spins to the answer
const PUZZLES = [
  { expr: '(4 × 5) mod 6', value: 20, mod: 6, answer: 2 },
  { expr: '(11 × 3) mod 7', value: 33, mod: 7, answer: 5 },
  { expr: '(8 + 14) mod 9', value: 22, mod: 9, answer: 4 },
  { expr: '(7 × 7) mod 12', value: 49, mod: 12, answer: 1 },
  { expr: '(13 + 27) mod 11', value: 40, mod: 11, answer: 7 },
];

const MAX_TRIES = 3;

function ModClock({ mod, highlight, size = 160 }) {
  const r = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;
  const ticks = Array.from({ length: mod }, (_, i) => {
    const angle = (i / mod) * 2 * Math.PI - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    const tx = cx + (r + 11) * Math.cos(angle);
    const ty = cy + (r + 11) * Math.sin(angle);
    return { i, x, y, tx, ty };
  });
  const hlAngle = highlight !== null
    ? (highlight / mod) * 2 * Math.PI - Math.PI / 2
    : null;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E5E5" strokeWidth="2"/>
      {ticks.map(({ i, x, y, tx, ty }) => (
        <g key={i}>
          <circle cx={x} cy={y} r={6}
            fill={i === highlight ? '#1CB0F6' : '#F0F0F0'}
            stroke={i === highlight ? '#1589C2' : '#D0D0D0'}
            strokeWidth="1.5"/>
          <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central"
            fontSize="9" fontFamily="monospace" fontWeight="bold"
            fill={i === highlight ? '#1CB0F6' : '#999'}>{i}</text>
        </g>
      ))}
      {hlAngle !== null && (
        <motion.line
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          x1={cx} y1={cy}
          x2={cx + (r - 6) * Math.cos(hlAngle)}
          y2={cy + (r - 6) * Math.sin(hlAngle)}
          stroke="#1CB0F6" strokeWidth="2.5" strokeLinecap="round"
        />
      )}
      <circle cx={cx} cy={cy} r={4} fill="#333"/>
    </svg>
  );
}

export default function ModularArithmetic() {
  const [pIdx, setPIdx] = useState(0);
  const [input, setInput] = useState('');
  const [tries, setTries] = useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState('intro');
  const [fb, setFb] = useState(null); // null | 'correct' | 'wrong'
  const [msg, setMsg] = useState('');
  const [revealed, setRevealed] = useState(null); // mod value to show on clock

  const p = PUZZLES[pIdx];

  function submit() {
    if (input === '') { setMsg('Enter a number.'); return; }
    const val = parseInt(input, 10);
    if (isNaN(val)) { setMsg('Enter a valid integer.'); return; }
    if (val === p.answer) {
      setFb('correct');
      setRevealed(p.answer);
      setScore(s => s + 150);
      setMsg(`Correct! ${p.value} ÷ ${p.mod} = ${Math.floor(p.value / p.mod)} remainder ${p.answer}`);
      setTimeout(() => {
        if (pIdx >= PUZZLES.length - 1) setPhase('won');
        else { setPIdx(i => i + 1); setInput(''); setFb(null); setMsg(''); setRevealed(null); }
      }, 1100);
    } else {
      setFb('wrong');
      setRevealed(val < p.mod && val >= 0 ? val : null);
      const t = tries - 1; setTries(t);
      if (t <= 0) { setPhase('lost'); return; }
      setMsg(`Not quite. Remember: X mod M = remainder when X is divided by M. ${t} tries left.`);
    }
  }

  function reset() {
    setPIdx(0); setInput(''); setTries(MAX_TRIES); setScore(0);
    setPhase('playing'); setFb(null); setMsg(''); setRevealed(null);
  }

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Modular Arithmetic</h1>
        <p className="text-center text-text-mid text-sm mb-5">X mod M = the remainder when X is divided by M. The mod clock shows where you land.</p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Modular Arithmetic</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "X mod M = the remainder left over when X is divided by M."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "An equation with one unknown is shown. Find the missing value."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "The mod clock shows where the answer lands on a number circle."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "(4 × 5) mod 6 = ?  →  20 ÷ 6 = 3 remainder 2  →  answer is 2."}}/>
              </div>
              <button onClick={() => setPhase('playing')} className="btn-primary w-full py-3 text-base">Got it — Start Playing</button>
            </motion.div>
          )}

          {phase === 'won' && (
            <motion.div key="won" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-green rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_6px_24px_rgba(88,204,2,0.35)]">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">Modular Expert!</h2>
              <div className="inline-flex items-center gap-2 bg-duo-yellow/15 border-2 border-duo-yellow/40 rounded-2xl px-5 py-2 mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                <span className="font-display font-black text-xl text-duo-yellow-dark">{score} XP</span>
              </div>
              <button onClick={reset} className="btn-primary w-full py-3 text-base">Play Again</button>
            </motion.div>
          )}
          {phase === 'lost' && (
            <motion.div key="lost" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-red/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border-2 border-duo-red/25">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" strokeWidth="3"><path d="M6 18 18 6M6 6l12 12" strokeLinecap="round"/></svg>
              </div>
              <h2 className="font-display font-black text-2xl text-text-dark mb-2">No More Tries</h2>
              <p className="text-text-mid text-sm mb-4">{p.expr} = {p.answer} — because {p.value} ÷ {p.mod} = {Math.floor(p.value / p.mod)} with remainder {p.answer}.</p>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}
          {phase === 'playing' && (
            <motion.div key={`p${pIdx}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xs text-text-muted">Problem</span>
                  <span className="font-mono font-bold text-xl text-text-dark">{pIdx + 1}<span className="text-text-muted text-sm font-normal">/{PUZZLES.length}</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-duo-yellow/15 rounded-xl px-3 py-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                    <span className="font-mono font-bold text-sm text-duo-yellow-dark">{score} XP</span>
                  </div>
                  <div className="flex gap-1.5">
                    {Array.from({ length: MAX_TRIES }).map((_, i) => (
                      <div key={i} className="w-3 h-3 rounded-full" style={{ background: i < tries ? '#1CB0F6' : '#E5E5E5' }}/>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6 mb-4 flex flex-col items-center">
                <p className="font-display font-black text-3xl text-text-dark mb-5 tracking-tight">
                  {p.expr} = <span className="text-duo-blue">?</span>
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <ModClock mod={p.mod} highlight={revealed} size={180}/>
                  <div className="flex flex-col items-center gap-3">
                    <p className="font-display font-bold text-xs text-text-muted uppercase tracking-wider">Your Answer</p>
                    <input
                      type="number"
                      min="0"
                      max={p.mod - 1}
                      value={input}
                      onChange={e => { setInput(e.target.value); setFb(null); setMsg(''); }}
                      onKeyDown={e => e.key === 'Enter' && submit()}
                      className={['w-24 h-16 text-center font-display font-black text-3xl rounded-2xl border-2 outline-none transition-all',
                        fb === 'correct' ? 'border-duo-green bg-[#58CC02]/10 text-[#3A8F00]'
                        : fb === 'wrong' ? 'border-duo-red bg-[#FF4B4B]/10 text-duo-red'
                        : 'border-surface-border bg-white text-text-dark focus:border-duo-blue',
                      ].join(' ')}
                    />
                    <p className="font-mono text-xs text-text-muted">0 to {p.mod - 1}</p>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {msg && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-surface-card rounded-2xl border border-surface-border px-4 py-2.5 mb-4 text-center font-body text-sm text-text-mid">
                    {msg}
                  </motion.div>
                )}
              </AnimatePresence>

              <button onClick={submit} disabled={input === ''}
                className={['w-full py-4 rounded-2xl font-display font-black text-lg transition-all',
                  input !== '' ? 'bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer' : 'bg-surface-off border-2 border-surface-border text-text-muted cursor-not-allowed',
                ].join(' ')}>
                Submit Answer
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ISAG Interactive Games — Modular Arithmetic</p>
      </div>
    </div>
  );
}
