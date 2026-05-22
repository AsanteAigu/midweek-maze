import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Puzzles ────────────────────────────────────────────────────────────────────
// Each puzzle: an SVG path, the correct symmetry answer, explanation.
// Unique twist: hovering an option shows the shape semi-transparently rotated so
// player can visually compare before clicking.
const PUZZLES = [
  {
    label: 'F-like shape',
    answer: 'none',
    explanation: 'This shape has no rotational symmetry — rotating by any angle changes its appearance.',
    // SVG path for F-like shape
    path: 'M-20,-20 L20,-20 L20,-8 L0,-8 L0,0 L14,0 L14,12 L0,12 L0,20 L-20,20 Z',
    fill: '#1CB0F6',
  },
  {
    label: 'Plus sign',
    answer: '90°',
    explanation: 'A plus sign looks identical after rotating 90°, 180°, or 270°. It has 4-fold rotational symmetry.',
    path: 'M-6,-20 L6,-20 L6,-6 L20,-6 L20,6 L6,6 L6,20 L-6,20 L-6,6 L-20,6 L-20,-6 L-6,-6 Z',
    fill: '#58CC02',
  },
  {
    label: 'Lightning bolt (Z-shape)',
    answer: '180°',
    explanation: 'This Z/S-shape looks identical after a 180° rotation but not after 90° or 270°.',
    path: 'M-20,-20 L20,-20 L20,-6 L0,-6 L20,6 L20,20 L-20,20 L-20,6 L0,6 L-20,-6 Z',
    fill: '#CE82FF',
  },
  {
    label: 'Four-arm pinwheel',
    answer: '90°',
    explanation: 'A 4-arm pinwheel has 4-fold symmetry — it looks the same every 90°.',
    path: 'M0,-18 L8,-6 L18,-18 L18,0 L6,-8 L6,18 L-6,6 L-18,18 L-18,0 L-6,8 L-6,-18 Z',
    fill: '#FF9600',
  },
  {
    label: 'Irregular blob',
    answer: 'none',
    explanation: 'This asymmetric shape has no rotational symmetry.',
    path: 'M0,-20 Q15,-12 18,0 Q20,14 8,20 Q-4,18 -16,10 Q-22,-4 -14,-16 Q-6,-24 0,-20 Z',
    fill: '#FF4B4B',
  },
];

const OPTIONS = ['none','90°','180°','270°'];
const OPTION_LABELS = ['No symmetry','90° symmetry','180° symmetry','270° symmetry'];
const MAX_TRIES = 3;

function ShapeDisplay({ puzzle, rotation = 0, size = 160, opacity = 1 }) {
  return (
    <svg width={size} height={size} viewBox="-24 -24 48 48" style={{ opacity }}>
      <g transform={`rotate(${rotation})`}>
        <path d={puzzle.path} fill={puzzle.fill} stroke="white" strokeWidth="0.5"/>
      </g>
    </svg>
  );
}

