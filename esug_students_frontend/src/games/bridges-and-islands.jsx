import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Hashi (Bridges & Islands) puzzles.
// Islands: circles with required bridge counts.
// Player clicks island A then island B to toggle a bridge (max 2 between a pair).
// Valid connections are pre-defined (same row/col, no island between them) — no crossing check needed.
// Verified solutions below.

// Puzzle 1 (4 islands — simple ring):
//   A(80,60)=2  B(240,60)=2
//   C(80,180)=2  D(240,180)=2
//   Solution: A-B, B-D, D-C, C-A  (each island gets 2 bridges)

// Puzzle 2 (6 islands):
//   A(60,60)=1  B(160,60)=3  C(280,60)=2
//   D(60,180)=1  E(160,180)=3  F(280,180)=2
//   Solution: A-B, B-C, B-E, C-F, D-E, E-F  (verified: each correct)

// Puzzle 3 (8 islands — no centre):
//   A(80,80)=2  B(200,80)=3  C(320,80)=2
//   D(80,200)=2              F(320,200)=2
//   G(80,320)=2  H(200,320)=3  I(320,320)=2
//   Solution: A-B, B-C, A-D, B-H, C-F, D-G, F-I, G-H, H-I  (verified)

const PUZZLES = [
  {
    islands: [
      { id: 'A', x: 80,  y: 60,  req: 2 },
      { id: 'B', x: 240, y: 60,  req: 2 },
      { id: 'C', x: 80,  y: 180, req: 2 },
      { id: 'D', x: 240, y: 180, req: 2 },
    ],
    conns: [['A','B'],['A','C'],['B','D'],['C','D']],
    solution: new Set(['A-B','B-D','C-D','A-C']),
    w: 320, h: 240,
  },
  {
    islands: [
      { id: 'A', x: 60,  y: 60,  req: 1 },
      { id: 'B', x: 175, y: 60,  req: 3 },
      { id: 'C', x: 295, y: 60,  req: 2 },
      { id: 'D', x: 60,  y: 180, req: 1 },
      { id: 'E', x: 175, y: 180, req: 3 },
      { id: 'F', x: 295, y: 180, req: 2 },
    ],
    conns: [['A','B'],['B','C'],['A','D'],['B','E'],['C','F'],['D','E'],['E','F']],
    solution: new Set(['A-B','B-C','B-E','C-F','D-E','E-F']),
    w: 355, h: 240,
  },
  {
    islands: [
      { id: 'A', x: 80,  y: 80,  req: 2 },
      { id: 'B', x: 200, y: 80,  req: 3 },
      { id: 'C', x: 320, y: 80,  req: 2 },
      { id: 'D', x: 80,  y: 200, req: 2 },
      { id: 'F', x: 320, y: 200, req: 2 },
      { id: 'G', x: 80,  y: 320, req: 2 },
      { id: 'H', x: 200, y: 320, req: 3 },
      { id: 'I', x: 320, y: 320, req: 2 },
    ],
    conns: [['A','B'],['B','C'],['A','D'],['B','H'],['C','F'],['D','G'],['F','I'],['G','H'],['H','I']],
    solution: new Set(['A-B','B-C','A-D','B-H','C-F','D-G','F-I','G-H','H-I']),
    w: 400, h: 400,
  },
];

const MAX_TRIES = 3;

function bridgeKey(a, b) {
  return [a, b].sort().join('-');
}

