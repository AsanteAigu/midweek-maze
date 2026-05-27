import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Show a sequence. Player fills in the last 3 missing terms.
// Rule shown after a wrong answer as hint.
const SEQUENCES = [
  {
    rule: 'a(n) = a(n−1) + 3',
    shown: [2, 5, 8, 11, 14],
    answers: [17, 20, 23],
    display: '2, 5, 8, 11, 14, ?, ?, ?',
    hint: 'Each term increases by 3.',
  },
  {
    rule: 'a(n) = 2 × a(n−1)',
    shown: [1, 2, 4, 8, 16],
    answers: [32, 64, 128],
    display: '1, 2, 4, 8, 16, ?, ?, ?',
    hint: 'Each term is double the previous one.',
  },
  {
    rule: 'a(n) = a(n−1) + a(n−2)',
    shown: [1, 3, 4, 7, 11],
    answers: [18, 29, 47],
    display: '1, 3, 4, 7, 11, ?, ?, ?',
    hint: 'Each term is the sum of the previous two (Fibonacci-style).',
  },
  {
    rule: 'a(n) = 3 × a(n−1) − a(n−2)',
    shown: [1, 3, 8, 21],
    answers: [55, 144, 377],
    display: '1, 3, 8, 21, ?, ?, ?',
    hint: 'a(n) = 3 × a(n−1) − a(n−2). Try: 3×21 − 8 = 55.',
  },
  {
    rule: 'a(n) = n × a(n−1) — factorial',
    shown: [1, 1, 2, 6, 24],
    answers: [120, 720, 5040],
    display: '1, 1, 2, 6, 24, ?, ?, ?',
    hint: 'This is n! (factorial): 5×24=120, 6×120=720, 7×720=5040.',
  },
];

const MAX_TRIES = 3;

export default function RecursiveSequence() {
  const [sIdx, setSIdx] = useState(0);
  const [inputs, setInputs] = useState(['', '', '']);
  const [tries, setTries] = useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState('intro');
  const [fb, setFb] = useState(null); // null | [bool,bool,bool]
  const [msg, setMsg] = useState('');

  const s = SEQUENCES[sIdx];

  function setInput(i, val) {
    setInputs(inp => inp.map((v, k) => k === i ? val : v));
    setFb(null); setMsg('');
  }

  function submit() {
    if (inputs.some(v => v === '')) { setMsg('Fill all 3 blanks.'); return; }
    const results = inputs.map((v, i) => parseInt(v, 10) === s.answers[i]);
    setFb(results);
    if (results.every(Boolean)) {
      setScore(sc => sc + 200);
      setMsg('Correct sequence!');
      setTimeout(() => {
        if (sIdx >= SEQUENCES.length - 1) { setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*'); }
        else { setSIdx(i => i + 1); setInputs(['','','']); setFb(null); setMsg(''); setTries(MAX_TRIES); }
      }, 900);
    } else {
      const t = tries - 1; setTries(t);
      const wrong = results.filter(r => !r).length;
      if (t <= 0) setPhase('lost');
      else setMsg(`${wrong} term${wrong > 1 ? 's' : ''} incorrect. ${t} tries left.`);
    }
  }

  function reset() {
    setSIdx(0); setInputs(['','','']); setTries(MAX_TRIES); setScore(0);
    setPhase('playing'); setFb(null); setMsg('');
  }

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Recursive Sequence</h1>
        <p className="text-center text-text-mid text-sm mb-5">Study the pattern and predict the next three terms.</p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Recursive Sequence</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A number sequence is shown with some terms missing at the end."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Find the hidden rule and fill in the blanks."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Common patterns: each term = sum of previous two, doubling, factorial, or a fixed increase."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "2, 5, 8, 11, ?, ?, ? → each increases by 3 → answers: 14, 17, 20."}}/>
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
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">Pattern Master!</h2>
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
              <p className="text-text-mid text-sm mb-2">Rule: <span className="font-mono font-bold text-text-dark">{s.rule}</span></p>
              <p className="text-text-mid text-sm mb-4">Answers: {s.answers.join(', ')}</p>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}
          {phase === 'playing' && (
            <motion.div key={`s${sIdx}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xs text-text-muted">Sequence</span>
                  <span className="font-mono font-bold text-xl text-text-dark">{sIdx+1}<span className="text-text-muted text-sm font-normal">/{SEQUENCES.length}</span></span>
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
                <p className="font-display font-bold text-xs text-text-muted uppercase tracking-wider mb-4">Complete the sequence</p>
                <div className="flex flex-wrap items-center gap-2 justify-center mb-5">
                  {s.shown.map((n, i) => (
                    <div key={i} className="px-3 py-2 bg-surface-off rounded-xl border-2 border-surface-border font-mono font-bold text-base text-text-dark min-w-[44px] text-center">
                      {n}
                    </div>
                  ))}
                  <span className="font-mono text-text-muted font-bold text-lg">→</span>
                  {inputs.map((v, i) => {
                    const correct = fb?.[i] === true;
                    const wrong = fb?.[i] === false;
                    return (
                      <input key={i} type="number" value={v}
                        onChange={e => setInput(i, e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && submit()}
                        className={['w-20 h-11 rounded-xl border-2 text-center font-display font-black text-base outline-none transition-all',
                          correct ? 'border-duo-green bg-[#58CC02]/10 text-[#3A8F00]'
                          : wrong ? 'border-duo-red bg-[#FF4B4B]/10 text-duo-red'
                          : 'border-surface-border bg-white text-text-dark focus:border-duo-blue',
                        ].join(' ')}
                        placeholder="?"
                      />
                    );
                  })}
                </div>
                <div className="bg-surface-off rounded-xl px-4 py-3 border border-surface-border">
                  <p className="font-mono text-xs text-text-muted">{s.display}</p>
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

              <div className="flex gap-3 mb-3">
                <button onClick={() => setMsg(`Hint: ${s.hint}`)}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all">
                  Hint
                </button>
                <button onClick={() => { setInputs(['','','']); setFb(null); setMsg(''); }}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid transition-all">
                  Clear
                </button>
              </div>
              <button onClick={submit} disabled={inputs.some(v => v === '')}
                className={['w-full py-4 rounded-2xl font-display font-black text-lg transition-all',
                  !inputs.some(v => v === '') ? 'bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer' : 'bg-surface-off border-2 border-surface-border text-text-muted cursor-not-allowed',
                ].join(' ')}>
                Submit Answers
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ISAG Interactive Games — Recursive Sequence</p>
      </div>
    </div>
  );
}
