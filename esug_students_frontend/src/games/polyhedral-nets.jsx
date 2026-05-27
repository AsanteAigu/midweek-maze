import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Consistent colors for ALL options (correct AND wrong) ─────────────────────
// Rectangles / squares: SQ  |  Triangles: TRI  |  Stroke: always white
// The only thing that differentiates correct from wrong is GEOMETRY, not color.
const SQ  = '#60A5FA';   // calm blue  — used for every rectangle/square face
const TRI = '#34D399';   // calm green — used for every triangular face
const ST  = 'white';     // stroke

// ── Helper ────────────────────────────────────────────────────────────────────
const R = ({ x, y, w, h, fill = SQ }) => (
  <rect x={x} y={y} width={w} height={h} fill={fill} stroke={ST} strokeWidth="1.2"/>
);
const T = ({ points, fill = TRI }) => (
  <polygon points={points} fill={fill} stroke={ST} strokeWidth="1.2"/>
);

const VS = 80; // viewBox size for each option thumbnail

// ═══════════════════════════════════════════════════════════════════════════════
// CUBE nets  (6 squares in different configurations)
// Valid: classic T-cross  |  Invalids: straight line-6, L+gap, 2×3 rect
// ═══════════════════════════════════════════════════════════════════════════════
const S = 14; // square size

