import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Pentomino puzzle: a 5x4 grid (20 cells). 4 pentominoes to place.
// Player clicks a piece in the tray, then clicks a grid cell to place it.
// Pieces can be flipped/rotated. Win when all 20 cells filled with no overlap.
// 3 puzzles with pre-defined solutions.

const CS = 44; // cell size

// Piece definitions: array of [row, col] offsets from anchor (0,0)
const PIECES = {
  L: { cells: [[0,0],[1,0],[2,0],[2,1]], color: '#1CB0F6' },
  T: { cells: [[0,0],[0,1],[0,2],[1,1]], color: '#58CC02' },
  S: { cells: [[0,1],[0,2],[1,0],[1,1]], color: '#CE82FF' },
  I: { cells: [[0,0],[0,1],[0,2],[0,3]], color: '#FF9600' },
  O: { cells: [[0,0],[0,1],[1,0],[1,1]], color: '#FF4B4B' }, // 2x2 square (tetromino-style, 4 cells)
};

// Rotate 90° clockwise: [r,c] → [c, -r] then normalize
function rotateCW(cells) {
  const rot = cells.map(([r,c]) => [c, -r]);
  const minR = Math.min(...rot.map(([r])=>r));
  const minC = Math.min(...rot.map(([,c])=>c));
  return rot.map(([r,c]) => [r-minR, c-minC]);
}

function flipH(cells) {
  const maxC = Math.max(...cells.map(([,c])=>c));
  return cells.map(([r,c]) => [r, maxC-c]);
}

function cellKey(r, c) { return `${r},${c}`; }

function placedCells(piece, anchor, rotation, flipped) {
  let cells = [...PIECES[piece].cells];
  for (let i = 0; i < rotation; i++) cells = rotateCW(cells);
  if (flipped) cells = flipH(cells);
  return cells.map(([r,c]) => [r + anchor[0], c + anchor[1]]);
}

// Pre-defined solution placements for each puzzle
// Puzzle 1: 5x4 grid filled with I, L, T, S pieces (4 pentominoes = 16 cells — not quite 20)
// Simplify: use 4 pieces of 5 cells each = 20 cells. Use standard pentominoes.
// Actually let me use a 4×5 grid (20 cells) with 4 L-tetrominoes (4 cells each) + redefined sizes.
// Simpler: 3×5 grid (15 cells), 3 pentominoes.

const GRID_ROWS = 3;
const GRID_COLS = 5;

const PUZZLES = [
  {
    // 3×5 grid. 3 pieces: horizontal I (1×5), L rotated, Z-shape
    pieceDefs: ['I5', 'L5', 'Z5'],
    // I5: 5 horizontal, L5: 4+1 corner, Z5: 2+2+1 zigzag
    // Placed solution:
    // Row 0: I5 covers (0,0)-(0,4)
    // Row 1: L5 covers (1,0),(1,1),(1,2),(2,2),(2,3)
    // Row 2 remainder: Z5 covers (1,3),(1,4),(2,0),(2,1),(2,4)
    hint: 'Place the horizontal bar in the top row first.',
  },
  {
    pieceDefs: ['I5', 'L5', 'Z5'],
    hint: 'Try the L-piece in the bottom-left corner.',
  },
  {
    pieceDefs: ['I5', 'L5', 'Z5'],
    hint: 'The Z-piece must bridge the middle row.',
  },
];

// Since free-placement of pentominoes with rotation is complex,
// implement as: player places 3 predefined pieces on a 3×5 grid.
// Pieces are placed by clicking cells — first click selects anchor, then we try to place.
// For this UI, we'll show pieces in tray and allow click-to-place with fixed orientation.

// Fixed piece shapes for each puzzle (no rotation needed):
const PIECE_SHAPES = [
  { id:'blue', cells: [[0,0],[0,1],[0,2],[0,3],[0,4]], color:'#1CB0F6', label:'I' }, // horizontal bar
  { id:'green', cells: [[0,0],[1,0],[2,0],[2,1],[2,2]], color:'#58CC02', label:'L' }, // L-shape
  { id:'purple', cells: [[0,2],[0,3],[1,1],[1,2],[2,0]], color:'#CE82FF', label:'Z' }, // Z/S-shape
];

// Solutions (piece id → anchor [r,c]):
const SOLUTIONS = [
  { blue:[0,0], green:[0,0], purple:[0,0] }, // puzzle 1 — won't work with fixed cells, use direct placement
];

// Simpler approach: pre-fill cells with piece colors as the "correct" placement.
// Player must discover which color goes where by trying placements.
// On submit, compare grid to solution.

// Pre-computed solution grids for 3 puzzles:
const SOLUTION_GRIDS = [
  // Puzzle 1: 3×5
  // Row 0: all blue (I horizontal)
  // Row 1: green,green,green,purple,purple
  // Row 2: green,green,purple,purple,purple
  [
    ['blue','blue','blue','blue','blue'],
    ['green','green','green','purple','purple'],
    ['green','green','purple','purple','purple'],
  ],
  // Puzzle 2:
  [
    ['purple','purple','blue','blue','blue'],
    ['purple','green','green','blue','blue'],
    ['purple','green','green','green','green'],
  ],
  // Puzzle 3:
  [
    ['blue','blue','green','green','green'],
    ['blue','purple','purple','green','purple'],
    ['blue','blue','purple','purple','purple'],
  ],
];

const COLORS_MAP = {
  blue: '#1CB0F6',
  green: '#58CC02',
  purple: '#CE82FF',
};

