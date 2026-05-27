import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const ROUNDS = [
  { target: 15, label: 'Use all 26 letters in 15 words or fewer.' },
  { target: 12, label: 'Use all 26 letters in 12 words or fewer.' },
  { target: 10, label: 'Use all 26 letters in 10 words or fewer. This is a tough one.' },
];

const HINT = 'The quick brown fox jumps over the lazy dog — 9 words, all 26 letters!';

function getUsed(text) {
  const s = new Set();
  for (const c of text.toUpperCase()) if (c >= 'A' && c <= 'Z') s.add(c);
  return s;
}

function wordCount(text) {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

const MAX_TRIES = 2;

export default function PangramBuilder() {
  const [round, setRound] = useState(0);
  const [text, setText] = useState('');
  const [tries, setTries] = useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState('playing');
  const [msg, setMsg] = useState('');
  const [hintShown, setHintShown] = useState(false);

  const r = ROUNDS[round];
  const used = getUsed(text);
  const missing = ALPHABET.filter(c => !used.has(c));
  const wc = wordCount(text);
  const allCovered = missing.length === 0;

  function submit() {
    if (text.trim() === '') { setMsg('Write something first.'); return; }
    if (!allCovered) {
      const t = tries - 1; setTries(t);
      setMsg(`Missing ${missing.length} letter${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.`);
      if (t <= 0) setPhase('lost');
      return;
    }
    if (wc > r.target) {
      const t = tries - 1; setTries(t);
      setMsg(`${wc} words — need ${r.target} or fewer. Cut ${wc - r.target} more word${wc - r.target > 1 ? 's' : ''}.`);
      if (t <= 0) setPhase('lost');
      return;
    }
    const bonus = wc < r.target ? (r.target - wc) * 5 : 0;
    const xp = 150 + bonus;
    setScore(s => s + xp);
    setMsg(`Pangram!${bonus ? ` (+${bonus} efficiency bonus)` : ''}`);
    setTimeout(() => {
      if (round >= ROUNDS.length - 1) { setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*'); }
      else { setRound(i => i + 1); setText(''); setMsg(''); setTries(MAX_TRIES); setHintShown(false); }
    }, 1000);
  }

  function reset() {
    setRound(0); setText(''); setTries(MAX_TRIES); setScore(0);
    setPhase('playing'); setMsg(''); setHintShown(false);
  }

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Pangram Builder</h1>
        <p className="text-center text-text-mid text-sm mb-5">Write a sentence that contains every letter of the alphabet at least once.</p>

        <AnimatePresence mode="wait">
          {phase === 'won' && (
            <motion.div key="won" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-green rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_6px_24px_rgba(88,204,2,0.35)]">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">Pangram Master!</h2>
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
              <p className="text-text-mid text-sm mb-4 font-body">{HINT}</p>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}
          {phase === 'playing' && (
            <motion.div key={`r${round}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xs text-text-muted">Round</span>
                  <span className="font-mono font-bold text-xl text-text-dark">{round + 1}<span className="text-text-muted text-sm font-normal">/{ROUNDS.length}</span></span>
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

              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4">
                <p className="font-display font-bold text-sm text-text-dark mb-3">{r.label}</p>
                <textarea
                  value={text}
                  onChange={e => { setText(e.target.value); setMsg(''); }}
                  placeholder="Type your pangram sentence here..."
                  className="w-full h-24 p-3 rounded-xl border-2 border-surface-border bg-surface-off font-body text-sm text-text-dark resize-none outline-none focus:border-duo-blue transition-all"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className={['font-mono text-xs font-bold transition-colors', wc > r.target ? 'text-duo-red' : 'text-text-mid'].join(' ')}>
                    {wc} / {r.target} words
                  </span>
                  <span className={['font-mono text-xs font-bold transition-colors', allCovered ? 'text-[#3A8F00]' : 'text-text-mid'].join(' ')}>
                    {26 - missing.length} / 26 letters
                  </span>
                </div>
              </div>

              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-4 mb-4">
                <p className="font-display font-black text-xs text-text-muted uppercase tracking-wider mb-3">Alphabet Coverage</p>
                <div className="flex flex-wrap gap-1.5">
                  {ALPHABET.map(c => (
                    <motion.div key={c}
                      animate={{ scale: used.has(c) ? [1, 1.15, 1] : 1 }}
                      transition={{ duration: 0.2 }}
                      className={['w-8 h-8 rounded-lg flex items-center justify-center font-display font-black text-xs transition-all',
                        used.has(c) ? 'bg-duo-green text-white shadow-sm' : 'bg-surface-off border-2 border-surface-border text-text-muted',
                      ].join(' ')}>
                      {c}
                    </motion.div>
                  ))}
                </div>
                {missing.length > 0 && text.length > 0 && (
                  <p className="font-body text-xs text-duo-red mt-2">Still missing: {missing.join(', ')}</p>
                )}
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
                <button onClick={() => { window.parent.postMessage({ type: 'HINT_USED' }, '*'); setHintShown(true); setMsg(HINT); }} disabled={hintShown}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all disabled:opacity-40">
                  Hint <span className="font-normal text-text-muted">(classic example)</span>
                </button>
                <button onClick={() => { setText(''); setMsg(''); }}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid transition-all">
                  Clear
                </button>
              </div>
              <button onClick={submit} disabled={text.trim() === ''}
                className={['w-full py-4 rounded-2xl font-display font-black text-lg transition-all',
                  text.trim() !== '' ? 'bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer' : 'bg-surface-off border-2 border-surface-border text-text-muted cursor-not-allowed',
                ].join(' ')}>
                Submit Pangram
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ESUG Interactive Games — Pangram Builder</p>
      </div>
    </div>
  );
}
