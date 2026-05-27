import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Puzzle definitions ─────────────────────────────────────────────────────────
// 9 value slots arranged in a 3×3 grid.
// s[0] rowOp[0] s[1] = s[2]   ← row 0
//   colOp[0]   colOp[1]  colOp[2]
// s[3] rowOp[1] s[4] = s[5]   ← row 1
//      =           =       =
// s[6] rowOp[2] s[7] = s[8]   ← row 2  (row 2 values ARE also column results)
//
// All 6 equations verified before defining each puzzle.
// All operators are × (multiply). All divisions are exact integers. Numbers up to 100.

const PUZZLES = [
  {
    // Row 0:  8 × 6  =  48 ✓
    // Row 1:  3 × 4  =  12 ✓
    // Row 2: 24 × 24 = 576 ✓ (wait: 24×24=576 ✓)
    // Col 0:  8 × 3  =  24 ✓
    // Col 1:  6 × 4  =  24 ✓
    // Col 2: 48 × 12 = 576 ✓
    solution: [8, 6, 48,  3, 4, 12,  24, 24, 576],
    rowOps: ['×', '×', '×'],
    colOps: ['×', '×', '×'],
    clues: [2, 5],   // pre-filled: s[2]=48, s[5]=12
    bank: [8, 6, 3, 4, 24, 24],
  },
  {
    // Row 0:  6 × 9  =  54 ✓
    // Row 1:  4 × 3  =  12 ✓
    // Row 2: 24 × 27 = 648 ✓
    // Col 0:  6 × 4  =  24 ✓
    // Col 1:  9 × 3  =  27 ✓
    // Col 2: 54 × 12 = 648 ✓
    solution: [6, 9, 54,  4, 3, 12,  24, 27, 648],
    rowOps: ['×', '×', '×'],
    colOps: ['×', '×', '×'],
    clues: [2, 5],   // pre-filled: s[2]=54, s[5]=12
    bank: [6, 9, 4, 3, 24, 27],
  },
  {
    // Row 0: 12 × 5  =  60 ✓
    // Row 1:  4 × 3  =  12 ✓
    // Row 2: 48 × 15 = 720 ✓
    // Col 0: 12 × 4  =  48 ✓
    // Col 1:  5 × 3  =  15 ✓
    // Col 2: 60 × 12 = 720 ✓
    solution: [12, 5, 60,  4, 3, 12,  48, 15, 720],
    rowOps: ['×', '×', '×'],
    colOps: ['×', '×', '×'],
    clues: [2, 5],   // pre-filled: s[2]=60, s[5]=12
    bank: [12, 5, 4, 3, 48, 15],
  },
];

const MAX_TRIES = 3;
const MAX_HINTS = 1;

function evaluate(a, op, b) {
  if (op === '×') return a * b;
  if (op === '÷') return b !== 0 ? a / b : null;
  return null;
}

function rowOk(s, puzzle, r) {
  const [i0, i1, i2] = [r * 3, r * 3 + 1, r * 3 + 2];
  if (s[i0] === null || s[i1] === null || s[i2] === null) return null;
  return evaluate(s[i0], puzzle.rowOps[r], s[i1]) === s[i2];
}

function colOk(s, puzzle, c) {
  const [i0, i1, i2] = [c, c + 3, c + 6];
  if (s[i0] === null || s[i1] === null || s[i2] === null) return null;
  return evaluate(s[i0], puzzle.colOps[c], s[i1]) === s[i2];
}

// ── Value cell ─────────────────────────────────────────────────────────────────
function ValCell({ value, isClue, isSelected, rowResult, colResult, onClick }) {
  // Only show correct/wrong colors after Check is pressed (non-null rowResult/colResult)
  const correct = rowResult === true && colResult === true;
  const wrong   = (rowResult === false || colResult === false) && !isClue;

  const border = isSelected ? '#1CB0F6'
               : correct    ? '#58CC02'
               : wrong      ? '#FF4B4B'
               : '#D1D5DB';
  const bg     = isSelected ? '#DFF4FF'
               : correct    ? '#E8FFD4'
               : wrong      ? '#FFECEC'
               : isClue     ? '#F9FAFB'
               : '#FFFFFF';
  const col    = isClue     ? '#6B7280'
               : isSelected ? '#0F8FC0'
               : correct    ? '#3D8F01'
               : wrong      ? '#CC2222'
               : '#1A1A2E';

  return (
    <motion.button onClick={onClick} whileTap={!isClue ? { scale: 0.92 } : {}}
      disabled={isClue}
      className="w-12 h-12 rounded-xl border-2 flex items-center justify-center font-mono font-black text-base transition-all select-none"
      style={{ borderColor: border, backgroundColor: bg, color: col, minWidth: 48 }}>
      {value !== null ? value : <span style={{ color: '#AFAFAF', fontSize: 18 }}>?</span>}
    </motion.button>
  );
}

