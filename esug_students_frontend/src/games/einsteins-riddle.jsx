import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 4 houses, 4 attributes each. Verified solution:
// House 1: Red,    Ghanaian,  Tea,    Cat
// House 2: Blue,   Nigerian,  Coffee, Dog
// House 3: Green,  Kenyan,    Milk,   Fish
// House 4: Yellow, Ethiopian, Juice,  Bird
//
// Clues:
// 1. The Ghanaian lives in the red house.
// 2. The cat owner drinks tea.
// 3. The Nigerian drinks coffee.
// 4. The milk drinker lives in house 3.
// 5. The green house is immediately right of the blue house.
// 6. The Kenyan keeps fish.
// 7. The Ethiopian keeps a bird.
// 8. The juice drinker lives in house 4.

const ATTRS = ['Color', 'Nationality', 'Drink', 'Pet'];
const OPTIONS = {
  Color:       ['Red','Blue','Green','Yellow'],
  Nationality: ['Ghanaian','Nigerian','Kenyan','Ethiopian'],
  Drink:       ['Tea','Coffee','Milk','Juice'],
  Pet:         ['Cat','Dog','Fish','Bird'],
};
const SOLUTION = [
  ['Red','Ghanaian','Tea','Cat'],
  ['Blue','Nigerian','Coffee','Dog'],
  ['Green','Kenyan','Milk','Fish'],
  ['Yellow','Ethiopian','Juice','Bird'],
];
const CLUES = [
  'The Ghanaian lives in the red house.',
  'The cat owner drinks tea.',
  'The Nigerian drinks coffee.',
  'The milk drinker lives in house 3.',
  'The green house is immediately to the right of the blue house.',
  'The Kenyan keeps fish.',
  'The Ethiopian keeps a bird.',
  'The juice drinker lives in house 4.',
];

const ATTR_ICONS = { Color: '▪', Nationality: '★', Drink: '◉', Pet: '◆' };

const MAX_TRIES = 3;

function initGrid() {
  return SOLUTION.map(row => row.map(() => null));
}

