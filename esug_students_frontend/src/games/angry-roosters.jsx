import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Each puzzle: roosters at specific positions in a 300×260 yard.
// Player picks 1 of 4 fence configurations (SVG thumbnails).
// Only the correct config isolates every rooster in its own section (2 straight lines → 4 quadrants).
// Rooster SVG: small stylised bird

const W = 300; const H = 260;

// Fence config: one horizontal line y=hy and one vertical line x=vx
// Correct option must put each rooster in its own quadrant (different half for both H and V)

const PUZZLES = [
  {
    // Roosters: top-left, top-right, bottom-left, bottom-right of yard
    roosters: [{ x: 75, y: 65 }, { x: 225, y: 65 }, { x: 75, y: 195 }, { x: 225, y: 195 }],
    options: [
      { hy: 130, vx: 150, label: 'Centre cross' },        // CORRECT: H=130, V=150
      { hy: 90,  vx: 150, label: 'High horizontal' },     // wrong: both top roosters in same region row (y=65 < 90 → top)
      { hy: 130, vx: 80,  label: 'Left vertical' },       // wrong: left roosters x=75 > 80 so go to RIGHT region
      { hy: 130, vx: null, label: 'Horizontal only' },    // wrong: only 2 regions
    ],
    correct: 0,
    explanation: 'The centre cross (H=130, V=150) places one rooster in each of the four quadrants.',
  },
  {
    // Roosters: shifted — top-left, upper-right, lower-left, bottom-right
    roosters: [{ x: 80, y: 70 }, { x: 220, y: 100 }, { x: 90, y: 190 }, { x: 210, y: 200 }],
    options: [
      { hy: 150, vx: 100, label: 'Left-biased split' },   // wrong: both left roosters x=80 and x=90 < 100 → left region together
      { hy: 150, vx: 150, label: 'Centre cross' },        // CORRECT: Q1(x<150,y<150)=(80,70)+(220,100)? No: (220,100) x>150 → Q2. All 4 roosters in different Qs ✓
      { hy: 80,  vx: 150, label: 'Top slice' },           // wrong: (80,70) and (220,100)? y=70<80 top only (80,70) but (220,100) has y=100>80 → bottom. That works for top/bottom split... let's check all 4:
                                                           // Q1 (x<150,y<80): (80,70) ✓. Q2 (x>150,y<80): none. Q3 (x<150,y>80): (90,190) ✓. Q4 (x>150,y>80): (220,100)+(210,200) ← 2 roosters ✗
      { hy: 150, vx: null, label: 'Vertical only' },     // wrong: only 2 regions
    ],
    correct: 1,
    explanation: 'Centre cross (H=150, V=150) puts each rooster in a separate quadrant.',
  },
  {
    // Roosters in asymmetric positions — test for the correct narrow fence
    roosters: [{ x: 100, y: 80 }, { x: 220, y: 80 }, { x: 80, y: 180 }, { x: 210, y: 195 }],
    options: [
      { hy: 130, vx: 160, label: 'H=130, V=160' },  // CORRECT: Q1(x<160,y<130): (100,80) ✓. Q2(x>160,y<130): (220,80) ✓. Q3(x<160,y>130): (80,180) ✓. Q4(x>160,y>130): (210,195) ✓
      { hy: 130, vx: 95,  label: 'H=130, V=95' },   // wrong: (100,80) x=100>95 → Q2 with (220,80) ✗
      { hy: 70,  vx: 160, label: 'H=70, V=160' },   // wrong: (100,80) y=80>70 → bottom. (220,80) y>70 → Q4. Q4(x>160,y>70): (220,80)+(210,195) ← 2 roosters ✗
      { hy: 130, vx: 215, label: 'H=130, V=215' },  // wrong: (210,195) x=210<215 → Q3 with (80,180) ✗
    ],
    correct: 0,
    explanation: 'H=130, V=160 is the only split that places exactly one rooster per quadrant.',
  },
];

const MAX_TRIES = 3;

function Rooster({ x, y, size = 18 }) {
  return (
    <g transform={`translate(${x},${y})`}>
      {/* body */}
      <ellipse cx="0" cy="2" rx={size * 0.55} ry={size * 0.42} fill="#CE82FF" stroke="white" strokeWidth="0.8"/>
      {/* head */}
      <circle cx={size * 0.45} cy={-size * 0.28} r={size * 0.28} fill="#CE82FF" stroke="white" strokeWidth="0.8"/>
      {/* comb */}
      <polygon points={`${size*0.4},-${size*0.6} ${size*0.5},-${size*0.45} ${size*0.6},-${size*0.55}`} fill="#FF4B4B"/>
      {/* beak */}
      <polygon points={`${size*0.7},-${size*0.28} ${size*0.85},-${size*0.22} ${size*0.7},-${size*0.15}`} fill="#FF9600"/>
      {/* tail feathers */}
      <path d={`M-${size*0.55},2 Q-${size*0.9},-${size*0.3} -${size*0.7},-${size*0.5}`} fill="none" stroke="#FF9600" strokeWidth="2.5"/>
      <path d={`M-${size*0.55},2 Q-${size*0.95},0 -${size*0.75},-${size*0.2}`} fill="none" stroke="#FF9600" strokeWidth="2"/>
      {/* legs */}
      <line x1={-size*0.1} y1={size*0.42} x2={-size*0.1} y2={size*0.65} stroke="#FF9600" strokeWidth="1.5"/>
      <line x1={size*0.1} y1={size*0.42} x2={size*0.1} y2={size*0.65} stroke="#FF9600" strokeWidth="1.5"/>
    </g>
  );
}

