import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Mazes ─────────────────────────────────────────────────────────────────────
// 10×10 grid. 0 = open path, 1 = wall.
// Unique twist: a "fog of war" mechanic — only cells adjacent to your current
// position and your visited path are visible. The rest is shrouded.
// Also: a hidden "teleporter" tile (marked 2) that jumps you 3 cells forward.

const MAZES = [
  {
    grid: [
      [0,0,1,0,0,0,1,0,0,0],
      [1,0,1,0,1,0,0,0,1,0],
      [0,0,0,0,1,1,1,0,0,0],
      [0,1,1,0,0,0,1,0,1,1],
      [0,0,0,0,1,0,0,0,0,0],
      [1,1,0,1,1,0,1,1,0,1],
      [0,0,0,0,0,0,0,1,0,0],
      [0,1,1,1,0,1,0,0,0,1],
      [0,0,0,0,0,0,1,0,1,0],
      [1,1,0,1,1,0,0,0,1,0],
    ],
    start: [0,0],
    end:   [9,9],
    teleporter: [4,7], // stepping on this jumps to [4,9] (verified open)
    teleportTo: [4,9],
  },
  {
    grid: [
      [0,1,0,0,0,1,0,0,0,0],
      [0,0,0,1,0,0,0,1,0,1],
      [1,0,1,1,0,1,0,0,0,0],
      [0,0,0,0,0,0,1,0,1,0],
      [0,1,1,0,1,0,0,0,0,1],
      [0,0,0,0,0,1,0,1,0,0],
      [1,1,0,1,0,0,0,0,1,0],
      [0,0,0,0,1,0,1,0,0,0],
      [0,1,1,0,0,0,0,1,0,1],
      [0,0,0,1,0,1,0,0,0,0],
    ],
    start: [0,0],
    end:   [9,9],
    teleporter: [3,4],
    teleportTo: [3,7],
  },
];

const MAX_TRIES = 3;

// ── BFS to find next step ─────────────────────────────────────────────────────
function bfsStep(grid, [sr, sc], visited, [er, ec]) {
  const queue = [[[sr, sc], [[sr, sc]]]];
  const seen  = new Set([...visited, `${sr},${sc}`]);
  while (queue.length) {
    const [[r, c], path] = queue.shift();
    if (r === er && c === ec) return path[1] ?? null;
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = r+dr, nc = c+dc;
      if (nr < 0 || nr > 9 || nc < 0 || nc > 9) continue;
      if (grid[nr][nc] === 1) continue;
      const k = `${nr},${nc}`;
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push([[nr, nc], [...path, [nr, nc]]]);
    }
  }
  return null;
}

