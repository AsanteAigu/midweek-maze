import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Puzzles — solution + which cells are clues ─────────────────────────────────
// solution[row][col], clues = set of "r,c" indices that are pre-filled
const PUZZLES = [
  {
    solution: [[1,2,3,4],[3,4,1,2],[2,3,4,1],[4,1,2,3]],
    clues: new Set(['0,0','0,3','1,1','2,2','3,0','3,3']),
  },
  {
    solution: [[2,1,4,3],[4,3,2,1],[1,4,3,2],[3,2,1,4]],
    clues: new Set(['0,0','0,2','1,3','2,1','3,0','3,2']),
  },
  {
    solution: [[4,1,2,3],[2,3,4,1],[3,4,1,2],[1,2,3,4]],
    clues: new Set(['0,1','0,3','1,0','2,3','3,1','3,2']),
  },
];

const MAX_TRIES = 3;

// ── Conflict detector ─────────────────────────────────────────────────────────
function getConflicts(grid) {
  const conflicts = new Set();
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const v = grid[r][c];
      if (!v) continue;
      // Check row
      for (let c2 = 0; c2 < 4; c2++) {
        if (c2 !== c && grid[r][c2] === v) {
          conflicts.add(`${r},${c}`);
          conflicts.add(`${r},${c2}`);
        }
      }
      // Check col
      for (let r2 = 0; r2 < 4; r2++) {
        if (r2 !== r && grid[r2][c] === v) {
          conflicts.add(`${r},${c}`);
          conflicts.add(`${r2},${c}`);
        }
      }
      // Check 2x2 box
      const br = Math.floor(r / 2) * 2;
      const bc = Math.floor(c / 2) * 2;
      for (let dr = 0; dr < 2; dr++) {
        for (let dc = 0; dc < 2; dc++) {
          const nr = br + dr, nc = bc + dc;
          if ((nr !== r || nc !== c) && grid[nr][nc] === v) {
            conflicts.add(`${r},${c}`);
            conflicts.add(`${nr},${nc}`);
          }
        }
      }
    }
  }
  return conflicts;
}

// ── Box outline helper (2×2 boxes need thick borders) ─────────────────────────
function boxBorder(r, c) {
  return {
    borderTop:    r === 0 ? '2px solid #3C3C3C' : r === 2 ? '2.5px solid #3C3C3C' : '1px solid #E5E5E5',
    borderBottom: r === 3 ? '2px solid #3C3C3C' : '1px solid #E5E5E5',
    borderLeft:   c === 0 ? '2px solid #3C3C3C' : c === 2 ? '2.5px solid #3C3C3C' : '1px solid #E5E5E5',
    borderRight:  c === 3 ? '2px solid #3C3C3C' : '1px solid #E5E5E5',
  };
}

