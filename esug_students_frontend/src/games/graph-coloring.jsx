import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Undirected graph coloring. No two adjacent nodes share a color.
// Player clicks a node then a color. Must use minimum colors (chromatic number).
// 3 graphs: chromatic numbers 2, 3, 3.

const COLORS = [
  { id: 'red',    label: 'Red',    hex: '#FF4B4B' },
  { id: 'blue',   label: 'Blue',   hex: '#1CB0F6' },
  { id: 'green',  label: 'Green',  hex: '#58CC02' },
  { id: 'purple', label: 'Purple', hex: '#CE82FF' },
];

const GRAPHS = [
  {
    name: 'Bipartite Graph',
    chromatic: 2,
    colors: 2,
    nodes: [
      { id:'A', x:80,  y:80  },
      { id:'B', x:80,  y:180 },
      { id:'C', x:240, y:80  },
      { id:'D', x:240, y:180 },
    ],
    edges: [['A','C'],['A','D'],['B','C'],['B','D']],
    hint: 'This is a bipartite graph — only 2 colors needed. Color {A,B} with color 1 and {C,D} with color 2.',
  },
  {
    name: 'Triangle Graph',
    chromatic: 3,
    colors: 3,
    nodes: [
      { id:'A', x:160, y:60  },
      { id:'B', x:60,  y:220 },
      { id:'C', x:260, y:220 },
      { id:'D', x:160, y:160 },
    ],
    edges: [['A','B'],['A','C'],['B','C'],['A','D'],['B','D'],['C','D']],
    hint: 'The triangle A-B-C requires 3 colors. D connects to all three.',
  },
  {
    name: 'Petersen-Style Graph',
    chromatic: 3,
    colors: 3,
    nodes: [
      { id:'A', x:160, y:50  },
      { id:'B', x:270, y:130 },
      { id:'C', x:230, y:250 },
      { id:'D', x:90,  y:250 },
      { id:'E', x:50,  y:130 },
      { id:'F', x:160, y:140 },
    ],
    edges: [['A','B'],['B','C'],['C','D'],['D','E'],['E','A'],['A','F'],['B','F'],['C','F'],['D','F'],['E','F']],
    hint: 'F connects to all outer nodes. Color F first, then alternate colors for the outer cycle.',
  },
];

const MAX_TRIES = 3;

