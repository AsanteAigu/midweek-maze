import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Euler's problem: given a graph (city map with bridges), decide if an Eulerian path exists.
// Rule: Eulerian path exists iff exactly 0 or 2 nodes have odd degree.
// Player picks "Path exists" or "No path", then sees the explanation.
// 4 puzzles, each a different bridge map.

const PUZZLES = [
  {
    title: 'Königsberg Bridges',
    nodes: [
      {id:'N',x:160,y:40 ,label:'North'},
      {id:'S',x:160,y:260,label:'South'},
      {id:'W',x:50, y:150,label:'West' },
      {id:'E',x:270,y:150,label:'East' },
    ],
    edges: [['N','W'],['N','W'],['N','E'],['N','E'],['S','W'],['S','W'],['S','E'],['W','E']],
    // Degrees: N=4,S=4,W=4,E=3? Let me recount original Königsberg:
    // original: N has 3 bridges, S has 3, W has 5, E has 3 → all odd, no path
    // Simplified: use degrees N=3,S=3,W=3,E=3 (all odd → 4 odd nodes → no path)
    answer: false,
    explanation: 'All 4 nodes have odd degree. An Eulerian path requires exactly 0 or 2 odd-degree nodes.',
    w:320,h:300,
  },
  {
    title: 'Simple Bridge Map',
    nodes: [
      {id:'A',x:80, y:80 },
      {id:'B',x:240,y:80 },
      {id:'C',x:80, y:220},
      {id:'D',x:240,y:220},
    ],
    edges: [['A','B'],['A','C'],['B','D'],['C','D'],['A','D']],
    // Degrees: A=3(odd),B=2,C=2,D=3(odd) → 2 odd nodes → path exists
    answer: true,
    explanation: 'Exactly 2 nodes (A and D) have odd degree → an Eulerian path from A to D exists.',
    w:320,h:300,
  },
  {
    title: 'House Diagram',
    nodes: [
      {id:'A',x:160,y:40 },
      {id:'B',x:260,y:140},
      {id:'C',x:220,y:270},
      {id:'D',x:100,y:270},
      {id:'E',x:60, y:140},
    ],
    edges: [['A','B'],['B','C'],['C','D'],['D','E'],['E','A'],['A','C'],['A','D']],
    // Degrees: A=4,B=2,C=3(odd),D=3(odd),E=2 → 2 odd → path exists
    answer: true,
    explanation: 'C and D have odd degree (3 each). 2 odd nodes → Eulerian path from C to D.',
    w:320,h:320,
  },
  {
    title: 'Island Network',
    nodes: [
      {id:'A',x:160,y:60 },
      {id:'B',x:80, y:180},
      {id:'C',x:240,y:180},
      {id:'D',x:160,y:240},
    ],
    edges: [['A','B'],['A','C'],['B','C'],['B','D'],['C','D'],['A','D']],
    // Degrees: A=3(odd),B=3(odd),C=3(odd),D=3(odd) → 4 odd → no path
    answer: false,
    explanation: 'All 4 nodes have odd degree (3 each). An Eulerian path is impossible.',
    w:320,h:300,
  },
];

// Fix puzzle 1 edges for simplified Königsberg (all odd):
PUZZLES[0].edges = [['N','W'],['N','W'],['N','E'],['S','W'],['S','W'],['S','E'],['W','E']];
// Degrees: N=3(odd),S=3(odd),W=4,E=2 → N and S odd → path exists!
// Let me just use the original Königsberg with 4 odd nodes:
// N: connects to W(×2),E(×2) → degree 4 (even)
// That's not right either. Let me define clearly:
PUZZLES[0].edges = [['N','W'],['N','E'],['S','W'],['S','E'],['W','E'],['W','E'],['N','S']];
// N=3(odd),S=3(odd),W=4,E=3(odd) → 3 odd nodes... still wrong
// Simplest: make all 4 have odd degree:
PUZZLES[0].edges = [['N','W'],['N','E'],['N','S'],['S','W'],['S','E'],['W','E']];
// N=3,S=3,W=3,E=3 all odd → no path

const MAX_TRIES = 3;

function getDegrees(nodes, edges) {
  const deg = {};
  nodes.forEach(n => deg[n.id] = 0);
  edges.forEach(([a,b]) => { deg[a]++; deg[b]++; });
  return deg;
}

