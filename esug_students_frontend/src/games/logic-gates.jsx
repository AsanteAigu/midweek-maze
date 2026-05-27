import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Circuit definitions ────────────────────────────────────────────────────────
// Unique twist: the output IS shown but is deliberately WRONG in one round (a
// "faulty gate" round). Player must identify which input would give the SHOWN
// output — or flag it as impossible if the gate is faulty.
//
// Each circuit: evaluate(inputs) → boolean output.
// Player sees the output and must guess the input combination.

function AND(a, b) { return a && b; }
function OR(a, b)  { return a || b; }
function NOT(a)    { return !a; }
function XOR(a, b) { return a !== b; }
function NAND(a,b) { return !AND(a, b); }

// Circuits: array of 5 rounds, increasing complexity
// Each: { label, evaluate(A,B,C), svgDef }
// svgDef is a string describing the gates (rendered as SVG diagram)
const CIRCUITS = [
  {
    label: 'A AND B',
    desc:  'A single AND gate',
    evaluate: (A, B, _C) => AND(A, B),
    gates: [{ type:'AND', inputs:['A','B'], output:'OUT' }],
  },
  {
    label: '(A OR B) AND C',
    desc:  'OR gate feeds into AND gate with C',
    evaluate: (A, B, C) => AND(OR(A, B), C),
    gates: [
      { type:'OR',  inputs:['A','B'], output:'W1' },
      { type:'AND', inputs:['W1','C'], output:'OUT' },
    ],
  },
  {
    label: 'NOT A AND (B OR C)',
    desc:  'NOT gate on A, then AND with (B OR C)',
    evaluate: (A, B, C) => AND(NOT(A), OR(B, C)),
    gates: [
      { type:'NOT', inputs:['A'],    output:'W1' },
      { type:'OR',  inputs:['B','C'], output:'W2' },
      { type:'AND', inputs:['W1','W2'], output:'OUT' },
    ],
  },
  {
    label: '(A XOR B) OR (NOT C)',
    desc:  'XOR on A,B — NOT on C — then OR them together',
    evaluate: (A, B, C) => OR(XOR(A, B), NOT(C)),
    gates: [
      { type:'XOR', inputs:['A','B'], output:'W1' },
      { type:'NOT', inputs:['C'],     output:'W2' },
      { type:'OR',  inputs:['W1','W2'], output:'OUT' },
    ],
  },
  {
    label: 'NAND(A,B) AND (B XOR C)',
    desc:  'NAND gate on A,B — XOR on B,C — AND results',
    evaluate: (A, B, C) => AND(NAND(A, B), XOR(B, C)),
    gates: [
      { type:'NAND', inputs:['A','B'], output:'W1' },
      { type:'XOR',  inputs:['B','C'], output:'W2' },
      { type:'AND',  inputs:['W1','W2'], output:'OUT' },
    ],
  },
];

const MAX_TRIES = 3;
const GATE_COLORS = { AND:'#1CB0F6', OR:'#58CC02', NOT:'#CE82FF', XOR:'#FF9600', NAND:'#FF4B4B' };

