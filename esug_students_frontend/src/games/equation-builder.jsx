import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Puzzles ────────────────────────────────────────────────────────────────────
// Each puzzle: 3 equations, a pool of 6 numbers (each used exactly once).
// Twist: one equation uses multiplication, increasing difficulty; pool order is shuffled.
// slots layout: [eq0_left, eq0_right, eq1_left, eq1_right, eq2_left, eq2_right]
const PUZZLES = [
  {
    equations: [
      { op: '+', result: 10 },
      { op: '×', result:  6 },
      { op: '−', result:  2 },
    ],
    solution: [8, 2, 1, 6, 7, 5],   // [8+2=10, 1×6=6, 7−5=2]
    pool: [1, 2, 5, 6, 7, 8],
  },
  {
    equations: [
      { op: '+', result: 13 },
      { op: '×', result: 12 },
      { op: '−', result:  5 },
    ],
    solution: [5, 8, 3, 4, 7, 2],   // [5+8=13, 3×4=12, 7−2=5]
    pool: [2, 3, 4, 5, 7, 8],
  },
  {
    equations: [
      { op: '+', result: 15 },
      { op: '×', result: 18 },
      { op: '−', result:  4 },
    ],
    solution: [7, 8, 3, 6, 5, 1],   // [7+8=15, 3×6=18, 5−1=4]
    pool: [1, 3, 5, 6, 7, 8],
  },
];

const MAX_TRIES = 2;

