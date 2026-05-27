import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Tangram: show a silhouette. Player picks which of 4 tangram arrangements matches it.
// Each option is an SVG showing tangram pieces arranged differently.
// 3 puzzles.

const SZ = 120; // canvas size for each option

// Helper: a tangram piece as SVG polygon
const P = ({ points, fill, stroke = 'white' }) => (
  <polygon points={points} fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round"/>
);

// Puzzle 1: target = square, options show 4 arrangements
// Correct: 2 large triangles forming a square
const sq1Correct = (
  <svg viewBox="0 0 120 120" width={SZ} height={SZ}>
    <P points="20,20 100,20 20,100" fill="#1CB0F6"/>
    <P points="100,20 100,100 20,100" fill="#CE82FF"/>
  </svg>
);
const sq1Wrong1 = (
  <svg viewBox="0 0 120 120" width={SZ} height={SZ}>
    <P points="20,60 60,20 100,60" fill="#1CB0F6"/>
    <P points="20,60 100,60 60,100" fill="#CE82FF"/>
  </svg>
);
const sq1Wrong2 = (
  <svg viewBox="0 0 120 120" width={SZ} height={SZ}>
    <P points="20,20 100,20 60,60" fill="#58CC02"/>
    <P points="20,100 100,100 60,60" fill="#FF9600"/>
    <rect x="20" y="60" width="80" height="1" fill="none"/>
  </svg>
);
const sq1Wrong3 = (
  <svg viewBox="0 0 120 120" width={SZ} height={SZ}>
    <P points="20,20 100,20 100,100 20,100" fill="none" stroke="#CBD5E1" strokeWidth="2"/>
    <P points="20,20 60,20 20,60" fill="#FF4B4B"/>
    <P points="60,20 100,20 100,60" fill="#1CB0F6"/>
  </svg>
);

// Target silhouette for puzzle 1
const target1 = (
  <svg viewBox="0 0 120 120" width={SZ} height={SZ}>
    <rect x="20" y="20" width="80" height="80" fill="#1A1A2E"/>
  </svg>
);

// Puzzle 2: target = triangle, options
const tri2Correct = (
  <svg viewBox="0 0 120 120" width={SZ} height={SZ}>
    <P points="60,15 15,105 105,105" fill="#FF9600"/>
    <P points="60,15 105,105 60,105" fill="#58CC02"/>
  </svg>
);
const tri2Wrong1 = (
  <svg viewBox="0 0 120 120" width={SZ} height={SZ}>
    <P points="60,15 15,105 105,105" fill="#FF9600"/>
    <P points="15,105 105,105 60,60" fill="#58CC02"/>
  </svg>
);
const tri2Wrong2 = (
  <svg viewBox="0 0 120 120" width={SZ} height={SZ}>
    <P points="60,20 20,100 100,100" fill="#CE82FF"/>
    <rect x="20" y="100" width="80" height="5" fill="#1CB0F6"/>
  </svg>
);
const tri2Wrong3 = (
  <svg viewBox="0 0 120 120" width={SZ} height={SZ}>
    <P points="60,20 100,60 60,100 20,60" fill="#FF9600"/>
  </svg>
);
const target2 = (
  <svg viewBox="0 0 120 120" width={SZ} height={SZ}>
    <P points="60,15 15,105 105,105" fill="#1A1A2E"/>
  </svg>
);

// Puzzle 3: target = parallelogram
const para3Correct = (
  <svg viewBox="0 0 120 120" width={SZ} height={SZ}>
    <P points="30,40 90,40 90,80 30,80" fill="#CE82FF"/>
    <P points="30,40 30,80 10,60" fill="#1CB0F6"/>
    <P points="90,40 90,80 110,60" fill="#58CC02"/>
  </svg>
);
const para3Wrong1 = (
  <svg viewBox="0 0 120 120" width={SZ} height={SZ}>
    <P points="20,30 100,30 80,90 40,90" fill="#CE82FF"/>
    <P points="20,30 40,90 10,60" fill="#1CB0F6"/>
  </svg>
);
const para3Wrong2 = (
  <svg viewBox="0 0 120 120" width={SZ} height={SZ}>
    <P points="20,50 100,50 100,70 20,70" fill="#FF9600"/>
    <P points="20,50 20,70 5,60" fill="#1CB0F6"/>
    <P points="100,50 115,40 100,70" fill="#CE82FF"/>
  </svg>
);
const para3Wrong3 = (
  <svg viewBox="0 0 120 120" width={SZ} height={SZ}>
    <P points="30,30 90,30 110,90 10,90" fill="#FF4B4B"/>
  </svg>
);
const target3 = (
  <svg viewBox="0 0 120 120" width={SZ} height={SZ}>
    <P points="30,40 90,40 90,80 30,80" fill="#1A1A2E"/>
    <P points="30,40 30,80 10,60" fill="#1A1A2E"/>
    <P points="90,40 90,80 110,60" fill="#1A1A2E"/>
  </svg>
);

