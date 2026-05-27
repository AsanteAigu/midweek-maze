import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const C = ['#1CB0F6','#58CC02','#CE82FF'];

function Cell({ shape, color, count, rotation=0, size=56, blank=false }) {
  if (blank) return (
    <div className="rounded-xl border-2 border-dashed border-surface-border-strong bg-surface-off flex items-center justify-center" style={{width:size,height:size}}>
      <span className="font-display font-black text-2xl text-text-muted">?</span>
    </div>
  );
  const pos = count===1?[[0,0]]:count===2?[[-10,0],[10,0]]:[[-10,-7],[10,-7],[0,9]];
  return (
    <div className="rounded-xl border-2 border-surface-border bg-white flex items-center justify-center" style={{width:size,height:size}}>
      <svg width={size-8} height={size-8} viewBox="-26 -26 52 52">
        {pos.map(([x,y],i)=>(
          <g key={i} transform={`translate(${x},${y}) rotate(${rotation})`}>
            {shape==='circle'   && <circle cx="0" cy="0" r="8" fill={color}/>}
            {shape==='square'   && <rect x="-8" y="-8" width="16" height="16" rx="2" fill={color}/>}
            {shape==='triangle' && <polygon points="0,-9 8,7 -8,7" fill={color}/>}
            {shape==='diamond'  && <polygon points="0,-9 9,0 0,9 -9,0" fill={color}/>}
          </g>
        ))}
      </svg>
    </div>
  );
}

const PUZZLES = [
  {
    rule:'Color cycles across each row: blue→green→purple',
    grid:[
      {shape:'circle',color:C[0],count:1},{shape:'circle',color:C[1],count:1},{shape:'circle',color:C[2],count:1},
      {shape:'circle',color:C[1],count:1},{shape:'circle',color:C[2],count:1},{shape:'circle',color:C[0],count:1},
      {shape:'circle',color:C[2],count:1},{shape:'circle',color:C[0],count:1},null,
    ],
    blank:8,
    options:[
      {shape:'circle',color:C[1],count:1},
      {shape:'circle',color:C[2],count:1},
      {shape:'circle',color:C[0],count:1},
      {shape:'square', color:C[1],count:1},
    ],
    correct:0,
  },
  {
    rule:'Shape changes each row: circle→square→triangle',
    grid:[
      {shape:'circle',  color:C[0],count:1},{shape:'circle',  color:C[1],count:1},{shape:'circle',  color:C[2],count:1},
      {shape:'square',  color:C[0],count:1},{shape:'square',  color:C[1],count:1},{shape:'square',  color:C[2],count:1},
      {shape:'triangle',color:C[0],count:1},null,{shape:'triangle',color:C[2],count:1},
    ],
    blank:7,
    options:[
      {shape:'triangle',color:C[1],count:1},
      {shape:'circle',  color:C[1],count:1},
      {shape:'square',  color:C[1],count:1},
      {shape:'triangle',color:C[0],count:1},
    ],
    correct:0,
  },
  {
    rule:'Count increases down each row: 1→2→3',
    grid:[
      {shape:'circle',color:C[0],count:1},{shape:'circle',color:C[1],count:1},{shape:'circle',color:C[2],count:1},
      {shape:'circle',color:C[0],count:2},{shape:'circle',color:C[1],count:2},{shape:'circle',color:C[2],count:2},
      null,{shape:'circle',color:C[1],count:3},{shape:'circle',color:C[2],count:3},
    ],
    blank:0,
    options:[
      {shape:'circle',color:C[0],count:3},
      {shape:'circle',color:C[0],count:1},
      {shape:'circle',color:C[0],count:2},
      {shape:'square',color:C[0],count:3},
    ],
    correct:0,
  },
  {
    rule:'Triangle rotates +90° each column: 0°→90°→180°',
    grid:[
      {shape:'triangle',color:C[0],count:1,rotation:0},  {shape:'triangle',color:C[0],count:1,rotation:90}, {shape:'triangle',color:C[0],count:1,rotation:180},
      {shape:'triangle',color:C[1],count:1,rotation:0},  {shape:'triangle',color:C[1],count:1,rotation:90}, null,
      {shape:'triangle',color:C[2],count:1,rotation:0},  {shape:'triangle',color:C[2],count:1,rotation:90}, {shape:'triangle',color:C[2],count:1,rotation:180},
    ],
    blank:5,
    options:[
      {shape:'triangle',color:C[1],count:1,rotation:180},
      {shape:'triangle',color:C[1],count:1,rotation:270},
      {shape:'triangle',color:C[1],count:1,rotation:0},
      {shape:'triangle',color:C[2],count:1,rotation:180},
    ],
    correct:0,
  },
  {
    rule:'Shape (column) and count (row) both change: col0=circle, col1=square, col2=diamond; row0=1, row1=2, row2=3',
    grid:[
      {shape:'circle', color:C[0],count:1},{shape:'square',  color:C[0],count:1},{shape:'diamond',color:C[0],count:1},
      {shape:'circle', color:C[1],count:2},{shape:'square',  color:C[1],count:2},{shape:'diamond',color:C[1],count:2},
      {shape:'circle', color:C[2],count:3},null,{shape:'diamond',color:C[2],count:3},
    ],
    blank:7,
    options:[
      {shape:'square', color:C[2],count:3},
      {shape:'circle', color:C[2],count:3},
      {shape:'square', color:C[0],count:3},
      {shape:'diamond',color:C[2],count:2},
    ],
    correct:0,
  },
];

