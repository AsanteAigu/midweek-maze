import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 5×5 grid. Number cells (non-clickable) show how many adjacent (UDLR) stars they require.
// Player clicks empty cells to toggle stars. Win when all constraints satisfied.
// Verified solutions listed in comments.

const PUZZLES = [
  {
    // Solution stars: (0,1),(0,3),(4,1),(4,3)
    nums: [{ r:1,c:1,req:1 },{ r:1,c:3,req:1 },{ r:3,c:1,req:1 },{ r:3,c:3,req:1 }],
    hint: 'Each number only needs 1 star nearby.',
  },
  {
    // Solution: (0,1),(1,0),(0,3),(1,4),(3,0),(4,1),(3,4),(4,3)
    nums: [{ r:0,c:0,req:2 },{ r:0,c:4,req:2 },{ r:4,c:0,req:2 },{ r:4,c:4,req:2 }],
    hint: 'Each corner needs exactly 2 stars beside it.',
  },
  {
    // Solution: (0,2),(1,1),(1,3),(3,1),(3,3),(4,2)
    nums: [{ r:1,c:2,req:3 },{ r:3,c:2,req:3 }],
    hint: 'Both number cells need 3 adjacent stars each.',
  },
];

const N = 5;
const MAX_TRIES = 3;

function adjCount(stars, r, c) {
  return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]]
    .filter(([ar,ac]) => ar>=0 && ar<N && ac>=0 && ac<N && stars.has(`${ar},${ac}`))
    .length;
}

function isNum(nums, r, c) {
  return nums.some(n => n.r===r && n.c===c);
}

const StarIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="#FF9600">
    <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>
  </svg>
);

export default function StarPlacement() {
  const [pIdx, setPIdx] = useState(0);
  const [stars, setStars] = useState(new Set());
  const [tries, setTries] = useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState('intro');
  const [msg, setMsg] = useState('');
  const [errors, setErrors] = useState(new Set()); // num cells that are wrong

  const p = PUZZLES[pIdx];

  function toggle(r, c) {
    if (isNum(p.nums, r, c)) return;
    setStars(s => { const ns = new Set(s); ns.has(`${r},${c}`) ? ns.delete(`${r},${c}`) : ns.add(`${r},${c}`); return ns; });
    setErrors(new Set());
    setMsg('');
  }

  function submit() {
    const errs = new Set();
    p.nums.forEach(({ r, c, req }) => {
      if (adjCount(stars, r, c) !== req) errs.add(`${r},${c}`);
    });
    setErrors(errs);
    if (errs.size === 0) {
      setScore(s => s + 150);
      setMsg('All stars correctly placed!');
      setTimeout(() => {
        if (pIdx >= PUZZLES.length - 1) setPhase('won');
        else { setPIdx(i => i + 1); setStars(new Set()); setErrors(new Set()); setMsg(''); }
      }, 900);
    } else {
      const t = tries - 1; setTries(t);
      if (t <= 0) setPhase('lost');
      else setMsg(`${errs.size} constraint${errs.size > 1 ? 's' : ''} not satisfied — highlighted red. ${t} tries left.`);
    }
  }

  function reset() {
    setPIdx(0); setStars(new Set()); setTries(MAX_TRIES); setScore(0);
    setPhase('playing'); setMsg(''); setErrors(new Set());
  }

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Star Placement</h1>
        <p className="text-center text-text-mid text-sm mb-5">Each numbered cell shows how many stars must touch it (up, down, left, right). Click empty cells to place or remove stars.</p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Star Placement</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A 5×5 grid contains numbered cells (blue) and empty cells (white)."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Each number tells you how many stars must be directly adjacent (up/down/left/right) to it."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Click empty white cells to toggle a star on or off."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "All number constraints must be satisfied simultaneously to win."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A cell showing \"2\" must have exactly two stars touching it — not 1, not 3."}}/>
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
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">Constellation Complete!</h2>
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
              <p className="text-text-mid text-sm mb-4">{p.hint}</p>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}
          {phase === 'playing' && (
            <motion.div key={`p${pIdx}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xs text-text-muted">Puzzle</span>
                  <span className="font-mono font-bold text-xl text-text-dark">{pIdx+1}<span className="text-text-muted text-sm font-normal">/{PUZZLES.length}</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-duo-yellow/15 rounded-xl px-3 py-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                    <span className="font-mono font-bold text-sm text-duo-yellow-dark">{score} XP</span>
                  </div>
                  <div className="flex gap-1.5">{Array.from({length:MAX_TRIES}).map((_,i)=>(
                    <div key={i} className="w-3 h-3 rounded-full" style={{background: i<tries?'#1CB0F6':'#E5E5E5'}}/>
                  ))}</div>
                </div>
              </div>

              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4 flex justify-center">
                <div className="grid gap-1.5" style={{gridTemplateColumns:`repeat(${N},56px)`}}>
                  {Array.from({length:N}).map((_,r) =>
                    Array.from({length:N}).map((_,c) => {
                      const numCell = p.nums.find(n => n.r===r && n.c===c);
                      const hasStar = stars.has(`${r},${c}`);
                      const isErr = errors.has(`${r},${c}`);
                      if (numCell) {
                        const cnt = adjCount(stars, r, c);
                        return (
                          <div key={`${r},${c}`}
                            className={['w-14 h-14 rounded-xl flex flex-col items-center justify-center border-2',
                              isErr ? 'border-duo-red bg-[#FF4B4B]/15' : 'border-duo-blue bg-[#1CB0F6]/10',
                            ].join(' ')}>
                            <span className={['font-display font-black text-lg', isErr ? 'text-duo-red' : 'text-duo-blue'].join(' ')}>
                              {numCell.req}
                            </span>
                            <span className="font-mono text-[9px] text-text-muted">{cnt}/{numCell.req}</span>
                          </div>
                        );
                      }
                      return (
                        <motion.button key={`${r},${c}`} onClick={()=>toggle(r,c)} whileTap={{scale:0.9}}
                          className={['w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer',
                            hasStar ? 'border-duo-orange bg-[#FF9600]/15' : 'border-surface-border bg-white hover:border-duo-blue',
                          ].join(' ')}>
                          {hasStar && <StarIcon/>}
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </div>

              <AnimatePresence>
                {msg && (
                  <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                    className="bg-surface-card rounded-2xl border border-surface-border px-4 py-2.5 mb-4 text-center font-body text-sm text-text-mid">
                    {msg}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 mb-3">
                <button onClick={()=>{ setMsg(`Hint: ${p.hint}`); }}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all">
                  Hint
                </button>
                <button onClick={()=>{ setStars(new Set()); setErrors(new Set()); setMsg(''); }}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid transition-all">
                  Clear
                </button>
              </div>
              <button onClick={submit}
                className="w-full py-4 rounded-2xl font-display font-black text-lg bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer transition-all">
                Check Placement
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ISAG Interactive Games — Star Placement</p>
      </div>
    </div>
  );
}