export default function EinsteinsRiddle() {
  const [grid, setGrid] = useState(initGrid);
  const [tries, setTries] = useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState('intro');
  const [msg, setMsg] = useState('');
  const [wrongCells, setWrongCells] = useState(new Set());
  const [hintCount, setHintCount] = useState(0);

  function cycle(house, attrIdx) {
    setGrid(g => {
      const ng = g.map(r => [...r]);
      const opts = OPTIONS[ATTRS[attrIdx]];
      const cur = ng[house][attrIdx];
      const next = cur === null ? opts[0] : opts[(opts.indexOf(cur) + 1) % opts.length];
      ng[house][attrIdx] = next;
      return ng;
    });
    setWrongCells(new Set());
    setMsg('');
  }

  function submit() {
    const unfilled = grid.some(row => row.some(v => v === null));
    if (unfilled) { setMsg('Fill in all cells first — click to cycle through options.'); return; }
    const wrong = new Set();
    grid.forEach((row, h) => row.forEach((val, a) => {
      if (val !== SOLUTION[h][a]) wrong.add(`${h},${a}`);
    }));
    setWrongCells(wrong);
    if (wrong.size === 0) {
      const xp = Math.max(200 - hintCount * 40, 40);
      setScore(s => s + xp);
      setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*');
    } else {
      const t = tries - 1; setTries(t);
      if (t <= 0) setPhase('lost');
      else setMsg(`${wrong.size} cell${wrong.size > 1 ? 's' : ''} incorrect — highlighted red. ${t} tries left.`);
    }
  }

  function hint() {
    window.parent.postMessage({ type: 'HINT_USED' }, '*');
    const empties = [];
    grid.forEach((row, h) => row.forEach((val, a) => { if (val !== SOLUTION[h][a]) empties.push([h, a]); }));
    if (empties.length === 0) return;
    const [h, a] = empties[Math.floor(Math.random() * empties.length)];
    setGrid(g => { const ng = g.map(r => [...r]); ng[h][a] = SOLUTION[h][a]; return ng; });
    setHintCount(c => c + 1);
    setMsg(`Hint: House ${h + 1} ${ATTRS[a]} → ${SOLUTION[h][a]}`);
    setWrongCells(new Set());
  }

  function reset() {
    setGrid(initGrid()); setTries(MAX_TRIES); setScore(0);
    setPhase('playing'); setMsg(''); setWrongCells(new Set()); setHintCount(0);
  }

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-2xl">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Einstein's Riddle</h1>
        <p className="text-center text-text-mid text-sm mb-5">4 houses in a row. Use the clues to deduce every attribute. Click any cell to cycle its value.</p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Einstein's Riddle</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Four houses in a row. Each has four attributes: Color, Nationality, Drink, Pet."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Eight clues are listed. Use logic to deduce every attribute for every house."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Click any cell to cycle through the possible values for that attribute."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "When all 16 cells match the solution, you win."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Clue: \"The Kenyan keeps fish.\" → set House ?'s Nationality to Kenyan and Pet to Fish, then use other clues to find which house number."}}/>
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
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">Solved It!</h2>
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
              <p className="text-text-mid text-sm mb-4">The fish is kept by the <strong>Kenyan</strong> in House 3.</p>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}
          {phase === 'playing' && (
            <motion.div key="playing" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <span className="font-display font-bold text-xs text-text-muted">Deduce all 16 cells</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-duo-yellow/15 rounded-xl px-3 py-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                    <span className="font-mono font-bold text-sm text-duo-yellow-dark">{score} XP</span>
                  </div>
                  <div className="flex gap-1.5">
                    {Array.from({ length: MAX_TRIES }).map((_, i) => (
                      <div key={i} className="w-3 h-3 rounded-full" style={{ background: i < tries ? '#1CB0F6' : '#E5E5E5' }}/>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-4 mb-4 overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-left font-display font-black text-xs text-text-muted w-24"></th>
                      {[1, 2, 3, 4].map(n => (
                        <th key={n} className="p-2 text-center font-display font-black text-sm text-text-dark">House {n}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ATTRS.map((attr, a) => (
                      <tr key={attr} className="border-t border-surface-border">
                        <td className="p-2 font-display font-bold text-xs text-text-muted">{ATTR_ICONS[attr]} {attr}</td>
                        {[0, 1, 2, 3].map(h => {
                          const key = `${h},${a}`;
                          const isWrong = wrongCells.has(key);
                          const val = grid[h][a];
                          return (
                            <td key={h} className="p-1.5 text-center">
                              <motion.button
                                onClick={() => cycle(h, a)}
                                whileTap={{ scale: 0.94 }}
                                className={['w-full px-2 py-2.5 rounded-xl border-2 font-display font-bold text-xs transition-all cursor-pointer leading-tight',
                                  isWrong ? 'border-duo-red bg-[#FF4B4B]/10 text-duo-red'
                                  : val ? 'border-duo-blue bg-[#1CB0F6]/10 text-duo-blue'
                                  : 'border-dashed border-surface-border-strong bg-surface-off text-text-muted hover:border-duo-blue',
                                ].join(' ')}>
                                {val ?? '—'}
                              </motion.button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Clues */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-4 mb-4">
                <p className="font-display font-black text-xs text-text-muted uppercase tracking-wider mb-2">Clues</p>
                <ol className="list-decimal list-inside space-y-1">
                  {CLUES.map((c, i) => (
                    <li key={i} className="font-body text-xs text-text-mid leading-snug">{c}</li>
                  ))}
                </ol>
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
                <button onClick={hint}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all">
                  Hint <span className="font-normal text-text-muted">(reveal one cell)</span>
                </button>
                <button onClick={() => { setGrid(initGrid()); setWrongCells(new Set()); setMsg(''); }}
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
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ESUG Interactive Games — Einstein's Riddle</p>
      </div>
    </div>
  );
}