const MAX_TRIES=3;

export default function PatternCompletion() {
  const [pIdx,setPIdx]=useState(0);
  const [sel,setSel]=useState(null);
  const [tries,setTries]=useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [phase,setPhase]=useState('intro');
  const [fb,setFb]=useState(null);
  const [msg,setMsg]=useState('');
  const [hint,setHint]=useState(false);

  // Shuffle options once per puzzle
  const [shuffled]=useState(()=>PUZZLES.map(p=>{
    const o=[...p.options.map((x,i)=>({...x,i}))];
    for(let i=o.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[o[i],o[j]]=[o[j],o[i]];}
    return o;
  }));

  const puzzle=PUZZLES[pIdx];

  function submit(){
    if(sel===null){setMsg('Select an option first');return;}
    const ok=shuffled[pIdx][sel].i===puzzle.correct;
    setFb(ok?'correct':'wrong');
    if(ok){
      const xp=Math.max(150-(hint?50:0),30);
      setScore(s=>s+xp);
      setMsg(`Correct!`);
      setHint(false);
      setTimeout(()=>{
        if(pIdx>=PUZZLES.length-1){ setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*'); }
        else{setPIdx(i=>i+1);setSel(null);setFb(null);setMsg('');}
      },900);
    } else {
      const t=tries-1; setTries(t);
      if(t<=0)setPhase('lost');
      else setMsg(`Wrong — Rule: ${puzzle.rule}. ${t} tries left`);
    }
  }

  function reset(){setPIdx(0);setSel(null);setTries(MAX_TRIES);setScore(0);setPhase('playing');setFb(null);setMsg('');setHint(false);}

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Pattern Completion</h1>
        <p className="text-center text-text-mid text-sm mb-5">Deduce the rule governing the 3×3 grid. Select the option that fills the missing cell.</p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Pattern Completion</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A 3×3 grid of visual patterns is shown with one cell missing (marked ?)."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Study the rows and columns to find the hidden rule — color cycle, shape change, count, or rotation."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Choose from four options (A–D) which fills the missing cell correctly."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Use the Hint button to reveal the rule name (costs XP)."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "If shapes change circle→square→triangle across rows and colors cycle blue→green→purple, find the option with the right shape AND color."}}/>
              </div>
              <button onClick={() => setPhase('playing')} className="btn-primary w-full py-3 text-base">Got it — Start Playing</button>
            </motion.div>
          )}

          {phase==='won'&&(
            <motion.div key="won" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-green rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_6px_24px_rgba(88,204,2,0.35)]">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">All Patterns Found!</h2>
              <button onClick={reset} className="btn-primary w-full py-3 text-base">Play Again</button>
            </motion.div>
          )}
          {phase==='lost'&&(
            <motion.div key="lost" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-red/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border-2 border-duo-red/25">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" strokeWidth="3"><path d="M6 18 18 6M6 6l12 12" strokeLinecap="round"/></svg>
              </div>
              <h2 className="font-display font-black text-2xl text-text-dark mb-2">No More Tries</h2>
              <p className="text-text-mid text-sm mb-5 font-body">Rule was: {puzzle.rule}</p>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}
          {phase==='playing'&&(
            <motion.div key={`p${pIdx}`} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <span className="font-display font-bold text-xs text-text-muted">Puzzle {pIdx+1}/{PUZZLES.length}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-duo-yellow/15 rounded-xl px-3 py-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                    <span className="font-mono font-bold text-sm text-duo-yellow-dark">{score} XP</span>
                  </div>
                  <div className="flex gap-1.5">{Array.from({length:MAX_TRIES}).map((_,i)=><div key={i} className="w-3 h-3 rounded-full" style={{background:i<tries?'#1CB0F6':'#E5E5E5'}}/>)}</div>
                </div>
              </div>
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4">
                <div className="grid gap-2 mx-auto w-fit mb-2" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
                  {puzzle.grid.map((cell,i)=>(
                    <Cell key={i} {...(cell||{})} blank={i===puzzle.blank} size={64}/>
                  ))}
                </div>
              </div>
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4">
                <p className="font-display font-bold text-xs text-text-muted uppercase tracking-wider mb-3">Which option completes the pattern?</p>
                <div className="grid grid-cols-4 gap-3">
                  {shuffled[pIdx].map((opt,i)=>{
                    const isSel=sel===i;
                    const isOk=fb==='correct'&&isSel;
                    const isBad=fb==='wrong'&&isSel;
                    return(
                      <motion.button key={i} onClick={()=>{setSel(i);setMsg('');}} whileTap={{scale:0.92}}
                        className={['flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all cursor-pointer',
                          isOk?'border-duo-green bg-duo-green/10':isBad?'border-duo-red bg-duo-red/8':isSel?'border-duo-blue bg-duo-blue/10':'border-surface-border bg-white hover:border-duo-blue'].join(' ')}>
                        <span className="font-display font-black text-xs text-text-muted">{['A','B','C','D'][i]}</span>
                        <Cell {...opt} size={52}/>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
              <AnimatePresence>{msg&&<motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="bg-surface-card rounded-2xl border border-surface-border px-4 py-2.5 mb-4 text-center font-body text-sm text-text-mid">{msg}</motion.div>}</AnimatePresence>
              <div className="flex gap-3 mb-3">
                <button onClick={()=>{ window.parent.postMessage({ type: 'HINT_USED' }, '*'); setHint(true);setMsg(`Hint: ${puzzle.rule}`);}} disabled={hint}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all disabled:opacity-40">
                  Hint <span className="font-normal text-text-muted"></span>
                </button>
                <button onClick={()=>{setSel(null);setMsg('');}} className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid transition-all">Clear</button>
              </div>
              <button onClick={submit} disabled={sel===null}
                className={['w-full py-4 rounded-2xl font-display font-black text-lg transition-all',sel!==null?'bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer':'bg-surface-off border-2 border-surface-border text-text-muted cursor-not-allowed'].join(' ')}>
                Submit Answer
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ESUG Interactive Games — Pattern Completion</p>
      </div>
    </div>
  );
}