const PUZZLES = [
  {
    targetShape: 'Square',
    target: target1,
    options: [sq1Correct, sq1Wrong1, sq1Wrong2, sq1Wrong3],
    correct: 0,
    explanation: 'Two large right triangles placed hypotenuse-to-hypotenuse form a square.',
  },
  {
    targetShape: 'Large Triangle',
    target: target2,
    options: [tri2Wrong2, tri2Correct, tri2Wrong1, tri2Wrong3],
    correct: 1,
    explanation: 'Two congruent triangles share a common edge to form the larger triangle.',
  },
  {
    targetShape: 'Hexagon',
    target: target3,
    options: [para3Wrong3, para3Wrong1, para3Correct, para3Wrong2],
    correct: 2,
    explanation: 'A rectangle flanked by two right triangles creates the hexagonal shape.',
  },
];

const MAX_TRIES = 3;

export default function TangramSolver() {
  const [pIdx, setPIdx] = useState(0);
  const [sel, setSel] = useState(null);
  const [tries, setTries] = useState(MAX_TRIES);
  const [setScore] = useState(0);
  const [phase, setPhase] = useState('intro');
  const [fb, setFb] = useState(null);
  const [msg, setMsg] = useState('');

  const p = PUZZLES[pIdx];

  function submit() {
    if (sel === null) { setMsg('Select an arrangement first.'); return; }
    if (sel === p.correct) {
      setFb('correct');
      setScore(s => s + 200);
      setMsg('Correct arrangement!');
      setTimeout(() => {
        if (pIdx >= PUZZLES.length - 1) { setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*'); }
        else { setPIdx(i => i+1); setSel(null); setFb(null); setMsg(''); }
      }, 900);
    } else {
      setFb('wrong');
      const t = tries - 1; setTries(t);
      if (t <= 0) setPhase('lost');
      else setMsg(`Wrong — the pieces don't match that silhouette. ${t} tries left.`);
    }
  }

  function reset() {
    setPIdx(0); setSel(null); setTries(MAX_TRIES); setScore(0);
    setPhase('playing'); setFb(null); setMsg('');
  }

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Tangram Solver</h1>
        <p className="text-center text-text-mid text-sm mb-5">Pick the tangram arrangement that exactly fills the black silhouette.</p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Tangram Solver</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A black silhouette is shown — this is the target shape to fill."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Four arrangements of tangram pieces are shown as options (A–D)."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Pick the arrangement that perfectly fills the silhouette with no gaps and no overlaps."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Two right triangles placed hypotenuse-to-hypotenuse make a square."}}/>
              </div>
              <button onClick={() => setPhase('playing')} className="btn-primary w-full py-3 text-base">Got it — Start Playing</button>
            </motion.div>
          )}

          {phase === 'won' && (
            <motion.div key="won" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-green rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_6px_24px_rgba(88,204,2,0.35)]">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">Tangram Master!</h2>
              <button onClick={reset} className="btn-primary w-full py-3 text-base">Play Again</button>
            </motion.div>
          )}
          {phase === 'lost' && (
            <motion.div key="lost" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-red/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border-2 border-duo-red/25">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" strokeWidth="3"><path d="M6 18 18 6M6 6l12 12" strokeLinecap="round"/></svg>
              </div>
              <h2 className="font-display font-black text-2xl text-text-dark mb-2">No More Tries</h2>
              <p className="text-text-mid text-sm mb-4">{p.explanation}</p>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}
          {phase === 'playing' && (
            <motion.div key={`p${pIdx}`} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xs text-text-muted">Shape</span>
                  <span className="font-mono font-bold text-xl text-text-dark">{pIdx+1}<span className="text-text-muted text-sm font-normal">/{PUZZLES.length}</span></span>
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

              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4 flex flex-col items-center">
                <p className="font-display font-bold text-sm text-text-dark mb-3">Target: {p.targetShape}</p>
                <div className="p-3 rounded-2xl bg-surface-off border-2 border-surface-border">
                  {p.target}
                </div>
              </div>

              <p className="font-display font-black text-xs text-text-muted uppercase tracking-wider mb-2 px-1">Which arrangement fills the silhouette?</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {p.options.map((opt, i) => {
                  const isSel = sel === i;
                  const isOk = fb === 'correct' && isSel;
                  const isBad = fb === 'wrong' && isSel;
                  return (
                    <motion.button key={i} onClick={() => { setSel(i); setMsg(''); }} whileTap={{scale:0.97}}
                      className={['flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all cursor-pointer',
                        isOk ? 'border-duo-green bg-[#58CC02]/10'
                        : isBad ? 'border-duo-red bg-[#FF4B4B]/10'
                        : isSel ? 'border-duo-blue bg-[#1CB0F6]/10'
                        : 'border-surface-border bg-white hover:border-duo-blue',
                      ].join(' ')}>
                      <span className="font-display font-black text-xs text-text-muted">{['A','B','C','D'][i]}</span>
                      {opt}
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>
                {msg && (
                  <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                    className="bg-surface-card rounded-2xl border border-surface-border px-4 py-2.5 mb-4 text-center font-body text-sm text-text-mid">
                    {msg}
                  </motion.div>
                )}
              </AnimatePresence>

              <button onClick={submit} disabled={sel === null}
                className={['w-full py-4 rounded-2xl font-display font-black text-lg transition-all',
                  sel !== null ? 'bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer' : 'bg-surface-off border-2 border-surface-border text-text-muted cursor-not-allowed',
                ].join(' ')}>
                Submit Answer
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ISAG Interactive Games — Tangram Solver</p>
      </div>
    </div>
  );
}
