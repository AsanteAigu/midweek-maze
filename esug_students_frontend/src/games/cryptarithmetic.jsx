import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Puzzles ────────────────────────────────────────────────────────────────────
// 3 classic cryptarithmetic puzzles, increasing difficulty.
// All solutions verified. Tries reduced to 2. Letter hints removed.
// Feedback on wrong answer says only "Incorrect — check your algebra."
const PUZZLES = [
  {
    // SEND + MORE = MONEY
    // S=9,E=5,N=6,D=7,M=1,O=0,R=8,Y=2  →  9567 + 1085 = 10652
    words:    ['SEND', 'MORE', 'MONEY'],
    operator: '+',
    letters:  ['D', 'E', 'M', 'N', 'O', 'R', 'S', 'Y'],
    solution: { S: 9, E: 5, N: 6, D: 7, M: 1, O: 0, R: 8, Y: 2 },
    noLeading: ['S', 'M'],
    hint: 'M must be 1 — it is the carry digit from the thousands column.',
  },
  {
    // BASE + BALL = GAMES
    // B=7,A=4,S=8,E=3,L=5,G=1,M=9  →  7483 + 7455 = 14938
    words:    ['BASE', 'BALL', 'GAMES'],
    operator: '+',
    letters:  ['A', 'B', 'E', 'G', 'L', 'M', 'S'],
    solution: { B: 7, A: 4, S: 8, E: 3, L: 5, G: 1, M: 9 },
    noLeading: ['B', 'G'],
    hint: 'G must be 1 — the result has 5 digits while each addend has 4.',
  },
  {
    // ODD + ODD = EVEN
    // O=6,D=5,E=1,V=3,N=0  →  655 + 655 = 1310
    words:    ['ODD', 'ODD', 'EVEN'],
    operator: '+',
    letters:  ['D', 'E', 'N', 'O', 'V'],
    solution: { O: 6, D: 5, E: 1, V: 3, N: 0 },
    noLeading: ['O', 'E'],
    hint: 'E must be 1 — EVEN has 4 digits and ODD has 3, so E is the carry.',
  },
];

const MAX_TRIES = 2;

// ── Evaluate word to number ───────────────────────────────────────────────────
function wordToNum(word, assigns) {
  if (word.split('').some(c => assigns[c] === null || assigns[c] === undefined)) return null;
  const digits = word.split('').map(c => assigns[c]);
  return parseInt(digits.join(''), 10);
}

// ── Number picker (0-9 buttons) ───────────────────────────────────────────────
function DigitPicker({ letter, value, usedDigits, noLeading, onChange }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-10 h-10 rounded-xl bg-duo-blue/10 border-2 border-duo-blue/30
        flex items-center justify-center font-display font-black text-lg"
        style={{ color: '#1CB0F6' }}>
        {letter}
      </div>
      <div className="grid grid-cols-5 gap-0.5">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => {
          const isAssigned = value === d;
          const isUsed     = usedDigits.includes(d) && !isAssigned;
          const isBlocked  = noLeading && d === 0;
          const disabled   = (isUsed || isBlocked) && !isAssigned;
          return (
            <button key={d} onClick={() => onChange(isAssigned ? null : d)}
              disabled={disabled}
              className={[
                'w-6 h-6 rounded text-xs font-mono font-bold transition-all',
                isAssigned ? 'bg-duo-blue text-white'
                : disabled  ? 'opacity-20 bg-surface-off text-text-muted cursor-not-allowed'
                : 'bg-white border border-surface-border text-text-dark hover:border-duo-blue hover:text-duo-blue cursor-pointer',
              ].join(' ')}>
              {d}
            </button>
          );
        })}
      </div>
      <div className="w-10 h-7 rounded-xl border-2 flex items-center justify-center font-mono font-bold text-base"
        style={{
          borderColor: value !== null ? '#1CB0F6' : '#E5E5E5',
          backgroundColor: value !== null ? '#DFF4FF' : '#F7F7F7',
          color: value !== null ? '#0F8FC0' : '#AFAFAF',
        }}>
        {value ?? '?'}
      </div>
    </div>
  );
}

