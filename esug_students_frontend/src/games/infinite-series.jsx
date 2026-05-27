import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Each puzzle: an infinite series. Player enters the sum as a fraction (numerator/denominator).
// Accepted if numerator/denominator = exact decimal or matches reduced fraction.
// Unique twist: partial-sum bar that grows visually as the series converges.

const SERIES = [
  {
    display: '1/2 + 1/4 + 1/8 + 1/16 + …',
    type: 'Geometric series (r = 1/2)',
    numAns: 1, denAns: 1,   // sum = 1
    partial: (n) => 1 - 1 / (2 ** (n + 1)),
    hint: 'Geometric series: a/(1−r) = (1/2)/(1−1/2) = 1',
    acceptDecimal: '1',
  },
  {
    display: '1 − 1/2 + 1/4 − 1/8 + …',
    type: 'Alternating geometric series (r = −1/2)',
    numAns: 2, denAns: 3,   // sum = 2/3
    partial: (n) => (1 - (-0.5) ** (n + 1)) / 1.5,
    hint: 'Alternating geometric: a/(1−r) = 1/(1+1/2) = 2/3',
    acceptDecimal: '0.667',
  },
  {
    display: '1/(1×2) + 1/(2×3) + 1/(3×4) + …',
    type: 'Telescoping series',
    numAns: 1, denAns: 1,   // sum = 1
    partial: (n) => 1 - 1 / (n + 2),
    hint: '1/(n(n+1)) = 1/n − 1/(n+1). Telescopes to 1 − 0 = 1',
    acceptDecimal: '1',
  },
  {
    display: '1/4 + 1/16 + 1/64 + …',
    type: 'Geometric series (a = 1/4, r = 1/4)',
    numAns: 1, denAns: 3,   // sum = (1/4)/(1−1/4) = 1/3
    partial: (n) => (1 / 4) * (1 - 0.25 ** (n + 1)) / 0.75,
    hint: 'a/(1−r) = (1/4)/(3/4) = 1/3',
    acceptDecimal: '0.333',
  },
  {
    display: '2/3 + 2/9 + 2/27 + …',
    type: 'Geometric series (a = 2/3, r = 1/3)',
    numAns: 1, denAns: 1,   // sum = (2/3)/(1−1/3) = (2/3)/(2/3) = 1
    partial: (n) => (2 / 3) * (1 - (1 / 3) ** (n + 1)) / (2 / 3),
    hint: 'a/(1−r) = (2/3)/(2/3) = 1',
    acceptDecimal: '1',
  },
];

const MAX_TRIES = 3;
const PARTIAL_TERMS = 8;

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

function checkAnswer(num, den, series) {
  if (isNaN(num) || isNaN(den) || den === 0) return false;
  const g = gcd(Math.abs(num), Math.abs(den));
  const rn = num / g; const rd = den / g;
  const sign = rd < 0 ? -1 : 1;
  return (sign * rn === series.numAns && sign * rd === series.denAns);
}

