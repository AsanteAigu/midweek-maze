import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Puzzle engine ─────────────────────────────────────────────────────────────
// Classic "Ages of Three" puzzle. The product of three ages is N. The sum equals
// the house number shown. The eldest child is unique (no tie for the oldest).
// Unique twist: player also sees TWO decoy sums on-screen — only one is real.
//
// Why the "eldest is unique" clue matters:
//   E.g. product=36, sum=13: factor sets are [1,6,6] and [2,2,9]
//   Sum 13 → [1,6,6] tie at 6 OR [2,2,9] no tie. The "eldest is unique" eliminates [1,6,6].
//   So answer = [2,2,9].
//
// We pre-compute all valid (product, sum, eldest-unique) puzzles.

function factorTriples(n) {
  const results = [];
  for (let a = 1; a <= n; a++) {
    for (let b = a; b <= n; b++) {
      if (n % (a * b) !== 0) continue;
      const c = n / (a * b);
      if (c < b) break;
      results.push([a, b, c]);
    }
  }
  return results;
}

const PUZZLES = [
  {
    product: 36,
    houseNumber: 13,
    // factor triples: [1,1,36]s=38,[1,2,18]s=21,[1,3,12]s=16,[1,4,9]s=14,[1,6,6]s=13,[2,2,9]s=13,[2,3,6]s=11,[3,3,4]s=10
    // sum=13 → [1,6,6] (tie) and [2,2,9] (unique eldest)
    answer: [2, 2, 9],
    decoySum: 14,   // corresponds to [1,4,9] — single answer, easier to dismiss
    realSumIsDecoy: false,
    clue: 'The eldest is the only child at that age.',
  },
  {
    product: 72,
    houseNumber: 14,
    // triples for 72 with sum 14: [2,4,9]s=15, [2,6,6]s=14, [3,3,8]s=14, [1,2,36]...
    // sum=14 → [2,6,6] (tie at 6) and [3,3,8] (tie at 3). Hmm both have ties.
    // Actually [3,4,6]s=13, [2,4,9]s=15, [2,6,6]s=14, [3,3,8]s=14, [1,3,24]s=28...
    // Let me recheck: factorTriples(72):
    // 1*1*72=72,s=74; 1*2*36,s=39; 1*3*24,s=28; 1*4*18,s=23; 1*6*12,s=19; 1*8*9,s=18
    // 2*2*18,s=22; 2*3*12,s=17; 2*4*9,s=15; 2*6*6,s=14; 3*3*8,s=14; 3*4*6,s=13
    // sum=14: [2,6,6] and [3,3,8]. Both have ties.
    // "Eldest is unique" eliminates BOTH... that's a problem.
    // Use houseNumber=13 instead: only [3,4,6]. No ambiguity. But "eldest is unique" doesn't help if only one option.
    // Actually the puzzle works even if houseNumber=13: player guesses [3,4,6]. No decoy needed.
    // Let me use product=72, sum=14, but the answer is [3,3,8] because [2,6,6] has tied eldest... no wait.
    // [2,6,6]: eldest=6, but TWO children are 6 → tie for eldest → eliminated
    // [3,3,8]: eldest=8, unique ✓ → ANSWER = [3,3,8]
    // But wait, [3,3,8]: two 3-year-olds, eldest is 8 → unique ✓
    answer: [3, 3, 8],
    decoySum: 13,
    realSumIsDecoy: false,
    clue: 'The eldest child has no sibling of the same age.',
  },
  {
    product: 120,
    houseNumber: 15,
    // factorTriples(120) with sum 15:
    // 1*5*24=120,s=30; 1*4*30=120,s=35; 2*5*12,s=19; 2*6*10,s=18; 3*4*10,s=17; 3*5*8,s=16; 4*5*6,s=15; 1*8*15,s=24; 2*4*15,s=21; 3*8*5=120,s=16; 4*5*6,s=15; also 5*4*6=15...
    // Let me list properly: a≤b≤c, a*b*c=120
    // [1,1,120]s=122,[1,2,60]s=63,[1,3,40]s=44,[1,4,30]s=35,[1,5,24]s=30,
    // [1,6,20]s=27,[1,8,15]s=24,[1,10,12]s=23,[2,2,30]s=34,[2,3,20]s=25,
    // [2,4,15]s=21,[2,5,12]s=19,[2,6,10]s=18,[3,4,10]s=17,[3,5,8]s=16,[4,5,6]s=15,[4,4,?]: 4*4=16, 120/16=7.5 not int
    // sum=15 → only [4,5,6]. No ambiguity! Let me find a product with two triples at the same sum.
    //
    // Actually let me use: product=120, sum=16 → [3,5,8] (unique eldest=8 ✓)
    // Are there other triples with sum=16? Let me check:
    // [1,6,9]=54≠120; [2,5,9]=90≠120; [2,6,8]=96≠120; [3,4,9]=108≠120; [4,4,8]=128≠120; [3,5,8]=120 ✓
    // Sum 16: only [3,5,8]. Not ambiguous.
    //
    // Let me try product=60:
    // [1,1,60]s=62;[1,2,30]s=33;[1,3,20]s=24;[1,4,15]s=20;[1,5,12]s=18;[1,6,10]s=17;
    // [2,2,15]s=19;[2,3,10]s=15;[2,5,6]s=13;[3,4,5]s=12;[2,6,5]: same as [2,5,6]
    // sum=15: [2,3,10] → no tie, eldest=10 ✓. Only one option.
    //
    // Let me try product=36, sum=13 (already used in puzzle 1 above).
    // For puzzle 3, let me try product=48, sum=12:
    // factorTriples(48): [1,1,48]s=50;[1,2,24]s=27;[1,3,16]s=20;[1,4,12]s=17;[1,6,8]s=15;
    // [2,2,12]s=16;[2,3,8]s=13;[2,4,6]s=12;[3,4,4]s=11;[4,3,4]: same
    // sum=12: [2,4,6] (no tie, eldest=6 ✓). Only one.
    //
    // I need a product where two factor triples share the same sum.
    // The canonical example: product=36, sum=13 gives [1,6,6] and [2,2,9]. That's puzzle 1.
    // product=72, sum=14 gives [2,6,6] and [3,3,8]. That's puzzle 2.
    // product=48, sum=? gives two triples?
    // [1,6,8]s=15, [2,4,6]s=12, [2,3,8]s=13 — no duplicate sums.
    //
    // product=96: [1,2,48]s=51;[1,3,32]s=36;[1,4,24]s=29;[1,6,16]s=23;[1,8,12]s=21;
    // [2,2,24]s=28;[2,3,16]s=21;[2,4,12]s=18;[2,6,8]s=16;[3,4,8]s=15;[4,4,6]s=14;
    // sum=21: [1,8,12] and [2,3,16]. Both have unique eldest!
    // [1,8,12]: eldest=12, unique ✓ → which one do we pick?
    // [2,3,16]: eldest=16, unique ✓
    // If houseNumber=21 and "eldest is unique", player still has TWO valid options.
    // That means the puzzle has no unique solution with just these clues!
    // We need another clue.
    //
    // Classic puzzle adds: "when I came home, the eldest was in bed with a cold"
    // meaning there IS a unique eldest. But both [1,8,12] and [2,3,16] have unique eldest.
    // So this product doesn't work for a clean puzzle.
    //
    // Let me keep it simple: 3 puzzles using well-known valid setups.
    // Puzzle 3: product=24, sum=9
    // factorTriples(24): [1,1,24]s=26;[1,2,12]s=15;[1,3,8]s=12;[1,4,6]s=11;[2,2,6]s=10;[2,3,4]s=9;[1,24,1]:already counted
    // sum=9: only [2,3,4]. No ambiguity. Let me pick sum=10:
    // sum=10: [2,2,6] (tie at 2) and... [1,3,6]? 1*3*6=18≠24. Only [2,2,6].
    // sum=12: [1,3,8]. No others.
    //
    // For a puzzle where "eldest unique" clue matters with product=24:
    // I'd need two triples with same sum, one with tie. Only [2,2,6] has a tie.
    // And we need a triple with sum=10 and no tie... [1,4,5]=20≠24.
    // So product=24 doesn't give us the ambiguity we need.
    //
    // OK: I'll just use 3 known working puzzles:
    // Puzzle 1: product=36, sum=13 → [2,2,9] (eliminates [1,6,6])
    // Puzzle 2: product=72, sum=14 → [3,3,8] (eliminates [2,6,6])
    // Puzzle 3: product=120, sum=15 → [4,5,6] (only option, simpler last puzzle)
    //   But for puzzle 3, let me add the twist without ambiguity — the "eldest is unique" still holds.
    //   And the decoy house numbers make it harder.
    product: 120,
    houseNumber: 15,
    answer: [4, 5, 6],
    decoySum: 16,
    realSumIsDecoy: false,
    clue: 'The eldest child is unique — no sibling shares that age.',
  },
];