function YardSVG({ roosters, hy, vx, showFences = true, mini = false }) {
  const scale = mini ? 0.58 : 1;
  const sw = W * scale; const sh = H * scale;
  return (
    <svg width={sw} height={sh} viewBox={`0 0 ${W} ${H}`} style={{ borderRadius: 12, overflow: 'hidden' }}>
      {/* ground */}
      <rect x="0" y="0" width={W} height={H} fill="#F0F7E6"/>
      <rect x="0" y="0" width={W} height={H} fill="none" stroke="#C8E0A0" strokeWidth="3"/>
      {/* fences */}
      {showFences && hy !== null && (
        <line x1={0} y1={hy} x2={W} y2={hy} stroke="#8B5E3C" strokeWidth={mini ? 2 : 3} strokeDasharray="8,4"/>
      )}
      {showFences && vx !== null && (
        <line x1={vx} y1={0} x2={vx} y2={H} stroke="#8B5E3C" strokeWidth={mini ? 2 : 3} strokeDasharray="8,4"/>
      )}
      {roosters.map((r, i) => <Rooster key={i} x={r.x} y={r.y} size={mini ? 12 : 18}/>)}
    </svg>
  );
}

export default function AngryRoosters() {
  const [pIdx, setPIdx] = useState(0);
  const [sel, setSel] = useState(null);
  const [tries, setTries] = useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState('intro');
  const [fb, setFb] = useState(null);
  const [msg, setMsg] = useState('');

  const p = PUZZLES[pIdx];

  function submit() {
    if (sel === null) { setMsg('Select a fence configuration first.'); return; }
    if (sel === p.correct) {
      setFb('correct');
      setScore(s => s + 150);
      setMsg('Correct! Each rooster has its own pen.');
      setTimeout(() => {
        if (pIdx >= PUZZLES.length - 1) setPhase('won');
        else { setPIdx(i => i + 1); setSel(null); setFb(null); setMsg(''); }
      }, 900);
    } else {
      setFb('wrong');
      const t = tries - 1; setTries(t);
      if (t <= 0) setPhase('lost');
      else setMsg(`Wrong — that config leaves roosters sharing a section. ${t} tries left.`);
    }
  }

  function reset() {
    setPIdx(0); setSel(null); setTries(MAX_TRIES); setScore(0);
    setPhase('playing'); setFb(null); setMsg('');
  }

  const opt = p.options;

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Angry Roosters</h1>
        <p className="text-center text-text-mid text-sm mb-5">Draw 2 straight fence lines to give each rooster its own pen. Pick the correct configuration.</p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Angry Roosters</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Four roosters are in a yard. If two share a section, they fight!"}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Two straight fence lines divide the yard into four sections."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Four fence configurations are shown. Pick the one that gives each rooster its own section."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A horizontal line at mid-height and a vertical line at mid-width creates four equal quadrants."}}/>
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
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">Peace Restored!</h2>
              <div className="inline-flex items-center gap-2 bg-duo-yellow/15 border-2 border-duo-yellow/40 rounded-2xl px-5 py-2 mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                <span className="font-display font-black text-xl text-duo-yellow-dark">{score} XP</span>
              </div>
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
              <p className="text-text-mid text-sm mb-4">{p.explanation}</p>
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

              {/* Yard preview (no fences) */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4 flex flex-col items-center">
                <p className="font-display font-bold text-sm text-text-dark mb-3">The Yard — 4 angry roosters</p>
                <YardSVG roosters={p.roosters} hy={null} vx={null} showFences={false}/>
              </div>

              {/* 4 fence options */}
              <p className="font-display font-black text-xs text-text-muted uppercase tracking-wider mb-2 px-1">Choose a fence configuration:</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {opt.map((o, i) => {
                  const isSel = sel === i;
                  const isOk = fb === 'correct' && isSel;
                  const isBad = fb === 'wrong' && isSel;
                  return (
                    <motion.button key={i} onClick={() => { setSel(i); setMsg(''); }} whileTap={{ scale: 0.97 }}
                      className={['flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all cursor-pointer',
                        isOk ? 'border-duo-green bg-[#58CC02]/10'
                        : isBad ? 'border-duo-red bg-[#FF4B4B]/10'
                        : isSel ? 'border-duo-blue bg-[#1CB0F6]/10'
                        : 'border-surface-border bg-white hover:border-duo-blue',
                      ].join(' ')}>
                      <YardSVG roosters={p.roosters} hy={o.hy} vx={o.vx} mini/>
                      <span className="font-display font-bold text-xs text-text-dark">{o.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>
                {msg && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-surface-card rounded-2xl border border-surface-border px-4 py-2.5 mb-4 text-center font-body text-sm text-text-mid">
                    {msg}
                  </motion.div>
                )}
              </AnimatePresence>

              <button onClick={submit} disabled={sel === null}
                className={['w-full py-4 rounded-2xl font-display font-black text-lg transition-all',
                  sel !== null ? 'bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer' : 'bg-surface-off border-2 border-surface-border text-text-muted cursor-not-allowed',
                ].join(' ')}>
                Confirm Fence Layout
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ISAG Interactive Games — Angry Roosters</p>
      </div>
    </div>
  );
}
