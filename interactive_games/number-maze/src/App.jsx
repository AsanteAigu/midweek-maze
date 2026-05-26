import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Puzzle grids — 6×6, values 1–36 each used once ────────────────────────────
// Move rule: |current_value - next_value| === 1 OR === 4
// Both grids verified with BFS to have a valid path from (0,0) to (5,5).
const PUZZLES = [
  {
    // Path: (0,0)→(1,0)→(2,0)→(3,0)→(3,1)→(3,2)→(4,2)→(5,2)→(5,3)→(5,4)→(5,5)
    // Diffs: 4,4,4,1,1,4,4,1,1,4 — all valid
    grid: [
      [ 1,  2,  3,  4,  6,  7],
      [ 5,  8, 10, 11, 12, 16],
      [ 9, 17, 18, 20, 21, 22],
      [13, 14, 15, 26, 27, 28],
      [30, 31, 19, 32, 33, 34],
      [35, 36, 23, 24, 25, 29],
    ],
  },
  {
    // Path: (0,0)→(0,1)→(0,2)→(1,2)→(2,2)→(2,3)→(2,4)→(3,4)→(4,4)→(4,5)→(5,5)
    // Diffs: 1,1,4,1,4,4,1,1,4,1 — all valid
    grid: [
      [10, 11, 12,  1,  2,  3],
      [ 4,  5, 16,  6,  7,  8],
      [ 9, 13, 17, 21, 25, 14],
      [15, 18, 19, 20, 26, 22],
      [23, 24, 28, 29, 27, 31],
      [30, 33, 34, 35, 36, 32],
    ],
  },
];

const GRID_SIZE = 6;
const MAX_TRIES = 2;

// ── Move validation (diff = 1 or 4) ──────────────────────────────────────────
function getValidNeighbours(grid, r, c, visited) {
  return [[-1, 0], [1, 0], [0, -1], [0, 1]]
    .map(([dr, dc]) => [r + dr, c + dc])
    .filter(([nr, nc]) => {
      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) return false;
      if (visited.has(`${nr},${nc}`)) return false;
      const d = Math.abs(grid[nr][nc] - grid[r][c]);
      return d === 1 || d === 4;
    });
}

function bfsOptimalMoves(grid) {
  const seen  = new Set(['0,0']);
  const queue = [[[0, 0], 0]];
  while (queue.length) {
    const [[r, c], d] = queue.shift();
    if (r === GRID_SIZE - 1 && c === GRID_SIZE - 1) return d;
    for (const [nr, nc] of getValidNeighbours(grid, r, c, seen)) {
      seen.add(`${nr},${nc}`);
      queue.push([[nr, nc], d + 1]);
    }
  }
  return null;
}

