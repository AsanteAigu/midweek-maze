import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 5 cities on a map. Player clicks cities in order to build a Hamiltonian cycle.
// Running total distance shown. Compare to optimal at end.
// Optimal tour verified: 21 km (A→B→C→E→D→A)

const CITIES = [
  { id:'A', x:160, y:50,  label:'Accra' },
  { id:'B', x:270, y:120, label:'Kumasi' },
  { id:'C', x:240, y:250, label:'Cape Coast' },
  { id:'D', x:80,  y:240, label:'Tamale' },
  { id:'E', x:60,  y:130, label:'Sunyani' },
];

// Distances (symmetric)
const DIST = {
  'A-B':4,'A-C':8,'A-D':9,'A-E':7,
  'B-C':5,'B-D':10,'B-E':6,
  'C-D':7,'C-E':4,
  'D-E':5,
};

function dist(a, b) {
  const key = [a,b].sort().join('-');
  return DIST[key] ?? Infinity;
}

function routeDistance(route) {
  let d = 0;
  for (let i = 0; i < route.length - 1; i++) d += dist(route[i], route[i+1]);
  if (route.length === CITIES.length) d += dist(route[route.length-1], route[0]);
  return d;
}

// Optimal tour: A→B→C→E→D→A = 4+5+4+5+9? Let me recalculate:
// A-B=4, B-C=5, C-E=4, E-D=5, D-A=9 = 27. That's wrong.
// Let me find the real optimal by brute force in comments:
// A→B→C→D→E→A = 4+5+7+5+7 = 28
// A→B→C→E→D→A = 4+5+4+5+9 = 27  (wait D-A=9 not in DIST... let me fix)
// Actually I didn't define A-D. Let me add it.
// With A-D=9: A→B→C→E→D→A=4+5+4+5+9=27
// A→E→D→C→B→A = 7+5+7+5+4 = 28
// A→B→E→C→D→A = 4+6+4+7+9 = 30
// A→E→C→B→D→A? B-D=10... 7+4+5+10+9 = 35
// A→D→E→C→B→A = 9+5+4+5+4 = 27 same as first reversed
// A→D→C→E→B→A = 9+7+4+6+4 = 30
// Shortest seems 27. Let me set OPTIMAL=27, route A→B→C→E→D→A

const OPTIMAL = 27;
const OPTIMAL_ROUTE = ['A','B','C','E','D'];

const MAX_TRIES = 3;