export default function GraphColoring() {
  const [gIdx, setGIdx] = useState(0);
  const [coloring, setColoring] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);
  const [tries, setTries] = useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState('intro');
  const [msg, setMsg] = useState('');
  const [conflicts, setConflicts] = useState(new Set());

  const g = GRAPHS[gIdx];
  const availColors = COLORS.slice(0, g.colors);

  function getConflicts(col) {
    const c = new Set();
    g.edges.forEach(([a, b]) => {
      if (col[a] && col[b] && col[a] === col[b]) { c.add(a); c.add(b); }
    });
    return c;
  }

  function assignColor(colorId) {
    if (!selectedNode) return;
    const newCol = { ...coloring, [selectedNode]: colorId };
    setColoring(newCol);
    setConflicts(getConflicts(newCol));
    setSelectedNode(null);
    setMsg('');
  }

  function submit() {
    const allColored = g.nodes.every(n => coloring[n.id]);
    if (!allColored) { setMsg('Color all nodes first.'); return; }
    const c = getConflicts(coloring);
    if (c.size === 0) {
      setScore(s => s + 300);
      setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*');
    } else {
      const t = tries - 1; setTries(t);
      if (t <= 0) setPhase('lost');
      else { setConflicts(c); setMsg(`${c.size / 2} conflict${c.size / 2 > 1 ? 's' : ''} — adjacent nodes share a color. ${t} tries left.`); }
    }
  }

  function reset() {
    setGIdx(0); setColoring({}); setSelectedNode(null); setTries(MAX_TRIES); setScore(0);
    setPhase('playing'); setMsg(''); setConflicts(new Set());
  }

  function nextGraph() {
    setGIdx(i => i + 1); setColoring({}); setSelectedNode(null);
    setMsg(''); setConflicts(new Set());
  }

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Graph Coloring</h1>
        <p className="text-center text-text-mid text-sm mb-5">Color every node so no two connected nodes share a color. Use the minimum number of colors.</p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Graph Coloring</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A graph of nodes connected by edges is shown."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Color every node so that no two nodes connected by an edge share the same color."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Click a node to select it, then click a color from the palette to assign it."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "The goal: satisfy all edges using the minimum number of colors (the chromatic number)."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A triangle (3 nodes, all connected) needs 3 different colors — one per node."}}/>
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
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">Properly Coloured!</h2>
              <div className="inline-flex items-center gap-2 bg-duo-yellow/15 border-2 border-duo-yellow/40 rounded-2xl px-5 py-2 mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                <span className="font-display font-black text-xl text-duo-yellow-dark">{score} XP</span>
              </div>
              {gIdx < GRAPHS.length - 1
                ? <button onClick={nextGraph} className="btn-primary w-full py-3 text-base">Next Graph</button>
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
              <p className="text-text-mid text-sm mb-4">{g.hint}</p>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}
          {phase === 'playing' && (
            <motion.div key={`g${gIdx}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <div>
                  <p className="font-display font-bold text-xs text-text-muted">{g.name}</p>
                  <p className="font-mono text-xs text-text-muted">Chromatic number: {g.chromatic}</p>
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

              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-4 mb-4">
                <svg width="320" height="300" viewBox="0 0 320 300" className="w-full">
                  {g.edges.map(([a, b]) => {
                    const na = g.nodes.find(n => n.id === a);
                    const nb = g.nodes.find(n => n.id === b);
                    const conflict = conflicts.has(a) && conflicts.has(b) && coloring[a] === coloring[b];
                    return (
                      <line key={`${a}-${b}`} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                        stroke={conflict ? '#FF4B4B' : '#CBD5E1'} strokeWidth={conflict ? 2.5 : 1.5}/>
                    );
                  })}
                  {g.nodes.map(n => {
                    const col = COLORS.find(c => c.id === coloring[n.id]);
                    const isSel = selectedNode === n.id;
                    const isConflict = conflicts.has(n.id);
                    return (
                      <g key={n.id} onClick={() => setSelectedNode(isSel ? null : n.id)} style={{cursor:'pointer'}}>
                        <circle cx={n.x} cy={n.y} r={22}
                          fill={col ? col.hex : '#F8FAFC'}
                          stroke={isConflict ? '#FF4B4B' : isSel ? '#1CB0F6' : '#CBD5E1'}
                          strokeWidth={isSel || isConflict ? 3 : 1.5}
                        />
                        <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central"
                          fontSize="13" fontFamily="sans-serif" fontWeight="bold"
                          fill={col ? 'white' : '#64748B'}>{n.id}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Color palette */}
              <div className="bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <p className="font-display font-bold text-xs text-text-muted mb-2">
                  {selectedNode ? `Coloring node ${selectedNode} — pick a color:` : 'Click a node, then choose a color'}
                </p>
                <div className="flex gap-2">
                  {availColors.map(c => (
                    <motion.button key={c.id} onClick={() => assignColor(c.id)} whileTap={{scale:0.92}}
                      disabled={!selectedNode}
                      className={['flex-1 py-2.5 rounded-xl font-display font-bold text-sm text-white transition-all',
                        selectedNode ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-40',
                      ].join(' ')}
                      style={{backgroundColor: c.hex}}>
                      {c.label}
                    </motion.button>
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
                <button onClick={() => setMsg(g.hint)}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all">
                  Hint
                </button>
                <button onClick={() => { setColoring({}); setConflicts(new Set()); setSelectedNode(null); setMsg(''); }}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid transition-all">
                  Clear
                </button>
              </div>
              <button onClick={submit}
                className="w-full py-4 rounded-2xl font-display font-black text-lg bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer transition-all">
                Check Coloring
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ISAG Interactive Games — Graph Coloring</p>
      </div>
    </div>
  );
}