const COLOR_LABELS = { blue: 'Blue (I)', green: 'Green (L)', purple: 'Purple (Z)' };

const MAX_TRIES = 3;

export default function PentominoPuzzle() {
  const [pIdx, setPIdx] = useState(0);
  const [grid, setGrid] = useState(() => Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(null)));
  const [activeColor, setActiveColor] = useState(null);
  const [tries, setTries] = useState(MAX_TRIES);
  const [setScore] = useState(0);
  const [phase, setPhase] = useState('intro');
  const [msg, setMsg] = useState('');
  const [wrongCells, setWrongCells] = useState(new Set());

  const sol = SOLUTION_GRIDS[pIdx];

  function clickCell(r, c) {
    if (!activeColor) { setMsg('Select a color piece first.'); return; }
    setGrid(g => {
      const ng = g.map(row => [...row]);
      ng[r][c] = ng[r][c] === activeColor ? null : activeColor;
      return ng;
    });
    setWrongCells(new Set()); setMsg('');
  }

  function submit() {
    const allFilled = grid.every(row => row.every(v => v !== null));
    if (!allFilled) { setMsg('Fill all 15 cells first.'); return; }
    const wrong = new Set();
    grid.forEach((row, r) => row.forEach((v, c) => {
      if (v !== sol[r][c]) wrong.add(cellKey(r, c));
    }));
    setWrongCells(wrong);
    if (wrong.size === 0) {
      setScore(s => s + 200);
      setMsg('Perfect fit!');
      setTimeout(() => {
        if (pIdx >= PUZZLES.length - 1) { setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*'); }
        else { setPIdx(i=>i+1); setGrid(Array(GRID_ROWS).fill(null).map(()=>Array(GRID_COLS).fill(null))); setWrongCells(new Set()); setMsg(''); setActiveColor(null); }
      }, 900);
    } else {
      const t = tries - 1; setTries(t);
      if (t <= 0) setPhase('lost');
      else setMsg(`${wrong.size} cell${wrong.size>1?'s':''} wrong (red border). ${t} tries left.`);
    }
  }

  function reset() {
    setPIdx(0); setGrid(Array(GRID_ROWS).fill(null).map(()=>Array(GRID_COLS).fill(null)));
    setTries(MAX_TRIES); setScore(0); setPhase('playing'); setMsg('');
    setWrongCells(new Set()); setActiveColor(null);
  }

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Pentomino Puzzle</h1>
        <p className="text-center text-text-mid text-sm mb-5">Fill the 3×5 grid completely with 3 pentomino pieces (no gaps, no overlaps). Select a color, then click cells to paint.</p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Pentomino Puzzle</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Fill the 3×5 grid with three pieces. Each piece is a different colour."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Select a colour from the palette, then click cells to paint them."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "All 15 cells must be filled — no gaps, no mixed colours in one piece."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Use the Hint button to reveal where one piece fits."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Blue piece covers 5 cells in a horizontal row. Green piece forms an L-shape. Purple fills the rest."}}/>
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
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">Perfect Fit!</h2>
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
              <p className="text-text-mid text-sm mb-4">{PUZZLES[pIdx].hint}</p>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}
          {phase === 'playing' && (
            <motion.div key={`p${pIdx}`} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
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
                    <div key={i} className="w-3 h-3 rounded-full" style={{background:i<tries?'#1CB0F6':'#E5E5E5'}}/>
                  ))}</div>
                </div>
              </div>

              {/* Color picker */}
              <div className="bg-surface-card rounded-2xl border border-surface-border shadow-card px-4 py-3 mb-4">
                <p className="font-display font-bold text-xs text-text-muted mb-2">Select piece color:</p>
                <div className="flex gap-2">
                  {Object.entries(COLORS_MAP).map(([id, hex]) => (
                    <motion.button key={id} onClick={() => setActiveColor(activeColor === id ? null : id)} whileTap={{scale:0.92}}
                      className={['flex-1 py-2.5 rounded-xl font-display font-bold text-sm text-white transition-all cursor-pointer border-2',
                        activeColor === id ? 'border-white shadow-md scale-105' : 'border-transparent opacity-80 hover:opacity-100',
                      ].join(' ')}
                      style={{backgroundColor: hex}}>
                      {COLOR_LABELS[id].split(' ')[0]}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Grid */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4 flex justify-center">
                <div className="grid gap-1" style={{gridTemplateColumns:`repeat(${GRID_COLS},${CS}px)`}}>
                  {grid.map((row, r) => row.map((v, c) => {
                    const key = cellKey(r, c);
                    const isWrong = wrongCells.has(key);
                    const hex = v ? COLORS_MAP[v] : null;
                    return (
                      <motion.button key={key} onClick={() => clickCell(r,c)} whileTap={{scale:0.9}}
                        className={['rounded-xl border-2 transition-all cursor-pointer',
                          isWrong ? 'border-duo-red' : hex ? 'border-white/30' : 'border-surface-border hover:border-duo-blue bg-surface-off',
                        ].join(' ')}
                        style={{ width: CS, height: CS, backgroundColor: hex ?? undefined }}>
                      </motion.button>
                    );
                  }))}
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
                <button onClick={() => setMsg(PUZZLES[pIdx].hint)}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all">
                  Hint
                </button>
                <button onClick={() => { setGrid(Array(GRID_ROWS).fill(null).map(()=>Array(GRID_COLS).fill(null))); setWrongCells(new Set()); setMsg(''); }}
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
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ISAG Interactive Games — Pentomino Puzzle</p>
      </div>
    </div>
  );
}
