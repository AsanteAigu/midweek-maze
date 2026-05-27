import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Grid: 5×5
// Solution:
//   Row 0: C R A N E
//   Row 1: L . R . .
//   Row 2: A D O R E
//   Row 3: M . M . .
//   Row 4: S L A N G
// Black cells (null): (1,1),(1,3),(1,4),(3,1),(3,3),(3,4)
const SOLUTION = [
  ['C','R','A','N','E'],
  ['L', null,'R', null, null],
  ['A','D','O','R','E'],
  ['M', null,'M', null, null],
  ['S','L','A','N','G'],
];

// Cell number labels: cell starts a new across or down entry
// (0,0)→1 [across CRANE + down CLAMS], (0,2)→2 [down AROMA],
// (2,0)→3 [across ADORE], (4,0)→4 [across SLANG]
const CELL_NUMS = { '0,0':1, '0,2':2, '2,0':3, '4,0':4 };

const CLUES_ACROSS = [
  { num:1, clue:'Large wading bird or a construction machine' },
  { num:3, clue:'To love or admire deeply' },
  { num:4, clue:'Informal or colloquial language' },
];
const CLUES_DOWN = [
  { num:1, clue:'Shellfish that can be steamed open (plural)' },
  { num:2, clue:'Pleasant smell — a perfume or fragrance' },
];

// Words available for hint: reveal the first incomplete one
const HINT_WORDS = [
  { cells:[[0,0],[0,1],[0,2],[0,3],[0,4]], word:'CRANE' },
  { cells:[[2,0],[2,1],[2,2],[2,3],[2,4]], word:'ADORE' },
  { cells:[[4,0],[4,1],[4,2],[4,3],[4,4]], word:'SLANG' },
  { cells:[[0,0],[1,0],[2,0],[3,0],[4,0]], word:'CLAMS' },
  { cells:[[0,2],[1,2],[2,2],[3,2],[4,2]], word:'AROMA' },
];

// Reading order of white cells for keyboard navigation
const WHITE_CELLS = [];
for (let r=0;r<5;r++) for (let c=0;c<5;c++) if(SOLUTION[r][c]!==null) WHITE_CELLS.push(`${r},${c}`);

const MAX_TRIES = 3;

const emptyGrid = () => SOLUTION.map(row => row.map(cell => (cell===null ? null : '')));