export default function BridgesAndIslands() {
  const [pIdx, setPIdx] = useState(0);
  const [bridges, setBridges] = useState(new Set()); // set of "A-B" keys (single bridge)
  const [pending, setPending] = useState(null);       // first island selected
  const [tries, setTries] = useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState('intro');
  const [msg, setMsg] = useState('');
  const [wrongBridges, setWrongBridges] = useState(new Set());
  const [wrongIslands, setWrongIslands] = useState(new Set());

  const p = PUZZLES[pIdx];

  function bridgeCount(id) {
    return [...bridges].filter(k => k.includes(id) && k.split('-').includes(id)).length;
  }

  function handleIslandClick(id) {
    if (pending === null) {
      setPending(id);
      setMsg(`Selected ${id} — now click the destination island.`);
      return;
    }
    if (pending === id) { setPending(null); setMsg(''); return; }
    const key = bridgeKey(pending, id);
    const isValid = p.conns.some(([a, b]) => bridgeKey(a, b) === key);
    if (!isValid) {
      setMsg(`No direct connection between ${pending} and ${id}.`);
      setPending(null);
      return;
    }
    setBridges(bs => {
      const nb = new Set(bs);
      if (nb.has(key)) nb.delete(key); else nb.add(key);
      return nb;
    });
    setWrongBridges(new Set());
    setWrongIslands(new Set());
    setPending(null);
    setMsg('');
  }

  function submit() {
    const wB = new Set();
    const wI = new Set();
    p.islands.forEach(({ id, req }) => {
      const cnt = bridgeCount(id);
      if (cnt !== req) wI.add(id);
    });
    bridges.forEach(k => { if (!p.solution.has(k)) wB.add(k); });
    p.solution.forEach(k => { if (!bridges.has(k)) { const [a, b] = k.split('-'); wI.add(a); wI.add(b); } });
    setWrongBridges(wB);
    setWrongIslands(wI);
    if (wI.size === 0 && wB.size === 0) {
      setScore(s => s + 200);
      setPhase('won'); if (pIdx >= PUZZLES.length - 1) window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*');
    } else {
      const t = tries - 1; setTries(t);
      if (t <= 0) setPhase('lost');
      else setMsg(`${wI.size} island${wI.size !== 1 ? 's' : ''} have wrong bridge counts. ${t} tries left.`);
    }
  }

  function hint() {
    const missing = [...p.solution].find(k => !bridges.has(k));
    if (!missing) return;
    setBridges(bs => new Set([...bs, missing]));
    const [a, b] = missing.split('-');
    setMsg(`Hint: bridge added between ${a} and ${b}.`);
    setWrongBridges(new Set()); setWrongIslands(new Set());
  }

  function reset() {
    setBridges(new Set()); setPending(null); setTries(MAX_TRIES); setScore(0);
    setPhase('playing'); setMsg(''); setWrongBridges(new Set()); setWrongIslands(new Set());
  }

  function nextPuzzle() {
    setBridges(new Set()); setPending(null); setMsg('');
    setWrongBridges(new Set()); setWrongIslands(new Set());
    setPIdx(i => i + 1);
  }

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Bridges & Islands</h1>
        <p className="text-center text-text-mid text-sm mb-5">Connect islands with bridges. Each island's number shows how many bridges must touch it. Click island A, then island B to draw or remove a bridge.</p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Bridges & Islands</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Islands are shown as circles. The number on each island = how many bridges must connect to it."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Click island A, then island B to draw a bridge. Click again to remove it."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Bridges run horizontally or vertically only. They cannot cross each other."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "When every island has exactly the right number of bridges, you win."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Island showing \"3\" must have exactly 3 bridges touching it — no more, no less."}}/>
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
              <h2 className="font-display font-black text-3xl text-text-dark mb-1">All Connected!</h2>
              <p className="text-text-mid text-sm mb-3">Puzzle {pIdx + 1} solved.</p>
              <div className="inline-flex items-center gap-2 bg-duo-yellow/15 border-2 border-duo-yellow/40 rounded-2xl px-5 py-2 mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                <span className="font-display font-black text-xl text-duo-yellow-dark">{score} XP</span>
              </div>
              {pIdx < PUZZLES.length - 1
                ? <button onClick={nextPuzzle} className="btn-primary w-full py-3 text-base">Next Puzzle</button>
                : <button onClick={reset} className="btn-primary w-full py-3 text-base">Play Again</button>
              }
            </motion.div>
          )}
          {phase === 'lost' && (
            <motion.div key="lost" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-red/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border-2 border-duo-red/25">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" strokeWidth="3"><path d="M6 18 18 6M6 6l12 12" strokeLinecap="round"/></svg>
              </div>
              <h2 className="font-display font-black text-2xl text-text-dark mb-2">No More Tries</h2>
              <p className="text-text-mid text-sm mb-4">Each island number tells you exactly how many bridges must connect to it.</p>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}
          {phase === 'playing' && (
            <motion.div key={`p${pIdx}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xs text-text-muted">Puzzle</span>
                  <span className="font-mono font-bold text-xl text-text-dark">{pIdx + 1}<span className="text-text-muted text-sm font-normal">/{PUZZLES.length}</span></span>
                </div>
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

              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-4 mb-4 flex justify-center overflow-x-auto">
                <svg width={p.w} height={p.h} viewBox={`0 0 ${p.w} ${p.h}`}>
                  {/* Bridge lines */}
                  {p.conns.map(([a, b]) => {
                    const ia = p.islands.find(i => i.id === a);
                    const ib = p.islands.find(i => i.id === b);
                    const key = bridgeKey(a, b);
                    const drawn = bridges.has(key);
                    const isWrong = wrongBridges.has(key);
                    if (!drawn) return null;
                    return (
                      <motion.line key={key}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        x1={ia.x} y1={ia.y} x2={ib.x} y2={ib.y}
                        stroke={isWrong ? '#FF4B4B' : '#1CB0F6'} strokeWidth="3" strokeLinecap="round"
                      />
                    );
                  })}
                  {/* Island circles */}
                  {p.islands.map(({ id, x, y, req }) => {
                    const cnt = bridgeCount(id);
                    const isPending = pending === id;
                    const isWrong = wrongIslands.has(id);
                    const isDone = cnt === req && !isWrong;
                    return (
                      <g key={id} onClick={() => handleIslandClick(id)} style={{ cursor: 'pointer' }}>
                        <circle cx={x} cy={y} r={22}
                          fill={isPending ? '#1CB0F6' : isDone ? '#58CC02' : isWrong ? '#FF4B4B' : 'white'}
                          stroke={isPending ? '#1589C2' : isDone ? '#3A8F00' : isWrong ? '#CC2222' : '#CBD5E1'}
                          strokeWidth={isPending ? 3 : 2}
                        />
                        <text x={x} y={y - 4} textAnchor="middle" dominantBaseline="central"
                          fontSize="13" fontFamily="monospace" fontWeight="bold"
                          fill={isPending || isDone || isWrong ? 'white' : '#1A1A2E'}>
                          {cnt}/{req}
                        </text>
                        <text x={x} y={y + 9} textAnchor="middle"
                          fontSize="9" fontFamily="monospace" fill={isPending || isDone || isWrong ? 'white' : '#999'}>
                          {id}
                        </text>
                      </g>
                    );
                  })}
                </svg>
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
                  Hint <span className="font-normal text-text-muted">(add one bridge)</span>
                </button>
                <button onClick={() => { setBridges(new Set()); setWrongBridges(new Set()); setWrongIslands(new Set()); setPending(null); setMsg(''); }}
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
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ISAG Interactive Games — Bridges &amp; Islands</p>
      </div>
    </div>
  );
}
