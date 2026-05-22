import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Puzzle grids — all verified to have valid paths ────────────────────────────
const PUZZLES = [
  {
    grid: [[1,2,5,4],[2,3,4,3],[5,4,3,4],[6,5,4,5]],
    // Valid path: (0,0)→(0,1)→(1,1)→(1,2)→(2,2)→(3,2)→(3,3) = 6 moves
  },
  {
    grid: [[1,2,3,2],[2,3,4,3],[3,4,5,4],[4,5,4,3]],
    // Valid path: (0,0)→(0,1)→(0,2)→(1,2)→(2,2)→(3,2)→(3,3) = 6 moves
  },
  {
    grid: [[1,2,5,6],[2,3,4,5],[7,4,5,6],[8,9,6,7]],
    // Valid path: (0,0)→(0,1)→(1,1)→(1,2)→(2,2)→(2,3)→(3,3) = 6 moves
  },
];

const MAX_TRIES = 3;

// ── BFS helpers ───────────────────────────────────────────────────────────────
function getValidNeighbours(grid, r, c, visited) {
  return [[-1,0],[1,0],[0,-1],[0,1]]
    .map(([dr, dc]) => [r + dr, c + dc])
    .filter(([nr, nc]) => {
      if (nr < 0 || nr > 3 || nc < 0 || nc > 3) return false;
      if (visited.has(`${nr},${nc}`)) return false;
      return Math.abs(grid[nr][nc] - grid[r][c]) === 1;
    });
}

function bfsNextStep(grid, [sr, sc], visited) {
  if (sr === 3 && sc === 3) return null;
  const queue = [[[sr, sc], [[sr, sc]]]];
  const seen  = new Set([...visited, `${sr},${sc}`]);
  while (queue.length) {
    const [[r, c], path] = queue.shift();
    if (r === 3 && c === 3) return path[1]; // next step after start
    for (const [nr, nc] of getValidNeighbours(grid, r, c, seen)) {
      seen.add(`${nr},${nc}`);
      queue.push([[nr, nc], [...path, [nr, nc]]]);
    }
  }
  return null;
}

function bfsOptimalMoves(grid) {
  const seen  = new Set(['0,0']);
  const queue = [[[0, 0], 0]];
  while (queue.length) {
    const [[r, c], d] = queue.shift();
    if (r === 3 && c === 3) return d;
    for (const [nr, nc] of getValidNeighbours(grid, r, c, seen)) {
      seen.add(`${nr},${nc}`);
      queue.push([[nr, nc], d + 1]);
    }
  }
  return null;
}