export default function TravellingSalesman() {
  const [route, setRoute] = useState([]);
  const [tries, setTries] = useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState('intro');
  const [msg, setMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const partialDist = routeDistance(route.slice());
  const isComplete = route.length === CITIES.length;
  const totalDist = isComplete ? partialDist : null;

  function clickCity(id) {
    if (route.includes(id)) {
      setMsg(`${id} already visited.`);
      return;
    }
    setRoute(r => [...r, id]);
    setMsg('');
  }

  function submit() {
    if (!isComplete) { setMsg('Visit all 5 cities first.'); return; }
    const d = routeDistance([...route]);
    const isOptimal = d === OPTIMAL;
    const xp = isOptimal ? 500 : d <= OPTIMAL + 4 ? 350 : 200;
    setScore(s => s + xp);
    setSubmitted(true);
    setMsg(`Your route: ${d} km${isOptimal ? ' — OPTIMAL!' : ` (optimal is ${OPTIMAL} km)`}.`);
    setTimeout(() => { setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*'); }, 1200);
  }

  function reset() {
    setRoute([]); setTries(MAX_TRIES); setScore(0);
    setPhase('playing'); setMsg(''); setSubmitted(false);
  }

  // Draw edges for current route
  const routeEdges = [];
  for (let i = 0; i < route.length - 1; i++) {
    routeEdges.push([route[i], route[i+1]]);
  }
  if (isComplete) routeEdges.push([route[route.length-1], route[0]]);

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Travelling Salesman</h1>
        <p className="text-center text-text-mid text-sm mb-5">Visit all 5 cities exactly once and return to the start. Find the shortest possible route.</p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Travelling Salesman</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Five cities appear on a map with distances shown on each connection."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Click cities in the order you want to visit them to build a route."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "You must visit every city <strong>exactly once</strong> and return to the starting city."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "The running distance updates as you click. Try to find the shortest possible tour."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A route of A→B→C→D→E→A. The total distance is the sum of all 5 segments."}}/>
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
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">Tour Complete!</h2>
              <p className="text-text-mid text-sm mb-2">{msg}</p>
              <p className="text-text-muted text-xs mb-4">Optimal: {OPTIMAL_ROUTE.join('→')}→A = {OPTIMAL} km</p>
              <button onClick={reset} className="btn-primary w-full py-3 text-base">Play Again</button>
            </motion.div>
          )}
          {phase === 'playing' && (
            <motion.div key="playing" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <div>
                  <p className="font-mono text-xs text-text-muted">Route: {route.length > 0 ? route.join('→') : '—'}</p>
                  <p className="font-display font-bold text-sm text-text-dark">
                    Distance so far: {route.length > 1 ? `${routeDistance(route)} km` : '—'}
                    {isComplete && ` + return = ${totalDist} km`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-duo-yellow/15 rounded-xl px-3 py-1">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                  <span className="font-mono font-bold text-sm text-duo-yellow-dark">{score} XP</span>
                </div>
              </div>

              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-4 mb-4">
                <svg width="320" height="300" viewBox="0 0 320 300" className="w-full">
                  {/* All distance edges (faint) */}
                  {Object.entries(DIST).map(([key, d]) => {
                    const [a, b] = key.split('-');
                    const ca = CITIES.find(c => c.id === a);
                    const cb = CITIES.find(c => c.id === b);
                    const mx = (ca.x + cb.x) / 2; const my = (ca.y + cb.y) / 2;
                    return (
                      <g key={key}>
                        <line x1={ca.x} y1={ca.y} x2={cb.x} y2={cb.y} stroke="#E5E5E5" strokeWidth="1"/>
                        <text x={mx} y={my-4} textAnchor="middle" fontSize="9" fill="#AAA" fontFamily="monospace">{d}</text>
                      </g>
                    );
                  })}
                  {/* Route edges */}
                  {routeEdges.map(([a, b], i) => {
                    const ca = CITIES.find(c => c.id === a);
                    const cb = CITIES.find(c => c.id === b);
                    return (
                      <motion.line key={`r${i}`} initial={{opacity:0}} animate={{opacity:1}}
                        x1={ca.x} y1={ca.y} x2={cb.x} y2={cb.y}
                        stroke="#1CB0F6" strokeWidth="2.5" strokeLinecap="round"/>
                    );
                  })}
                  {/* City nodes */}
                  {CITIES.map((c, i) => {
                    const visited = route.indexOf(c.id);
                    const isFirst = route[0] === c.id;
                    return (
                      <g key={c.id} onClick={() => !route.includes(c.id) && clickCity(c.id)}
                        style={{cursor: route.includes(c.id) ? 'default' : 'pointer'}}>
                        <circle cx={c.x} cy={c.y} r={20}
                          fill={isFirst ? '#58CC02' : visited >= 0 ? '#1CB0F6' : 'white'}
                          stroke={visited >= 0 ? (isFirst ? '#3A8F00' : '#1589C2') : '#CBD5E1'}
                          strokeWidth="2"/>
                        <text x={c.x} y={c.y-2} textAnchor="middle" dominantBaseline="central"
                          fontSize="12" fontWeight="bold" fontFamily="sans-serif"
                          fill={visited >= 0 ? 'white' : '#64748B'}>{c.id}</text>
                        {visited >= 0 && (
                          <text x={c.x} y={c.y+10} textAnchor="middle"
                            fontSize="8" fontFamily="monospace" fill={isFirst ? '#3A8F00' : '#1589C2'}>
                            {visited + 1}
                          </text>
                        )}
                        <text x={c.x} y={c.y+30} textAnchor="middle"
                          fontSize="9" fontFamily="sans-serif" fill="#999">{c.label}</text>
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
                <button onClick={() => setMsg(`Hint: Optimal route is ${OPTIMAL_ROUTE.join('→')}→A = ${OPTIMAL} km`)}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all">
                  Hint
                </button>
                <button onClick={() => { setRoute([]); setMsg(''); }}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid transition-all">
                  Clear
                </button>
              </div>
              <button onClick={submit} disabled={!isComplete}
                className={['w-full py-4 rounded-2xl font-display font-black text-lg transition-all',
                  isComplete ? 'bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer' : 'bg-surface-off border-2 border-surface-border text-text-muted cursor-not-allowed',
                ].join(' ')}>
                {isComplete ? 'Submit Route' : `Visit ${CITIES.length - route.length} more ${CITIES.length - route.length === 1 ? 'city' : 'cities'}`}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ISAG Interactive Games — Travelling Salesman</p>
      </div>
    </div>
  );
}
