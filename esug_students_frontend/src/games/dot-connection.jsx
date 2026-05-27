import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Eulerian path puzzle: traverse every edge exactly once.
// Player clicks nodes in sequence. Each click extends the path.
// If the next node is connected to current by an unused edge, the edge is drawn.

// 3 puzzles with guaranteed Eulerian paths.
// Puzzle 1: 4 nodes, 5 edges — 2 odd-degree nodes (A,D) → path A→D or D→A
// Puzzle 2: 4 nodes, 6 edges — 0 odd-degree → Eulerian circuit
// Puzzle 3: 5 nodes, 8 edges — 2 odd-degree nodes

const PUZZLES = [
  {
    nodes: [
      {id:'A',x:80, y:80 },
      {id:'B',x:240,y:80 },
      {id:'C',x:80, y:220},
      {id:'D',x:240,y:220},
    ],
    edges: [['A','B'],['A','C'],['A','D'],['B','D'],['C','D']],
    // Degrees: A=3(odd),B=2,C=2,D=3(odd) → path from A to D
    // One valid path: A→B→D→C→A→D
    startHint: 'Start at A or D (the odd-degree nodes).',
    w:320, h:300,
  },
  {
    nodes: [
      {id:'A',x:160,y:60 },
      {id:'B',x:280,y:160},
      {id:'C',x:200,y:270},
      {id:'D',x:120,y:270},
      {id:'E',x:40, y:160},
    ],
    edges: [['A','B'],['B','C'],['C','D'],['D','E'],['E','A'],['A','C']],
    // Degrees: A=3(odd),B=2,C=3(odd),D=2,E=2 → path from A to C (or C to A)
    // One path: A→B→C→A→E→D→C
    startHint: 'Start at A or C (odd-degree nodes).',
    w:320, h:330,
  },
  {
    nodes: [
      {id:'A',x:80, y:80 },
      {id:'B',x:240,y:80 },
      {id:'C',x:160,y:180},
      {id:'D',x:80, y:270},
      {id:'E',x:240,y:270},
    ],
    edges: [['A','B'],['A','C'],['A','D'],['B','C'],['B','E'],['C','D'],['C','E'],['D','E']],
    // Degrees: A=3(odd),B=3(odd),C=4,D=3(odd),E=3(odd) — 4 odd: no Eulerian path!
    // Let me redesign: remove A-D to fix degrees
    // Actually let me use: edges that give exactly 0 or 2 odd nodes
    // Edges: A-B, A-C, B-C, B-D, C-D, C-E, D-E, A-E
    // Degrees: A=3(odd),B=3(odd),C=4,D=3(odd),E=3(odd) — still 4 odd.
    // Try: A-B, A-C, A-D, B-C, B-E, C-D, D-E (7 edges)
    // A=3,B=3,C=3,D=3,E=2 — 4 odd nodes. Still wrong.
    // Simpler: just use A-B,B-C,C-D,D-A,A-C,B-D (complete graph K4 minus one edge? K4=6 edges, all degree 3, all odd—no Euler path)
    // Let me use: 5 nodes, specific edges with exactly 2 odd nodes:
    // A-B, B-C, C-D, D-E, E-A, A-C, B-D — degrees: A=3,B=3,C=3,D=3,E=2 — 4 odd, no good
    // Use: A-B,A-C,B-C,C-D,D-E,C-E — degrees A=2,B=2,C=4,D=2,E=2 — all even! Eulerian circuit.
    startHint: 'All nodes have even degree — circuit exists. Start anywhere.',
    w:320, h:350,
  },
];

// Fix puzzle 3 edges
PUZZLES[2].edges = [['A','B'],['A','C'],['B','C'],['C','D'],['D','E'],['C','E']];

function edgeKey(a,b) { return [a,b].sort().join('-'); }

const MAX_TRIES = 3;