// ── Cell component ────────────────────────────────────────────────────────────
function Cell({ value, state, onClick }) {
  // state: 'start'|'end'|'current'|'visited'|'valid'|'default'|'invalid-flash'
  const styles = {
    start:   'bg-duo-green/20 border-duo-green text-duo-green-dark font-black',
    end:     'bg-duo-red/15   border-duo-red   text-duo-red font-black',
    current: 'bg-duo-blue     border-duo-blue  text-white   font-black shadow-blue',
    visited: 'bg-duo-blue/15  border-duo-blue/30 text-duo-blue font-bold',
    valid:   'bg-duo-green/10 border-duo-green/50 text-text-dark cursor-pointer hover:bg-duo-green/25',
    default: 'bg-white border-surface-border text-text-dark',
  };

  return (
    <motion.button
      onClick={onClick}
      whileTap={state === 'valid' ? { scale: 0.92 } : {}}
      className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center
        font-mono font-bold text-xl transition-all select-none
        ${styles[state] || styles.default}`}>
      {value}
      {state === 'start'   && <span className="absolute top-1 left-1 text-[8px] font-display font-black leading-none">S</span>}
      {state === 'end'     && <span className="absolute bottom-1 right-1 text-[8px] font-display font-black leading-none">E</span>}
    </motion.button>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function NumberMaze() {
  const [pIdx,     setPIdx]    = useState(0);
  const [curPos,   setCurPos]  = useState([0, 0]);
  const [visited,  setVisited] = useState(() => new Set(['0,0']));
  const [path,     setPath]    = useState([[0, 0]]);
  const [moves,    setMoves]   = useState(0);
  const [triesLeft,setTries]   = useState(MAX_TRIES);
  const [phase,    setPhase]   = useState('intro');
  const [msg,      setMsg]     = useState('');
  const [msgErr,   setMsgErr]  = useState(false);
  const [hintCell, setHintCell]= useState(null);
  const [hintsUsed,setHints]   = useState(0);

  const puzzle  = PUZZLES[pIdx];
  const optimal = bfsOptimalMoves(puzzle.grid);
  const validMoves = getValidNeighbours(puzzle.grid, curPos[0], curPos[1], visited);

  function cellState(r, c) {
    const key = `${r},${c}`;
    if (curPos[0] === r && curPos[1] === c)                                           return 'current';
    if (r === 3 && c === 3 && !visited.has(key))                                      return 'end';
    if (r === 0 && c === 0 && !visited.has(key))                                      return 'start';
    if (visited.has(key))                                                             return 'visited';
    if (validMoves.some(([nr, nc]) => nr === r && nc === c))                          return 'valid';
    if (hintCell && hintCell[0] === r && hintCell[1] === c)                           return 'valid';
    return 'default';
  }

  const handleCell = useCallback((r, c) => {
    if (phase !== 'playing') return;
    const isValid = validMoves.some(([nr, nc]) => nr === r && nc === c);
    if (!isValid) {
      const diff = Math.abs(puzzle.grid[r][c] - puzzle.grid[curPos[0]][curPos[1]]);
      if (visited.has(`${r},${c}`)) { setMsg('Already visited that cell'); setMsgErr(true); }
      else if (diff !== 1)           { setMsg(`Needs a difference of 1 — this cell differs by ${diff}`); setMsgErr(true); }
      else                           { setMsg('Not adjacent to your current position'); setMsgErr(true); }
      setTimeout(() => setMsg(''), 1800);
      return;
    }
    setMsgErr(false);
    setHintCell(null);
    const newVisited = new Set([...visited, `${r},${c}`]);
    const newPath    = [...path, [r, c]];
    const newMoves   = moves + 1;
    setCurPos([r, c]);
    setVisited(newVisited);
    setPath(newPath);
    setMoves(newMoves);

    if (r === 3 && c === 3) {
      setPhase('won');
    } else {
      // Check if stuck (no valid moves from new position)
      const nextMoves = getValidNeighbours(puzzle.grid, r, c, newVisited);
      if (nextMoves.length === 0 && !(r === 3 && c === 3)) {
        setMsg('Dead end — no valid moves from here');
        setMsgErr(true);
      } else {
        setMsg(`Moved to (${r+1},${c+1}) — value ${puzzle.grid[r][c]}`);
        setMsgErr(false);
      }
    }
  }, [phase, puzzle, curPos, visited, path, moves, validMoves]);

  function giveHint() {
    const next = bfsNextStep(puzzle.grid, curPos, visited);
    if (!next) { setMsg('No path forward from here — try restarting'); setMsgErr(true); return; }
    setHintCell(next);
    setHints(h => h + 1);
    setMsg(`Hint: move to row ${next[0]+1}, col ${next[1]+1}  (value ${puzzle.grid[next[0]][next[1]]})`);
    setMsgErr(false);
  }

  function restartPuzzle() {
    setCurPos([0, 0]); setVisited(new Set(['0,0']));
    setPath([[0, 0]]); setMoves(0); setMsg(''); setHintCell(null);
  }

  function nextPuzzle() {
    const next = pIdx + 1;
    setPIdx(next); setCurPos([0, 0]); setVisited(new Set(['0,0']));
    setPath([[0, 0]]); setMoves(0); setMsg(''); setHintCell(null); setHints(0);
    setPhase('playing');
  }

  function reset() {
    setPIdx(0); setCurPos([0, 0]); setVisited(new Set(['0,0']));
    setPath([[0, 0]]); setMoves(0); setTries(MAX_TRIES);
    setPhase('playing'); setMsg(''); setHintCell(null); setHints(0);
  }

  const xp = phase === 'won'
    ? Math.max(200 - hintsUsed * 15 - Math.max(0, moves - optimal) * 5, 50) : 0;

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-md">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">
          Interactive Puzzle
        </p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Number Maze</h1>
        <p className="text-center text-text-mid text-sm mb-5">
          Navigate from S to E. Each step must differ by exactly 1. No revisiting cells.
        </p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Number Maze</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A 4×4 grid of numbers. Start at the top-left (green), reach the bottom-right (red)."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Move one step at a time to an adjacent cell (up/down/left/right — no diagonals)."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Each step must change the cell value by exactly <strong>+1 or −1</strong>."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "You cannot revisit any cell."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Standing on value 5 → you can only move to a cell containing 4 or 6."}}/>
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
                  <path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/>
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
            <motion.div key={`p${pIdx}`} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
              {/* HUD */}
              <div className="flex items-center justify-between bg-surface-card rounded-2xl
                border border-surface-border shadow-card px-5 py-3 mb-4">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="font-display font-bold text-xs text-text-muted uppercase tracking-wider block">Moves</span>
                    <span className="font-mono font-bold text-2xl text-text-dark">{moves}</span>
                  </div>
                  <div className="w-px h-8 bg-surface-border"/>
                  <div>
                    <span className="font-display font-bold text-xs text-text-muted uppercase tracking-wider block">Optimal</span>
                    <span className="font-mono font-bold text-2xl text-text-dark">{optimal}</span>
                  </div>
                </div>
                <div>
                  <span className="font-display font-bold text-xs text-text-muted uppercase tracking-wider block text-right">Puzzle</span>
                  <span className="font-mono font-bold text-xl text-text-dark text-right block">
                    {pIdx+1}/{PUZZLES.length}
                  </span>
                </div>
              </div>

              {/* Grid */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4">
                <div className="grid gap-2 mx-auto" style={{ gridTemplateColumns: 'repeat(4, 1fr)', width: 280 }}>
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
                    { color: 'bg-duo-green/10', label: 'Valid move' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className={`w-3 h-3 rounded ${color} border border-surface-border`}/>
                      <span className="font-body text-xs text-text-muted">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message */}
              <AnimatePresence>
                {msg && (
                  <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
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
                <button onClick={giveHint}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white
                    border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all">
                  Hint  <span className="font-normal text-text-muted">(−15 XP)</span>
                </button>
                <button onClick={restartPuzzle}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white
                    border-2 border-surface-border text-text-mid hover:border-surface-border-strong transition-all">
                  Restart
                </button>
              </div>

              <div className="bg-duo-blue/5 rounded-2xl border border-duo-blue/15 px-4 py-2.5">
                <p className="font-display font-bold text-xs text-duo-blue">
                  Click a highlighted cell to move there. Green cells = valid next moves.
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
