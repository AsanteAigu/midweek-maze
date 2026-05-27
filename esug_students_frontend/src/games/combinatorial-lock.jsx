import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Mastermind-style: guess a 4-digit code (digits 1-6).
// After each guess: ● = correct digit in correct position, ○ = correct digit wrong position.
// 3 rounds with random codes. 6 guesses per round.

const DIGITS = 6;
const CODE_LEN = 4;
const MAX_GUESSES = 6;
const ROUNDS = 3;

function randomCode() {
  return Array.from({ length: CODE_LEN }, () => Math.floor(Math.random() * DIGITS) + 1);
}

function evaluate(guess, code) {
  let black = 0; let white = 0;
  const codeCopy = [...code]; const guessCopy = [...guess];
  for (let i = 0; i < CODE_LEN; i++) {
    if (guessCopy[i] === codeCopy[i]) { black++; guessCopy[i] = codeCopy[i] = -1; }
  }
  for (let i = 0; i < CODE_LEN; i++) {
    if (guessCopy[i] === -1) continue;
    const j = codeCopy.indexOf(guessCopy[i]);
    if (j !== -1) { white++; codeCopy[j] = -1; }
  }
  return { black, white };
}

const MAX_TRIES = 3;

export default function CombinatorialLock() {
  const [round, setRound] = useState(1);
  const [code] = useState(() => [randomCode(), randomCode(), randomCode()]);
  const [guesses, setGuesses] = useState([]);
  const [current, setCurrent] = useState(Array(CODE_LEN).fill(''));
  const [phase, setPhase] = useState('intro'); // playing | won | lost | roundWon
  const [setScore] = useState(0);
  const [msg, setMsg] = useState('');

  const currentCode = code[round - 1];
  const guessesLeft = MAX_GUESSES - guesses.length;
  const totalRounds = ROUNDS;

  function setDigit(pos, val) {
    setCurrent(c => c.map((d, i) => i === pos ? val : d));
    setMsg('');
  }

  function submitGuess() {
    if (current.some(d => d === '')) { setMsg('Fill all 4 digits.'); return; }
    const guess = current.map(Number);
    const fb = evaluate(guess, currentCode);
    const newGuesses = [...guesses, { guess, ...fb }];
    setGuesses(newGuesses);
    setCurrent(Array(CODE_LEN).fill(''));
    if (fb.black === CODE_LEN) {
      const xp = 100 + guessesLeft * 20;
      setScore(s => s + xp);
      setMsg(`Cracked!`);
      setTimeout(() => {
        if (round >= totalRounds) { setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*'); }
        else setPhase('roundWon');
      }, 800);
    } else if (newGuesses.length >= MAX_GUESSES) {
      setPhase('lost');
    } else {
      setMsg(`${fb.black} correct position${fb.black !== 1 ? 's' : ''}, ${fb.white} correct digit${fb.white !== 1 ? 's' : ''} wrong position.`);
    }
  }

  function nextRound() {
    setRound(r => r + 1);
    setGuesses([]); setCurrent(Array(CODE_LEN).fill(''));
    setPhase('playing'); setMsg('');
  }

  function reset() {
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Combinatorial Lock</h1>
        <p className="text-center text-text-mid text-sm mb-5">Guess the 4-digit code (digits 1–6). ● = right digit, right place. ○ = right digit, wrong place.</p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Combinatorial Lock</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Crack a secret 4-digit code. Each digit is between 1 and 6."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "After each guess, you get feedback: <strong>●</strong> = right digit, right position. <strong>○</strong> = right digit, wrong position."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Use the clues to narrow down the code. You have 6 guesses per round."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Guess 1234, get ●○ → one digit is perfectly placed, one is in the code but misplaced."}}/>
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
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">All Codes Cracked!</h2>
              <button onClick={reset} className="btn-primary w-full py-3 text-base">New Game</button>
            </motion.div>
          )}
          {phase === 'lost' && (
            <motion.div key="lost" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-red/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border-2 border-duo-red/25">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" strokeWidth="3"><path d="M6 18 18 6M6 6l12 12" strokeLinecap="round"/></svg>
              </div>
              <h2 className="font-display font-black text-2xl text-text-dark mb-2">Lock Unbreakable</h2>
              <p className="text-text-mid text-sm mb-4">The code was: <span className="font-display font-black text-text-dark">{currentCode.join(' – ')}</span></p>
              <button onClick={reset} className="btn-primary w-full py-3">Try Again</button>
            </motion.div>
          )}
          {phase === 'roundWon' && (
            <motion.div key="roundWon" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <h2 className="font-display font-black text-2xl text-text-dark mb-2">Round {round} Cracked!</h2>
              <p className="text-text-mid text-sm mb-5">Next lock awaits...</p>
              <button onClick={nextRound} className="btn-primary w-full py-3">Round {round + 1}</button>
            </motion.div>
          )}
          {phase === 'playing' && (
            <motion.div key={`r${round}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xs text-text-muted">Round</span>
                  <span className="font-mono font-bold text-xl text-text-dark">{round}<span className="text-text-muted text-sm font-normal">/{totalRounds}</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-text-muted">{guessesLeft} guess{guessesLeft !== 1 ? 'es' : ''} left</span>
                  <div className="flex items-center gap-1.5 bg-duo-yellow/15 rounded-xl px-3 py-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                    <span className="font-mono font-bold text-sm text-duo-yellow-dark">{score} XP</span>
                  </div>
                </div>
              </div>

              {/* Lock display */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4">
                <div className="flex gap-2 justify-center mb-4">
                  {Array(CODE_LEN).fill(null).map((_, i) => (
                    <div key={i} className="w-14 h-14 rounded-2xl bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#555" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                  ))}
                </div>

                {/* Guess history */}
                <div className="space-y-2 mb-4 max-h-52 overflow-y-auto">
                  {guesses.map((g, gi) => (
                    <div key={gi} className="flex items-center gap-3 bg-surface-off rounded-xl px-3 py-2">
                      <div className="flex gap-1.5">
                        {g.guess.map((d, di) => (
                          <div key={di} className="w-9 h-9 rounded-lg bg-white border-2 border-surface-border flex items-center justify-center font-display font-black text-sm text-text-dark">
                            {d}
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1 ml-2">
                        {Array(g.black).fill('●').map((s, i) => <span key={`b${i}`} className="text-duo-green font-bold text-sm">{s}</span>)}
                        {Array(g.white).fill('○').map((s, i) => <span key={`w${i}`} className="text-duo-orange font-bold text-sm">{s}</span>)}
                        {g.black === 0 && g.white === 0 && <span className="text-text-muted text-xs">no matches</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input row */}
                <div className="flex gap-2 justify-center mb-2">
                  {current.map((d, i) => (
                    <select key={i} value={d} onChange={e => setDigit(i, e.target.value)}
                      className="w-14 h-14 rounded-2xl border-2 border-duo-blue bg-[#1CB0F6]/10 text-center font-display font-black text-xl text-duo-blue outline-none cursor-pointer appearance-none">
                      <option value="">–</option>
                      {Array.from({length: DIGITS}, (_, k) => k + 1).map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  ))}
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

              <button onClick={submitGuess} disabled={current.some(d => d === '')}
                className={['w-full py-4 rounded-2xl font-display font-black text-lg transition-all',
                  !current.some(d => d === '') ? 'bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer' : 'bg-surface-off border-2 border-surface-border text-text-muted cursor-not-allowed',
                ].join(' ')}>
                Submit Guess
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ISAG Interactive Games — Combinatorial Lock</p>
      </div>
    </div>
  );
}