// ── Equation display ──────────────────────────────────────────────────────────
function EquationDisplay({ puzzle, assigns }) {
  const nums = puzzle.words.map(w => wordToNum(w, assigns));
  const [a, b, c] = nums;
  const computed = a !== null && b !== null ? a + b : null;
  const matches  = computed !== null && c !== null && computed === c;

  function renderWord(word) {
    return (
      <div className="text-right">
        <div className="font-mono font-black text-2xl text-text-dark tracking-widest">
          {word.split('').map((ch, i) => (
            <span key={i} className="inline-block w-7 text-center"
              style={{ color: assigns[ch] !== null && assigns[ch] !== undefined ? '#1CB0F6' : '#AFAFAF' }}>
              {assigns[ch] !== null && assigns[ch] !== undefined ? assigns[ch] : ch}
            </span>
          ))}
        </div>
        <div className="font-mono text-xs text-text-muted tracking-widest">
          {word.split('').map((ch, i) => <span key={i} className="inline-block w-7 text-center">{ch}</span>)}
        </div>
      </div>
    );
  }

  return (
    <div className="font-mono text-right space-y-2 p-4 bg-surface-off rounded-2xl border border-surface-border">
      {renderWord(puzzle.words[0])}
      <div className="flex items-center justify-end gap-2">
        <span className="font-display font-black text-2xl text-text-muted">{puzzle.operator}</span>
        {renderWord(puzzle.words[1])}
      </div>
      <div className="border-t-2 border-text-dark pt-2">
        {renderWord(puzzle.words[2])}
      </div>
      {computed !== null && (
        <div className={`text-center text-sm font-display font-bold rounded-xl px-3 py-1
          ${matches ? 'text-duo-green-dark bg-duo-green/10' : 'text-duo-red bg-duo-red/8'}`}>
          {matches ? `${computed} = ${c} ✓ Matches!` : `Sum so far: ${computed}`}
        </div>
      )}
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function Cryptarithmetic() {
  const [pIdx,      setPIdx]   = useState(0);
  const [assigns,   setAssigns] = useState({});
  const [triesLeft, setTries]  = useState(MAX_TRIES);
  const [setScore]  = useState(0);
  const [phase,     setPhase]  = useState('intro');
  const [msg,       setMsg]    = useState('');
  const [hintShown, setHint]   = useState(false);

  const puzzle = PUZZLES[pIdx];

  const usedDigits = puzzle.letters
    .filter(l => assigns[l] !== null && assigns[l] !== undefined)
    .map(l => assigns[l]);

  function setLetter(l, d) {
    setAssigns(prev => ({ ...prev, [l]: d }));
    setMsg('');
  }

  const allAssigned = puzzle.letters.every(l => assigns[l] !== null && assigns[l] !== undefined);

  function check() {
    if (!allAssigned) { setMsg('Assign a digit to every letter first.'); return; }

    const vals   = puzzle.letters.map(l => assigns[l]);
    const unique = new Set(vals).size === vals.length;
    if (!unique) { setMsg('All letters must map to different digits.'); return; }

    for (const l of puzzle.noLeading) {
      if (assigns[l] === 0) { setMsg(`${l} cannot be 0 (leading digit).`); return; }
    }

    const nums = puzzle.words.map(w => wordToNum(w, assigns));
    const [a, b, c] = nums;
    const correct = a + b === c;

    if (correct) {
      const xp = hintShown ? 100 : 200;
      setScore(s => s + xp);
      setMsg(`Correct!`);
      setTimeout(() => {
        if (pIdx >= PUZZLES.length - 1) {
          setPhase('won');
          window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*');
        } else { setPIdx(i => i + 1); setAssigns({}); setMsg(''); setHint(false); setTries(MAX_TRIES); }
      }, 900);
    } else {
      const t = triesLeft - 1;
      setTries(t);
      if (t <= 0) setPhase('lost');
      else setMsg(`Incorrect — check your algebra. ${t} ${t === 1 ? 'try' : 'tries'} left.`);
    }
  }

  function giveHint() {
    setHint(true);
    setMsg(`Hint: ${puzzle.hint}`);
  }

  function reset() {
    setPIdx(0);
    setAssigns({});
    setTries(MAX_TRIES);
    setScore(0);
    setPhase('playing');
    setMsg('');
    setHint(false);
  }

  const assignedCount = puzzle.letters.filter(l => assigns[l] !== null && assigns[l] !== undefined).length;
  const unique        = new Set(usedDigits).size === usedDigits.length;
  const noLeadOk      = puzzle.noLeading.every(l => assigns[l] !== 0);
  const nums          = puzzle.words.map(w => wordToNum(w, assigns));
  const sumOk         = nums[0] !== null && nums[1] !== null && nums[2] !== null && nums[0] + nums[1] === nums[2];

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-xl">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Cryptarithmetic</h1>
        <p className="text-center text-text-mid text-sm mb-5">
          Each letter represents a unique digit. Make the equation arithmetically correct.
        </p>

        <AnimatePresence mode="wait">

          {phase === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Cryptarithmetic</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{ __html: "A letter equation is shown (e.g. SEND + MORE = MONEY)." }} />
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{ __html: "Replace every letter with a unique digit 0–9 so the arithmetic is correct." }} />
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{ __html: "Each letter maps to exactly one digit, and no two letters share the same digit." }} />
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{ __html: "No leading zeros: the first letter of any word cannot be 0. You have <strong>2 tries</strong> per puzzle." }} />
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{ __html: "ODD + ODD = EVEN → O=6, D=5, E=1, V=3, N=0 gives 655 + 655 = 1310 ✓" }} />
              </div>
              <button onClick={() => setPhase('playing')} className="btn-primary w-full py-3 text-base">Got it — Start Playing</button>
            </motion.div>
          )}

          {phase === 'won' && (
            <motion.div key="won" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-green rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_6px_24px_rgba(88,204,2,0.35)]">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">Decoded!</h2>
              <button onClick={reset} className="btn-primary w-full py-3 text-base">Play Again</button>
            </motion.div>
          )}

          {phase === 'lost' && (
            <motion.div key="lost" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-red/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border-2 border-duo-red/25">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" strokeWidth="3">
                  <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="font-display font-black text-2xl text-text-dark mb-3">No More Tries</h2>
              <div className="bg-duo-blue/5 rounded-2xl border border-duo-blue/15 p-4 mb-5 text-left">
                <p className="font-display font-bold text-xs text-duo-blue uppercase mb-2">Solution</p>
                <div className="flex flex-wrap gap-2">
                  {puzzle.letters.map(l => (
                    <span key={l} className="font-mono text-sm text-text-dark bg-white rounded-xl border border-surface-border px-2 py-1">
                      {l}={puzzle.solution[l]}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div key={`p${pIdx}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              {/* HUD */}
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <span className="font-display font-bold text-xs text-text-muted">Puzzle {pIdx + 1}/{PUZZLES.length}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-duo-yellow/15 rounded-xl px-3 py-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>
                    <span className="font-mono font-bold text-sm text-duo-yellow-dark">{score} XP</span>
                  </div>
                  <div className="flex gap-1.5">
                    {Array.from({ length: MAX_TRIES }).map((_, i) => (
                      <div key={i} className="w-3 h-3 rounded-full" style={{ background: i < triesLeft ? '#1CB0F6' : '#E5E5E5' }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Live equation */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4">
                <h2 className="font-display font-black text-lg text-text-dark mb-3">
                  {puzzle.words[0]} {puzzle.operator} {puzzle.words[1]} = {puzzle.words[2]}
                </h2>
                <EquationDisplay puzzle={puzzle} assigns={assigns} />
              </div>

              {/* Constraint checklist */}
              <div className="bg-surface-card rounded-2xl border border-surface-border shadow-card px-4 py-3 mb-4">
                <div className="flex gap-4 flex-wrap">
                  {[
                    { label: `${assignedCount}/${puzzle.letters.length} assigned`, ok: assignedCount === puzzle.letters.length },
                    { label: 'All unique',    ok: unique && assignedCount > 1 },
                    { label: 'No leading 0s', ok: noLeadOk },
                    { label: 'Sum correct',   ok: sumOk },
                  ].map(({ label, ok }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: ok ? '#58CC02' : '#E5E5E5' }}>
                        {ok && (
                          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2">
                            <path d="M2 6l3 3 5-5" strokeLinecap="round" />
                          </svg>
                        )}
                      </div>
                      <span className="font-display font-bold text-xs text-text-mid">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Letter pickers */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4">
                <p className="font-display font-bold text-xs text-text-muted uppercase tracking-wider mb-4">
                  Assign digits to letters
                </p>
                <div className="flex gap-4 flex-wrap justify-center">
                  {puzzle.letters.map(l => (
                    <DigitPicker key={l} letter={l}
                      value={assigns[l] ?? null}
                      usedDigits={usedDigits}
                      noLeading={puzzle.noLeading.includes(l)}
                      onChange={d => setLetter(l, d)} />
                  ))}
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
                <button onClick={giveHint} disabled={hintShown}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all disabled:opacity-40">
                  Hint <span className="font-normal text-text-muted"></span>
                </button>
                <button onClick={() => { setAssigns({}); setMsg(''); }}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-surface-border-strong transition-all">
                  Clear
                </button>
              </div>
              <button onClick={check} disabled={!allAssigned}
                className={[
                  'w-full py-4 rounded-2xl font-display font-black text-lg transition-all',
                  allAssigned
                    ? 'bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer'
                    : 'bg-surface-off border-2 border-surface-border text-text-muted cursor-not-allowed',
                ].join(' ')}>
                Verify Equation
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ISAG Interactive Games — Cryptarithmetic</p>
      </div>
    </div>
  );
}