// ── Cell component ────────────────────────────────────────────────────────────
function Cell({ value, state, onClick }) {
  // state: 'start'|'end'|'current'|'visited'|'default'
  // 'valid' state removed — player must figure out valid moves themselves
  const styles = {
    start:   'bg-duo-green/20 border-duo-green text-duo-green-dark font-black',
    end:     'bg-duo-red/15   border-duo-red   text-duo-red font-black',
    current: 'bg-duo-blue     border-duo-blue  text-white   font-black shadow-blue',
    visited: 'bg-duo-blue/15  border-duo-blue/30 text-duo-blue font-bold',
    default: 'bg-white border-surface-border text-text-dark cursor-pointer hover:border-duo-blue/50',
  };

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center
        font-mono font-bold text-base transition-all select-none
        ${styles[state] || styles.default}`}>
      {value}
      {state === 'start' && <span className="absolute top-0.5 left-1 text-[7px] font-display font-black leading-none">S</span>}
      {state === 'end'   && <span className="absolute bottom-0.5 right-1 text-[7px] font-display font-black leading-none">E</span>}
    </motion.button>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function NumberMaze() {
  const [pIdx,      setPIdx]    = useState(0);
  const [curPos,    setCurPos]  = useState([0, 0]);
  const [visited,   setVisited] = useState(() => new Set(['0,0']));
  const [path,      setPath]    = useState([[0, 0]]);
  const [moves,     setMoves]   = useState(0);
  const [triesLeft, setTries]   = useState(MAX_TRIES);
  const [phase,     setPhase]   = useState('intro');
  const [msg,       setMsg]     = useState('');
  const [msgErr,    setMsgErr]  = useState(false);

  const puzzle  = PUZZLES[pIdx];
  const optimal = bfsOptimalMoves(puzzle.grid);
  // Valid moves computed but NOT highlighted — used only for stuck detection and error messages
  const validMoves = getValidNeighbours(puzzle.grid, curPos[0], curPos[1], visited);

  function cellState(r, c) {
    const key = `${r},${c}`;
    if (curPos[0] === r && curPos[1] === c)                          return 'current';
    if (r === GRID_SIZE - 1 && c === GRID_SIZE - 1 && !visited.has(key)) return 'end';
    if (r === 0 && c === 0 && !visited.has(key))                     return 'start';
    if (visited.has(key))                                            return 'visited';
    // No 'valid' highlight — player figures it out themselves
    return 'default';
  }

  const handleCell = useCallback((r, c) => {
    if (phase !== 'playing') return;
    const isValid = validMoves.some(([nr, nc]) => nr === r && nc === c);
    if (!isValid) {
      const d = Math.abs(puzzle.grid[r][c] - puzzle.grid[curPos[0]][curPos[1]]);
      const adjacent = Math.abs(r - curPos[0]) + Math.abs(c - curPos[1]) === 1;
      if (visited.has(`${r},${c}`)) {
        setMsg('Already visited that cell.');
        setMsgErr(true);
      } else if (!adjacent) {
        setMsg('Not adjacent to your current position.');
        setMsgErr(true);
      } else {
        setMsg(`Invalid move — difference is ${d}, but must be 1 or 4.`);
        setMsgErr(true);
      }
      setTimeout(() => setMsg(''), 1800);
      return;
    }
    setMsgErr(false);
    const newVisited = new Set([...visited, `${r},${c}`]);
    const newPath    = [...path, [r, c]];
    const newMoves   = moves + 1;
    setCurPos([r, c]);
    setVisited(newVisited);
    setPath(newPath);
    setMoves(newMoves);

    if (r === GRID_SIZE - 1 && c === GRID_SIZE - 1) {
      setPhase('won');
      if (pIdx === PUZZLES.length - 1) {
        window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*');
      }
    } else {
      const nextMoves = getValidNeighbours(puzzle.grid, r, c, newVisited);
      if (nextMoves.length === 0) {
        setMsg('Dead end — no valid moves from here.');
        setMsgErr(true);
      } else {
        setMsg('');
        setMsgErr(false);
      }
    }
  }, [phase, puzzle, pIdx, curPos, visited, path, moves, validMoves]);

  function restartPuzzle() {
    setCurPos([0, 0]);
    setVisited(new Set(['0,0']));
    setPath([[0, 0]]);
    setMoves(0);
    setMsg('');
  }

  function nextPuzzle() {
    const next = pIdx + 1;
    setPIdx(next);
    setCurPos([0, 0]);
    setVisited(new Set(['0,0']));
    setPath([[0, 0]]);
    setMoves(0);
    setMsg('');
    setPhase('playing');
  }

  function reset() {
    setPIdx(0);
    setCurPos([0, 0]);
    setVisited(new Set(['0,0']));
    setPath([[0, 0]]);
    setMoves(0);
    setTries(MAX_TRIES);
    setPhase('playing');
    setMsg('');
  }

  const xp = phase === 'won'
    ? Math.max(200 - Math.max(0, moves - optimal) * 5, 50)
    : 0;

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">
          Interactive Puzzle
        </p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Number Maze</h1>
        <p className="text-center text-text-mid text-sm mb-5">
          Navigate from S to E. Each step must differ by exactly 1 or 4. No revisiting cells.
        </p>

        <AnimatePresence mode="wait">

          {phase === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Number Maze</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{ __html: "A 6×6 grid of numbers. Start at the top-left (S), reach the bottom-right (E)." }} />
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{ __html: "Move one step at a time to an adjacent cell (up/down/left/right — no diagonals)." }} />
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{ __html: "Each step must change the cell value by exactly <strong>+1, −1, +4, or −4</strong>." }} />
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{ __html: "You cannot revisit any cell. Valid moves are <strong>not highlighted</strong> — figure it out!" }} />
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{ __html: "Standing on value 10 → you can move to a neighbour containing 9, 11, 6, or 14." }} />
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
                  <path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="font-display font-black text-3xl text-text-dark mb-1">Path Found!</h2>
              <p className="font-mono text-lg text-text-mid mb-1">
                {moves} moves <span className="text-text-muted text-sm">/ optimal: {optimal}</span>
              </p>
              {moves === optimal && (
                <p className="font-display font-bold text-sm text-duo-green mb-2">Optimal path!</p>
              )}
              <div className="inline-flex items-center gap-2 bg-duo-yellow/15 border-2 border-duo-yellow/40
                rounded-2xl px-5 py-2 mb-5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#E6AC00">
                  <path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                </svg>
                <span className="font-display font-black text-lg text-duo-yellow-dark">+{xp} XP</span>
              </div>
              <div className="flex gap-3">
                {pIdx < PUZZLES.length - 1
                  ? <button onClick={nextPuzzle} className="btn-primary flex-1 py-3">Next Puzzle</button>
                  : <button onClick={reset}       className="btn-primary flex-1 py-3">Play Again</button>
                }
              </div>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div key={`p${pIdx}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              {/* HUD */}
              <div className="flex items-center justify-between bg-surface-card rounded-2xl
                border border-surface-border shadow-card px-5 py-3 mb-4">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="font-display font-bold text-xs text-text-muted uppercase tracking-wider block">Moves</span>
                    <span className="font-mono font-bold text-2xl text-text-dark">{moves}</span>
                  </div>
                  <div className="w-px h-8 bg-surface-border" />
                  <div>
                    <span className="font-display font-bold text-xs text-text-muted uppercase tracking-wider block">Optimal</span>
                    <span className="font-mono font-bold text-2xl text-text-dark">{optimal}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <span className="font-display font-bold text-xs text-text-muted uppercase tracking-wider block text-right">Puzzle</span>
                    <span className="font-mono font-bold text-xl text-text-dark text-right block">
                      {pIdx + 1}/{PUZZLES.length}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {Array.from({ length: MAX_TRIES }).map((_, i) => (
                      <div key={i} className="w-3 h-3 rounded-full"
                        style={{ background: i < triesLeft ? '#1CB0F6' : '#E5E5E5' }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-4 mb-4">
                <div className="grid gap-1.5 mx-auto" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, width: 300 }}>
                  {puzzle.grid.map((row, r) => row.map((val, c) => (
                    <div key={`${r},${c}`} className="relative">
                      <Cell value={val} state={cellState(r, c)} onClick={() => handleCell(r, c)} />
                    </div>
                  )))}
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-3 mt-4 flex-wrap">
                  {[
                    { color: 'bg-duo-blue', label: 'Current' },
                    { color: 'bg-duo-blue/15', label: 'Visited' },
                    { color: 'bg-duo-green/20', label: 'Start' },
                    { color: 'bg-duo-red/15', label: 'End' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className={`w-3 h-3 rounded ${color} border border-surface-border`} />
                      <span className="font-body text-xs text-text-muted">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message */}
              <AnimatePresence>
                {msg && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={`rounded-2xl border px-4 py-2.5 mb-4 text-center font-body text-sm
                      ${msgErr
                        ? 'bg-duo-red/8 border-duo-red/25 text-duo-red'
                        : 'bg-surface-card border-surface-border text-text-mid'}`}>
                    {msg}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Controls */}
              <div className="flex gap-3 mb-3">
                <button onClick={restartPuzzle}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white
                    border-2 border-surface-border text-text-mid hover:border-surface-border-strong transition-all">
                  Restart Puzzle
                </button>
              </div>

              <div className="bg-duo-blue/5 rounded-2xl border border-duo-blue/15 px-4 py-2.5">
                <p className="font-display font-bold text-xs text-duo-blue">
                  Click any cell to move there. Valid steps differ by 1 or 4 — no hints!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 text-text-muted text-xs font-mono text-center">
          ISAG Interactive Games — Number Maze
        </p>
      </div>
    </div>
  );
}
