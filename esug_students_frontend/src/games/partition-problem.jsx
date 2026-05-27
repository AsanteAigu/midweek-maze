import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Partition set of integers into two equal-sum subsets.
// Player clicks numbers to assign to subset A (rest go to B). Or declare impossible.

const PUZZLES = [
  {
    nums: [3, 1, 4, 1, 5, 2, 2],
    // sum = 18, target = 9
    // solution A: {5,4} or {5,3,1} or many others
    possible: true,
    hint: 'Total = 18, target each half = 9. Try {5, 4} = 9.',
  },
  {
    nums: [8, 3, 5, 2, 6, 4],
    // sum = 28, target = 14
    // solution: {8,6} or {8,3,3}... {8,6}=14 ✓
    possible: true,
    hint: 'Total = 28, target = 14. Try {8, 6} = 14.',
  },
  {
    nums: [7, 3, 2, 9, 4, 1],
    // sum = 26, target = 13
    // {9,4}=13 ✓
    possible: true,
    hint: 'Total = 26, target = 13. Try {9, 4} = 13.',
  },
  {
    nums: [1, 5, 11, 5],
    // sum = 22, target = 11
    // {11} = 11 ✓
    possible: true,
    hint: 'Total = 22, target = 11. One element alone does the job.',
  },
  {
    nums: [1, 2, 3, 5],
    // sum = 11 (odd) — impossible!
    possible: false,
    hint: 'Total = 11 (odd). You cannot split an odd total into two equal halves.',
  },
];

const MAX_TRIES = 3;

export default function PartitionProblem() {
  const [pIdx, setPIdx] = useState(0);
  const [subsetA, setSubsetA] = useState(new Set()); // indices in subsetA
  const [tries, setTries] = useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState('intro');
  const [msg, setMsg] = useState('');

  const p = PUZZLES[pIdx];
  const total = p.nums.reduce((a, b) => a + b, 0);
  const target = total / 2;
  const sumA = [...subsetA].reduce((s, i) => s + p.nums[i], 0);
  const sumB = total - sumA;

  function toggleIdx(i) {
    setSubsetA(s => { const ns = new Set(s); ns.has(i) ? ns.delete(i) : ns.add(i); return ns; });
    setMsg('');
  }

  function submitPartition() {
    if (!p.possible) { failWrong(); return; }
    if (sumA === target) {
      setScore(s => s + 300);
      setMsg(`Correct! A = {${[...subsetA].map(i=>p.nums[i]).join(',')}}, B = {${p.nums.filter((_,i)=>!subsetA.has(i)).join(',')}} — both sum to ${target}.`);
      setTimeout(advance, 1100);
    } else {
      failWrong();
    }
  }

  function submitImpossible() {
    if (!p.possible) {
      setScore(s => s + 200);
      setMsg(`Correct! Total is ${total} (odd) — impossible to partition equally.`);
      setTimeout(advance, 1100);
    } else {
      failWrong();
    }
  }

  function failWrong() {
    const t = tries - 1; setTries(t);
    if (t <= 0) { setPhase('lost'); return; }
    setMsg(p.possible
      ? `Not equal — A sums to ${sumA}, B sums to ${sumB}. Need each to be ${target}. ${t} tries left.`
      : `This partition is actually possible! Look again. ${t} tries left.`
    );
  }

  function advance() {
    if (pIdx >= PUZZLES.length - 1) { setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*'); }
    else { setPIdx(i => i + 1); setSubsetA(new Set()); setMsg(''); setTries(MAX_TRIES); }
  }

  function reset() {
    setPIdx(0); setSubsetA(new Set()); setTries(MAX_TRIES); setScore(0);
    setPhase('playing'); setMsg('');
  }

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Partition Problem</h1>
        <p className="text-center text-text-mid text-sm mb-5">Split the set into two subsets with equal sums, or declare it impossible.</p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Partition Problem</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A set of numbers is shown. Can you split them into two groups with <strong>equal sums</strong>?"}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Click numbers to assign them to Subset A. The rest automatically go to Subset B."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Both subset sums are shown in real time."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "If it's impossible to split equally, click the \"Impossible\" button instead."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "{3, 1, 4, 1, 5}: total=14, target=7. Subsets {3,4}=7 and {1,1,5}=7. ✓"}}/>
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
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">Partitioned!</h2>
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
                  <span className="font-display font-bold text-xs text-text-muted">Set</span>
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

              {/* Number cards */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4">
                <p className="font-display font-bold text-xs text-text-muted uppercase tracking-wider mb-3">
                  Click numbers to add to Subset A. Total = {total}. Target each = {Number.isInteger(target) ? target : '—'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {p.nums.map((n, i) => {
                    const inA = subsetA.has(i);
                    return (
                      <motion.button key={i} onClick={() => toggleIdx(i)} whileTap={{ scale: 0.9 }}
                        className={['w-12 h-12 rounded-2xl border-2 font-display font-black text-lg transition-all cursor-pointer',
                          inA ? 'border-duo-blue bg-[#1CB0F6]/15 text-duo-blue' : 'border-surface-border bg-white text-text-dark hover:border-duo-blue',
                        ].join(' ')}>
                        {n}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Subset display */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Subset A', indices: [...subsetA], color: '#1CB0F6', bg: 'rgba(28,176,246,0.08)' },
                    { label: 'Subset B', indices: p.nums.map((_,i) => i).filter(i => !subsetA.has(i)), color: '#CE82FF', bg: 'rgba(206,130,255,0.08)' },
                  ].map(({ label, indices, color, bg }) => {
                    const s = indices.reduce((t, i) => t + p.nums[i], 0);
                    return (
                      <div key={label} className="rounded-2xl border-2 border-surface-border p-3" style={{ backgroundColor: bg }}>
                        <p className="font-display font-black text-xs mb-1" style={{ color }}>{label}</p>
                        <p className="font-mono text-xs text-text-mid min-h-[20px]">
                          {indices.length > 0 ? `{${indices.map(i => p.nums[i]).join(', ')}}` : '{ }'}
                        </p>
                        <p className="font-display font-black text-base mt-1" style={{ color }}>
                          Sum = {s}
                          {Number.isInteger(target) && s === target && <span className="text-duo-green ml-2">✓</span>}
                        </p>
                      </div>
                    );
                  })}
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
                <button onClick={submitPartition}
                  className="flex-1 py-3 rounded-2xl font-display font-black text-sm bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer transition-all">
                  Equal Partition
                </button>
                <button onClick={submitImpossible}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-duo-red text-duo-red hover:bg-[#FF4B4B]/10 cursor-pointer transition-all">
                  Impossible
                </button>
              </div>
              <button onClick={() => setMsg(p.hint)}
                className="w-full py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all">
                Hint
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ISAG Interactive Games — Partition Problem</p>
      </div>
    </div>
  );
}