export default function MiniCrossword() {
  const [grid, setGrid] = useState(emptyGrid);
  const [tries, setTries] = useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState('intro');
  const [msg, setMsg] = useState('');
  const [wrongCells, setWrongCells] = useState(new Set());
  const [correctCells, setCorrectCells] = useState(new Set());
  const [selected, setSelected] = useState(null);
  const [hintUsed, setHintUsed] = useState(false);
  const inputRefs = useRef({});

  function navigate(fromKey, direction) {
    const idx = WHITE_CELLS.indexOf(fromKey);
    let next;
    if (direction === 'forward' && idx < WHITE_CELLS.length-1) next = WHITE_CELLS[idx+1];
    if (direction === 'back' && idx > 0) next = WHITE_CELLS[idx-1];
    if (!next) return;
    const [nr,nc] = next.split(',').map(Number);
    setSelected({ row:nr, col:nc });
    inputRefs.current[next]?.focus();
  }

  function handleInput(r, c, val) {
    const letter = val.replace(/[^a-zA-Z]/g,'').slice(-1).toUpperCase();
    setGrid(g => g.map((row,ri) => row.map((cell,ci) => ri===r&&ci===c ? letter : cell)));
    setWrongCells(new Set());
    if (letter) navigate(`${r},${c}`, 'forward');
  }

  function handleKeyDown(r, c, e) {
    if (e.key === 'Backspace') {
      if (grid[r][c] === '') navigate(`${r},${c}`, 'back');
      else setGrid(g => g.map((row,ri) => row.map((cell,ci) => ri===r&&ci===c ? '' : cell)));
      e.preventDefault();
    }
    if (e.key === 'ArrowRight' || e.key === 'Tab') { navigate(`${r},${c}`, 'forward'); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { navigate(`${r},${c}`, 'back'); e.preventDefault(); }
  }

  function submit() {
    const unfilled = WHITE_CELLS.some(k => { const [r,c]=k.split(',').map(Number); return grid[r][c]===''; });
    if (unfilled) { setMsg('Fill in all white cells first.'); return; }
    const wrong = new Set();
    const correct = new Set();
    WHITE_CELLS.forEach(k => {
      const [r,c]=k.split(',').map(Number);
      (grid[r][c]===SOLUTION[r][c] ? correct : wrong).add(k);
    });
    setWrongCells(wrong);
    setCorrectCells(correct);
    if (wrong.size===0) {
      setScore(s => s + (hintUsed ? 100 : 200));
      setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*');
    } else {
      const t = tries-1; setTries(t);
      if (t<=0) setPhase('lost');
      else setMsg(`${wrong.size} cell${wrong.size>1?'s':''} incorrect — highlighted in red. ${t} ${t===1?'try':'tries'} left.`);
    }
  }

  function useHint() {
    window.parent.postMessage({ type: 'HINT_USED' }, '*');
    const target = HINT_WORDS.find(w => w.cells.some(([r,c]) => grid[r][c]!==SOLUTION[r][c]));
    if (!target) return;
    setHintUsed(true);
    setGrid(g => { const ng=g.map(row=>[...row]); target.cells.forEach(([r,c])=>{ ng[r][c]=SOLUTION[r][c]; }); return ng; });
    setMsg(`Hint: revealed "${target.word}"`);
    setWrongCells(new Set());
  }

  function reset() {
    setGrid(emptyGrid()); setTries(MAX_TRIES); setScore(0); setPhase('playing');
    setMsg(''); setWrongCells(new Set()); setCorrectCells(new Set());
    setSelected(null); setHintUsed(false);
  }

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Mini Crossword</h1>
        <p className="text-center text-text-mid text-sm mb-5">Fill in the 5×5 grid using the clues. Click a cell and type — use arrow keys to navigate.</p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Mini Crossword</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Fill the 5×5 crossword grid using the Across and Down clues."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Numbers in the top-left corner of cells correspond to clue numbers. Across = left→right. Down = top→bottom."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Click a white cell and type a letter. Use arrow keys or Tab to navigate."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Shared cells (intersections) must satisfy both their Across and Down clue."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "If 1-Across is CRANE and 2-Down starts in the same row at column 2, the cell at (row 0, col 2) must be A — satisfying both."}}/>
              </div>
              <button onClick={() => setPhase('playing')} className="btn-primary w-full py-3 text-base">Got it — Start Playing</button>
            </motion.div>
          )}

          {phase==='won' && (
            <motion.div key="won" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-green rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_6px_24px_rgba(88,204,2,0.35)]">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">Crossword Complete!</h2>
              <button onClick={reset} className="btn-primary w-full py-3 text-base">Play Again</button>
            </motion.div>
          )}
          {phase==='lost' && (
            <motion.div key="lost" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-red/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border-2 border-duo-red/25">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" strokeWidth="3"><path d="M6 18 18 6M6 6l12 12" strokeLinecap="round"/></svg>
              </div>
              <h2 className="font-display font-black text-2xl text-text-dark mb-2">No More Tries</h2>
              <p className="text-text-mid text-sm mb-4">Answers: CRANE / ADORE / SLANG across; CLAMS / AROMA down.</p>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}
          {phase==='playing' && (
            <motion.div key="playing" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
              {/* Header bar */}
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <span className="font-display font-bold text-xs text-text-muted">5×5 Crossword</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-duo-yellow/15 rounded-xl px-3 py-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                    <span className="font-mono font-bold text-sm text-duo-yellow-dark">{score} XP</span>
                  </div>
                  <div className="flex gap-1.5">
                    {Array.from({length:MAX_TRIES}).map((_,i) => (
                      <div key={i} className="w-3 h-3 rounded-full" style={{background: i<tries ? '#1CB0F6' : '#E5E5E5'}}/>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4 flex justify-center">
                <div className="grid gap-1.5" style={{gridTemplateColumns:'repeat(5,56px)'}}>
                  {SOLUTION.map((row,r) => row.map((cell,c) => {
                    const key = `${r},${c}`;
                    if (cell===null) return (
                      <div key={key} className="w-14 h-14 rounded-lg bg-neutral-800"/>
                    );
                    const num = CELL_NUMS[key];
                    const isWrong = wrongCells.has(key);
                    const isCorrect = correctCells.has(key);
                    const isSel = selected?.row===r && selected?.col===c;
                    return (
                      <div key={key} className="relative">
                        {num && <span className="absolute top-0.5 left-1 font-mono text-[9px] text-text-muted z-10 pointer-events-none leading-none">{num}</span>}
                        <input
                          ref={el => { inputRefs.current[key]=el; }}
                          maxLength={2}
                          value={grid[r][c] ?? ''}
                          onChange={e => handleInput(r, c, e.target.value)}
                          onKeyDown={e => handleKeyDown(r, c, e)}
                          onFocus={() => setSelected({row:r, col:c})}
                          className={[
                            'w-14 h-14 rounded-lg border-2 text-center font-display font-black text-xl uppercase outline-none transition-all cursor-pointer',
                            isWrong ? 'border-duo-red bg-[#FF4B4B]/10 text-duo-red'
                            : isCorrect ? 'border-duo-green bg-[#58CC02]/10 text-[#3A8F00]'
                            : isSel ? 'border-duo-blue bg-[#1CB0F6]/10 text-duo-blue'
                            : 'border-surface-border bg-white text-text-dark hover:border-duo-blue',
                          ].join(' ')}
                        />
                      </div>
                    );
                  }))}
                </div>
              </div>

              {/* Clues */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-surface-card rounded-2xl border border-surface-border shadow-card p-4">
                  <p className="font-display font-black text-xs text-text-muted uppercase tracking-wider mb-2">Across</p>
                  {CLUES_ACROSS.map(({num,clue}) => (
                    <p key={num} className="text-xs text-text-mid mb-1.5 leading-snug">
                      <span className="font-display font-black text-text-dark">{num}. </span>{clue}
                    </p>
                  ))}
                </div>
                <div className="bg-surface-card rounded-2xl border border-surface-border shadow-card p-4">
                  <p className="font-display font-black text-xs text-text-muted uppercase tracking-wider mb-2">Down</p>
                  {CLUES_DOWN.map(({num,clue}) => (
                    <p key={num} className="text-xs text-text-mid mb-1.5 leading-snug">
                      <span className="font-display font-black text-text-dark">{num}. </span>{clue}
                    </p>
                  ))}
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
                <button onClick={useHint} disabled={hintUsed}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all disabled:opacity-40">
                  Hint <span className="font-normal text-text-muted">(reveal a word)</span>
                </button>
                <button onClick={() => { setGrid(emptyGrid()); setWrongCells(new Set()); setMsg(''); }}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid transition-all">
                  Clear
                </button>
              </div>
              <button onClick={submit}
                className="w-full py-4 rounded-2xl font-display font-black text-lg bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer transition-all">
                Check Answers
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ESUG Interactive Games — Mini Crossword</p>
      </div>
    </div>
  );
}
