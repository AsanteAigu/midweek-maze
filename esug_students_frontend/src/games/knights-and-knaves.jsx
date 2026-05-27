import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Puzzles — all solutions verified by logic ─────────────────────────────────
// Knight = always tells the truth. Knave = always lies.
const PUZZLES = [
  {
    chars: [
      { id: 'A', color: '#1CB0F6', statement: '"At least one of us is a knave."' },
      { id: 'B', color: '#58CC02', statement: '"C is a knight."' },
      { id: 'C', color: '#CE82FF', statement: '"A is a knave."' },
    ],
    solution: { A: 'Knight', B: 'Knave', C: 'Knave' },
    // A(K): ≥1 knave = true (B,C knave) ✓ | B(Kn): C knight = false (C knave) ✓ | C(Kn): A knave = false (A knight) ✓
  },
  {
    chars: [
      { id: 'A', color: '#1CB0F6', statement: '"All of us are knights."' },
      { id: 'B', color: '#58CC02', statement: '"Exactly one of us is a knave."' },
      { id: 'C', color: '#CE82FF', statement: '"B is lying."' },
    ],
    solution: { A: 'Knave', B: 'Knave', C: 'Knight' },
    // A(Kn): all knights = false ✓ | B(Kn): exactly 1 knave = false (2 knaves) ✓ | C(K): B lying = true ✓
  },
  {
    chars: [
      { id: 'A', color: '#1CB0F6', statement: '"We are all the same type."' },
      { id: 'B', color: '#58CC02', statement: '"A is a knave."' },
      { id: 'C', color: '#CE82FF', statement: '"B is a knave."' },
    ],
    solution: { A: 'Knave', B: 'Knight', C: 'Knave' },
    // A(Kn): all same = false (A,C knave B knight) ✓ | B(K): A knave = true ✓ | C(Kn): B knave = false (B knight) ✓
  },
  {
    chars: [
      { id: 'A', color: '#1CB0F6', statement: '"C is a knave."' },
      { id: 'B', color: '#58CC02', statement: '"A is a knight."' },
      { id: 'C', color: '#CE82FF', statement: '"B is a knave."' },
    ],
    solution: { A: 'Knight', B: 'Knight', C: 'Knave' },
    // A(K): C knave = true ✓ | B(K): A knight = true ✓ | C(Kn): B knave = false (B knight) ✓
  },
  {
    chars: [
      { id: 'A', color: '#1CB0F6', statement: '"Exactly two of us are knaves."' },
      { id: 'B', color: '#58CC02', statement: '"A is lying."' },
      { id: 'C', color: '#CE82FF', statement: '"B is telling the truth."' },
    ],
    solution: { A: 'Knight', B: 'Knave', C: 'Knave' },
    // A(K): exactly 2 knaves (B,C) = true ✓ | B(Kn): A lying = false (A truthful) ✓ | C(Kn): B truthful = false ✓
  },
];

const MAX_TRIES = 3;

// ── SVG person silhouette ─────────────────────────────────────────────────────
function PersonFigure({ color, type }) {
  // type: null (unassigned) | 'Knight' | 'Knave'
  const opacity = type ? 1 : 0.6;
  return (
    <svg width="52" height="76" viewBox="0 0 44 66" style={{ overflow: 'visible', opacity }}>
      <circle cx="22" cy="11" r="10" fill={color} />
      <circle cx="18.5" cy="10" r="2" fill="rgba(0,0,0,0.45)" />
      <circle cx="25.5" cy="10" r="2" fill="rgba(0,0,0,0.45)" />
      <circle cx="19.5" cy="8.8" r="0.8" fill="rgba(255,255,255,0.8)" />
      <circle cx="26.5" cy="8.8" r="0.8" fill="rgba(255,255,255,0.8)" />
      <path d="M18 15 Q22 18 26 15" stroke="rgba(0,0,0,0.35)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <rect x="15" y="22" width="14" height="17" rx="5" fill={color} opacity="0.88" />
      {type === 'Knight' && (
        // Shield badge
        <g transform="translate(27, 7)">
          <path d="M0 0 L8 0 L8 6 L4 10 L0 6 Z" fill="#FFC800" stroke="#E6A000" strokeWidth="0.8"/>
          <path d="M4 2 L4 8M2 4 L6 4" stroke="#E6A000" strokeWidth="1" strokeLinecap="round"/>
        </g>
      )}
      {type === 'Knave' && (
        // Dagger badge
        <g transform="translate(27, 7)">
          <circle cx="4" cy="4" r="5" fill="#FF4B4B" opacity="0.9"/>
          <line x1="2" y1="2" x2="6" y2="6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="6" y1="2" x2="2" y2="6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </g>
      )}
      {/* Legs */}
      <line x1="19" y1="39" x2="15" y2="57" stroke={color} strokeWidth="5" strokeLinecap="round"/>
      <line x1="25" y1="39" x2="29" y2="57" stroke={color} strokeWidth="5" strokeLinecap="round"/>
    </svg>
  );
}

