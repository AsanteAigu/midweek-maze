import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Boolean SAT in CNF. Player assigns T/F to variables.
// Each clause highlighted green (satisfied) or red (violated) in real time.
// Verified solutions: multiple valid assignments exist; any satisfying one wins.

const FORMULAS = [
  {
    vars: ['A','B','C'],
    clauses: [
      [['A',true],['B',true]],           // A ∨ B
      [['A',false],['C',true]],          // ¬A ∨ C
      [['B',true],['C',false]],          // B ∨ ¬C
    ],
    display: ['A ∨ B', '¬A ∨ C', 'B ∨ ¬C'],
    // Solution: A=T,B=T,C=T works: (T∨T),(F∨T),(T∨F) all true
    hint: 'Try A=True, B=True, C=True.',
  },
  {
    vars: ['A','B','C'],
    clauses: [
      [['A',true],['B',false]],          // A ∨ ¬B
      [['B',true],['C',true]],           // B ∨ C
      [['A',false],['C',false]],         // ¬A ∨ ¬C
      [['A',true],['B',true]],           // A ∨ B
    ],
    display: ['A ∨ ¬B', 'B ∨ C', '¬A ∨ ¬C', 'A ∨ B'],
    // Solution: A=T,B=T,C=F: (T∨F),(T∨F),(F∨T),(T∨T) all true
    hint: 'Try A=True, B=True, C=False.',
  },
  {
    vars: ['A','B','C','D'],
    clauses: [
      [['A',true],['B',true],['C',false]],   // A ∨ B ∨ ¬C
      [['A',false],['D',true]],              // ¬A ∨ D
      [['B',false],['C',true]],             // ¬B ∨ C
      [['C',false],['D',false]],            // ¬C ∨ ¬D
      [['A',true],['C',true]],              // A ∨ C
    ],
    display: ['A ∨ B ∨ ¬C', '¬A ∨ D', '¬B ∨ C', '¬C ∨ ¬D', 'A ∨ C'],
    // Solution: A=T,B=F,C=T,D=T: (T∨F∨F),(F∨T),(T∨T),(F∨F)→last clause ¬C∨¬D = F∨F = F ✗
    // Let's try A=T,B=T,C=T,D=F: (T∨T∨F),(F∨F)=F ✗
    // A=T,B=F,C=F,D=T: (T∨F∨T),(F∨T),(T∨F),(T∨F),(T∨F) = T,T,T,T,T ✓
    hint: 'Try A=True, B=False, C=False, D=True.',
  },
];

const MAX_TRIES = 3;

function evalClause(clause, vals) {
  return clause.some(([v, pos]) => (vals[v] === true) === pos);
}