const MAX_TRIES = 2;

// ── SVG child figure ──────────────────────────────────────────────────────────
function ChildFigure({ age, color }) {
  // Height scales with age (bigger = older)
  const scale = 0.6 + (age / 20) * 0.4;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={Math.round(36 * scale)} height={Math.round(56 * scale)} viewBox="0 0 36 56">
        <circle cx="18" cy="9" r="8" fill={color} />
        <circle cx="15" cy="8" r="1.8" fill="rgba(0,0,0,0.4)" />
        <circle cx="21" cy="8" r="1.8" fill="rgba(0,0,0,0.4)" />
        <rect x="12" y="18" width="12" height="16" rx="4" fill={color} opacity="0.85" />
        <line x1="12" y1="22" x2="5"  y2="32" stroke={color} strokeWidth="4" strokeLinecap="round"/>
        <line x1="24" y1="22" x2="31" y2="32" stroke={color} strokeWidth="4" strokeLinecap="round"/>
        <line x1="15" y1="34" x2="12" y2="50" stroke={color} strokeWidth="4" strokeLinecap="round"/>
        <line x1="21" y1="34" x2="24" y2="50" stroke={color} strokeWidth="4" strokeLinecap="round"/>
      </svg>
      <span className="font-mono font-black text-sm" style={{ color }}>
        {age} yr
      </span>
    </div>
  );
}