export default function RotationalSymmetry() {
  const [pIdx,setPIdx]=useState(0);
  const [sel,setSel]=useState(null);
  const [hovering,setHovering]=useState(null); // option index being hovered
  const [tries,setTries]=useState(MAX_TRIES);
  const [score,setScore]=useState(0);
  const [phase,setPhase]=useState('intro');
  const [fb,setFb]=useState(null);
  const [msg,setMsg]=useState('');
  const [streak,setStreak]=useState(0);

  const puzzle=PUZZLES[pIdx];
  const hoverAngle = hovering!==null ? (OPTIONS[hovering]==='90°'?90:OPTIONS[hovering]==='180°'?180:OPTIONS[hovering]==='270°'?270:0) : 0;

  function submit(){
    if(sel===null){setMsg('Select an option');return;}
    const ok=OPTIONS[sel]===puzzle.answer;
    setFb(ok?'correct':'wrong');
    if(ok){
      const streakBonus=streak>=2?50:0;
      const xp=150+streakBonus;
      setScore(s=>s+xp);
      setStreak(s=>s+1);
      setMsg(`Correct!${streakBonus?` +${streakBonus} streak bonus`:''} +${xp} XP`);
      setTimeout(()=>{
        if(pIdx>=PUZZLES.length-1)setPhase('won');
        else{setPIdx(i=>i+1);setSel(null);setFb(null);setMsg('');setHovering(null);}
      },900);
    } else {
      setStreak(0);
      const t=tries-1;setTries(t);
      if(t<=0)setPhase('lost');
      else setMsg(`Wrong. ${puzzle.explanation} ${t} tries left`);
    }
  }

  function reset(){setPIdx(0);setSel(null);setTries(MAX_TRIES);setScore(0);setPhase('playing');setFb(null);setMsg('');setStreak(0);setHovering(null);}

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Rotational Symmetry</h1>
        <p className="text-center text-text-mid text-sm mb-5">Determine if the shape has rotational symmetry and at what angle. Hover an option to preview the rotation.</p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Rotational Symmetry</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A shape is displayed. Decide whether rotating it produces an identical-looking shape."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Options: No symmetry / 90° rotation / 180° rotation / 270° rotation."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A shape has <strong>90° symmetry</strong> if it looks the same after a quarter-turn."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Hover over an option to see a semi-transparent rotated preview overlaid on the shape."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A plus sign (+) looks identical after 90°, 180°, and 270°. A letter F has no rotational symmetry."}}/>
              </div>
              <button onClick={() => setPhase('playing')} className="btn-primary w-full py-3 text-base">Got it — Start Playing</button>
            </motion.div>
          )}

          {phase==='won'&&(
            <motion.div key="won" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-green rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_6px_24px_rgba(88,204,2,0.35)]">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">Expert Eye!</h2>
              <div className="inline-flex items-center gap-2 bg-duo-yellow/15 border-2 border-duo-yellow/40 rounded-2xl px-5 py-2 mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                <span className="font-display font-black text-xl text-duo-yellow-dark">{score} XP</span>
              </div>
              <button onClick={reset} className="btn-primary w-full py-3 text-base">Play Again</button>
            </motion.div>
          )}
          {phase==='lost'&&(
            <motion.div key="lost" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-red/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border-2 border-duo-red/25">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" strokeWidth="3"><path d="M6 18 18 6M6 6l12 12" strokeLinecap="round"/></svg>
              </div>
              <h2 className="font-display font-black text-2xl text-text-dark mb-2">No More Tries</h2>
              <p className="text-text-mid text-sm mb-4">{puzzle.explanation}</p>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}
          {phase==='playing'&&(
            <motion.div key={`p${pIdx}`} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xs text-text-muted">Shape</span>
                  <span className="font-mono font-bold text-xl text-text-dark">{pIdx+1}<span className="text-text-muted text-sm font-normal">/{PUZZLES.length}</span></span>
                </div>
                <div className="flex items-center gap-3">
                  {streak>=2&&<span className="font-display font-bold text-xs text-duo-orange bg-duo-orange/10 rounded-xl px-3 py-1" style={{color:'#FF9600',backgroundColor:'rgba(255,150,0,0.1)'}}>Streak ×{streak}</span>}
                  <div className="flex items-center gap-1.5 bg-duo-yellow/15 rounded-xl px-3 py-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                    <span className="font-mono font-bold text-sm text-duo-yellow-dark">{score} XP</span>
                  </div>
                  <div className="flex gap-1.5">{Array.from({length:MAX_TRIES}).map((_,i)=><div key={i} className="w-3 h-3 rounded-full" style={{background:i<tries?'#1CB0F6':'#E5E5E5'}}/>)}</div>
                </div>
              </div>

              {/* Shape display with overlay */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6 mb-4 flex flex-col items-center">
                <p className="font-display font-bold text-sm text-text-dark mb-4">{puzzle.label}</p>
                <div className="relative flex items-center justify-center" style={{width:160,height:160}}>
                  <ShapeDisplay puzzle={puzzle} rotation={0} size={160}/>
                  {hovering!==null && OPTIONS[hovering]!=='none' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShapeDisplay puzzle={{...puzzle,fill:puzzle.fill+'80'}} rotation={hoverAngle} size={160} opacity={0.5}/>
                    </div>
                  )}
                </div>
                {hovering!==null&&OPTIONS[hovering]!=='none'&&(
                  <p className="font-display font-bold text-xs text-text-muted mt-2">Previewing {OPTIONS[hovering]} rotation</p>
                )}
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {OPTIONS.map((opt,i)=>{
                  const isSel=sel===i;
                  const isOk=fb==='correct'&&isSel;
                  const isBad=fb==='wrong'&&isSel;
                  return(
                    <motion.button key={opt}
                      onClick={()=>{setSel(i);setMsg('');}}
                      onMouseEnter={()=>setHovering(i)}
                      onMouseLeave={()=>setHovering(null)}
                      whileTap={{scale:0.96}}
                      className={['py-4 rounded-2xl border-2 font-display font-bold text-sm transition-all cursor-pointer',
                        isOk?'border-duo-green bg-duo-green/10 text-duo-green-dark'
                        :isBad?'border-duo-red bg-duo-red/8 text-duo-red'
                        :isSel?'border-duo-blue bg-duo-blue/10 text-duo-blue'
                        :'border-surface-border bg-white text-text-dark hover:border-duo-blue'].join(' ')}>
                      {OPTION_LABELS[i]}
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>{msg&&<motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="bg-surface-card rounded-2xl border border-surface-border px-4 py-2.5 mb-4 text-center font-body text-sm text-text-mid">{msg}</motion.div>}</AnimatePresence>

              <button onClick={submit} disabled={sel===null}
                className={['w-full py-4 rounded-2xl font-display font-black text-lg transition-all',sel!==null?'bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer':'bg-surface-off border-2 border-surface-border text-text-muted cursor-not-allowed'].join(' ')}>
                Submit Answer
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ISAG Interactive Games — Rotational Symmetry</p>
      </div>
    </div>
  );
}