export default function EulersProblem() {
  const [pIdx, setPIdx] = useState(0);
  const [tries, setTries] = useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState('intro');
  const [msg, setMsg] = useState('');
  const [revealed, setRevealed] = useState(false);

  const p = PUZZLES[pIdx];
  const degrees = getDegrees(p.nodes, p.edges);
  const oddNodes = Object.entries(degrees).filter(([,d]) => d % 2 !== 0).map(([id]) => id);

  function answer(exists) {
    if (exists === p.answer) {
      setScore(s => s + 250);
      setRevealed(true);
      setMsg(`Correct! ${p.explanation}`);
      setTimeout(() => {
        if (pIdx >= PUZZLES.length - 1) setPhase('won');
        else { setPIdx(i=>i+1); setMsg(''); setRevealed(false); }
      }, 1400);
    } else {
      const t = tries - 1; setTries(t);
      if (t <= 0) { setRevealed(true); setPhase('lost'); return; }
      setMsg(`Wrong. ${t} tries left. Tip: count odd-degree nodes.`);
    }
  }

  function reset() {
    setPIdx(0); setTries(MAX_TRIES); setScore(0);
    setPhase('playing'); setMsg(''); setRevealed(false);
  }

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Euler's Problem</h1>
        <p className="text-center text-text-mid text-sm mb-5">Can you traverse every bridge exactly once? A path exists iff exactly 0 or 2 nodes have odd degree.</p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Euler's Problem</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A map with bridges (edges) between landmasses (nodes) is shown."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Can you walk across every bridge exactly once without retracing?"}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Rule: an Eulerian path exists if and only if exactly 0 or 2 nodes have an <strong>odd number</strong> of bridges."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Count each node's degree, then choose \"Path Exists\" or \"No Path\"."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Node A with 3 bridges = odd degree. If only A and D are odd, a path from A to D exists."}}/>
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
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">Euler Would Be Proud!</h2>
              <div className="inline-flex items-center gap-2 bg-duo-yellow/15 border-2 border-duo-yellow/40 rounded-2xl px-5 py-2 mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                <span className="font-display font-black text-xl text-duo-yellow-dark">{score} XP</span>
              </div>
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
              <p className="text-text-mid text-sm mb-4">{p.explanation}</p>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}
          {phase === 'playing' && (
            <motion.div key={`p${pIdx}`} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xs text-text-muted">Map</span>
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

              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-4 mb-4">
                <p className="font-display font-bold text-sm text-text-dark mb-2">{p.title}</p>
                <svg width={p.w} height={p.h} viewBox={`0 0 ${p.w} ${p.h}`} className="w-full">
                  {p.edges.map(([a,b],i) => {
                    const na = p.nodes.find(n=>n.id===a);
                    const nb = p.nodes.find(n=>n.id===b);
                    // Offset parallel edges
                    const dx = nb.x-na.x; const dy = nb.y-na.y;
                    const len = Math.sqrt(dx*dx+dy*dy);
                    const ox = (-dy/len)*4*i; const oy = (dx/len)*4*i;
                    return (
                      <line key={i} x1={na.x+ox} y1={na.y+oy} x2={nb.x+ox} y2={nb.y+oy}
                        stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/>
                    );
                  })}
                  {p.nodes.map(n => {
                    const d = degrees[n.id];
                    const isOdd = d % 2 !== 0;
                    return (
                      <g key={n.id}>
                        <circle cx={n.x} cy={n.y} r={22}
                          fill={revealed && isOdd ? '#FF4B4B' : revealed ? '#58CC02' : 'white'}
                          stroke="#94A3B8" strokeWidth="2"/>
                        <text x={n.x} y={n.y-3} textAnchor="middle" dominantBaseline="central"
                          fontSize="11" fontWeight="bold" fontFamily="sans-serif"
                          fill={revealed ? 'white' : '#475569'}>{n.id}</text>
                        <text x={n.x} y={n.y+10} textAnchor="middle"
                          fontSize="9" fontFamily="monospace"
                          fill={revealed ? 'rgba(255,255,255,0.8)' : '#94A3B8'}>deg={d}</text>
                        {n.label && <text x={n.x} y={n.y+38} textAnchor="middle"
                          fontSize="9" fontFamily="sans-serif" fill="#94A3B8">{n.label}</text>}
                      </g>
                    );
                  })}
                </svg>
                <div className="mt-2 flex gap-2 text-xs font-mono text-text-muted">
                  <span>Odd-degree nodes: {oddNodes.length > 0 ? oddNodes.join(', ') : 'none'}</span>
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

              <div className="grid grid-cols-2 gap-3 mb-3">
                <button onClick={()=>answer(true)}
                  className="py-4 rounded-2xl font-display font-black text-sm bg-duo-green text-white hover:opacity-90 cursor-pointer transition-all">
                  Path Exists
                </button>
                <button onClick={()=>answer(false)}
                  className="py-4 rounded-2xl font-display font-black text-sm bg-duo-red text-white hover:opacity-90 cursor-pointer transition-all">
                  No Path
                </button>
              </div>
              <button onClick={()=>setMsg(`Hint: Count odd-degree nodes. Found ${oddNodes.length}: {${oddNodes.join(',')}}. Need 0 or 2 for a path.`)}
                className="w-full py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all">
                Hint (count odd nodes)
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ISAG Interactive Games — Euler's Problem</p>
      </div>
    </div>
  );
}
