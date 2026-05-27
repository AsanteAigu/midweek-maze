import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PUZZLES = [
  { terms: [1, 1, 2, null, 5, 8, null],    blanks: [3, 6], answers: [3, 13]  },
  { terms: [2, 3, 5, 8, null, 21, null],   blanks: [4, 6], answers: [13, 34] },
  { terms: [null, 2, 3, 5, 8, null, 21],   blanks: [0, 5], answers: [1, 13]  },
  { terms: [1, null, 3, 5, 8, 13, null],   blanks: [1, 6], answers: [2, 21]  },
  { terms: [3, 5, null, 13, 21, null, 55], blanks: [2, 5], answers: [8, 34]  },
];

const MAX_TRIES    = 3;
const XP_PER_ROUND = 30;

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

function Tile({ value, isBlank, inputVal, onChange, status }) {
  const border = status === 'correct' ? '#58CC02' : status === 'wrong' ? '#FF4B4B' : '#E5E5E5';
  const bg     = status === 'correct' ? '#E8FFD4' : status === 'wrong'   ? '#FFECEC' : isBlank ? '#fff' : '#F7F7F7';
  return (
    <div className="flex flex-col items-center gap-1">
      {isBlank ? (
        <input type="number" value={inputVal} onChange={e => onChange(e.target.value)}
          className="w-14 h-14 text-center font-mono font-bold text-xl rounded-2xl border-2
            outline-none focus:ring-4 focus:ring-duo-blue/15 transition-all"
          style={{ borderColor: border, backgroundColor: bg }}
          placeholder="?" />
      ) : (
        <div className="w-14 h-14 flex items-center justify-center rounded-2xl border-2
          font-mono font-bold text-xl text-text-dark"
          style={{ borderColor: '#E5E5E5', backgroundColor: bg }}>
          {value}
        </div>
      )}
    </div>
  );
}