function PartialSumBar({ series, width = 240 }) {
  const partials = Array.from({ length: PARTIAL_TERMS }, (_, i) => series.partial(i));
  const target = series.numAns / series.denAns;
  return (
    <div className="flex flex-col gap-1 mt-3">
      {partials.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-text-muted w-6 text-right">n={i+1}</span>
          <div className="flex-1 bg-surface-off rounded-full h-2 border border-surface-border overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (p / target) * 100)}%` }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="h-full bg-duo-blue rounded-full"
            />
          </div>
          <span className="font-mono text-[9px] text-text-muted w-12">{p.toFixed(3)}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 mt-1">
        <span className="font-mono text-[9px] text-duo-blue w-6 text-right">∞</span>
        <div className="flex-1 bg-[#1CB0F6]/20 rounded-full h-2 border border-duo-blue/40 overflow-hidden">
          <div className="h-full bg-duo-blue rounded-full" style={{ width: '100%' }}/>
        </div>
        <span className="font-mono text-[9px] text-duo-blue font-bold w-12">{(series.numAns / series.denAns).toFixed(3)}</span>
      </div>
    </div>
  );
}

export default function InfiniteSeries() {
  const [sIdx, setSIdx] = useState(0);
  const [num, setNum] = useState('');
  const [den, setDen] = useState('');
  const [tries, setTries] = useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState('intro');
  const [fb, setFb] = useState(null);
  const [msg, setMsg] = useState('');
  const [showPartial, setShowPartial] = useState(false);

  const s = SERIES[sIdx];

  function submit() {
    if (num === '' || den === '') { setMsg('Enter both numerator and denominator.'); return; }
    const n = parseInt(num, 10); const d = parseInt(den, 10);
    if (checkAnswer(n, d, s)) {
      setFb('correct');
      setScore(sc => sc + 250);
      setMsg(`Correct! The sum converges to ${s.numAns}/${s.denAns}.`);
      setTimeout(() => {
        if (sIdx >= SERIES.length - 1) { setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*'); }
        else { setSIdx(i => i + 1); setNum(''); setDen(''); setFb(null); setMsg(''); setShowPartial(false); }
      }, 1000);
    } else {
      setFb('wrong');
      const t = tries - 1; setTries(t);
      if (t <= 0) setPhase('lost');
      else setMsg(`Not quite. ${t} tries left. Use the partial sums for guidance.`);
    }
  }

  function reset() {
    setSIdx(0); setNum(''); setDen(''); setTries(MAX_TRIES); setScore(0);
    setPhase('playing'); setFb(null); setMsg(''); setShowPartial(false);
  }

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Infinite Series</h1>
        <p className="text-center text-text-mid text-sm mb-5">Compute the exact sum of each infinite series. Enter your answer as a fraction.</p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Infinite Series</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "An infinite sum is shown: a₁ + a₂ + a₃ + … stretching forever."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Some infinite series converge to a finite number. Your job: find that number."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Enter the answer as a fraction (numerator ÷ denominator)."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Use the partial-sum bar to see how the series approaches its limit."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "1/2 + 1/4 + 1/8 + … → each term halves → total approaches 1. Answer: 1/1."}}/>
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
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">Analysis Expert!</h2>
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
              <p className="text-text-mid text-sm mb-4">{s.hint}</p>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}
          {phase === 'playing' && (
            <motion.div key={`s${sIdx}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xs text-text-muted">Series</span>
                  <span className="font-mono font-bold text-xl text-text-dark">{sIdx+1}<span className="text-text-muted text-sm font-normal">/{SERIES.length}</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-duo-yellow/15 rounded-xl px-3 py-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                    <span className="font-mono font-bold text-sm text-duo-yellow-dark">{score} XP</span>
                  </div>
                  <div className="flex gap-1.5">{Array.from({length:MAX_TRIES}).map((_,i)=>(
                    <div key={i} className="w-3 h-3 rounded-full" style={{background:i<tries?'#1CB0F6':'#E5E5E5'}}/>
                  ))}</div>
                </div>
              </div>

              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4">
                <p className="font-display font-bold text-xs text-text-muted uppercase tracking-wider mb-2">{s.type}</p>
                <p className="font-mono font-bold text-lg text-text-dark mb-4">{s.display}</p>

                <p className="font-display font-bold text-sm text-text-dark mb-3">Sum = ?</p>
                <div className="flex items-center gap-3 justify-center">
                  <div className="flex flex-col items-center gap-1">
                    <input type="number" value={num} onChange={e => { setNum(e.target.value); setFb(null); setMsg(''); }}
                      placeholder="num"
                      className={['w-20 h-11 text-center rounded-xl border-2 font-display font-black text-base outline-none transition-all',
                        fb==='correct'?'border-duo-green bg-[#58CC02]/10 text-[#3A8F00]':fb==='wrong'?'border-duo-red bg-[#FF4B4B]/10 text-duo-red':'border-surface-border bg-white text-text-dark focus:border-duo-blue'
                      ].join(' ')}/>
                    <div className="w-20 h-0.5 bg-text-dark rounded"/>
                    <input type="number" value={den} onChange={e => { setDen(e.target.value); setFb(null); setMsg(''); }}
                      placeholder="den"
                      className={['w-20 h-11 text-center rounded-xl border-2 font-display font-black text-base outline-none transition-all',
                        fb==='correct'?'border-duo-green bg-[#58CC02]/10 text-[#3A8F00]':fb==='wrong'?'border-duo-red bg-[#FF4B4B]/10 text-duo-red':'border-surface-border bg-white text-text-dark focus:border-duo-blue'
                      ].join(' ')}/>
                  </div>
                </div>

                <button onClick={() => setShowPartial(v => !v)}
                  className="mt-4 w-full py-2 rounded-xl font-display font-bold text-xs text-text-muted border border-surface-border bg-surface-off hover:border-duo-blue hover:text-duo-blue transition-all">
                  {showPartial ? 'Hide' : 'Show'} Partial Sum Convergence
                </button>
                {showPartial && <PartialSumBar series={s}/>}
              </div>

              <AnimatePresence>
                {msg && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-surface-card rounded-2xl border border-surface-border px-4 py-2.5 mb-4 text-center font-body text-sm text-text-mid">
                    {msg}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 mb-3">
                <button onClick={() => setMsg(`Hint: ${s.hint}`)}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all">
                  Hint
                </button>
                <button onClick={() => { setNum(''); setDen(''); setFb(null); setMsg(''); }}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid transition-all">
                  Clear
                </button>
              </div>
              <button onClick={submit} disabled={num === '' || den === ''}
                className={['w-full py-4 rounded-2xl font-display font-black text-lg transition-all',
                  num !== '' && den !== '' ? 'bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer' : 'bg-surface-off border-2 border-surface-border text-text-muted cursor-not-allowed',
                ].join(' ')}>
                Submit Sum
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ESUG Interactive Games — Infinite Series</p>
      </div>
    </div>
  );
}
