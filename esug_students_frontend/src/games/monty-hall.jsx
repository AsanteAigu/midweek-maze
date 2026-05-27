import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TOTAL_ROUNDS = 8;  // more rounds = better stats, player must discover strategy themselves
const TOTAL_DOORS  = 5;
const HOST_REVEALS = 3;  // reveal 3 so exactly 1 unchosen door remains — unambiguous switch target

// ── SVG Door ──────────────────────────────────────────────────────────────────
function Door({ number, doorState, isChoice, isSwitchTarget, isRevealed, onClick, disabled }) {
  // doorState: 'closed' | 'empty' | 'prize'
  const border = isChoice      ? '#1CB0F6'
               : isSwitchTarget ? '#58CC02'
               : isRevealed    ? '#AFAFAF'
               : '#E5E5E5';
  const bg     = isChoice      ? '#DFF4FF'
               : isSwitchTarget ? '#E8FFD4'
               : isRevealed    ? '#F7F7F7'
               : '#FFFFFF';

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { y: -4 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      className="flex flex-col items-center gap-1 select-none"
      style={{ cursor: disabled ? 'default' : 'pointer' }}>
      <svg width="68" height="100" viewBox="0 0 68 100">
        {/* Door frame */}
        <rect x="4" y="4" width="60" height="90" rx="6" fill={bg} stroke={border} strokeWidth="2.5"/>
        {/* Door arch top */}
        <path d="M10 30 Q34 14 58 30" fill="none" stroke={border} strokeWidth="1.5" opacity="0.5"/>
        {/* Panel lines */}
        <rect x="10" y="32" width="22" height="25" rx="3" fill="none" stroke={border} strokeWidth="1.2" opacity="0.4"/>
        <rect x="36" y="32" width="22" height="25" rx="3" fill="none" stroke={border} strokeWidth="1.2" opacity="0.4"/>
        <rect x="10" y="62" width="48" height="22" rx="3" fill="none" stroke={border} strokeWidth="1.2" opacity="0.4"/>

        {/* Knob */}
        {doorState === 'closed' && (
          <circle cx="44" cy="52" r="4" fill={border} opacity="0.7"/>
        )}

        {/* Door number */}
        {doorState === 'closed' && (
          <text x="34" y="20" textAnchor="middle"
            fontFamily="JetBrains Mono, monospace" fontSize="12" fontWeight="700" fill={border}>
            {number + 1}
          </text>
        )}

        {/* Prize star */}
        {doorState === 'prize' && (
          <g transform="translate(34, 48)">
            <polygon points="0,-18 5,-6 18,-6 8,3 12,16 0,8 -12,16 -8,3 -18,3 -5,-6"
              fill="#FFC800" stroke="#E6A000" strokeWidth="1"/>
            <text x="0" y="30" textAnchor="middle"
              fontFamily="Nunito, sans-serif" fontSize="9" fontWeight="900" fill="#3D8F01">
              PRIZE
            </text>
          </g>
        )}

        {/* Empty X */}
        {doorState === 'empty' && (
          <>
            <line x1="20" y1="35" x2="48" y2="65" stroke="#AFAFAF" strokeWidth="3" strokeLinecap="round"/>
            <line x1="48" y1="35" x2="20" y2="65" stroke="#AFAFAF" strokeWidth="3" strokeLinecap="round"/>
          </>
        )}
      </svg>

      {/* Label */}
      <span className="font-display font-bold text-xs"
        style={{ color: isChoice ? '#0F8FC0' : isSwitchTarget ? '#3D8F01' : '#AFAFAF' }}>
        {isChoice ? 'Your pick' : isSwitchTarget ? 'Switch?' : ''}
      </span>
    </motion.button>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function MontyHall() {
  const [round,      setRound]    = useState(1);
  const [prizeDoor,  setPrize]    = useState(() => Math.floor(Math.random() * TOTAL_DOORS));
  const [picked,     setPicked]   = useState(null);      // index 0-4
  const [revealed,   setRevealed] = useState([]);        // indices of opened empty doors
  const [switchDoor, setSwitchD]  = useState(null);      // door to switch to
  const [finalDoor,  setFinalD]   = useState(null);
  const [roundPhase, setRPhase]   = useState('choosing');// choosing|deciding|result
  const [wins,       setWins]     = useState(0);
  const [history,    setHistory]  = useState([]);        // [{choice,won,switched}]
  const [phase,      setPhase]    = useState('intro'); // playing|done

  function doorState(i) {
    if (roundPhase === 'result' || (roundPhase === 'deciding' && revealed.includes(i))) {
      if (roundPhase === 'result')  return i === prizeDoor ? 'prize' : 'empty';
      return 'empty';
    }
    return 'closed';
  }

  const handleDoorClick = useCallback((i) => {
    if (roundPhase !== 'choosing') return;
    setPicked(i);

    // Host reveals HOST_REVEALS empty doors (not prize, not player's pick)
    const candidates = Array.from({ length: TOTAL_DOORS }, (_, d) => d)
      .filter(d => d !== prizeDoor && d !== i)
      .sort(() => Math.random() - 0.5);
    const toReveal = candidates.slice(0, HOST_REVEALS);
    setRevealed(toReveal);

    // Switch target = the one remaining door not picked and not revealed
    const sw = Array.from({ length: TOTAL_DOORS }, (_, d) => d)
      .find(d => d !== i && !toReveal.includes(d));
    setSwitchD(sw);

    setRPhase('deciding');
  }, [roundPhase, prizeDoor]);

  function decide(choice) { // 'stay' | 'switch'
    const finalD = choice === 'switch' ? switchDoor : picked;
    const won    = finalD === prizeDoor;
    setFinalD(finalD);
    if (won) setWins(w => w + 1);
    setHistory(h => [...h, { round, choice, won }]);
    setRPhase('result');
  }

  function nextRound() {
    if (round >= TOTAL_ROUNDS) { window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*'); setPhase('done'); return; }
    const next = round + 1;
    setRound(next);
    setPrize(Math.floor(Math.random() * TOTAL_DOORS));
    setPicked(null);
    setRevealed([]);
    setSwitchD(null);
    setFinalD(null);
    setRPhase('choosing');
  }

  function reset() {
    setRound(1);
    setPrize(Math.floor(Math.random() * TOTAL_DOORS));
    setPicked(null); setRevealed([]); setSwitchD(null); setFinalD(null);
    setRPhase('choosing'); setWins(0); setHistory([]); setPhase('playing');
  }

  const roundWon = finalDoor === prizeDoor;

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-xl">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">
          Interactive Puzzle
        </p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">
          Monty Hall
        </h1>
        <p className="text-center text-text-mid text-sm mb-5">
          5 doors, 1 prize. Pick a door. The host opens 3 empty ones — leaving one. Switch or stay?
        </p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Monty Hall</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Five doors are shown. One hides a prize; four are empty. Click a door to pick it."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "The host then opens some empty doors you didn't pick, leaving one alternative."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Choose: <strong>Switch</strong> to the remaining unopened door, or <strong>Stay</strong> with your original choice."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Play 8 rounds and track your win rate. The maths reveals which strategy wins more!"}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "With 5 doors, the prize is behind your chosen door 1/5 of the time. Switching wins when it's behind any of the other 4 — so switching wins 4/5 = 80% of the time."}}/>
              </div>
              <button onClick={() => setPhase('playing')} className="btn-primary w-full py-3 text-base">Got it — Start Playing</button>
            </motion.div>
          )}

          {phase === 'done' && (
            <motion.div key="done" initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-7">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-duo-blue rounded-3xl flex items-center justify-center mx-auto mb-4
                  shadow-glow">
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" strokeLinecap="round"/>
                  </svg>
                </div>
                <h2 className="font-display font-black text-3xl text-text-dark mb-1">
                  {wins}/{TOTAL_ROUNDS} rounds won
                </h2>
                <p className="font-body text-text-mid text-sm">
                  {wins >= 4 ? 'Excellent strategy!' : wins >= 3 ? 'Good result!' : 'Keep practising!'}
                </p>
              </div>

              {/* Move history */}
              <div className="bg-surface-off rounded-2xl border border-surface-border p-4 mb-5">
                <p className="font-display font-bold text-xs text-text-muted uppercase tracking-wider mb-3">
                  Round history
                </p>
                <div className="space-y-2">
                  {history.map((h, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="font-mono text-xs text-text-mid">Round {h.round}</span>
                      <span className="font-display font-bold text-xs"
                        style={{ color: h.choice === 'switch' ? '#58CC02' : '#FF9600' }}>
                        {h.choice === 'switch' ? 'Switched' : 'Stayed'}
                      </span>
                      <span className="font-display font-bold text-xs"
                        style={{ color: h.won ? '#58CC02' : '#FF4B4B' }}>
                        {h.won ? 'Won' : 'Lost'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Probability explanation */}
              <div className="bg-duo-blue/5 rounded-2xl border border-duo-blue/15 p-4 mb-5">
                <p className="font-display font-bold text-sm text-duo-blue mb-2">The Math</p>
                <p className="font-body text-xs text-text-mid leading-relaxed">
                  With 5 doors: P(prize behind your door) = 1/5 = 20%.<br/>
                  P(prize behind any other door) = 4/5 = 80%.<br/>
                  The host opens 3 empty non-chosen doors, leaving exactly 1 alternative door.<br/>
                  All that 80% collapses onto that 1 remaining door.<br/>
                  <span className="font-bold text-text-dark">Switching wins 80% of the time — always switch!</span>
                </p>
              </div>

              <button onClick={reset} className="btn-primary w-full py-3 text-base">Play Again</button>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div key={`r${round}`} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
              {/* HUD */}
              <div className="flex items-center justify-between bg-surface-card rounded-2xl
                border border-surface-border shadow-card px-5 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xs text-text-muted uppercase tracking-wider">Round</span>
                  <span className="font-mono font-bold text-xl text-text-dark">
                    {round}<span className="text-text-muted text-sm font-normal">/{TOTAL_ROUNDS}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xs text-text-muted">Wins:</span>
                  <span className="font-mono font-bold text-xl text-duo-green-dark">{wins}</span>
                  <span className="text-text-muted font-mono text-sm">/{round - 1}</span>
                </div>
              </div>

              {/* Doors */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6 mb-4">
                {roundPhase === 'choosing' && (
                  <p className="font-display font-bold text-sm text-text-mid text-center mb-4">
                    Pick one of the {TOTAL_DOORS} doors — one hides a prize
                  </p>
                )}
                {roundPhase === 'deciding' && (
                  <p className="font-display font-bold text-sm text-text-mid text-center mb-4">
                    The host opened 3 empty doors — one unchosen door remains. Switch or stay?
                  </p>
                )}
                {roundPhase === 'result' && (
                  <p className={`font-display font-black text-lg text-center mb-4 ${roundWon ? 'text-duo-green-dark' : 'text-duo-red'}`}>
                    {roundWon ? 'You found the prize!' : 'No prize this time'}
                  </p>
                )}

                <div className="flex justify-center gap-3 flex-wrap">
                  {Array.from({ length: TOTAL_DOORS }, (_, i) => (
                    <Door key={i} number={i}
                      doorState={doorState(i)}
                      isChoice={picked === i && roundPhase !== 'result'}
                      isSwitchTarget={switchDoor === i && roundPhase === 'deciding'}
                      isRevealed={revealed.includes(i)}
                      onClick={() => handleDoorClick(i)}
                      disabled={roundPhase !== 'choosing'} />
                  ))}
                </div>

                {/* Result reveal */}
                {roundPhase === 'result' && (
                  <div className={`mt-4 rounded-2xl border-2 px-4 py-3 text-center
                    ${roundWon
                      ? 'bg-duo-green/8 border-duo-green/25'
                      : 'bg-duo-red/8 border-duo-red/20'}`}>
                    <p className="font-body text-sm text-text-mid">
                      Prize was behind door <strong className="text-text-dark">{prizeDoor + 1}</strong>
                      {' — '}you {history[history.length - 1]?.choice === 'switch' ? 'switched' : 'stayed'}
                      {' → '}{roundWon ? 'won' : 'lost'}
                    </p>
                  </div>
                )}
              </div>

              {/* Decision buttons */}
              {roundPhase === 'deciding' && (
                <div className="flex gap-3 mb-3">
                  <motion.button onClick={() => decide('stay')} whileTap={{ scale: 0.97 }}
                    className="flex-1 py-4 rounded-2xl font-display font-black text-lg
                      bg-white border-2 border-[#FF9600] text-[#FF9600]
                      hover:bg-[#FF9600] hover:text-white active:scale-95 transition-all cursor-pointer">
                    Stay with Door {(picked ?? 0) + 1}
                  </motion.button>
                  <motion.button onClick={() => decide('switch')} whileTap={{ scale: 0.97 }}
                    className="flex-1 py-4 rounded-2xl font-display font-black text-lg
                      bg-duo-green text-white border-2 border-transparent
                      shadow-[0_4px_0_#3D8F01] hover:bg-duo-green-dark active:shadow-none
                      active:translate-y-0.5 transition-all cursor-pointer">
                    Switch to Door {(switchDoor ?? 0) + 1}
                  </motion.button>
                </div>
              )}

              {roundPhase === 'result' && (
                <button onClick={nextRound} className="btn-primary w-full py-4 text-lg">
                  {round < TOTAL_ROUNDS ? `Next Round  (${round + 1}/${TOTAL_ROUNDS})` : 'See Final Results'}
                </button>
              )}

              {roundPhase === 'choosing' && (
                <div className="bg-surface-card rounded-2xl border border-surface-border px-4 py-2.5">
                  <p className="font-display font-bold text-xs text-text-muted text-center">
                    Track your win rate — does switching or staying perform better?
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 text-text-muted text-xs font-mono text-center">
          ISAG Interactive Games — Monty Hall
        </p>
      </div>
    </div>
  );
}