export default function FibonacciSequence() {
  const [idx,       setIdx]      = useState(0);
  const [inputs,    setInputs]   = useState({});
  const [triesLeft, setTries]    = useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [hints,     setHints]    = useState(0);
  const [phase,     setPhase]    = useState('intro');
  const [feedback,  setFeedback] = useState({});
  const [msg,       setMsg]      = useState('');

  const puzzle    = PUZZLES[idx];
  const allFilled = puzzle.blanks.every(i => inputs[i]?.trim());

  function setInput(bi, v) { setInputs(p => ({ ...p, [bi]: v })); }

  function check() {
    const fb = {};
    let ok = true;
    puzzle.blanks.forEach((ti, i) => {
      const correct = parseInt(inputs[ti] || '', 10) === puzzle.answers[i];
      fb[ti] = correct ? 'correct' : 'wrong';
      if (!correct) ok = false;
    });
    setFeedback(fb);

    if (ok) {
      const xp = Math.max(XP_PER_ROUND - hints * 5, 10);
      setScore(s => s + xp);
      setMsg(`Correct!`);
      setHints(0);
      setTimeout(() => {
        if (idx >= PUZZLES.length - 1) { setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*'); }
        else { setIdx(i => i + 1); setInputs({}); setFeedback({}); setMsg(''); }
      }, 900);
    } else {
      const t = triesLeft - 1;
      setTries(t);
      if (t <= 0) setPhase('lost');
      else setMsg(`Wrong — ${t} ${t === 1 ? 'try' : 'tries'} left`);
    }
  }

  function hint() {
    const bi = puzzle.blanks.find(i => inputs[i] !== String(puzzle.answers[puzzle.blanks.indexOf(i)]));
    if (bi === undefined) return;
    const ai = puzzle.blanks.indexOf(bi);
    setInputs(p => ({ ...p, [bi]: String(puzzle.answers[ai]) }));
    setHints(h => h + 1);
    setMsg('Hint used');
  }

  function retry() { setInputs({}); setFeedback({}); setMsg(''); setPhase('playing'); }

  function reset() {
    setIdx(0); setInputs({}); setFeedback({});
    setTries(MAX_TRIES); setScore(0); setHints(0);
    setPhase('playing'); setMsg('');
  }

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-xl">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">
          Interactive Puzzle
        </p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">
          Fibonacci Sequence
        </h1>
        <p className="text-center text-text-mid text-sm mb-5">
          Each term equals the sum of the two before it. Fill in the blanks.
        </p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Fibonacci Sequence</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A number sequence is shown with some terms missing."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "The rule: each term = the sum of the two terms before it."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Fill in the blanks using this formula: F(n) = F(n−1) + F(n−2)."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "The Hint button reveals the formula reminder."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "1, 1, 2, 3, 5, 8, ?, ?, ? → 8+5=13, 13+8=21, 21+13=34."}}/>
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
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">All 5 Done!</h2>
              <p className="font-body text-sm text-text-mid mb-6">You spotted every Fibonacci pattern.</p>
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
              <p className="text-text-mid text-sm mb-5 font-body">
                Remember: F(n) = F(n−1) + F(n−2). Each term is the sum of the previous two.
              </p>
              <div className="bg-duo-blue/5 rounded-2xl border border-duo-blue/15 p-4 mb-5 text-left">
                <p className="font-display font-bold text-xs text-duo-blue uppercase tracking-wider mb-2">
                  Answers for this round
                </p>
                {puzzle.blanks.map((ti, i) => (
                  <p key={i} className="font-mono text-sm text-text-mid">
                    Position {ti + 1} = <span className="text-text-dark font-bold">{puzzle.answers[i]}</span>
                  </p>
                ))}
              </div>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div key={`p${idx}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <HUD round={idx + 1} total={PUZZLES.length} triesLeft={triesLeft} />

              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6 mb-4">
                <div className="flex items-center gap-2 mb-5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1CB0F6" strokeWidth="2">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2
                      M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"
                      strokeLinecap="round"/>
                  </svg>
                  <h2 className="font-display font-black text-lg text-text-dark">
                    Sequence {idx + 1} of {PUZZLES.length}
                  </h2>
                </div>

                <div className="flex items-end justify-center gap-1.5 flex-wrap pb-2">
                  {puzzle.terms.map((val, ti) => {
                    const isBlank = puzzle.blanks.includes(ti);
                    return (
                      <div key={ti} className="flex items-center gap-1">
                        <Tile value={val} isBlank={isBlank}
                          inputVal={inputs[ti] ?? ''}
                          onChange={v => setInput(ti, v)}
                          status={feedback[ti] ?? null} />
                        {ti < puzzle.terms.length - 1 && (
                          <span className="font-display font-black text-xl text-text-muted pb-5">,</span>
                        )}
                      </div>
                    );
                  })}
                  <span className="font-display font-black text-2xl text-text-muted pb-5"> …</span>
                </div>

                <div className="mt-3 flex items-center gap-2 bg-duo-blue/5 rounded-xl px-4 py-2
                  border border-duo-blue/15">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1CB0F6" strokeWidth="2">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M12 8v4m0 4h.01" strokeLinecap="round"/>
                  </svg>
                  <span className="font-display font-bold text-xs text-duo-blue">
                    Rule: F(n) = F(n−1) + F(n−2)
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
                  Hint  <span className="font-normal text-text-muted"></span>
                </button>
                <button onClick={retry}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white
                    border-2 border-surface-border text-text-mid hover:border-surface-border-strong transition-all">
                  Restart
                </button>
              </div>

              <button onClick={check} disabled={!allFilled}
                className={[
                  'w-full py-4 rounded-2xl font-display font-black text-lg transition-all',
                  allFilled
                    ? 'bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer'
                    : 'bg-surface-off border-2 border-surface-border text-text-muted cursor-not-allowed',
                ].join(' ')}>
                Check Answers
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 text-text-muted text-xs font-mono text-center">
          ISAG Interactive Games — Fibonacci Sequence
        </p>
      </div>
    </div>
  );
}