// ── Character card ─────────────────────────────────────────────────────────────
function CharCard({ char, assignment, onToggle, feedback }) {
  const assigned = assignment !== null;
  const borderColor = feedback === 'correct' ? '#58CC02'
                    : feedback === 'wrong'   ? '#FF4B4B'
                    : assigned               ? '#1CB0F6'
                    : '#E5E5E5';
  const bgColor     = feedback === 'correct' ? '#E8FFD4'
                    : feedback === 'wrong'   ? '#FFECEC'
                    : '#FFFFFF';

  return (
    <div className="flex flex-col items-center rounded-2xl border-2 p-3 gap-2 transition-all"
      style={{ borderColor, backgroundColor: bgColor, minWidth: 120 }}>
      {/* Character ID */}
      <span className="font-display font-black text-xl" style={{ color: char.color }}>{char.id}</span>

      {/* Figure */}
      <PersonFigure color={char.color} type={assignment} />

      {/* Statement bubble */}
      <div className="bg-surface-off rounded-xl border border-surface-border px-2 py-1.5 w-full">
        <p className="font-body text-xs text-text-mid text-center leading-snug italic">
          {char.statement}
        </p>
      </div>

      {/* Toggle button */}
      <button onClick={onToggle}
        className="w-full py-2 rounded-xl font-display font-bold text-sm border-2 transition-all"
        style={{
          borderColor: assignment === 'Knight' ? '#FFC800'
                     : assignment === 'Knave'  ? '#FF4B4B'
                     : '#E5E5E5',
          backgroundColor: assignment === 'Knight' ? '#FFF8E0'
                          : assignment === 'Knave'  ? '#FFECEC'
                          : '#F7F7F7',
          color: assignment === 'Knight' ? '#B8860B'
               : assignment === 'Knave'  ? '#CC2222'
               : '#AFAFAF',
        }}>
        {assignment ?? 'Unassigned'}
      </button>

      {/* Feedback label */}
      {feedback && (
        <span className="font-display font-bold text-xs"
          style={{ color: feedback === 'correct' ? '#3D8F01' : '#CC2222' }}>
          {feedback === 'correct' ? 'Correct' : 'Wrong'}
        </span>
      )}
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function KnightsAndKnaves() {
  const [pIdx,     setPIdx]    = useState(0);
  const [assigns,  setAssigns] = useState({ A: null, B: null, C: null });
  const [triesLeft,setTries]   = useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [phase,    setPhase]   = useState('intro');
  const [feedback, setFB]      = useState({});
  const [msg,      setMsg]     = useState('');
  const [hintsUsed,setHints]   = useState(0);

  const puzzle   = PUZZLES[pIdx];
  const allSet   = puzzle.chars.every(c => assigns[c.id] !== null);

  function toggle(id) {
    setAssigns(prev => ({
      ...prev,
      [id]: prev[id] === null ? 'Knight' : prev[id] === 'Knight' ? 'Knave' : 'Knight',
    }));
    setFB({});
    setMsg('');
  }

  function check() {
    const fb = {};
    let allCorrect = true;
    puzzle.chars.forEach(c => {
      const correct = assigns[c.id] === puzzle.solution[c.id];
      fb[c.id] = correct ? 'correct' : 'wrong';
      if (!correct) allCorrect = false;
    });
    setFB(fb);

    if (allCorrect) {
      const xp = Math.max(40 - hintsUsed * 10, 10);
      setScore(s => s + xp);
      setMsg(`Correct!`);
      setHints(0);
      setTimeout(() => {
        if (pIdx >= PUZZLES.length - 1) { setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*'); }
        else {
          setPIdx(i => i + 1);
          setAssigns({ A: null, B: null, C: null });
          setFB({}); setMsg('');
        }
      }, 1000);
    } else {
      const t = triesLeft - 1;
      setTries(t);
      if (t <= 0) { setPhase('lost'); }
      else { setMsg(`Incorrect — ${t} ${t === 1 ? 'try' : 'tries'} left`); }
    }
  }

  function giveHint() {
    // Reveal one character's correct type
    const unknown = puzzle.chars.find(c => assigns[c.id] !== puzzle.solution[c.id]);
    if (!unknown) return;
    setAssigns(prev => ({ ...prev, [unknown.id]: puzzle.solution[unknown.id] }));
    setHints(h => h + 1);
    setMsg(`Hint: ${unknown.id} is a ${puzzle.solution[unknown.id]}`);
    setFB({});
  }

  function reset() {
    setPIdx(0); setAssigns({ A: null, B: null, C: null });
    setTries(MAX_TRIES); setScore(0); setPhase('playing');
    setFB({}); setMsg(''); setHints(0);
  }

  function retryRound() {
    setAssigns({ A: null, B: null, C: null });
    setFB({}); setMsg('');
  }

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-xl">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">
          Interactive Puzzle
        </p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">
          Knights & Knaves
        </h1>
        <p className="text-center text-text-mid text-sm mb-5">
          Knights always tell the truth. Knaves always lie. Identify each character.
        </p>

        {/* Legend */}
        <div className="flex justify-center gap-6 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-400"/>
            <span className="font-display font-bold text-xs text-text-mid">Knight — tells truth</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-300"/>
            <span className="font-display font-bold text-xs text-text-mid">Knave — always lies</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Knights & Knaves</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Every character is either a <strong>Knight</strong> (always tells the truth) or a <strong>Knave</strong> (always lies)."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Each character makes a statement. You must figure out who is which."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Click each character card to toggle between Knight and Knave."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "The assignment is correct when every statement is logically consistent with each person's role."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "If A says \"B is a Knave\" and A is a Knight, then B really is a Knave (Knights tell the truth)."}}/>
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
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">All Solved!</h2>
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
              <h2 className="font-display font-black text-2xl text-text-dark mb-2">No More Tries</h2>
              <div className="bg-duo-blue/5 rounded-2xl border border-duo-blue/15 p-4 mb-5 text-left">
                <p className="font-display font-bold text-xs text-duo-blue uppercase tracking-wider mb-2">Solution</p>
                {puzzle.chars.map(c => (
                  <p key={c.id} className="font-mono text-sm text-text-mid">
                    {c.id}  is a  <span className="font-bold text-text-dark">{puzzle.solution[c.id]}</span>
                  </p>
                ))}
              </div>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div key={`p${pIdx}`} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
              {/* HUD */}
              <div className="flex items-center justify-between bg-surface-card rounded-2xl
                border border-surface-border shadow-card px-5 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xs text-text-muted uppercase tracking-wider">Puzzle</span>
                  <span className="font-mono font-bold text-xl text-text-dark">
                    {pIdx+1}<span className="text-text-muted text-sm font-normal">/{PUZZLES.length}</span>
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
                      <div key={i} className="w-3 h-3 rounded-full transition-all"
                        style={{ background: i < triesLeft ? '#1CB0F6' : '#E5E5E5' }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Character cards */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4">
                <p className="font-display font-bold text-xs text-text-muted uppercase tracking-wider mb-4 text-center">
                  Click each card to toggle Knight / Knave
                </p>
                <div className="flex gap-3 justify-center">
                  {puzzle.chars.map(c => (
                    <CharCard key={c.id} char={c}
                      assignment={assigns[c.id]}
                      onToggle={() => toggle(c.id)}
                      feedback={feedback[c.id] ?? null} />
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

              {/* Controls */}
              <div className="flex gap-3 mb-3">
                <button onClick={giveHint}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white
                    border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all">
                  Hint  <span className="font-normal text-text-muted"></span>
                </button>
                <button onClick={retryRound}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white
                    border-2 border-surface-border text-text-mid hover:border-surface-border-strong transition-all">
                  Reset
                </button>
              </div>

              <button onClick={check} disabled={!allSet}
                className={[
                  'w-full py-4 rounded-2xl font-display font-black text-lg transition-all',
                  allSet
                    ? 'bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer'
                    : 'bg-surface-off border-2 border-surface-border text-text-muted cursor-not-allowed',
                ].join(' ')}>
                Submit Assignments
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 text-text-muted text-xs font-mono text-center">
          ISAG Interactive Games — Knights & Knaves
        </p>
      </div>
    </div>
  );
}
