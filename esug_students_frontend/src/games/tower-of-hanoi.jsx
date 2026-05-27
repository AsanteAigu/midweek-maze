import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Constants ──────────────────────────────────────────────────────────────────
const DISC_COUNT  = 5;
const OPTIMAL     = 31; // 2^5 - 1
const DISC_COLORS = { 5: '#FF9600', 4: '#CE82FF', 3: '#1CB0F6', 2: '#58CC02', 1: '#FF4B4B' };
const DISC_W      = (size) => 28 + size * 16; // size 1=44, size 5=108
const DISC_H      = 22;
const PEG_X       = { A: 80, B: 220, C: 360 };
const BASE_Y      = 175;
const PEG_H       = 140;

// Precompute optimal 31-move solution from initial state
function computeOptimal() {
  const moves = [];
  function hanoi(n, from, to, via) {
    if (n === 0) return;
    hanoi(n - 1, from, via, to);
    moves.push({ from, to });
    hanoi(n - 1, via, to, from);
  }
  hanoi(DISC_COUNT, 'A', 'C', 'B');
  return moves;
}
const OPTIMAL_PATH = computeOptimal();

// ── SVG Tower visualisation ────────────────────────────────────────────────────
function TowerSVG({ pegs, selected, onPegClick }) {
  return (
    <svg viewBox="0 0 440 210" className="w-full" style={{ maxHeight: 210 }}>
      {/* Base platform */}
      <rect x="10" y="186" width="420" height="14" rx="5" fill="#E5E5E5" />

      {['A', 'B', 'C'].map((peg) => {
        const cx       = PEG_X[peg];
        const discs    = pegs[peg];
        const isSelect = selected === peg;

        return (
          <g key={peg} onClick={() => onPegClick(peg)} style={{ cursor: 'pointer' }}>
            {/* Click zone */}
            <rect x={cx - 70} y={20} width={140} height={180} fill="transparent" />

            {/* Peg rod */}
            <rect x={cx - 5} y={BASE_Y - PEG_H} width={10} height={PEG_H + 14}
              rx="4" fill={isSelect ? '#1CB0F6' : '#AFAFAF'} />

            {/* Peg label */}
            <text x={cx} y="208" textAnchor="middle"
              fontFamily="Nunito, sans-serif" fontSize="13" fontWeight="900"
              fill={isSelect ? '#1CB0F6' : '#777'}>
              Peg {peg}
            </text>

            {/* Selection glow */}
            {isSelect && (
              <rect x={cx - 62} y={BASE_Y - PEG_H - 8} width={124} height={PEG_H + 22}
                rx="10" fill="none" stroke="#1CB0F6" strokeWidth="2" strokeDasharray="6 3" opacity="0.6" />
            )}

            {/* Discs — stack from bottom */}
            {discs.map((size, stackIdx) => {
              const w = DISC_W(size);
              const y = BASE_Y - (stackIdx + 1) * (DISC_H + 2) + 2;
              const isTop = stackIdx === discs.length - 1;
              return (
                <g key={size}>
                  <rect x={cx - w / 2} y={y} width={w} height={DISC_H} rx="6"
                    fill={DISC_COLORS[size]}
                    stroke={isTop && isSelect ? 'white' : 'rgba(0,0,0,0.12)'}
                    strokeWidth={isTop && isSelect ? 2.5 : 1} />
                  {/* Disc label */}
                  <text x={cx} y={y + DISC_H / 2 + 5} textAnchor="middle"
                    fontFamily="JetBrains Mono, monospace" fontSize="11" fontWeight="600"
                    fill="rgba(255,255,255,0.9)">
                    {size}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
const INITIAL_PEGS = { A: [5, 4, 3, 2, 1], B: [], C: [] };

export default function TowerOfHanoi() {
  const [pegs,     setPegs]    = useState(INITIAL_PEGS);
  const [selected, setSelect]  = useState(null);
  const [moves,    setMoves]   = useState(0);
  const [hints,    setHints]   = useState(0);
  const [phase,    setPhase]   = useState('intro');
  const [msg,      setMsg]     = useState('Click any peg to select the top disc');
  const [msgType,  setMsgType] = useState('info'); // info|error|success

  function showMsg(text, type = 'info') { setMsg(text); setMsgType(type); }

  const handlePegClick = useCallback((peg) => {
    if (phase !== 'playing') return;

    if (!selected) {
      // Select source peg
      if (pegs[peg].length === 0) { showMsg('That peg is empty', 'error'); return; }
      setSelect(peg);
      const top = pegs[peg][pegs[peg].length - 1];
      showMsg(`Disc ${top} selected from Peg ${peg} — click destination peg`, 'info');
      return;
    }

    if (selected === peg) {
      // Deselect
      setSelect(null);
      showMsg('Deselected — click a peg to start again', 'info');
      return;
    }

    // Attempt move: selected → peg
    const src = pegs[selected];
    const dst = pegs[peg];
    const disc = src[src.length - 1];

    if (dst.length > 0 && dst[dst.length - 1] < disc) {
      showMsg(`Cannot place disc ${disc} on disc ${dst[dst.length - 1]} — larger on smaller is not allowed`, 'error');
      setSelect(null);
      return;
    }

    // Valid move
    const newPegs = {
      A: [...pegs.A],
      B: [...pegs.B],
      C: [...pegs.C],
    };
    newPegs[selected] = newPegs[selected].slice(0, -1);
    newPegs[peg]      = [...newPegs[peg], disc];
    setPegs(newPegs);
    setSelect(null);
    const newMoves = moves + 1;
    setMoves(newMoves);

    if (newPegs.C.length === DISC_COUNT) {
      setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*');
    } else {
      showMsg(`Moved disc ${disc}: Peg ${selected} → Peg ${peg}  (${newMoves} moves)`, 'info');
    }
  }, [pegs, selected, moves, phase]);

  function giveHint() {
    const nextMove = OPTIMAL_PATH[moves];
    if (!nextMove) { showMsg('You\'re already at or past the optimal solution!', 'info'); return; }
    setHints(h => h + 1);
    showMsg(`Hint: Move top disc from Peg ${nextMove.from} → Peg ${nextMove.to}`, 'info');
  }

  function restart() {
    setPegs(INITIAL_PEGS);
    setSelect(null);
    setMoves(0);
    setHints(0);
    setPhase('playing');
    showMsg('Click any peg to select the top disc', 'info');
  }

  const xpEarned = phase === 'won'
    ? Math.max(200 + (moves <= OPTIMAL ? 100 : 0) - hints * 5, 50)
    : 0;

  const msgBg = msgType === 'error'   ? 'bg-duo-red/8 border-duo-red/25 text-duo-red'
              : msgType === 'success' ? 'bg-duo-green/8 border-duo-green/25 text-duo-green-dark'
              : 'bg-surface-card border-surface-border text-text-mid';

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-xl">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">
          Interactive Puzzle
        </p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">
          Tower of Hanoi
        </h1>
        <p className="text-center text-text-mid text-sm mb-5">
          Move all {DISC_COUNT} discs from Peg A to Peg C. Never place a larger disc on a smaller one.
        </p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Tower of Hanoi</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Five discs are stacked on peg A (largest at the bottom). Move them all to peg C."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Only one disc may move at a time — always the topmost disc on a peg."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "A larger disc can <strong>never</strong> sit on top of a smaller disc."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Click a disc to select it, then click the destination peg. Optimal solution: 31 moves."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "You cannot move disc 3 onto peg B if disc 2 is already there (3 > 2)."}}/>
              </div>
              <button onClick={() => setPhase('playing')} className="btn-primary w-full py-3 text-base">Got it — Start Playing</button>
            </motion.div>
          )}

          {phase === 'won' && (
            <motion.div key="won" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-green rounded-3xl flex items-center justify-center mx-auto mb-4
                shadow-[0_6px_24px_rgba(88,204,2,0.35)]">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">Solved!</h2>
              <p className="font-mono text-lg text-text-mid mb-1">
                {moves} moves  <span className="text-text-muted text-sm">/ optimal: {OPTIMAL}</span>
              </p>
              {moves <= OPTIMAL && (
                <p className="font-display font-bold text-sm text-duo-green mb-2">Optimal solution!</p>
              )}
              <div className="inline-flex items-center gap-2 bg-duo-yellow/15 border-2 border-duo-yellow/40
                rounded-2xl px-5 py-2 mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#E6AC00">
                  <path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/>
                </svg>
                <span className="font-display font-black text-xl text-duo-yellow-dark">+{xpEarned} XP</span>
              </div>
              <br/>
              <button onClick={restart} className="btn-primary px-8 py-3">Play Again</button>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div key="playing" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              {/* HUD */}
              <div className="flex items-center justify-between bg-surface-card rounded-2xl
                border border-surface-border shadow-card px-5 py-3 mb-4">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="font-display font-bold text-xs text-text-muted uppercase tracking-wider block">Moves</span>
                    <span className="font-mono font-bold text-2xl text-text-dark">{moves}</span>
                  </div>
                  <div className="w-px h-8 bg-surface-border" />
                  <div>
                    <span className="font-display font-bold text-xs text-text-muted uppercase tracking-wider block">Optimal</span>
                    <span className="font-mono font-bold text-2xl text-text-dark">{OPTIMAL}</span>
                  </div>
                </div>
                {moves <= OPTIMAL && moves > 0 && (
                  <span className="font-display font-bold text-xs text-duo-green bg-duo-green/10
                    border border-duo-green/25 rounded-xl px-3 py-1">On track</span>
                )}
                {moves > OPTIMAL && (
                  <span className="font-display font-bold text-xs text-duo-orange bg-duo-orange/10
                    border border-duo-orange/25 rounded-xl px-3 py-1"
                    style={{ color: '#FF9600', borderColor: 'rgba(255,150,0,0.3)', backgroundColor: 'rgba(255,150,0,0.08)' }}>
                    Over optimal
                  </span>
                )}
              </div>

              {/* Tower */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4">
                <TowerSVG pegs={pegs} selected={selected} onPegClick={handlePegClick} />
              </div>

              {/* Message */}
              <div className={`rounded-2xl border px-4 py-3 mb-4 text-center font-body text-sm ${msgBg}`}>
                {msg}
              </div>

              {/* Controls */}
              <div className="flex gap-3 mb-3">
                <button onClick={giveHint}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white
                    border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all">
                  Hint  <span className="font-normal text-text-muted"></span>
                </button>
                <button onClick={restart}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white
                    border-2 border-surface-border text-text-mid hover:border-surface-border-strong transition-all">
                  Restart
                </button>
              </div>

              <div className="bg-duo-blue/5 rounded-2xl border border-duo-blue/15 px-4 py-2.5">
                <p className="font-display font-bold text-xs text-duo-blue">
                  How to play: Click a peg to select its top disc, then click another peg to move it there.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 text-text-muted text-xs font-mono text-center">
          ESUG Interactive Games — Tower of Hanoi
        </p>
      </div>
    </div>
  );
}