const OpCell = ({ op }) => (
  <div className="w-7 flex items-center justify-center">
    <span className="font-display font-black text-xl text-text-muted">{op}</span>
  </div>
);

const EqLabel = ({ green }) => (
  <div className="w-7 flex items-center justify-center">
    <span className={`font-display font-black text-xl ${green ? 'text-duo-green-dark' : 'text-text-muted'}`}>=</span>
  </div>
);

const Gap = () => <div className="w-7" />;

// ── App ────────────────────────────────────────────────────────────────────────
export default function MathCross() {
  const [pIdx,     setPIdx]    = useState(0);
  const [grid,     setGrid]    = useState(() => initGrid(0));
  const [selBank,  setSelBank] = useState(null);
  const [tries,    setTries]   = useState(MAX_TRIES);
  const [setScore]   = useState(0);
  const [phase,    setPhase]   = useState('intro');
  const [msg,      setMsg]     = useState('');
  const [hints,    setHints]   = useState(0);
  const [checked,  setChecked] = useState(false);

  function initGrid(idx) {
    const p = PUZZLES[idx];
    return Array.from({ length: 9 }, (_, i) => p.clues.includes(i) ? p.solution[i] : null);
  }

  const puzzle = PUZZLES[pIdx];

  // Per-cell feedback ONLY after Check is pressed
  const rStatus = checked ? [0, 1, 2].map(r => rowOk(grid, puzzle, r)) : [null, null, null];
  const cStatus = checked ? [0, 1, 2].map(c => colOk(grid, puzzle, c)) : [null, null, null];

  function cellRowResult(slot) { return rStatus[Math.floor(slot / 3)]; }
  function cellColResult(slot) { return cStatus[slot % 3]; }

  function clickCell(si) {
    if (puzzle.clues.includes(si)) return;
    if (selBank === null) { setMsg('Pick a number from the bank first.'); return; }
    const newGrid = [...grid];
    if (newGrid[si] !== null) {
      newGrid[si] = null;
      setGrid(newGrid); setChecked(false); setMsg(''); return;
    }
    newGrid[si] = puzzle.bank[selBank];
    setGrid(newGrid);
    setSelBank(null);
    setChecked(false);
    setMsg('');
  }

  function clickFilled(si) {
    if (puzzle.clues.includes(si)) return;
    const newGrid = [...grid];
    newGrid[si] = null;
    setGrid(newGrid);
    setChecked(false);
    setMsg('');
  }

  function submit() {
    if (grid.some(v => v === null)) { setMsg('Fill all empty cells first.'); return; }
    setChecked(true);
    const allOk = [0, 1, 2].every(r => rowOk(grid, puzzle, r)) &&
                  [0, 1, 2].every(c => colOk(grid, puzzle, c));
    if (allOk) {
      const xp = Math.max(150 - hints * 50, 30);
      setScore(s => s + xp);
      setMsg(`All equations balance!`);
      setHints(0);
      setTimeout(() => {
        if (pIdx >= PUZZLES.length - 1) {
          setPhase('won');
          window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*');
        } else {
          setPIdx(i => i + 1);
          setGrid(initGrid(pIdx + 1));
          setSelBank(null);
          setChecked(false);
          setMsg('');
        }
      }, 1000);
    } else {
      const t = tries - 1;
      setTries(t);
      if (t <= 0) setPhase('lost');
      else setMsg(`Some equations don't balance — check highlighted cells. ${t} ${t === 1 ? 'try' : 'tries'} left.`);
    }
  }

  function giveHint() {
    if (hints >= MAX_HINTS) { setMsg('No more hints available.'); return; }
    const empty = grid.findIndex((v, i) => v === null && !puzzle.clues.includes(i));
    if (empty === -1) return;
    const ng = [...grid];
    ng[empty] = puzzle.solution[empty];
    setGrid(ng);
    setHints(h => h + 1);
    setChecked(false);
    setMsg('Hint used — one cell filled. No more hints remain.');
  }

  function reset() {
    setPIdx(0);
    setGrid(initGrid(0));
    setSelBank(null);
    setTries(MAX_TRIES);
    setScore(0);
    setPhase('playing');
    setChecked(false);
    setMsg('');
    setHints(0);
  }

  // Track which bank tiles are placed in the grid
  const usedBank = (() => {
    const used = new Set();
    grid.forEach((v, si) => {
      if (v !== null && !puzzle.clues.includes(si)) {
        const bi = puzzle.bank.findIndex((bv, bi) => bv === v && !used.has(bi));
        if (bi !== -1) used.add(bi);
      }
    });
    return used;
  })();

  // ── Grid render ─────────────────────────────────────────────────────────────
  function renderGrid() {
    const slots = grid;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto auto auto', gap: '6px', alignItems: 'center', justifyItems: 'center' }}>
        {/* Row 0 */}
        <ValCell value={slots[0]} isClue={puzzle.clues.includes(0)} isSelected={false}
          rowResult={cellRowResult(0)} colResult={cellColResult(0)}
          onClick={() => slots[0] !== null && !puzzle.clues.includes(0) ? clickFilled(0) : clickCell(0)} />
        <OpCell op={puzzle.rowOps[0]} />
        <ValCell value={slots[1]} isClue={puzzle.clues.includes(1)} isSelected={false}
          rowResult={cellRowResult(1)} colResult={cellColResult(1)}
          onClick={() => slots[1] !== null && !puzzle.clues.includes(1) ? clickFilled(1) : clickCell(1)} />
        <EqLabel green={rStatus[0] === true} />
        <ValCell value={slots[2]} isClue={puzzle.clues.includes(2)} isSelected={false}
          rowResult={cellRowResult(2)} colResult={cellColResult(2)}
          onClick={() => slots[2] !== null && !puzzle.clues.includes(2) ? clickFilled(2) : clickCell(2)} />

        {/* Column operators row */}
        <div className="h-7 flex items-center"><span className="font-display font-black text-base text-text-muted">{puzzle.colOps[0]}</span></div>
        <Gap />
        <div className="h-7 flex items-center"><span className="font-display font-black text-base text-text-muted">{puzzle.colOps[1]}</span></div>
        <Gap />
        <div className="h-7 flex items-center"><span className="font-display font-black text-base text-text-muted">{puzzle.colOps[2]}</span></div>

        {/* Row 1 */}
        <ValCell value={slots[3]} isClue={puzzle.clues.includes(3)} isSelected={false}
          rowResult={cellRowResult(3)} colResult={cellColResult(3)}
          onClick={() => slots[3] !== null && !puzzle.clues.includes(3) ? clickFilled(3) : clickCell(3)} />
        <OpCell op={puzzle.rowOps[1]} />
        <ValCell value={slots[4]} isClue={puzzle.clues.includes(4)} isSelected={false}
          rowResult={cellRowResult(4)} colResult={cellColResult(4)}
          onClick={() => slots[4] !== null && !puzzle.clues.includes(4) ? clickFilled(4) : clickCell(4)} />
        <EqLabel green={rStatus[1] === true} />
        <ValCell value={slots[5]} isClue={puzzle.clues.includes(5)} isSelected={false}
          rowResult={cellRowResult(5)} colResult={cellColResult(5)}
          onClick={() => slots[5] !== null && !puzzle.clues.includes(5) ? clickFilled(5) : clickCell(5)} />

        {/* Column equals row */}
        <div className="h-7 flex items-center"><span className={`font-display font-black text-base ${cStatus[0] === true ? 'text-duo-green-dark' : 'text-text-muted'}`}>=</span></div>
        <Gap />
        <div className="h-7 flex items-center"><span className={`font-display font-black text-base ${cStatus[1] === true ? 'text-duo-green-dark' : 'text-text-muted'}`}>=</span></div>
        <Gap />
        <div className="h-7 flex items-center"><span className={`font-display font-black text-base ${cStatus[2] === true ? 'text-duo-green-dark' : 'text-text-muted'}`}>=</span></div>

        {/* Row 2 */}
        <ValCell value={slots[6]} isClue={puzzle.clues.includes(6)} isSelected={false}
          rowResult={cellRowResult(6)} colResult={cellColResult(6)}
          onClick={() => slots[6] !== null && !puzzle.clues.includes(6) ? clickFilled(6) : clickCell(6)} />
        <OpCell op={puzzle.rowOps[2]} />
        <ValCell value={slots[7]} isClue={puzzle.clues.includes(7)} isSelected={false}
          rowResult={cellRowResult(7)} colResult={cellColResult(7)}
          onClick={() => slots[7] !== null && !puzzle.clues.includes(7) ? clickFilled(7) : clickCell(7)} />
        <EqLabel green={rStatus[2] === true} />
        <ValCell value={slots[8]} isClue={puzzle.clues.includes(8)} isSelected={false}
          rowResult={cellRowResult(8)} colResult={cellColResult(8)}
          onClick={() => slots[8] !== null && !puzzle.clues.includes(8) ? clickFilled(8) : clickCell(8)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-md">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Math Cross</h1>
        <p className="text-center text-text-mid text-sm mb-5">
          Place numbers so every row AND column multiplication equation balances.
        </p>

        <AnimatePresence mode="wait">

          {phase === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Math Cross</h2>
              <div className="space-y-3 mb-5">
                {[
                  'A 3×3 grid of number cells is shown. Two are pre-filled (grey). Six cells are blank.',
                  'Select a number from the bank below, then click a blank cell to place it.',
                  'Every <strong>row</strong> equation must balance using × (multiply).',
                  'Every <strong>column</strong> equation must also balance (top × middle = bottom).',
                  'Click a filled cell to remove it if you change your mind. You have 1 hint available.',
                ].map((s, i) => (
                  <div key={i} className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                    <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">{i + 1}</span>
                    <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{ __html: s }} />
                  </div>
                ))}
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Reading the grid</p>
                <p className="font-body text-sm text-text-mid">Rows read left → right. Columns read top → bottom. The <strong>= signs</strong> mark the end of each equation. Feedback only appears after pressing Check Solution.</p>
              </div>
              <button onClick={() => setPhase('playing')} className="btn-primary w-full py-3 text-base">Got it — Start Playing</button>
            </motion.div>
          )}

          {phase === 'won' && (
            <motion.div key="won" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-green rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_6px_24px_rgba(88,204,2,0.35)]">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">All Balanced!</h2>
              <button onClick={reset} className="btn-primary w-full py-3 text-base">Play Again</button>
            </motion.div>
          )}

          {phase === 'lost' && (
            <motion.div key="lost" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-red/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border-2 border-duo-red/25">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" strokeWidth="3"><path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" /></svg>
              </div>
              <h2 className="font-display font-black text-2xl text-text-dark mb-3">No More Tries</h2>
              <div className="bg-duo-blue/5 rounded-2xl border border-duo-blue/15 p-3 mb-5 text-left">
                <p className="font-display font-bold text-xs text-duo-blue uppercase mb-2">Solution</p>
                {[0, 1, 2].map(r => (
                  <p key={r} className="font-mono text-sm text-text-mid">
                    {puzzle.solution[r * 3]} {puzzle.rowOps[r]} {puzzle.solution[r * 3 + 1]} = {puzzle.solution[r * 3 + 2]}
                  </p>
                ))}
              </div>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div key={`p${pIdx}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <span className="font-display font-bold text-xs text-text-muted">Puzzle {pIdx + 1}/{PUZZLES.length}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-duo-yellow/15 rounded-xl px-3 py-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>
                    <span className="font-mono font-bold text-sm text-duo-yellow-dark">{score} XP</span>
                  </div>
                  <div className="flex gap-1.5">{Array.from({ length: MAX_TRIES }).map((_, i) => (
                    <div key={i} className="w-3 h-3 rounded-full" style={{ background: i < tries ? '#1CB0F6' : '#E5E5E5' }} />
                  ))}</div>
                </div>
              </div>

              {/* Main grid */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6 mb-4 flex justify-center">
                {renderGrid()}
              </div>

              {/* Number bank */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-4 mb-4">
                <p className="font-display font-bold text-xs text-text-muted uppercase tracking-wider mb-3">
                  Number Bank — select a number, then click a blank cell
                </p>
                <div className="flex flex-wrap gap-2">
                  {puzzle.bank.map((n, bi) => {
                    const isUsed = usedBank.has(bi);
                    const isSel  = selBank === bi;
                    return (
                      <motion.button key={bi}
                        onClick={() => { if (!isUsed) setSelBank(isSel ? null : bi); setMsg(''); }}
                        disabled={isUsed}
                        whileTap={!isUsed ? { scale: 0.9 } : {}}
                        className={['w-14 h-12 rounded-xl border-2 font-mono font-black text-base transition-all',
                          isUsed ? 'opacity-25 cursor-not-allowed bg-surface-off border-surface-border text-text-muted'
                          : isSel ? 'bg-duo-blue border-duo-blue text-white shadow-blue cursor-pointer'
                          : 'bg-white border-surface-border text-text-dark hover:border-duo-blue cursor-pointer',
                        ].join(' ')}>
                        {n}
                      </motion.button>
                    );
                  })}
                </div>
                {selBank !== null && (
                  <p className="font-display font-bold text-xs text-duo-blue mt-2">
                    {puzzle.bank[selBank]} selected — click an empty cell to place it
                  </p>
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
                <button onClick={giveHint} disabled={hints >= MAX_HINTS}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  Hint <span className="font-normal text-text-muted">({hints >= MAX_HINTS ? 'used' : ''})</span>
                </button>
                <button onClick={() => { setGrid(initGrid(pIdx)); setSelBank(null); setChecked(false); setMsg(''); }}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid transition-all">
                  Clear
                </button>
              </div>
              <button onClick={submit}
                className="w-full py-4 rounded-2xl font-display font-black text-lg bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer transition-all">
                Check Solution
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ISAG Interactive Games — Math Cross</p>
      </div>
    </div>
  );
}