// Valid cube net — T-cross: [ . X . . ] / [ X X X X ] / [ . X . . ]
const cubeNetValid = (
  <svg viewBox={`0 0 ${VS} ${VS}`} width={VS} height={VS}>
    <R x={23} y={10} w={S} h={S}/>                       {/* top centre */}
    <R x={9}  y={24} w={S} h={S}/>                       {/* left */}
    <R x={23} y={24} w={S} h={S}/>                       {/* centre */}
    <R x={37} y={24} w={S} h={S}/>                       {/* right */}
    <R x={51} y={24} w={S} h={S}/>                       {/* far right */}
    <R x={23} y={38} w={S} h={S}/>                       {/* bottom centre */}
  </svg>
);
// Invalid: all 6 in a row — cannot fold into a cube
const cubeNetWrong1 = (
  <svg viewBox={`0 0 ${VS} ${VS}`} width={VS} height={VS}>
    {[0,1,2,3,4,5].map(i => <R key={i} x={4+i*12} y={32} w={11} h={11}/>)}
  </svg>
);
// Invalid: 2×3 rectangle
const cubeNetWrong2 = (
  <svg viewBox={`0 0 ${VS} ${VS}`} width={VS} height={VS}>
    {[0,1,2].map(i => [<R key={`a${i}`} x={19+i*14} y={24} w={13} h={13}/>, <R key={`b${i}`} x={19+i*14} y={37} w={13} h={13}/>])}
  </svg>
);
// Invalid: S-zigzag (4+2)
const cubeNetWrong3 = (
  <svg viewBox={`0 0 ${VS} ${VS}`} width={VS} height={VS}>
    {[0,1,2,3].map(i => <R key={i} x={8+i*13} y={22} w={12} h={12}/>)}
    {[0,1].map(i => <R key={`b${i}`} x={21+i*13} y={34} w={12} h={12}/>)}
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// TRIANGULAR PRISM nets  (3 rectangles in a row + 2 triangles on centre rect)
// ═══════════════════════════════════════════════════════════════════════════════
const RW = 13; const RH = 10; const TH = 9;

// Valid: 3 rects in row, triangle above and below the middle rect
const prismNetValid = (
  <svg viewBox={`0 0 ${VS} ${VS}`} width={VS} height={VS}>
    <R x={18} y={28} w={RW} h={RH}/>
    <R x={31} y={28} w={RW} h={RH}/>
    <R x={44} y={28} w={RW} h={RH}/>
    <T points={`37,22 31,28 44,28`}/>          {/* triangle above middle */}
    <T points={`37,44 31,38 44,38`}/>          {/* triangle below middle */}
  </svg>
);
// Invalid: triangles above the wrong rect (first one)
const prismNetWrong1 = (
  <svg viewBox={`0 0 ${VS} ${VS}`} width={VS} height={VS}>
    <R x={18} y={28} w={RW} h={RH}/>
    <R x={31} y={28} w={RW} h={RH}/>
    <R x={44} y={28} w={RW} h={RH}/>
    <T points={`24,22 18,28 31,28`}/>          {/* triangle above FIRST rect */}
    <T points={`37,44 31,38 44,38`}/>
  </svg>
);
// Invalid: rects in an L, triangles misplaced
const prismNetWrong2 = (
  <svg viewBox={`0 0 ${VS} ${VS}`} width={VS} height={VS}>
    <R x={18} y={22} w={RW} h={RH}/>
    <R x={18} y={32} w={RW} h={RH}/>
    <R x={31} y={32} w={RW} h={RH}/>
    <T points={`24,18 18,24 31,24`}/>
    <T points={`24,50 18,44 31,44`}/>
  </svg>
);
// Invalid: 4 rects in a row (too many rectangles)
const prismNetWrong3 = (
  <svg viewBox={`0 0 ${VS} ${VS}`} width={VS} height={VS}>
    {[0,1,2,3].map(i => <R key={i} x={10+i*14} y={28} w={13} h={10}/>)}
    <T points={`23,22 17,28 30,28`}/>
    <T points={`23,44 17,38 30,38`}/>
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// TETRAHEDRON nets  (4 equilateral triangles — a strip of 4 is one valid net)
// ═══════════════════════════════════════════════════════════════════════════════
const TW = 14; // triangle width

// Valid: strip of 4 triangles alternating up/down
const tetraNetValid = (
  <svg viewBox={`0 0 ${VS} ${VS}`} width={VS} height={VS}>
    <T points={`15,50 22,38 29,50`}/>
    <T points={`29,38 22,38 36,38 `}/>
    <T points={`29,50 36,38 43,50`}/>
    <T points={`43,38 36,38 50,38`}/>
  </svg>
);
// Wrong: only 3 triangles
const tetraNetWrong1 = (
  <svg viewBox={`0 0 ${VS} ${VS}`} width={VS} height={VS}>
    <T points={`15,50 22,38 29,50`}/>
    <T points={`29,38 22,38 36,38`}/>
    <T points={`29,50 36,38 43,50`}/>
  </svg>
);
// Wrong: 4 triangles but disconnected (all pointing up)
const tetraNetWrong2 = (
  <svg viewBox={`0 0 ${VS} ${VS}`} width={VS} height={VS}>
    <T points={`15,50 22,38 29,50`}/>
    <T points={`33,50 40,38 47,50`}/>
    <T points={`15,32 22,20 29,32`}/>
    <T points={`33,32 40,20 47,32`}/>
  </svg>
);
// Wrong: 5 triangles
const tetraNetWrong3 = (
  <svg viewBox={`0 0 ${VS} ${VS}`} width={VS} height={VS}>
    {[0,1,2,3,4].map(i => <T key={i} points={`${10+i*12},50 ${16+i*12},38 ${22+i*12},50`}/>)}
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// SQUARE PYRAMID nets  (1 square + 4 triangles attached to each side of square)
// ═══════════════════════════════════════════════════════════════════════════════
const PSZ = 16; // pyramid square size

// Valid: cross — square with 4 triangles on all 4 edges
const pyrNetValid = (
  <svg viewBox={`0 0 ${VS} ${VS}`} width={VS} height={VS}>
    <R x={32} y={32} w={PSZ} h={PSZ}/>
    <T points={`40,24 32,32 48,32`}/>  {/* top */}
    <T points={`40,56 32,48 48,48`}/>  {/* bottom */}
    <T points={`24,40 32,32 32,48`}/>  {/* left */}
    <T points={`56,40 48,32 48,48`}/>  {/* right */}
  </svg>
);
// Wrong: square with only 3 triangles
const pyrNetWrong1 = (
  <svg viewBox={`0 0 ${VS} ${VS}`} width={VS} height={VS}>
    <R x={32} y={32} w={PSZ} h={PSZ}/>
    <T points={`40,24 32,32 48,32`}/>
    <T points={`40,56 32,48 48,48`}/>
    <T points={`24,40 32,32 32,48`}/>
  </svg>
);
// Wrong: square with 4 triangles but triangles are on same side (invalid fold)
const pyrNetWrong2 = (
  <svg viewBox={`0 0 ${VS} ${VS}`} width={VS} height={VS}>
    <R x={32} y={36} w={PSZ} h={PSZ}/>
    {[0,1,2,3].map(i => <T key={i} points={`${24+i*8},28 ${24+i*8},36 ${32+i*8},36`}/>)}
  </svg>
);
// Wrong: no square, 5 triangles
const pyrNetWrong3 = (
  <svg viewBox={`0 0 ${VS} ${VS}`} width={VS} height={VS}>
    {[0,1,2,3,4].map(i => <T key={i} points={`${10+i*12},50 ${16+i*12},38 ${22+i*12},50`}/>)}
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// OCTAHEDRON nets  (8 equilateral triangles — 2 rows of 4)
// ═══════════════════════════════════════════════════════════════════════════════

// Valid: 2 rows of 4 alternating triangles
const octaNetValid = (
  <svg viewBox={`0 0 ${VS} ${VS}`} width={VS} height={VS}>
    {[0,1,2,3].map(i => <T key={`t${i}`} points={`${10+i*15},24 ${17+i*15},36 ${24+i*15},24`}/>)}
    {[0,1,2,3].map(i => <T key={`b${i}`} points={`${10+i*15},48 ${17+i*15},36 ${24+i*15},48`}/>)}
  </svg>
);
// Wrong: only 6 triangles
const octaNetWrong1 = (
  <svg viewBox={`0 0 ${VS} ${VS}`} width={VS} height={VS}>
    {[0,1,2].map(i => <T key={`t${i}`} points={`${10+i*15},24 ${17+i*15},36 ${24+i*15},24`}/>)}
    {[0,1,2].map(i => <T key={`b${i}`} points={`${10+i*15},48 ${17+i*15},36 ${24+i*15},48`}/>)}
  </svg>
);
// Wrong: 8 triangles all in one row
const octaNetWrong2 = (
  <svg viewBox={`0 0 ${VS} ${VS}`} width={VS} height={VS}>
    {[0,1,2,3,4,5,6,7].map(i => <T key={i} points={`${4+i*9},46 ${8+i*9},36 ${13+i*9},46`}/>)}
  </svg>
);
// Wrong: 2 rows but rows are same direction (both pointing up)
const octaNetWrong3 = (
  <svg viewBox={`0 0 ${VS} ${VS}`} width={VS} height={VS}>
    {[0,1,2,3].map(i => <T key={`t${i}`} points={`${10+i*15},26 ${17+i*15},38 ${24+i*15},26`}/>)}
    {[0,1,2,3].map(i => <T key={`b${i}`} points={`${10+i*15},44 ${17+i*15},56 ${24+i*15},44`}/>)}
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// PUZZLES
// ═══════════════════════════════════════════════════════════════════════════════
const PUZZLES = [
  {
    shape: 'Cube',
    desc: '6 equal square faces',
    options: [cubeNetWrong1, cubeNetWrong2, cubeNetValid, cubeNetWrong3],
    correct: 2,
    explanation: 'The T-cross net has 6 squares correctly arranged to fold into a cube. A straight row of 6 squares cannot fold.',
  },
  {
    shape: 'Triangular Prism',
    desc: '2 triangular faces + 3 rectangular faces',
    options: [prismNetWrong1, prismNetValid, prismNetWrong2, prismNetWrong3],
    correct: 1,
    explanation: '3 rectangles in a row with a triangle centred above AND below the middle rectangle folds correctly into a prism.',
  },
  {
    shape: 'Tetrahedron',
    desc: '4 equilateral triangular faces',
    options: [tetraNetWrong1, tetraNetWrong2, tetraNetValid, tetraNetWrong3],
    correct: 2,
    explanation: 'A strip of 4 alternating-direction triangles folds into a tetrahedron. Fewer than 4 triangles or disconnected ones do not.',
  },
  {
    shape: 'Square Pyramid',
    desc: '1 square base + 4 triangular faces',
    options: [pyrNetWrong1, pyrNetWrong2, pyrNetValid, pyrNetWrong3],
    correct: 2,
    explanation: 'One central square with triangles attached to all 4 edges folds into a square pyramid.',
  },
  {
    shape: 'Octahedron',
    desc: '8 equilateral triangular faces',
    options: [octaNetWrong1, octaNetWrong2, octaNetWrong3, octaNetValid],
    correct: 3,
    explanation: 'Two rows of 4 triangles (alternating up-down-up-down) fold into an octahedron.',
  },
];

const MAX_TRIES = 3;

export default function PolyhedralNets() {
  const [pIdx, setPIdx] = useState(0);
  const [sel,  setSel]  = useState(null);
  const [tries, setTries] = useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState('intro');
  const [fb,    setFb]   = useState(null);
  const [msg,   setMsg]  = useState('');

  const p = PUZZLES[pIdx];

  function submit() {
    if (sel === null) { setMsg('Select a net first.'); return; }
    if (sel === p.correct) {
      setFb('correct');
      setScore(s => s + 250);
      setMsg('Correct net!');
      setTimeout(() => {
        if (pIdx >= PUZZLES.length - 1) {
          setPhase('won');
          window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*');
        } else { setPIdx(i => i + 1); setSel(null); setFb(null); setMsg(''); }
      }, 900);
    } else {
      setFb('wrong');
      const t = tries - 1; setTries(t);
      if (t <= 0) setPhase('lost');
      else setMsg(`Wrong — that arrangement doesn't fold into a ${p.shape}. ${t} tries left.`);
    }
  }

  function reset() {
    setPIdx(0); setSel(null); setTries(MAX_TRIES); setScore(0);
    setPhase('intro'); setFb(null); setMsg('');
  }

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Polyhedral Nets</h1>
        <p className="text-center text-text-mid text-sm mb-5">A net is a 2D shape that folds into a 3D solid. Pick the net that folds into the given polyhedron.</p>

        <AnimatePresence mode="wait">

          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Polyhedral Nets</h2>
              <div className="space-y-3 mb-5">
                {[
                  'A 3D solid is named and described.',
                  'Four flat 2D arrangements of faces (nets) are shown as options A–D.',
                  'Pick the <strong>one net that correctly folds</strong> into the named shape — no gaps, no overlaps.',
                  'Tip: count the faces first. Then imagine folding along each shared edge.',
                ].map((s, i) => (
                  <div key={i} className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                    <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">{i+1}</span>
                    <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: s}}/>
                  </div>
                ))}
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid">A cube has 6 square faces. A valid net has those 6 squares connected edge-to-edge so that folding closes every face with no overlaps.</p>
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
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">3D Vision!</h2>
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
                  <span className="font-display font-bold text-xs text-text-muted">Shape</span>
                  <span className="font-mono font-bold text-xl text-text-dark">{pIdx+1}<span className="text-text-muted text-sm font-normal">/{PUZZLES.length}</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-duo-yellow/15 rounded-xl px-3 py-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                    <span className="font-mono font-bold text-sm text-duo-yellow-dark">{score} XP</span>
                  </div>
                  <div className="flex gap-1.5">{Array.from({length:MAX_TRIES}).map((_,i) => (
                    <div key={i} className="w-3 h-3 rounded-full" style={{background:i<tries?'#1CB0F6':'#E5E5E5'}}/>
                  ))}</div>
                </div>
              </div>

              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4 text-center">
                <p className="font-display font-black text-2xl text-text-dark">{p.shape}</p>
                <p className="font-body text-sm text-text-mid">{p.desc}</p>
              </div>

              <p className="font-display font-black text-xs text-text-muted uppercase tracking-wider mb-2 px-1">Which net folds into this shape?</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {p.options.map((net, i) => {
                  const isSel = sel === i;
                  const isOk  = fb === 'correct' && isSel;
                  const isBad = fb === 'wrong'   && isSel;
                  return (
                    <motion.button key={i} onClick={() => { if (!fb) { setSel(i); setMsg(''); } }} whileTap={{scale:0.97}}
                      className={['flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border-2 min-h-[100px] transition-all cursor-pointer',
                        isOk  ? 'border-duo-green bg-[#58CC02]/10'
                        : isBad ? 'border-duo-red bg-[#FF4B4B]/10'
                        : isSel ? 'border-duo-blue bg-[#1CB0F6]/10'
                        : 'border-surface-border bg-white hover:border-duo-blue',
                      ].join(' ')}>
                      <span className="font-display font-black text-xs text-text-muted">{['A','B','C','D'][i]}</span>
                      {net}
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>
                {msg && (
                  <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                    className="bg-surface-card rounded-2xl border border-surface-border px-4 py-2.5 mb-4 text-center font-body text-sm text-text-mid">
                    {msg}
                  </motion.div>
                )}
              </AnimatePresence>

              <button onClick={submit} disabled={sel === null}
                className={['w-full py-4 rounded-2xl font-display font-black text-lg transition-all',
                  sel !== null ? 'bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer' : 'bg-surface-off border-2 border-surface-border text-text-muted cursor-not-allowed',
                ].join(' ')}>
                Submit Answer
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ESUG Interactive Games — Polyhedral Nets</p>
      </div>
    </div>
  );
}