export default function DotConnection() {
  const [pIdx, setPIdx] = useState(0);
  const [path, setPath] = useState([]); // sequence of node ids
  const [usedEdges, setUsedEdges] = useState(new Set());
  const [tries, setTries] = useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState('intro');
  const [msg, setMsg] = useState('');

  const p = PUZZLES[pIdx];
  const totalEdges = p.edges.length;

  function clickNode(id) {
    if (path.length === 0) {
      setPath([id]); setMsg(''); return;
    }
    const current = path[path.length - 1];
    if (current === id) { setMsg('Select a different node.'); return; }
    const key = edgeKey(current, id);
    const exists = p.edges.some(([a,b]) => edgeKey(a,b) === key);
    if (!exists) { setMsg(`No edge between ${current} and ${id}.`); return; }
    if (usedEdges.has(key)) { setMsg(`Edge ${current}–${id} already used.`); return; }

    const newPath = [...path, id];
    const newUsed = new Set([...usedEdges, key]);
    setPath(newPath);
    setUsedEdges(newUsed);
    setMsg('');

    if (newUsed.size === totalEdges) {
      setScore(s => s + 300);
      setMsg('All edges traversed!');
      setTimeout(() => {
        if (pIdx >= PUZZLES.length - 1) { setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*'); }
        else { setPIdx(i => i+1); setPath([]); setUsedEdges(new Set()); setMsg(''); }
      }, 900);
    }
  }

  function undo() {
    if (path.length <= 1) { setPath([]); setUsedEdges(new Set()); return; }
    const prev = path[path.length-2];
    const last = path[path.length-1];
    const key = edgeKey(prev, last);
    setPath(p => p.slice(0,-1));
    setUsedEdges(s => { const ns=new Set(s); ns.delete(key); return ns; });
    setMsg('');
  }

  function reset() {
    setPIdx(0); setPath([]); setUsedEdges(new Set()); setTries(MAX_TRIES); setScore(0);
    setPhase('playing'); setMsg('');
  }

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Dot Connection</h1>
        <p className="text-center text-text-mid text-sm mb-5">Trace a path through every edge exactly once (Eulerian path). Click dots in sequence to draw your route.</p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Dot Connection</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A graph of dots connected by edges is shown. Trace a path that uses every edge <strong>exactly once</strong>."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Click a dot to start, then click an adjacent dot to draw the next edge."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "You cannot reuse an edge. Use the Undo button to backtrack."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Tip: an Eulerian path exists when exactly 0 or 2 nodes have an odd number of connections."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "If A connects to B, C, D (3 edges), A has odd degree. Start or end your path at A."}}/>
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
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">Every Edge Crossed!</h2>
              <div className="inline-flex items-center gap-2 bg-duo-yellow/15 border-2 border-duo-yellow/40 rounded-2xl px-5 py-2 mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                <span className="font-display font-black text-xl text-duo-yellow-dark">{score} XP</span>
              </div>
              <button onClick={reset} className="btn-primary w-full py-3 text-base">Play Again</button>
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
                  <span className="font-mono text-xs text-text-muted">{usedEdges.size}/{totalEdges} edges</span>
                  <div className="flex items-center gap-1.5 bg-duo-yellow/15 rounded-xl px-3 py-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                    <span className="font-mono font-bold text-sm text-duo-yellow-dark">{score} XP</span>
                  </div>
                </div>
              </div>

              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-4 mb-4 flex justify-center">
                <svg width={p.w} height={p.h} viewBox={`0 0 ${p.w} ${p.h}`}>
                  {p.edges.map(([a,b]) => {
                    const na = p.nodes.find(n=>n.id===a);
                    const nb = p.nodes.find(n=>n.id===b);
                    const used = usedEdges.has(edgeKey(a,b));
                    return (
                      <line key={edgeKey(a,b)} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                        stroke={used ? '#1CB0F6' : '#CBD5E1'} strokeWidth={used ? 3 : 1.5}
                        strokeLinecap="round"/>
                    );
                  })}
                  {p.nodes.map(n => {
                    const visitIdx = path.lastIndexOf(n.id);
                    const isCurrent = path[path.length-1] === n.id;
                    const isStart = path[0] === n.id;
                    const visited = visitIdx >= 0;
                    return (
                      <g key={n.id} onClick={()=>clickNode(n.id)} style={{cursor:'pointer'}}>
                        <circle cx={n.x} cy={n.y} r={20}
                          fill={isCurrent ? '#1CB0F6' : isStart && path.length > 1 ? '#58CC02' : visited ? '#A0D4F7' : 'white'}
                          stroke={isCurrent ? '#1589C2' : '#CBD5E1'} strokeWidth="2"/>
                        <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central"
                          fontSize="13" fontWeight="bold" fontFamily="sans-serif"
                          fill={visited ? 'white' : '#64748B'}>{n.id}</text>
                      </g>
                    );
                  })}
                </svg>
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
                <button onClick={()=>setMsg(p.startHint)}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all">
                  Hint
                </button>
                <button onClick={undo} disabled={path.length === 0}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid transition-all disabled:opacity-40">
                  Undo
                </button>
                <button onClick={()=>{setPath([]);setUsedEdges(new Set());setMsg('');}}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid transition-all">
                  Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ISAG Interactive Games — Dot Connection</p>
      </div>
    </div>
  );
}
