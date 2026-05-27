import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ROUNDS = [
  { target: 12,  solution: [2, 2, 3]    },  // 2²×3
  { target: 30,  solution: [2, 3, 5]    },  // 2×3×5
  { target: 36,  solution: [2, 2, 3, 3] },  // 2²×3²
  { target: 60,  solution: [2, 2, 3, 5] },  // 2²×3×5
  { target: 105, solution: [3, 5, 7]    },  // 3×5×7
];

const PRIMES    = [2, 3, 5, 7, 11, 13];
const MAX_TRIES = 3;

function product(arr) { return arr.reduce((a, b) => a * b, 1); }

// ── Hint logic: find the first prime still needed ─────────────────────────────
function getHintPrime(selected, solution) {
  const counts = {};
  selected.forEach(p => { counts[p] = (counts[p] || 0) + 1; });
  const needed = {};
  solution.forEach(p => { needed[p] = (needed[p] || 0) + 1; });
  for (const [p, n] of Object.entries(needed)) {
    if ((counts[parseInt(p)] || 0) < n) return parseInt(p);
  }
  return null;
}

// ── HUD ───────────────────────────────────────────────────────────────────────
function HUD({ round, total, triesLeft }) {
  return (
    <div className="flex items-center justify-between bg-surface-card rounded-2xl
      border border-surface-border shadow-card px-5 py-3 mb-4">
      <div className="flex items-center gap-2">
        <span className="font-display font-bold text-xs text-text-muted uppercase tracking-wider">Round</span>
        <span className="font-mono font-bold text-xl text-text-dark">
          {round}<span className="text-text-muted text-sm font-normal">/{total}</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-duo-yellow/15 rounded-xl px-3 py-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#E6AC00">
            <path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/>
          </svg>
          <span className="font-mono font-bold text-sm text-duo-yellow-dark">{score} XP</span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: MAX_TRIES }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full transition-all"
              style={{ background: i < triesLeft ? '#1CB0F6' : '#E5E5E5' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function PrimeFactorization() {
  const [roundIdx, setRoundIdx] = useState(0);
  const [selected, setSelected] = useState([]); // array of primes chosen so far
  const [triesLeft,setTries]    = useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [phase,    setPhase]    = useState('intro');
  const [msg,      setMsg]      = useState('');
  const [msgOk,    setMsgOk]    = useState(false);
  const [hints,    setHints]    = useState(0);

  const round  = ROUNDS[roundIdx];
  const curr   = selected.length > 0 ? product(selected) : 1;
  const full   = curr === round.target;
  const over   = curr > round.target;

  function addPrime(p) {
    if (over || full) return;
    const next = [...selected, p];
    setSelected(next);
    const newProd = product(next);
    if (newProd === round.target) {
      setMsg(`${formatChain(next)} = ${newProd}  — correct!`);
      setMsgOk(true);
    } else if (newProd > round.target) {
      setMsg(`${formatChain(next)} = ${newProd} — exceeds ${round.target}!`);
      setMsgOk(false);
    } else {
      setMsg('');
    }
  }

  function removeLast() {
    setSelected(s => s.slice(0, -1));
    setMsg('');
  }

  function formatChain(arr) {
    if (arr.length === 0) return '1';
    return arr.join(' × ');
  }

  function submitAnswer() {
    if (!full) { setMsg('The product doesn\'t equal the target yet'); setMsgOk(false); return; }

    const xp = Math.max(30 - hints * 5, 10);
    setScore(s => s + xp);
    setMsg(`Correct!`);
    setMsgOk(true);
    setHints(0);

    setTimeout(() => {
      if (roundIdx >= ROUNDS.length - 1) { setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*'); }
      else { setRoundIdx(i => i + 1); setSelected([]); setMsg(''); }
    }, 900);
  }

  function giveHint() {
    const p = getHintPrime(selected, round.solution);
    if (!p) return;
    setHints(h => h + 1);
    setMsg(`Hint: try adding  ${p}  as the next factor`);
    setMsgOk(false);
  }

  function reset() {
    setRoundIdx(0); setSelected([]); setTries(MAX_TRIES);
    setScore(0); setPhase('playing'); setMsg(''); setHints(0);
  }

  const progressPct = Math.min((curr / round.target) * 100, 100);
  const barColor    = over ? '#FF4B4B' : full ? '#58CC02' : '#1CB0F6';

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-xl">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">
          Interactive Puzzle
        </p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">
          Prime Factorization
        </h1>
        <p className="text-center text-text-mid text-sm mb-5">
          Build the prime factorization of the target number using only prime factors.
        </p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Prime Factorization</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A target number is shown. Break it down into its prime factors."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Click prime number buttons (2, 3, 5, 7…) to build the factorization chain."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "The running product updates with each click. Match the target exactly."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Remove the last prime with the ← button if you make a mistake."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "36 = 2 × 2 × 3 × 3. Click 2, 2, 3, 3 → running product reaches 36. ✓"}}/>
              </div>
              <button onClick={() => setPhase('playing')} className="btn-primary w-full py-3 text-base">Got it — Start Playing</button>
            </motion.div>
          )}

          {phase === 'won' && (
            <motion.div key="won" initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-green rounded-3xl flex items-center justify-center mx-auto mb-4
                shadow-[0_6px_24px_rgba(88,204,2,0.35)]">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">All Factored!</h2>
              <p className="font-body text-sm text-text-mid mb-6">
                Every number broken down to its prime building blocks.
              </p>
              <button onClick={reset} className="btn-primary w-full py-3 text-base">Play Again</button>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div key={`r${roundIdx}`} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
              <HUD round={roundIdx + 1} total={ROUNDS.length} triesLeft={triesLeft} />

              {/* Target + product display */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6 mb-4">
                {/* Target number */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-display font-bold text-xs text-text-muted uppercase tracking-wider mb-1">Target</p>
                    <span className="font-mono font-black text-5xl text-text-dark">{round.target}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-xs text-text-muted uppercase tracking-wider mb-1">
                      Running product
                    </p>
                    <span className="font-mono font-black text-3xl"
                      style={{ color: over ? '#FF4B4B' : full ? '#58CC02' : '#3C3C3C' }}>
                      {curr}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 bg-surface-off rounded-full overflow-hidden mb-4 border border-surface-border">
                  <motion.div className="h-full rounded-full transition-all"
                    animate={{ width: `${progressPct}%` }}
                    style={{ backgroundColor: barColor }} />
                </div>

                {/* Factor chain */}
                <div className="min-h-14 flex items-center justify-center bg-surface-off rounded-2xl
                  border-2 border-surface-border px-4 py-3">
                  {selected.length === 0 ? (
                    <span className="font-display font-bold text-text-muted text-sm">
                      Click prime buttons below to build the factorization
                    </span>
                  ) : (
                    <div className="flex items-center flex-wrap gap-2 justify-center">
                      {selected.map((p, i) => (
                        <span key={i} className="flex items-center gap-2">
                          <span className="font-mono font-black text-2xl text-text-dark
                            bg-white rounded-xl border-2 border-duo-blue/30 px-3 py-1">
                            {p}
                          </span>
                          {i < selected.length - 1 && (
                            <span className="font-display font-black text-xl text-text-muted">×</span>
                          )}
                        </span>
                      ))}
                      <span className="font-display font-black text-xl text-text-muted">=</span>
                      <span className="font-mono font-black text-2xl"
                        style={{ color: over ? '#FF4B4B' : full ? '#58CC02' : '#3C3C3C' }}>
                        {curr}
                      </span>
                      {full && (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#58CC02" strokeWidth="3">
                          <path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Prime buttons */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4">
                <p className="font-display font-bold text-xs text-text-muted uppercase tracking-wider mb-3">
                  Prime factors
                </p>
                <div className="flex gap-3 flex-wrap">
                  {PRIMES.map(p => {
                    const wouldExceed = curr * p > round.target;
                    const disabled    = full || wouldExceed;
                    return (
                      <motion.button key={p}
                        onClick={() => addPrime(p)}
                        disabled={disabled}
                        whileTap={!disabled ? { scale: 0.9 } : {}}
                        className={[
                          'w-14 h-14 rounded-2xl font-mono font-black text-xl border-2 transition-all',
                          disabled
                            ? 'bg-surface-off border-surface-border text-text-muted cursor-not-allowed opacity-40'
                            : 'bg-white border-duo-blue/30 text-duo-blue hover:bg-duo-blue hover:text-white cursor-pointer shadow-card',
                        ].join(' ')}>
                        {p}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <AnimatePresence>
                {msg && (
                  <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                    className={`rounded-2xl border px-4 py-2.5 mb-4 text-center font-body text-sm
                      ${msgOk
                        ? 'bg-duo-green/8 border-duo-green/25 text-duo-green-dark'
                        : 'bg-surface-card border-surface-border text-text-mid'}`}>
                    {msg}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Controls */}
              <div className="flex gap-3 mb-3">
                <button onClick={giveHint}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white
                    border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all">
                  Hint  <span className="font-normal text-text-muted"></span>
                </button>
                <button onClick={removeLast} disabled={selected.length === 0}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white
                    border-2 border-surface-border text-text-mid hover:border-duo-red hover:text-duo-red
                    transition-all disabled:opacity-30">
                  Remove last
                </button>
              </div>

              <button onClick={submitAnswer} disabled={!full}
                className={[
                  'w-full py-4 rounded-2xl font-display font-black text-lg transition-all',
                  full
                    ? 'bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer'
                    : 'bg-surface-off border-2 border-surface-border text-text-muted cursor-not-allowed',
                ].join(' ')}>
                {full ? `Submit — ${formatChain(selected)} = ${curr}` : 'Build the factorization above'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 text-text-muted text-xs font-mono text-center">
          ISAG Interactive Games — Prime Factorization
        </p>
      </div>
    </div>
  );
}
