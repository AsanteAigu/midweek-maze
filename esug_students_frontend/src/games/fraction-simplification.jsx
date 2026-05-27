import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FRACTIONS = [
  { num: 48, den: 64,  sNum: 3, sDen: 4 },
  { num: 24, den: 36,  sNum: 2, sDen: 3 },
  { num: 15, den: 25,  sNum: 3, sDen: 5 },
  { num: 56, den: 72,  sNum: 7, sDen: 9 },
  { num: 18, den: 42,  sNum: 3, sDen: 7 },
];

const MAX_TRIES = 3;

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

function HUD({ round, total, triesLeft }) {
  return (
    <div className="flex items-center justify-between bg-surface-card rounded-2xl
      border border-surface-border shadow-card px-5 py-3 mb-4">
      <div className="flex items-center gap-2">
        <span className="font-display font-bold text-xs text-text-muted uppercase tracking-wider">Fraction</span>
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

// Big fraction display
function FractionDisplay({ num, den, size = 'lg' }) {
  const textSize = size === 'lg' ? 'text-5xl' : 'text-2xl';
  return (
    <div className="flex flex-col items-center gap-0">
      <span className={`font-mono font-black ${textSize} text-text-dark leading-none`}>{num}</span>
      <div className="w-full h-0.5 bg-text-dark rounded my-1.5" />
      <span className={`font-mono font-black ${textSize} text-text-dark leading-none`}>{den}</span>
    </div>
  );
}

export default function FractionSimplification() {
  const [idx,       setIdx]    = useState(0);
  const [numInput,  setNumIn]  = useState('');
  const [denInput,  setDenIn]  = useState('');
  const [triesLeft, setTries]  = useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [phase,     setPhase]  = useState('intro');
  const [feedback,  setFB]     = useState(null); // null|'correct'|'wrong'|'notsimplified'
  const [msg,       setMsg]    = useState('');
  const [hintShown, setHint]   = useState(false);

  const fr = FRACTIONS[idx];

  function check() {
    const n = parseInt(numInput, 10);
    const d = parseInt(denInput, 10);
    if (!n || !d || d === 0) { setMsg('Enter valid numbers'); return; }

    // Must be mathematically equivalent
    if (n * fr.den !== d * fr.num) {
      setFB('wrong');
      const t = triesLeft - 1;
      setTries(t);
      setMsg(`${n}/${d} is not equal to ${fr.num}/${fr.den}`);
      if (t <= 0) setTimeout(() => setPhase('lost'), 800);
      return;
    }

    // Must be fully simplified
    if (gcd(n, d) !== 1) {
      setFB('notsimplified');
      setMsg(`${n}/${d} can be simplified further — divide both by ${gcd(n, d)}`);
      return;
    }

    // Correct!
    setFB('correct');
    const xp = hintShown ? 15 : 25;
    setScore(s => s + xp);
    setMsg(`Correct!`);
    setHint(false);
    setTimeout(() => {
      if (idx >= FRACTIONS.length - 1) { setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*'); }
      else { setIdx(i => i + 1); setNumIn(''); setDenIn(''); setFB(null); setMsg(''); }
    }, 900);
  }

  function hint() {
    window.parent.postMessage({ type: 'HINT_USED' }, '*');
    setMsg(`GCD(${fr.num}, ${fr.den}) = ${gcd(fr.num, fr.den)}  →  divide both by it`);
    setHint(true);
  }

  function reset() {
    setIdx(0); setNumIn(''); setDenIn('');
    setTries(MAX_TRIES); setScore(0);
    setPhase('playing'); setFB(null); setMsg(''); setHint(false);
  }

  const borderNum = feedback === 'correct' ? '#58CC02' : feedback === 'wrong' || feedback === 'notsimplified' ? '#FF4B4B' : '#E5E5E5';

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-xl">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">
          Interactive Puzzle
        </p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">
          Fraction Simplification
        </h1>
        <p className="text-center text-text-mid text-sm mb-5">
          Reduce each fraction to its lowest terms. Both numbers must share no common factor.
        </p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Fraction Simplification</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A fraction is shown (e.g. 48/64). Reduce it to its lowest terms."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Divide both numerator and denominator by their GCD (Greatest Common Divisor)."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "The fraction is fully simplified when GCD(numerator, denominator) = 1."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Use the Hint button to reveal the GCD."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "48/64: GCD=16 → 48÷16=3, 64÷16=4 → simplified: 3/4."}}/>
              </div>
              <button onClick={() => setPhase('playing')} className="btn-primary w-full py-3 text-base">Got it — Start Playing</button>
            </motion.div>
          )}

          {phase === 'won' && (
            <motion.div key="won" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-green rounded-3xl flex items-center justify-center mx-auto mb-4
                shadow-[0_6px_24px_rgba(88,204,2,0.35)]">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">All 5 Reduced!</h2>
              <p className="font-body text-sm text-text-mid mb-6">
                Every fraction fully simplified. Well done.
              </p>
              <button onClick={reset} className="btn-primary w-full py-3 text-base">Play Again</button>
            </motion.div>
          )}

          {phase === 'lost' && (
            <motion.div key="lost" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-red/10 rounded-3xl flex items-center justify-center mx-auto mb-4
                border-2 border-duo-red/25">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" strokeWidth="3">
                  <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className="font-display font-black text-2xl text-text-dark mb-2">No More Tries</h2>
              <p className="text-text-mid text-sm mb-3 font-body">
                Find GCD of numerator and denominator, then divide both by it.
              </p>
              <div className="bg-duo-blue/5 rounded-2xl border border-duo-blue/15 p-3 mb-5">
                <p className="font-mono text-sm text-text-mid">
                  {fr.num}/{fr.den}  →  <span className="font-bold text-text-dark">{fr.sNum}/{fr.sDen}</span>
                  <span className="text-text-muted ml-2">(GCD = {gcd(fr.num, fr.den)})</span>
                </p>
              </div>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div key={`fr${idx}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <HUD round={idx + 1} total={FRACTIONS.length} triesLeft={triesLeft} />

              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6 mb-4">
                <h2 className="font-display font-black text-lg text-text-dark mb-5 flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1CB0F6" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Reduce this fraction
                </h2>

                {/* Original → Simplified layout */}
                <div className="flex items-center justify-center gap-8">
                  {/* Original */}
                  <div className="text-center">
                    <p className="font-display font-bold text-xs text-text-muted uppercase tracking-wider mb-3">
                      Original
                    </p>
                    <div className="bg-surface-off rounded-2xl border-2 border-surface-border px-6 py-4">
                      <FractionDisplay num={fr.num} den={fr.den} />
                    </div>
                  </div>

                  {/* Arrow */}
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#AFAFAF" strokeWidth="2.5">
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>

                  {/* Inputs */}
                  <div className="text-center">
                    <p className="font-display font-bold text-xs text-text-muted uppercase tracking-wider mb-3">
                      Simplified
                    </p>
                    <div className="flex flex-col items-center gap-0 bg-white rounded-2xl border-2 px-6 py-4"
                      style={{ borderColor: borderNum }}>
                      <input type="number" value={numInput} onChange={e => setNumIn(e.target.value)}
                        className="w-20 text-center font-mono font-black text-4xl text-text-dark
                          outline-none bg-transparent"
                        placeholder="?" />
                      <div className="w-full h-0.5 bg-text-dark rounded my-1.5" />
                      <input type="number" value={denInput} onChange={e => setDenIn(e.target.value)}
                        className="w-20 text-center font-mono font-black text-4xl text-text-dark
                          outline-none bg-transparent"
                        placeholder="?" />
                    </div>
                  </div>
                </div>

                {/* Rule */}
                <div className="mt-4 flex items-center gap-2 bg-surface-off rounded-xl px-4 py-2.5
                  border border-surface-border">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#AFAFAF" strokeWidth="2">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M12 8v4m0 4h.01" strokeLinecap="round"/>
                  </svg>
                  <span className="font-display font-bold text-xs text-text-muted">
                    Fully simplified means GCD(numerator, denominator) = 1
                  </span>
                </div>
              </div>

              <AnimatePresence>
                {msg && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-surface-card rounded-2xl border border-surface-border px-4 py-2.5 mb-4
                      text-center font-body text-sm text-text-mid">
                    {msg}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 mb-3">
                <button onClick={hint}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white
                    border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all">
                  Hint  <span className="font-normal text-text-muted">(show GCD)</span>
                </button>
                <button onClick={() => { setNumIn(''); setDenIn(''); setFB(null); setMsg(''); }}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white
                    border-2 border-surface-border text-text-mid hover:border-surface-border-strong transition-all">
                  Clear
                </button>
              </div>

              <button onClick={check} disabled={!numInput || !denInput}
                className={[
                  'w-full py-4 rounded-2xl font-display font-black text-lg transition-all',
                  numInput && denInput
                    ? 'bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer'
                    : 'bg-surface-off border-2 border-surface-border text-text-muted cursor-not-allowed',
                ].join(' ')}>
                Check Answer
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 text-text-muted text-xs font-mono text-center">
          ESUG Interactive Games — Fraction Simplification
        </p>
      </div>
    </div>
  );
}