// ── Cell ──────────────────────────────────────────────────────────────────────
function MazeCell({ r, c, maze, curPos, visited, visible, hintCell, onClick }) {
  const [cr, cc] = curPos;
  const isCur   = cr === r && cc === c;
  const isStart = maze.start[0] === r && maze.start[1] === c;
  const isEnd   = maze.end[0] === r && maze.end[1] === c;
  const isTele  = maze.teleporter[0] === r && maze.teleporter[1] === c;
  const isWall  = maze.grid[r][c] === 1;
  const isVisited = visited.has(`${r},${c}`);
  const isHint  = hintCell && hintCell[0] === r && hintCell[1] === c;
  const isVisible = visible.has(`${r},${c}`);

  // Fog of war: if not visible and not visited, shroud it
  if (!isVisible && !isVisited && !isCur) {
    return (
      <div className="w-7 h-7 rounded-sm"
        style={{ backgroundColor: '#1A2035' }} />
    );
  }

  let bg    = '#FFFFFF';
  let border= '#E5E5E5';
  let content = null;

  if (isWall) { bg = '#2A2A3A'; border = '#1A1A2A'; }
  else if (isCur) { bg = '#1CB0F6'; border = '#0F8FC0'; }
  else if (isEnd) { bg = '#FF4B4B20'; border = '#FF4B4B'; }
  else if (isStart) { bg = '#58CC0220'; border = '#58CC02'; }
  else if (isTele && isVisible) { bg = '#FFC80025'; border = '#FFC800'; }
  else if (isHint) { bg = '#58CC0220'; border = '#58CC02'; }
  else if (isVisited) { bg = '#1CB0F615'; border = '#1CB0F630'; }

  if (isEnd && isVisible) content = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" strokeWidth="2.5">
      <polygon points="3,3 21,12 3,21" fill="#FF4B4B" opacity="0.7"/>
    </svg>
  );
  if (isTele && isVisible && !isWall) content = (
    <span className="font-mono font-black text-xs" style={{ color: '#E6AC00' }}>T</span>
  );
  if (isCur) content = (
    <div className="w-3 h-3 rounded-full bg-white opacity-90"/>
  );

  return (
    <motion.button
      onClick={onClick}
      whileTap={!isWall ? { scale: 0.88 } : {}}
      className="w-7 h-7 rounded-sm border flex items-center justify-center transition-all select-none"
      style={{ backgroundColor: bg, borderColor: border, cursor: isWall ? 'default' : 'pointer' }}
      disabled={isWall}>
      {content}
    </motion.button>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function MazeNavigator() {
  const [mIdx,     setMIdx]    = useState(0);
  const [curPos,   setCurPos]  = useState([0, 0]);
  const [visited,  setVisited] = useState(() => new Set(['0,0']));
  const [moves,    setMoves]   = useState(0);
  const [triesLeft,setTries]   = useState(MAX_TRIES);
  const [phase,    setPhase]   = useState('intro');
  const [msg,      setMsg]     = useState('');
  const [msgErr,   setMsgErr]  = useState(false);
  const [hintCell, setHint]    = useState(null);
  const [hintsUsed,setHints]   = useState(0);
  const [teleportAnim, setTA]  = useState(false);

  const maze    = MAZES[mIdx];
  const [er, ec]= maze.end;

  // Visibility: current cell + all adjacent open cells
  const visible = new Set([`${curPos[0]},${curPos[1]}`]);
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]) {
    const nr = curPos[0]+dr, nc = curPos[1]+dc;
    if (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 9) visible.add(`${nr},${nc}`);
  }

  const handleCell = useCallback((r, c) => {
    if (phase !== 'playing') return;
    if (maze.grid[r][c] === 1) { setMsg('That is a wall'); setMsgErr(true); setTimeout(()=>setMsg(''), 1200); return; }

    const [cr, cc] = curPos;
    const dr = Math.abs(r - cr), dc2 = Math.abs(c - cc);
    if (dr + dc2 !== 1) { setMsg('Move one step at a time'); setMsgErr(true); setTimeout(()=>setMsg(''), 1200); return; }
    if (visited.has(`${r},${c}`) && !(r === er && c === ec)) {
      setMsg('Already visited — cannot backtrack'); setMsgErr(true); setTimeout(()=>setMsg(''), 1500); return;
    }

    const newVisited = new Set([...visited, `${r},${c}`]);
    const newMoves   = moves + 1;
    setHint(null);

    // Teleporter check
    if (maze.teleporter[0] === r && maze.teleporter[1] === c) {
      const [tr, tc] = maze.teleportTo;
      setCurPos([tr, tc]);
      newVisited.add(`${tr},${tc}`);
      setVisited(newVisited);
      setMoves(newMoves + 1);
      setTA(true);
      setMsg('Teleported! +1 move');
      setMsgErr(false);
      setTimeout(() => setTA(false), 600);
      return;
    }

    setCurPos([r, c]);
    setVisited(newVisited);
    setMoves(newMoves);
    setMsg('');
    setMsgErr(false);

    if (r === er && c === ec) { setPhase('won'); if (mIdx >= MAZES.length - 1) window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*'); }
  }, [phase, maze, curPos, visited, moves, er, ec]);

  // Keyboard support
  useEffect(() => {
    function onKey(e) {
      if (phase !== 'playing') return;
      const dirs = { ArrowUp:[-1,0], ArrowDown:[1,0], ArrowLeft:[0,-1], ArrowRight:[0,1] };
      const d = dirs[e.key];
      if (!d) return;
      e.preventDefault();
      const nr = curPos[0]+d[0], nc = curPos[1]+d[1];
      if (nr < 0 || nr > 9 || nc < 0 || nc > 9) return;
      handleCell(nr, nc);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, curPos, handleCell]);

  function giveHint() {
    const next = bfsStep(maze.grid, curPos, visited, maze.end);
    if (!next) { setMsg('No path forward — you may be stuck'); setMsgErr(true); return; }
    setHint(next);
    setHints(h => h + 1);
    setMsg(`Hint: move to row ${next[0]+1}, col ${next[1]+1}`);
    setMsgErr(false);
  }

  function restart() {
    setCurPos(maze.start); setVisited(new Set([`${maze.start[0]},${maze.start[1]}`]));
    setMoves(0); setMsg(''); setHint(null); setPhase('playing'); setMsgErr(false);
  }

  function nextMaze() {
    const next = mIdx + 1;
    setMIdx(next); setCurPos(MAZES[next].start);
    setVisited(new Set([`${MAZES[next].start[0]},${MAZES[next].start[1]}`]));
    setMoves(0); setMsg(''); setHint(null); setPhase('playing'); setHints(0);
  }

  function resetAll() {
    setMIdx(0); setCurPos(MAZES[0].start);
    setVisited(new Set([`${MAZES[0].start[0]},${MAZES[0].start[1]}`]));
    setMoves(0); setTries(MAX_TRIES); setPhase('playing'); setMsg(''); setHint(null); setHints(0);
  }

  const xp = phase === 'won' ? Math.max(150 - hintsUsed * 20 - Math.max(0, moves - 20) * 2, 30) : 0;

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">
          Interactive Puzzle
        </p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Maze Navigator</h1>
        <p className="text-center text-text-mid text-sm mb-5">
          Navigate through the fog. Click or use arrow keys. Watch for the teleporter tile (T).
        </p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Maze Navigator</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Find your way from START (green) to END (red) through the fog-of-war maze."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Click adjacent open cells (up/down/left/right) to move. Walls block you."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Only nearby cells are revealed — explore to uncover the maze."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Watch for a hidden teleporter tile! Use the Hint button for the next best step."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "You can only move to cells directly touching your current position — no jumping."}}/>
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
              <h2 className="font-display font-black text-3xl text-text-dark mb-1">Exit Found!</h2>
              <p className="font-mono text-lg text-text-mid mb-1">{moves} moves</p>
              <div className="inline-flex items-center gap-2 bg-duo-yellow/15 border-2 border-duo-yellow/40
                rounded-2xl px-5 py-2 mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#E6AC00">
                  <path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/>
                </svg>
                <span className="font-display font-black text-xl text-duo-yellow-dark">+{xp} XP</span>
              </div>
              <div className="flex gap-3">
                {mIdx < MAZES.length - 1
                  ? <button onClick={nextMaze} className="btn-primary flex-1 py-3">Next Maze</button>
                  : <button onClick={resetAll}  className="btn-primary flex-1 py-3">Play Again</button>
                }
              </div>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div key={`m${mIdx}`} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
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
                    <span className="font-display font-bold text-xs text-text-muted uppercase tracking-wider block">Maze</span>
                    <span className="font-mono font-bold text-2xl text-text-dark">{mIdx+1}/{MAZES.length}</span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: MAX_TRIES }).map((_, i) => (
                    <div key={i} className="w-3 h-3 rounded-full"
                      style={{ background: i < triesLeft ? '#1CB0F6' : '#E5E5E5' }} />
                  ))}
                </div>
              </div>

              {/* Maze grid */}
              <motion.div
                animate={teleportAnim ? { scale:[1,1.04,1], opacity:[1,0.7,1] } : {}}
                transition={{ duration: 0.5 }}
                className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-4 mb-4">
                <div className="flex flex-col gap-0.5 mx-auto w-fit">
                  {maze.grid.map((row, r) => (
                    <div key={r} className="flex gap-0.5">
                      {row.map((_, c) => (
                        <MazeCell key={c} r={r} c={c}
                          maze={maze} curPos={curPos}
                          visited={visited} visible={visible}
                          hintCell={hintCell}
                          onClick={() => handleCell(r, c)} />
                      ))}
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-4 mt-3 flex-wrap">
                  {[
                    { color: 'bg-duo-blue', label: 'You' },
                    { color: 'bg-duo-blue/15', label: 'Visited' },
                    { color: 'bg-duo-red/15', label: 'Exit' },
                    { color: 'bg-duo-yellow/20', label: 'T = Teleporter' },
                    { color: 'bg-[#1A2035]', label: 'Fog' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded-sm ${color} border border-surface-border`}/>
                      <span className="font-body text-xs text-text-muted">{label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Message */}
              <AnimatePresence>
                {msg && (
                  <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                    className={`rounded-2xl border px-4 py-2.5 mb-4 text-center font-body text-sm
                      ${msgErr ? 'bg-duo-red/8 border-duo-red/25 text-duo-red'
                               : 'bg-surface-card border-surface-border text-text-mid'}`}>
                    {msg}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 mb-3">
                <button onClick={giveHint}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white
                    border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all">
                  Hint  <span className="font-normal text-text-muted"></span>
                </button>
                <button onClick={restart}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white
                    border-2 border-surface-border text-text-mid hover:border-surface-border-strong transition-all">
                  Restart
                </button>
              </div>

              <div className="bg-duo-blue/5 rounded-2xl border border-duo-blue/15 px-4 py-2.5">
                <p className="font-display font-bold text-xs text-duo-blue text-center">
                  Arrow keys or click to move. Only adjacent open cells are visible.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 text-text-muted text-xs font-mono text-center">
          ISAG Interactive Games — Maze Navigator
        </p>
      </div>
    </div>
  );
}