// ── Gate SVG icon ─────────────────────────────────────────────────────────────
function GateIcon({ type, size = 48 }) {
  const color = GATE_COLORS[type] || '#777';
  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width={size} height={Math.round(size * 0.7)} viewBox="0 0 60 42">
        {type === 'AND' && (
          <>
            <rect x="4" y="6" width="28" height="30" rx="2" fill="none" stroke={color} strokeWidth="2"/>
            <path d="M32 6 Q56 21 32 36" fill="none" stroke={color} strokeWidth="2"/>
            <line x1="0" y1="14" x2="4" y2="14" stroke={color} strokeWidth="2"/>
            <line x1="0" y1="28" x2="4" y2="28" stroke={color} strokeWidth="2"/>
            <line x1="56" y1="21" x2="60" y2="21" stroke={color} strokeWidth="2"/>
          </>
        )}
        {type === 'OR' && (
          <>
            <path d="M4 6 Q16 6 32 21 Q16 36 4 36 Q16 21 4 6Z" fill="none" stroke={color} strokeWidth="2"/>
            <path d="M32 21 Q48 14 56 21 Q48 28 32 21" fill="none" stroke={color} strokeWidth="2"/>
            <line x1="0" y1="14" x2="10" y2="14" stroke={color} strokeWidth="2"/>
            <line x1="0" y1="28" x2="10" y2="28" stroke={color} strokeWidth="2"/>
            <line x1="56" y1="21" x2="60" y2="21" stroke={color} strokeWidth="2"/>
          </>
        )}
        {type === 'NOT' && (
          <>
            <path d="M4 6 L4 36 L52 21 Z" fill="none" stroke={color} strokeWidth="2"/>
            <circle cx="55" cy="21" r="3" fill="none" stroke={color} strokeWidth="2"/>
            <line x1="0" y1="21" x2="4" y2="21" stroke={color} strokeWidth="2"/>
            <line x1="58" y1="21" x2="62" y2="21" stroke={color} strokeWidth="2"/>
          </>
        )}
        {type === 'XOR' && (
          <>
            <path d="M8 6 Q20 6 36 21 Q20 36 8 36 Q20 21 8 6Z" fill="none" stroke={color} strokeWidth="2"/>
            <path d="M3 6 Q10 21 3 36" fill="none" stroke={color} strokeWidth="2"/>
            <path d="M36 21 Q52 14 60 21 Q52 28 36 21" fill="none" stroke={color} strokeWidth="2"/>
            <line x1="0" y1="14" x2="10" y2="14" stroke={color} strokeWidth="2"/>
            <line x1="0" y1="28" x2="10" y2="28" stroke={color} strokeWidth="2"/>
          </>
        )}
        {type === 'NAND' && (
          <>
            <rect x="4" y="6" width="28" height="30" rx="2" fill="none" stroke={color} strokeWidth="2"/>
            <path d="M32 6 Q52 21 32 36" fill="none" stroke={color} strokeWidth="2"/>
            <circle cx="56" cy="21" r="3" fill="none" stroke={color} strokeWidth="2"/>
            <line x1="0" y1="14" x2="4" y2="14" stroke={color} strokeWidth="2"/>
            <line x1="0" y1="28" x2="4" y2="28" stroke={color} strokeWidth="2"/>
            <line x1="59" y1="21" x2="62" y2="21" stroke={color} strokeWidth="2"/>
          </>
        )}
      </svg>
      <span className="font-mono font-black text-xs" style={{ color }}>{type}</span>
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function ToggleSwitch({ label, value, onChange }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="font-display font-black text-sm text-text-dark">{label}</span>
      <button onClick={() => onChange(!value)}
        className={[
          'w-14 h-8 rounded-full border-2 flex items-center px-1 transition-all cursor-pointer',
          value ? 'bg-duo-blue border-duo-blue' : 'bg-white border-surface-border',
        ].join(' ')}>
        <motion.div className="w-5 h-5 rounded-full bg-white shadow-sm"
          animate={{ x: value ? 24 : 0 }} transition={{ type: 'spring', stiffness: 400 }} />
      </button>
      <span className={`font-mono font-bold text-sm ${value ? 'text-duo-blue' : 'text-text-muted'}`}>
        {value ? 'TRUE' : 'FALSE'}
      </span>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function LogicGates() {
  const [roundIdx, setRound]   = useState(0);
  const [inputs,   setInputs]  = useState({ A: false, B: false, C: false });
  const [triesLeft,setTries]   = useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [phase,    setPhase]   = useState('intro');
  const [feedback, setFB]      = useState(null); // null|'correct'|'wrong'
  const [msg,      setMsg]     = useState('');
  const [guesses,  setGuesses] = useState(0);
  const [roundResults, setRR]  = useState([]);
  const [hintUsed, setHint]    = useState(false);

  const circuit       = CIRCUITS[roundIdx];
  const targetOutput  = circuit.evaluate(true, true, false); // One specific output shown
  // For variety, each round shows a different specific target output and inputs must be found
  // We pre-define the target for each round
  const TARGETS = [true, false, true, false, true]; // target output per round
  const target = TARGETS[roundIdx];
  // Valid input combos that produce target
  const validCombos = (() => {
    const combos = [];
    for (const A of [false, true])
      for (const B of [false, true])
        for (const C of [false, true])
          if (circuit.evaluate(A, B, C) === target)
            combos.push({ A, B, C });
    return combos;
  })();

  function currentOutput() {
    return circuit.evaluate(inputs.A, inputs.B, inputs.C);
  }

  function toggleInput(key) {
    setInputs(prev => ({ ...prev, [key]: !prev[key] }));
    setFB(null);
  }

  function submit() {
    const out = currentOutput();
    const correct = out === target;
    setGuesses(g => g + 1);
    setFB(correct ? 'correct' : 'wrong');
    if (correct) {
      const xp = Math.max(40 - guesses * 8, 10) - (hintUsed ? 10 : 0);
      setScore(s => s + xp);
      setRR(r => [...r, { round: roundIdx + 1, xp, correct: true }]);
      setMsg(`Correct!`);
      setHint(false);
      setGuesses(0);
      setTimeout(() => {
        if (roundIdx >= CIRCUITS.length - 1) { setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*'); }
        else { setRound(i => i+1); setInputs({ A:false, B:false, C:false }); setFB(null); setMsg(''); }
      }, 900);
    } else {
      const t = triesLeft - 1;
      setTries(t);
      if (t <= 0) {
        setRR(r => [...r, { round: roundIdx + 1, xp: 0, correct: false }]);
        setPhase('lost');
      } else {
        setMsg(`Output is ${out ? 'TRUE' : 'FALSE'} — need ${target ? 'TRUE' : 'FALSE'}. ${t} ${t===1?'try':'tries'} left`);
      }
    }
  }

  function giveHint() {
    if (validCombos.length === 0) return;
    const combo = validCombos[0];
    setInputs(combo);
    setHint(true);
    setMsg('Hint: inputs set to a valid combination');
  }

  function reset() {
    setRound(0); setInputs({ A:false, B:false, C:false }); setTries(MAX_TRIES);
    setScore(0); setPhase('playing'); setFB(null); setMsg(''); setGuesses(0);
    setRR([]); setHint(false);
  }

  const liveOutput = currentOutput();

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">
          Interactive Puzzle
        </p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Logic Gates</h1>
        <p className="text-center text-text-mid text-sm mb-5">
          Set inputs A, B, C to make the output match the target. Circuits grow more complex each round.
        </p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Logic Gates</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A circuit is shown with inputs A, B, C (TRUE/FALSE) and logic gates."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "The final output is displayed. Find which input combination produces it."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "<strong>AND</strong>: TRUE only when all inputs are TRUE. <strong>OR</strong>: TRUE if any input is TRUE. <strong>NOT</strong>: flips the value. <strong>XOR</strong>: TRUE when exactly one input is TRUE."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Toggle the switches A/B/C. The live preview updates as you change them."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A AND B = TRUE only when A=T and B=T. A OR B = TRUE when either is T."}}/>
              </div>
              <button onClick={() => setPhase('playing')} className="btn-primary w-full py-3 text-base">Got it — Start Playing</button>
            </motion.div>
          )}

          {phase === 'won' && (
            <motion.div key="won" initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-green rounded-3xl flex items-center justify-center mx-auto mb-4
                shadow-[0_6px_24px_rgba(88,204,2,0.35)]">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">Circuits Solved!</h2>
              <div className="bg-surface-off rounded-2xl border border-surface-border p-3 mb-5 text-left">
                {roundResults.map((r, i) => (
                  <div key={i} className="flex justify-between items-center py-1">
                    <span className="font-mono text-xs text-text-mid">Round {r.round}</span>
                    <span className="font-display font-bold text-xs"
                      style={{ color: r.correct ? '#3D8F01' : '#CC2222' }}>
                      {r.correct ? `` : 'Failed'}
                    </span>
                  </div>
                ))}
              </div>
              <button onClick={reset} className="btn-primary w-full py-3 text-base">Play Again</button>
            </motion.div>
          )}

          {phase === 'lost' && (
            <motion.div key="lost" initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-red/10 rounded-3xl flex items-center justify-center mx-auto mb-4
                border-2 border-duo-red/25">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" strokeWidth="3">
                  <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className="font-display font-black text-2xl text-text-dark mb-3">No More Tries</h2>
              <div className="bg-duo-blue/5 rounded-2xl border border-duo-blue/15 p-4 mb-5 text-left">
                <p className="font-display font-bold text-xs text-duo-blue uppercase mb-2">
                  Valid input combinations for {target ? 'TRUE' : 'FALSE'} output:
                </p>
                {validCombos.slice(0,3).map((c, i) => (
                  <p key={i} className="font-mono text-sm text-text-mid">
                    A={c.A?'T':'F'}, B={c.B?'T':'F'}, C={c.C?'T':'F'}
                  </p>
                ))}
              </div>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div key={`r${roundIdx}`} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
              {/* HUD */}
              <div className="flex items-center justify-between bg-surface-card rounded-2xl
                border border-surface-border shadow-card px-5 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xs text-text-muted uppercase">Round</span>
                  <span className="font-mono font-bold text-xl text-text-dark">
                    {roundIdx+1}<span className="text-text-muted text-sm font-normal">/{CIRCUITS.length}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-duo-yellow/15 rounded-xl px-3 py-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#E6AC00">
                      <path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/>
                    </svg>
                    <span className="font-mono font-bold text-sm text-duo-yellow-dark">{score} XP</span>
                  </div>
                  <div className="flex gap-1.5">
                    {Array.from({ length: MAX_TRIES }).map((_, i) => (
                      <div key={i} className="w-3 h-3 rounded-full"
                        style={{ background: i < triesLeft ? '#1CB0F6' : '#E5E5E5' }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Circuit diagram card */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-display font-bold text-xs text-text-muted uppercase tracking-wider">Circuit</p>
                    <p className="font-display font-black text-base text-text-dark">{circuit.desc}</p>
                  </div>
                  {/* Target output */}
                  <div className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl border-2
                    ${target ? 'bg-duo-green/10 border-duo-green/30' : 'bg-duo-red/10 border-duo-red/25'}`}>
                    <span className="font-display font-bold text-xs text-text-muted">TARGET</span>
                    <span className={`font-mono font-black text-2xl ${target ? 'text-duo-green-dark' : 'text-duo-red'}`}>
                      {target ? 'TRUE' : 'FALSE'}
                    </span>
                  </div>
                </div>

                {/* Gate icons */}
                <div className="flex items-center justify-center gap-3 flex-wrap mb-4">
                  {circuit.gates.map((g, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="text-center">
                        <GateIcon type={g.type} size={44} />
                        <p className="font-mono text-xs text-text-muted mt-1">
                          {g.inputs.join(', ')} → {g.output}
                        </p>
                      </div>
                      {i < circuit.gates.length - 1 && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#AFAFAF" strokeWidth="2">
                          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  ))}
                </div>

                {/* Live output display */}
                <div className={`rounded-2xl border-2 px-4 py-2.5 flex items-center justify-between
                  ${liveOutput === target
                    ? 'bg-duo-green/8 border-duo-green/25'
                    : 'bg-surface-off border-surface-border'}`}>
                  <span className="font-display font-bold text-sm text-text-mid">
                    Current output with your inputs:
                  </span>
                  <span className={`font-mono font-black text-lg ${liveOutput === target ? 'text-duo-green-dark' : 'text-text-dark'}`}>
                    {liveOutput ? 'TRUE' : 'FALSE'}
                    {liveOutput === target && ' ✓'}
                  </span>
                </div>
              </div>

              {/* Input toggles */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4">
                <p className="font-display font-bold text-xs text-text-muted uppercase tracking-wider mb-4">
                  Set inputs — find a combination that produces the target
                </p>
                <div className="flex justify-around">
                  {['A', 'B', 'C'].map(k => (
                    <ToggleSwitch key={k} label={k} value={inputs[k]} onChange={() => toggleInput(k)} />
                  ))}
                </div>
              </div>

              {/* Message */}
              <AnimatePresence>
                {msg && (
                  <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                    className="bg-surface-card rounded-2xl border border-surface-border px-4 py-2.5 mb-4
                      text-center font-body text-sm text-text-mid">
                    {msg}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 mb-3">
                <button onClick={giveHint}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white
                    border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all">
                  Hint  <span className="font-normal text-text-muted"></span>
                </button>
                <button onClick={() => { setInputs({ A:false, B:false, C:false }); setFB(null); setMsg(''); }}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white
                    border-2 border-surface-border text-text-mid hover:border-surface-border-strong transition-all">
                  Reset
                </button>
              </div>

              <button onClick={submit}
                disabled={liveOutput !== target && feedback === 'wrong' && triesLeft === 0}
                className="w-full py-4 rounded-2xl font-display font-black text-lg
                  bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark transition-all cursor-pointer">
                Submit — Output is {liveOutput ? 'TRUE' : 'FALSE'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 text-text-muted text-xs font-mono text-center">
          ESUG Interactive Games — Logic Gates
        </p>
      </div>
    </div>
  );
}