// ── Number selector overlay ───────────────────────────────────────────────────
function NumSelector({ onSelect, onClear }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
      className="absolute z-20 bg-white rounded-2xl shadow-card-hover border-2 border-duo-blue/30
        p-2 flex gap-2"
      style={{ top: '110%', left: '50%', transform: 'translateX(-50%)' }}>
      {[1, 2, 3, 4].map(n => (
        <button key={n} onClick={() => onSelect(n)}
          className="w-10 h-10 rounded-xl font-mono font-bold text-lg bg-duo-blue text-white
            hover:bg-duo-blue-dark transition-all">
          {n}
        </button>
      ))}
      <button onClick={onClear}
        className="w-10 h-10 rounded-xl font-mono font-bold text-lg bg-surface-off border-2
          border-surface-border text-text-muted hover:border-duo-red hover:text-duo-red transition-all">
        ✕
      </button>
    </motion.div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function MiniSudoku() {
  const [pIdx,     setPIdx]    = useState(0);
  const [grid,     setGrid]    = useState(() => buildGrid(0));
  const [selCell,  setSelCell] = useState(null); // [r,c] or null
  const [triesLeft,setTries]   = useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [hints,    setHints]   = useState(0);
  const [phase,    setPhase]   = useState('intro');
  const [msg,      setMsg]     = useState('');

  function buildGrid(puzzleIdx) {
    const { solution, clues } = PUZZLES[puzzleIdx];
    return Array.from({ length: 4 }, (_, r) =>
      Array.from({ length: 4 }, (_, c) =>
        clues.has(`${r},${c}`) ? solution[r][c] : 0
      )
    );
  }

  const { solution, clues } = PUZZLES[pIdx];
  const conflicts = getConflicts(grid);
  const filled    = grid.flat().filter(v => v > 0).length;
  const total     = 16;

  function placeNumber(n) {
    if (!selCell) return;
    const [r, c] = selCell;
    const next = grid.map(row => [...row]);
    next[r][c] = n;
    setGrid(next);
    setSelCell(null);
    setMsg('');
  }

  function clearCell() {
    if (!selCell) return;
    const [r, c] = selCell;
    if (clues.has(`${r},${c}`)) return;
    const next = grid.map(row => [...row]);
    next[r][c] = 0;
    setGrid(next);
    setSelCell(null);
  }

  function verify() {
    const noConflicts = conflicts.size === 0;
    const allFilled   = grid.flat().every(v => v > 0);
    if (!allFilled)    { setMsg(`${total - filled} cells still empty`); return; }
    if (!noConflicts)  { setMsg('There are conflicts — check highlighted cells'); return; }

    // Compare to solution
    const correct = grid.every((row, r) => row.every((v, c) => v === solution[r][c]));
    if (correct) {
      const xp = Math.max(150 - hints * 20, 30);
      setScore(s => s + xp);
      setMsg(`Correct!`);
      setTimeout(() => {
        if (pIdx >= PUZZLES.length - 1) { setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*'); }
        else { setPIdx(i => i + 1); setGrid(buildGrid(pIdx + 1)); setHints(0); setMsg(''); setSelCell(null); }
      }, 800);
    } else {
      const t = triesLeft - 1;
      setTries(t);
      setMsg(`Incorrect — ${t} ${t === 1 ? 'try' : 'tries'} left`);
      if (t <= 0) setTimeout(() => setPhase('lost'), 700);
    }
  }

  function giveHint() {
    // Reveal one empty cell
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!clues.has(`${r},${c}`) && grid[r][c] === 0) {
          const next = grid.map(row => [...row]);
          next[r][c] = solution[r][c];
          setGrid(next);
          setHints(h => h + 1);
          setMsg(`Hint: placed ${solution[r][c]} at row ${r + 1}, col ${c + 1}`);
          return;
        }
      }
    }
  }

  function restart() {
    setPIdx(0); setGrid(buildGrid(0)); setSelCell(null);
    setTries(MAX_TRIES); setScore(0); setHints(0);
    setPhase('playing'); setMsg('');
  }

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-md">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">
          Interactive Puzzle
        </p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">
          Mini Sudoku
        </h1>
        <p className="text-center text-text-mid text-sm mb-5">
          Place 1–4 once in every row, column, and 2×2 box.
        </p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Mini Sudoku</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Fill a 4×4 grid so every number 1–4 appears exactly once in each row, column, and 2×2 box."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Grey cells are pre-filled clues — you cannot change them."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Click an empty cell to open the number selector, then choose 1–4."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Red borders highlight conflicts. Resolve all conflicts to win."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "If row 1 already has 1, 2, 3 → the blank cell in row 1 must be 4."}}/>
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
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">All Puzzles Solved!</h2>
              <button onClick={restart} className="btn-primary w-full py-3 mt-4 text-base">Play Again</button>
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
                Each row, column, and 2×2 box must contain 1, 2, 3, and 4 exactly once.
              </p>
              <button onClick={restart} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div key={`p${pIdx}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              {/* HUD */}
              <div className="flex items-center justify-between bg-surface-card rounded-2xl
                border border-surface-border shadow-card px-5 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xs text-text-muted uppercase tracking-wider">Puzzle</span>
                  <span className="font-mono font-bold text-xl text-text-dark">
                    {pIdx + 1}<span className="text-text-muted text-sm font-normal">/{PUZZLES.length}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-text-muted">
                    {filled}/{total} filled
                  </span>
                  <div className="flex gap-1.5">
                    {Array.from({ length: MAX_TRIES }).map((_, i) => (
                      <div key={i} className="w-3 h-3 rounded-full transition-all"
                        style={{ background: i < triesLeft ? '#1CB0F6' : '#E5E5E5' }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4">
                <div className="grid gap-0 mx-auto" style={{ gridTemplateColumns: 'repeat(4, 1fr)', width: 240 }}>
                  {grid.map((row, r) => row.map((val, c) => {
                    const key      = `${r},${c}`;
                    const isClue   = clues.has(key);
                    const isConfl  = conflicts.has(key);
                    const isSel    = selCell?.[0] === r && selCell?.[1] === c;
                    const isEmpty  = val === 0;

                    let bg = '#fff';
                    if (isClue)  bg = '#F7F7F7';
                    if (isConfl) bg = '#FFECEC';
                    if (isSel)   bg = '#DFF4FF';

                    return (
                      <div key={key} className="relative"
                        style={{ ...boxBorder(r, c), backgroundColor: bg }}>
                        <button
                          onClick={() => {
                            if (isClue) return;
                            setSelCell(isSel ? null : [r, c]);
                            setMsg('');
                          }}
                          className="w-full h-14 flex items-center justify-center transition-colors"
                          style={{ cursor: isClue ? 'default' : 'pointer' }}>
                          <span className={[
                            'font-mono font-bold text-xl',
                            isClue   ? 'text-text-dark'                    : '',
                            !isClue && !isEmpty ? 'text-duo-blue'          : '',
                            isEmpty  ? 'text-transparent'                  : '',
                            isConfl  ? 'text-duo-red'                      : '',
                          ].join(' ')}>
                            {val || '·'}
                          </span>
                        </button>
                        {/* Number selector popup */}
                        {isSel && (
                          <NumSelector onSelect={placeNumber} onClear={clearCell} />
                        )}
                      </div>
                    );
                  }))}
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-4 mt-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-surface-off border border-surface-border" />
                    <span className="font-body text-xs text-text-muted">Clue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-duo-blue/20 border border-duo-blue/30" />
                    <span className="font-body text-xs text-text-muted">Selected</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-duo-red/15 border border-duo-red/25" />
                    <span className="font-body text-xs text-text-muted">Conflict</span>
                  </div>
                </div>
              </div>

              {/* Message */}
              <AnimatePresence>
                {msg && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-surface-card rounded-2xl border border-surface-border px-4 py-2.5 mb-4
                      text-center font-body text-sm text-text-mid">
                    {msg}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Controls */}
              <div className="flex gap-3 mb-3">
                <button onClick={giveHint}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white
                    border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all">
                  Hint  <span className="font-normal text-text-muted"></span>
                </button>
                <button onClick={() => { setGrid(buildGrid(pIdx)); setSelCell(null); setMsg(''); }}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white
                    border-2 border-surface-border text-text-mid hover:border-surface-border-strong transition-all">
                  Clear
                </button>
              </div>

              <button onClick={verify}
                className="w-full py-4 rounded-2xl font-display font-black text-lg
                  bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer transition-all">
                Verify Solution
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 text-text-muted text-xs font-mono text-center">
          ISAG Interactive Games — Mini Sudoku
        </p>
      </div>
    </div>
  );
}