export default function SatProblem() {
  const [fIdx, setFIdx] = useState(0);
  const [vals, setVals] = useState({});
  const [tries, setTries] = useState(MAX_TRIES);
  const [setScore] = useState(0);
  const [phase, setPhase] = useState('intro');
  const [msg, setMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const f = FORMULAS[fIdx];
  const clauseStatus = f.clauses.map(c => evalClause(c, vals));
  const allAssigned = f.vars.every(v => v in vals);
  const allSatisfied = clauseStatus.every(Boolean);

  function toggle(v) {
    setVals(vs => ({ ...vs, [v]: !vs[v] }));
    setSubmitted(false); setMsg('');
  }

  function submit() {
    if (!allAssigned) { setMsg('Assign all variables first.'); return; }
    setSubmitted(true);
    if (allSatisfied) {
      setScore(s => s + 300);
      setMsg('All clauses satisfied!');
      setTimeout(() => {
        if (fIdx >= FORMULAS.length - 1) { setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*'); }
        else { setFIdx(i => i + 1); setVals({}); setSubmitted(false); setMsg(''); }
      }, 900);
    } else {
      const t = tries - 1; setTries(t);
      const bad = clauseStatus.filter(c => !c).length;
      if (t <= 0) setPhase('lost');
      else setMsg(`${bad} clause${bad > 1 ? 's' : ''} not satisfied (red). ${t} tries left.`);
    }
  }

  function reset() {
    setFIdx(0); setVals({}); setTries(MAX_TRIES); setScore(0);
    setPhase('playing'); setMsg(''); setSubmitted(false);
  }

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">SAT Problem</h1>
        <p className="text-center text-text-mid text-sm mb-5">Assign True/False to every variable so all clauses (joined by ∧) are satisfied. Toggle variables and watch the clauses respond.</p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — SAT Problem</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A Boolean formula is shown in CNF form: several clauses joined by AND (∧)."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Assign TRUE or FALSE to every variable so that <strong>all clauses</strong> evaluate to TRUE."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Each clause uses OR (∨) — it's satisfied if at least one literal is TRUE. ¬A means NOT A."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Toggle variable values. Clauses turn green (satisfied) or red (violated) in real time."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "(A ∨ B) ∧ (¬A ∨ C): try A=T, B=T, C=T → (T∨T)=T, (F∨T)=T. All satisfied! ✓"}}/>
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
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">Satisfiable!</h2>
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
              <p className="text-text-mid text-sm mb-4">{f.hint}</p>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}
          {phase === 'playing' && (
            <motion.div key={`f${fIdx}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xs text-text-muted">Formula</span>
                  <span className="font-mono font-bold text-xl text-text-dark">{fIdx+1}<span className="text-text-muted text-sm font-normal">/{FORMULAS.length}</span></span>
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

              {/* Variable toggles */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4">
                <p className="font-display font-black text-xs text-text-muted uppercase tracking-wider mb-3">Variables</p>
                <div className="flex gap-3 flex-wrap">
                  {f.vars.map(v => {
                    const val = vals[v];
                    return (
                      <motion.button key={v} onClick={() => toggle(v)} whileTap={{ scale: 0.92 }}
                        className={['flex items-center gap-2 px-4 py-3 rounded-2xl border-2 font-display font-black text-sm transition-all cursor-pointer',
                          val === true ? 'border-duo-green bg-[#58CC02]/10 text-[#3A8F00]'
                          : val === false ? 'border-duo-red bg-[#FF4B4B]/10 text-duo-red'
                          : 'border-surface-border bg-white text-text-muted',
                        ].join(' ')}>
                        <span className="text-base">{v}</span>
                        <span className="font-mono text-xs">{val === undefined ? '?' : val ? 'T' : 'F'}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Clause display */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4">
                <p className="font-display font-black text-xs text-text-muted uppercase tracking-wider mb-3">Clauses (all must be true)</p>
                <div className="space-y-2">
                  {f.clauses.map((clause, i) => {
                    const sat = evalClause(clause, vals);
                    const anyAssigned = clause.some(([v]) => v in vals);
                    return (
                      <motion.div key={i}
                        animate={{ backgroundColor: submitted && anyAssigned ? (sat ? 'rgba(88,204,2,0.08)' : 'rgba(255,75,75,0.08)') : 'transparent' }}
                        className={['flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all',
                          submitted && anyAssigned ? (sat ? 'border-duo-green' : 'border-duo-red') : 'border-surface-border',
                        ].join(' ')}>
                        <span className="font-mono font-bold text-sm text-text-dark">{f.display[i]}</span>
                        {submitted && anyAssigned && (
                          <span className={['ml-auto font-display font-black text-xs', sat ? 'text-[#3A8F00]' : 'text-duo-red'].join(' ')}>
                            {sat ? 'TRUE' : 'FALSE'}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
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
                <button onClick={() => setMsg(f.hint)}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all">
                  Hint
                </button>
                <button onClick={() => { setVals({}); setSubmitted(false); setMsg(''); }}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid transition-all">
                  Reset
                </button>
              </div>
              <button onClick={submit} disabled={!allAssigned}
                className={['w-full py-4 rounded-2xl font-display font-black text-lg transition-all',
                  allAssigned ? 'bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer' : 'bg-surface-off border-2 border-surface-border text-text-muted cursor-not-allowed',
                ].join(' ')}>
                Check Assignment
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ISAG Interactive Games — SAT Problem</p>
      </div>
    </div>
  );
}