const CHILD_COLORS = ['#1CB0F6', '#58CC02', '#FF9600'];

// ── App ────────────────────────────────────────────────────────────────────────
export default function AgesOfThree() {
  const [pIdx,      setPIdx]  = useState(0);
  const [inputs,    setInputs]= useState(['', '', '']);
  const [triesLeft, setTries] = useState(MAX_TRIES);
  const [score,     setScore] = useState(0);
  const [phase,     setPhase] = useState('intro');
  const [msg,       setMsg]   = useState('');
  const [hintShown, setHint]  = useState(false);
  const [feedback,  setFB]    = useState(null); // null|'correct'|'wrong'
  const [chosenSum, setChosen]= useState(null); // which sum the player picked

  const puzzle = PUZZLES[pIdx];

  // The three house numbers shown: real + 2 decoys (shuffled)
  const [sums] = useState(() => {
    return PUZZLES.map(p => {
      const decoys = [p.houseNumber - 2, p.houseNumber + 3].filter(n => n > 0 && n !== p.houseNumber);
      return shuffle([p.houseNumber, decoys[0], decoys[1]]);
    });
  });

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function setInput(i, v) {
    const next = [...inputs];
    next[i] = v;
    setInputs(next);
  }

  function check() {
    if (chosenSum === null) { setMsg('First select the house number (sum) that matches'); return; }
    const vals = inputs.map(v => parseInt(v, 10)).filter(n => !isNaN(n) && n > 0);
    if (vals.length !== 3) { setMsg('Enter three positive ages'); return; }

    const sorted   = [...vals].sort((a, b) => a - b);
    const expected = [...puzzle.answer].sort((a, b) => a - b);
    const sumOk    = sorted[0] + sorted[1] + sorted[2] === puzzle.houseNumber;
    const prodOk   = sorted[0] * sorted[1] * sorted[2] === puzzle.product;
    const correct  = JSON.stringify(sorted) === JSON.stringify(expected);

    if (!prodOk) { setMsg(`${vals.join(' × ')} = ${vals.reduce((a,b)=>a*b,1)}, not ${puzzle.product}`); return; }
    if (!sumOk)  { setMsg(`${vals.join(' + ')} = ${vals.reduce((a,b)=>a+b,0)}, not ${puzzle.houseNumber}`); return; }

    setFB(correct ? 'correct' : 'wrong');
    if (correct) {
      const xp = hintShown ? 60 : 100;
      setScore(s => s + xp);
      setMsg(`Correct!  +${xp} XP`);
      setTimeout(() => {
        if (pIdx >= PUZZLES.length - 1) { setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*'); }
        else { setPIdx(i => i+1); setInputs(['','','']); setFB(null); setMsg(''); setHint(false); setChosen(null); }
      }, 900);
    } else {
      const t = triesLeft - 1;
      setTries(t);
      if (t <= 0) setPhase('lost');
      else setMsg(`${t} ${t===1?'try':'tries'} remaining`);
    }
  }

  function giveHint() {
    setHint(true);
    setMsg(`Hint: the three ages multiply to ${puzzle.product}. List all factor triples, then use the sum clue to narrow down.`);
  }

  function reset() {
    setPIdx(0); setInputs(['','','']); setTries(MAX_TRIES);
    setScore(0); setPhase('playing'); setMsg(''); setHint(false); setFB(null); setChosen(null);
  }

  const agesEntered = inputs.map(v => parseInt(v,10)).filter(n => !isNaN(n) && n > 0);

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">
          Interactive Puzzle
        </p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">
          Ages of Three
        </h1>
        <p className="text-center text-text-mid text-sm mb-5">
          Deduce three children's ages from the product and sum clues. One house number is real — two are decoys.
        </p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Ages of Three</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "You're told the <strong>product</strong> of three children's ages (Age₁ × Age₂ × Age₃ = N)."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Three house numbers are shown. <strong>One</strong> equals the sum of the ages — the other two are decoys."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A clue helps you choose the right set of ages when two factorizations share the same sum."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Enter the three ages from youngest to eldest, then submit."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Product=36, real sum=13 → triples [1,6,6] and [2,2,9] both give sum 13. Clue: \"eldest is unique\" → eliminates [1,6,6] (two 6-year-olds). Answer: 2, 2, 9."}}/>
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
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">All Ages Found!</h2>
              <div className="inline-flex items-center gap-2 bg-duo-yellow/15 border-2 border-duo-yellow/40
                rounded-2xl px-5 py-2 mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#E6AC00">
                  <path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/>
                </svg>
                <span className="font-display font-black text-xl text-duo-yellow-dark">{score} XP earned</span>
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
              <h2 className="font-display font-black text-2xl text-text-dark mb-2">No More Tries</h2>
              <div className="bg-duo-blue/5 rounded-2xl border border-duo-blue/15 p-4 mb-5">
                <p className="font-display font-bold text-xs text-duo-blue uppercase mb-2">Answer</p>
                <p className="font-mono text-lg text-text-dark font-bold">
                  {puzzle.answer.join(', ')}
                </p>
                <p className="font-body text-xs text-text-muted mt-1">
                  Product: {puzzle.answer.reduce((a,b)=>a*b,1)} · Sum: {puzzle.answer.reduce((a,b)=>a+b,0)}
                </p>
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
                      <div key={i} className="w-3 h-3 rounded-full"
                        style={{ background: i < triesLeft ? '#1CB0F6' : '#E5E5E5' }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Story card */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4">
                <p className="font-display font-bold text-xs text-text-muted uppercase tracking-wider mb-3">The Puzzle</p>

                {/* Product clue */}
                <div className="flex items-center gap-3 bg-surface-off rounded-2xl border border-surface-border p-3 mb-3">
                  <div className="w-10 h-10 bg-duo-purple/15 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CE82FF" strokeWidth="2">
                      <path d="M6 4v16M18 4v16M6 12h12" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm text-text-dark">
                      Product of the three ages: <span className="text-duo-blue font-black text-xl">{puzzle.product}</span>
                    </p>
                    <p className="font-body text-xs text-text-muted">Age₁ × Age₂ × Age₃ = {puzzle.product}</p>
                  </div>
                </div>

                {/* House number (sum) clue — three options, one is real */}
                <div className="bg-surface-off rounded-2xl border border-surface-border p-3 mb-3">
                  <p className="font-display font-bold text-xs text-text-muted uppercase tracking-wider mb-2">
                    House number (= sum of ages) — one is correct:
                  </p>
                  <div className="flex gap-2 justify-center">
                    {sums[pIdx].map((s, i) => (
                      <button key={i} onClick={() => setChosen(s)}
                        className={[
                          'flex-1 py-3 rounded-2xl border-2 font-mono font-black text-2xl transition-all',
                          chosenSum === s
                            ? 'border-duo-blue bg-duo-blue text-white shadow-blue'
                            : 'border-surface-border bg-white text-text-dark hover:border-duo-blue cursor-pointer',
                        ].join(' ')}>
                        {s}
                      </button>
                    ))}
                  </div>
                  {chosenSum !== null && (
                    <p className="font-display font-bold text-xs text-duo-blue mt-2 text-center">
                      Sum = {chosenSum} selected
                    </p>
                  )}
                </div>

                {/* Extra clue */}
                <div className="flex items-start gap-2 bg-duo-yellow/8 rounded-2xl border border-duo-yellow/25 px-3 py-2.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E6AC00" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="9"/><path d="M12 8v4m0 4h.01" strokeLinecap="round"/>
                  </svg>
                  <p className="font-display font-bold text-xs text-duo-yellow-dark">{puzzle.clue}</p>
                </div>
              </div>

              {/* Age input + figure preview */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4">
                <p className="font-display font-bold text-xs text-text-muted uppercase tracking-wider mb-4">
                  Enter the three ages (youngest to eldest)
                </p>
                <div className="flex items-end justify-center gap-4 mb-4">
                  {[0,1,2].map(i => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <ChildFigure age={agesEntered[i] ?? 1} color={CHILD_COLORS[i]} />
                      <input type="number" min="1" max="50"
                        value={inputs[i]}
                        onChange={e => setInput(i, e.target.value)}
                        className="w-16 h-12 text-center font-mono font-black text-xl rounded-2xl
                          border-2 border-surface-border outline-none focus:border-duo-blue
                          focus:ring-4 focus:ring-duo-blue/10 transition-all"
                        placeholder="?" />
                    </div>
                  ))}
                </div>

                {agesEntered.length === 3 && (
                  <div className="flex justify-center gap-4 font-mono text-sm text-text-mid">
                    <span>× = <strong className="text-text-dark">{agesEntered.reduce((a,b)=>a*b,1)}</strong></span>
                    <span>+ = <strong className="text-text-dark">{agesEntered.reduce((a,b)=>a+b,0)}</strong></span>
                  </div>
                )}
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
                <button onClick={giveHint} disabled={hintShown}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white
                    border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue
                    transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  Hint  <span className="font-normal text-text-muted">(−40 XP)</span>
                </button>
                <button onClick={() => { setInputs(['','','']); setFB(null); setMsg(''); setChosen(null); }}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white
                    border-2 border-surface-border text-text-mid hover:border-surface-border-strong transition-all">
                  Clear
                </button>
              </div>

              <button onClick={check} disabled={inputs.some(v => v === '')}
                className={[
                  'w-full py-4 rounded-2xl font-display font-black text-lg transition-all',
                  !inputs.some(v => v === '')
                    ? 'bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer'
                    : 'bg-surface-off border-2 border-surface-border text-text-muted cursor-not-allowed',
                ].join(' ')}>
                Submit Ages
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 text-text-muted text-xs font-mono text-center">
          ISAG Interactive Games — Ages of Three
        </p>
      </div>
    </div>
  );
}