function evaluate(a, op, b) {
  if (op === '+') return a + b;
  if (op === '×') return a * b;
  if (op === '−') return a - b;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Slot component ─────────────────────────────────────────────────────────────
function Slot({ value, status, isSelected, onClick }) {
  const border = status === 'correct' ? '#58CC02'
               : status === 'wrong'   ? '#FF4B4B'
               : isSelected           ? '#1CB0F6'
               : '#E5E5E5';
  const bg     = status === 'correct' ? '#E8FFD4'
               : status === 'wrong'   ? '#FFECEC'
               : isSelected           ? '#DFF4FF'
               : value !== null       ? '#F7F7F7'
               : '#FFFFFF';
  return (
    <motion.button whileTap={{ scale: 0.92 }} onClick={onClick}
      className="w-12 h-12 rounded-2xl border-2 font-mono font-black text-xl
        flex items-center justify-center transition-all select-none"
      style={{ borderColor: border, backgroundColor: bg, color: '#3C3C3C' }}>
      {value ?? <span className="text-text-muted text-base">?</span>}
    </motion.button>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function EquationBuilder() {
  const [pIdx,     setPIdx]     = useState(0);
  const [slots,    setSlots]    = useState(Array(6).fill(null));
  const [pickedTile, setPicked] = useState(null);   // index into shuffledPool
  const [triesLeft, setTries]   = useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [phase,    setPhase]    = useState('intro');
  const [status,   setStatus]   = useState(Array(6).fill(null)); // correct|wrong|null
  const [msg,      setMsg]      = useState('');
  const [hints,    setHints]    = useState(0);
  const [shuffledPool] = useState(() => shuffle(PUZZLES[0].pool));

  const puzzle = PUZZLES[pIdx];

  // Compute which pool tiles are already placed (by matching value in slots)
  const usedPoolIndices = [];
  slots.forEach(v => {
    if (v !== null) {
      const i = shuffledPool.findIndex((p, bi) => p === v && !usedPoolIndices.includes(bi));
      if (i !== -1) usedPoolIndices.push(i);
    }
  });

  function clickSlot(si) {
    if (pickedTile !== null) {
      // Place the picked tile
      const val = shuffledPool[pickedTile];
      const newSlots = [...slots];
      // If slot already has a value, return it to pool (just clear it)
      newSlots[si] = val;
      setSlots(newSlots);
      setPicked(null);
      setStatus(Array(6).fill(null));
      setMsg('');
    } else if (slots[si] !== null) {
      // Remove from slot (click placed value to remove)
      const newSlots = [...slots];
      newSlots[si] = null;
      setSlots(newSlots);
      setStatus(Array(6).fill(null));
    }
  }

  function clickTile(ti) {
    if (usedPoolIndices.includes(ti)) return;
    setPicked(prev => prev === ti ? null : ti);
  }

  function check() {
    if (slots.some(v => v === null)) { setMsg('Fill all slots first'); return; }

    const st = [];
    let allOk = true;
    puzzle.equations.forEach((eq, i) => {
      const a = slots[i * 2], b = slots[i * 2 + 1];
      const ok = evaluate(a, eq.op, b) === eq.result;
      st.push(ok ? 'correct' : 'wrong', ok ? 'correct' : 'wrong');
      if (!ok) allOk = false;
    });
    setStatus(st);

    if (allOk) {
      const xp = Math.max(200 - hints * 30, 50);
      setScore(s => s + xp);
      setMsg(`All balanced!`);
      setHints(0);
      setTimeout(() => {
        if (pIdx >= PUZZLES.length - 1) { setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*'); }
        else { setPIdx(i => i+1); setSlots(Array(6).fill(null)); setStatus(Array(6).fill(null)); setMsg(''); }
      }, 900);
    } else {
      const t = triesLeft - 1;
      setTries(t);
      if (t <= 0) setPhase('lost');
      else setMsg(`Some equations don't balance — ${t} ${t===1?'try':'tries'} left`);
    }
  }

  function giveHint() {
    // Reveal one correct placement
    const emptySlot = slots.findIndex(v => v === null);
    if (emptySlot === -1) return;
    const newSlots = [...slots];
    newSlots[emptySlot] = puzzle.solution[emptySlot];
    setSlots(newSlots);
    setHints(h => h+1);
    setStatus(Array(6).fill(null));
    setMsg(`Hint: slot ${emptySlot+1} revealed`);
  }

  function reset() {
    setPIdx(0); setSlots(Array(6).fill(null)); setPicked(null);
    setTries(MAX_TRIES); setScore(0); setPhase('playing');
    setStatus(Array(6).fill(null)); setMsg(''); setHints(0);
  }

  const eqResult = (i) => {
    const a = slots[i*2], b = slots[i*2+1];
    if (a === null || b === null) return null;
    return evaluate(a, puzzle.equations[i].op, b);
  };

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-md">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Equation Builder</h1>
        <p className="text-center text-text-mid text-sm mb-5">
          Place all six numbers so every equation balances simultaneously. Each number used exactly once.
        </p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Equation Builder</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Three equations are shown with blank slots."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A bank of numbers is provided. Click a number, then click a blank to place it."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "All three equations must be correct simultaneously."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Each number from the bank is used exactly once across all blanks."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "_ + _ = 10 and _ × _ = 6 and _ − _ = 3. Numbers 1,2,3,4,5,7 → place (3,7) / (2,3) / (4,1)."}}/>
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
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">All Balanced!</h2>
              <button onClick={reset} className="btn-primary w-full py-3 text-base">Play Again</button>
            </motion.div>
          )}

          {phase === 'lost' && (
            <motion.div key="lost" initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-red/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border-2 border-duo-red/25">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" strokeWidth="3">
                  <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className="font-display font-black text-2xl text-text-dark mb-3">No More Tries</h2>
              <div className="bg-duo-blue/5 rounded-2xl border border-duo-blue/15 p-4 mb-5 text-left">
                {puzzle.equations.map((eq, i) => (
                  <p key={i} className="font-mono text-sm text-text-mid">
                    {puzzle.solution[i*2]} {eq.op} {puzzle.solution[i*2+1]} = {eq.result}
                  </p>
                ))}
              </div>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div key={`p${pIdx}`} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
              {/* HUD */}
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <span className="font-display font-bold text-xs text-text-muted">Puzzle {pIdx+1}/{PUZZLES.length}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-duo-yellow/15 rounded-xl px-3 py-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                    <span className="font-mono font-bold text-sm text-duo-yellow-dark">{score} XP</span>
                  </div>
                  <div className="flex gap-1.5">
                    {Array.from({length:MAX_TRIES}).map((_,i)=>(
                      <div key={i} className="w-3 h-3 rounded-full" style={{background:i<triesLeft?'#1CB0F6':'#E5E5E5'}}/>
                    ))}
                  </div>
                </div>
              </div>

              {/* Equations */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6 mb-4">
                <div className="space-y-4">
                  {puzzle.equations.map((eq, i) => {
                    const res = eqResult(i);
                    const ok  = res === eq.result;
                    return (
                      <div key={i} className="flex items-center justify-center gap-3">
                        <Slot value={slots[i*2]}   status={status[i*2]}   isSelected={false} onClick={()=>clickSlot(i*2)}   />
                        <span className="font-display font-black text-2xl text-text-muted w-6 text-center">{eq.op}</span>
                        <Slot value={slots[i*2+1]} status={status[i*2+1]} isSelected={false} onClick={()=>clickSlot(i*2+1)} />
                        <span className="font-display font-black text-xl text-text-muted">=</span>
                        <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center font-mono font-black text-xl
                          ${res === null ? 'border-surface-border bg-surface-off text-text-muted'
                            : ok ? 'border-duo-green bg-duo-green/10 text-duo-green-dark'
                            : 'border-duo-red/40 bg-duo-red/5 text-duo-red'}`}>
                          {eq.result}
                        </div>
                        {res !== null && (
                          <span className={`font-display font-bold text-sm ${ok?'text-duo-green-dark':'text-duo-red'}`}>
                            {ok ? '✓' : `(${res})`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Number pool */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-4 mb-4">
                <p className="font-display font-bold text-xs text-text-muted uppercase tracking-wider mb-3">
                  Number pool — click to select, then click a slot
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {shuffledPool.map((n, ti) => {
                    const used = usedPoolIndices.includes(ti);
                    const sel  = pickedTile === ti;
                    return (
                      <motion.button key={ti} onClick={()=>clickTile(ti)} disabled={used}
                        whileTap={!used?{scale:0.9}:{}}
                        className={[
                          'w-12 h-12 rounded-2xl border-2 font-mono font-black text-xl transition-all',
                          used ? 'opacity-25 cursor-not-allowed bg-surface-off border-surface-border text-text-muted'
                          : sel ? 'bg-duo-blue border-duo-blue text-white shadow-blue cursor-pointer'
                          : 'bg-white border-surface-border text-text-dark hover:border-duo-blue cursor-pointer',
                        ].join(' ')}>
                        {n}
                      </motion.button>
                    );
                  })}
                </div>
                {pickedTile !== null && (
                  <p className="font-display font-bold text-xs text-duo-blue mt-2 text-center">
                    {shuffledPool[pickedTile]} selected — click any slot to place it
                  </p>
                )}
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
                <button onClick={giveHint}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all">
                  Hint <span className="font-normal text-text-muted"></span>
                </button>
                <button onClick={()=>{setSlots(Array(6).fill(null));setPicked(null);setStatus(Array(6).fill(null));setMsg('');}}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-surface-border-strong transition-all">
                  Clear
                </button>
              </div>
              <button onClick={check}
                className="w-full py-4 rounded-2xl font-display font-black text-lg bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark transition-all cursor-pointer">
                Check All Equations
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ESUG Interactive Games — Equation Builder</p>
      </div>
    </div>
  );
}
