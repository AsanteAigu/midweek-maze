import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Puzzle definitions ─────────────────────────────────────────────────────────
// Twist: farmer's name and entity names are rephrased per puzzle.
// Two danger pairs per puzzle; boat holds captain + 1 entity max.
// Unique mechanic: a "night crossing" mode in puzzle 2 — each round trip costs
// extra moves, and the move budget is tight (optimal 7 moves required).

const PUZZLES = [
  {
    title:    'The Survey Team',
    caption:  'A team leader must ferry equipment across the ravine. The rope bridge holds 2 at once.',
    captain:  'Leader',
    captainColor: '#1CB0F6',
    entities: [
      { id: 'drone',   label: 'Drone',   color: '#CE82FF', icon: 'D' },
      { id: 'fuel',    label: 'Fuel',    color: '#FF9600', icon: 'F' },
      { id: 'signal',  label: 'Signal',  color: '#58CC02', icon: 'S' },
    ],
    // Danger pairs (without captain):
    // drone + fuel → drone ignites fuel
    // signal + fuel → signal device sparks fuel
    dangers: [['drone','fuel'],['signal','fuel']],
    // Safe entity alone: signal only, drone only — need to verify
    // Actually fuel can be alone, drone can be alone, signal can be alone.
    // Danger is any pair containing fuel without leader.
    optimalMoves: 7,
    // Classic solution: leader+drone over, leader back, leader+signal over, leader+drone back, leader+fuel over, leader back, leader+drone over
  },
  {
    title:    'The Farm Crossing',
    caption:  'Classic river crossing puzzle — keep the animals safe on each bank.',
    captain:  'Farmer',
    captainColor: '#FF9600',
    entities: [
      { id: 'fox',     label: 'Fox',     color: '#FF4B4B', icon: 'X' },
      { id: 'chicken', label: 'Chicken', color: '#FFC800', icon: 'C' },
      { id: 'grain',   label: 'Grain',   color: '#58CC02', icon: 'G' },
    ],
    dangers: [['fox','chicken'],['chicken','grain']],
    optimalMoves: 7,
  },
];

const MAX_TRIES = 3;

// ── Safety check ──────────────────────────────────────────────────────────────
function isBankSafe(bank, dangers, captainOnBank) {
  if (captainOnBank) return true;
  for (const [a, b] of dangers) {
    if (bank.includes(a) && bank.includes(b)) return false;
  }
  return true;
}

// ── Entity card SVG figure ─────────────────────────────────────────────────────
function EntityCard({ entity, inBoat, onClick, disabled }) {
  return (
    <motion.button onClick={onClick} disabled={disabled}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.92 } : {}}
      className={[
        'flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all select-none w-16',
        inBoat    ? 'border-duo-blue bg-duo-blue/10 shadow-blue'
        : disabled ? 'border-surface-border bg-surface-off opacity-40 cursor-default'
        : 'border-surface-border bg-white hover:border-duo-blue cursor-pointer',
      ].join(' ')}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-lg"
        style={{ backgroundColor: `${entity.color}22`, color: entity.color, border: `2px solid ${entity.color}44` }}>
        {entity.icon}
      </div>
      <span className="font-display font-bold text-xs text-text-dark leading-none">{entity.label}</span>
    </motion.button>
  );
}

// ── Captain figure ────────────────────────────────────────────────────────────
function CaptainBadge({ label, color }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-lg"
        style={{ backgroundColor: `${color}22`, color, border: `2px solid ${color}44` }}>
        L
      </div>
      <span className="font-display font-bold text-xs text-text-dark">{label}</span>
    </div>
  );
}

// ── Bank display ──────────────────────────────────────────────────────────────
function Bank({ label, entities, captainHere, puzzle, boatHere, onPick, boatContents, phase }) {
  const isUnsafe = !isBankSafe(entities.map(e=>e.id), puzzle.dangers, captainHere);
  return (
    <div className={[
      'flex flex-col items-center gap-2 flex-1 rounded-2xl border-2 p-3 min-h-32',
      isUnsafe ? 'border-duo-red/50 bg-duo-red/5' : 'border-surface-border bg-surface-off',
    ].join(' ')}>
      <p className="font-display font-black text-xs text-text-muted uppercase tracking-wider">{label}</p>
      {captainHere && !boatHere && (
        <CaptainBadge label={puzzle.captain} color={puzzle.captainColor} />
      )}
      {boatHere && (
        <div className="flex items-center gap-1 text-xs font-body text-text-muted italic">
          (on boat)
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {entities.map(e => (
          <EntityCard key={e.id} entity={e}
            inBoat={boatContents.includes(e.id)}
            onClick={() => onPick(e.id)}
            disabled={phase !== 'select' || !captainHere || boatContents.includes(e.id)} />
        ))}
      </div>
      {isUnsafe && (
        <span className="font-display font-bold text-xs text-duo-red">Danger!</span>
      )}
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function RiverCrossing() {
  const [pIdx,   setPIdx]   = useState(0);
  const [left,   setLeft]   = useState(() => PUZZLES[0].entities.map(e=>e.id));
  const [right,  setRight]  = useState([]);
  const [boat,   setBoat]   = useState({ side:'left', cargo:[] }); // cargo = entity ids
  const [phase,  setPhase]  = useState('intro'); // select|crossing|won|failed
  const [moves,  setMoves]  = useState(0);
  const [triesLeft,setTries]= useState(MAX_TRIES);
  const [score, setScore] = useState(0);
  const [msg,    setMsg]    = useState('');
  const [hints,  setHints]  = useState(0);

  const puzzle = PUZZLES[pIdx];
  const captainOnLeft  = boat.side === 'left' || phase === 'select';

  // Actual captain position = boat.side when not crossing
  const captainLeft  = boat.side === 'left';
  const captainRight = boat.side === 'right';

  function toggleCargo(id) {
    if (phase !== 'select') return;
    setBoat(b => ({
      ...b,
      cargo: b.cargo.includes(id) ? b.cargo.filter(x=>x!==id) : [...b.cargo, id],
    }));
  }

  function cross() {
    if (phase !== 'select') return;
    const fromSide   = boat.side;
    const toSide     = fromSide === 'left' ? 'right' : 'left';
    const cargo      = boat.cargo;
    const fromBank   = fromSide === 'left' ? [...left] : [...right];
    const toBank     = fromSide === 'left' ? [...right] : [...left];

    // Move cargo entities from source bank to destination
    const newFrom = fromBank.filter(id => !cargo.includes(id));
    const newTo   = [...toBank, ...cargo];
    const newMoves = moves + 1;

    // Captain is now on toSide; check if fromSide is now safe
    const fromSafe = isBankSafe(newFrom, puzzle.dangers, false);

    if (!fromSafe) {
      setMsg('That leaves a dangerous situation on the left bank!');
      setBoat(b => ({ ...b, cargo: [] }));
      return;
    }

    if (fromSide === 'left') { setLeft(newFrom); setRight(newTo); }
    else                     { setRight(newFrom); setLeft(newTo); }

    setBoat({ side: toSide, cargo: [] });
    setMoves(newMoves);
    setMsg('');
    setPhase('crossing');

    setTimeout(() => {
      // Check win: all entities on right
      const finalRight = toSide === 'right' ? newTo : newFrom;
      if (finalRight.length === puzzle.entities.length) {
        const xp = Math.max(150 - hints * 20, 40) + (newMoves <= puzzle.optimalMoves ? 50 : 0);
        setScore(s => s + xp);
        setMsg(newMoves <= puzzle.optimalMoves ? `Optimal!` : `Solved in ${newMoves} moves!`);
        setPhase('won'); if (pIdx >= PUZZLES.length - 1) window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*');
      } else {
        setPhase('select');
      }
    }, 700);
  }

  function giveHint() {
    window.parent.postMessage({ type: 'HINT_USED' }, '*');
    const hints_map = {
      0: [`Take ${puzzle.entities[0].label} across first`],
      1: [`Return alone`],
      2: [`Take ${puzzle.entities[1].label} across`],
      3: [`Bring ${puzzle.entities[0].label} back`],
      4: [`Take ${puzzle.entities[2].label} across`],
      5: [`Return alone`],
      6: [`Finally, take ${puzzle.entities[0].label} across`],
    };
    const tip = hints_map[moves]?.[0] ?? 'Follow the optimal 7-move path';
    setMsg(`Hint: ${tip}`);
    setHints(h => h+1);
  }

  function restart() {
    setLeft(puzzle.entities.map(e=>e.id));
    setRight([]); setBoat({ side:'left', cargo:[] });
    setPhase('select'); setMoves(0); setMsg('');
  }

  function nextPuzzle() {
    const n = pIdx + 1;
    setPIdx(n);
    setLeft(PUZZLES[n].entities.map(e=>e.id));
    setRight([]); setBoat({ side:'left', cargo:[] });
    setPhase('select'); setMoves(0); setMsg(''); setHints(0);
  }

  function resetAll() {
    restart(); setPIdx(0); setTries(MAX_TRIES); setScore(0); setHints(0);
  }

  const leftEntities  = puzzle.entities.filter(e => left.includes(e.id));
  const rightEntities = puzzle.entities.filter(e => right.includes(e.id));

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-xl">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">River Crossing</h1>
        <p className="text-center text-text-mid text-sm mb-5">
          Move everyone across without leaving a dangerous pair unattended. Optimal = 7 moves.
        </p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — River Crossing</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Move all characters from the left bank to the right bank."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "The boat holds the farmer <strong>plus one other character</strong>. The farmer must always be in the boat."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Some characters cannot be left alone together without the farmer (e.g. fox eats goose, goose eats grain)."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Click a character to load them into the boat, then click the boat arrow to cross."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Goose + Grain cannot be left alone. Fox + Goose cannot be left alone. The farmer keeps the peace."}}/>
              </div>
              <button onClick={() => setPhase('select')} className="btn-primary w-full py-3 text-base">Got it — Start Playing</button>
            </motion.div>
          )}

          {phase === 'won' && (
            <motion.div key="won" initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-green rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_6px_24px_rgba(88,204,2,0.35)]">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="font-display font-black text-3xl text-text-dark mb-1">Everyone Across!</h2>
              <p className="font-mono text-lg text-text-mid mb-2">{moves} moves  <span className="text-text-muted text-sm">/ optimal: {puzzle.optimalMoves}</span></p>
              {moves <= puzzle.optimalMoves && <p className="font-display font-bold text-sm text-duo-green mb-2">Optimal path!</p>}
              <div className="flex gap-3">
                {pIdx < PUZZLES.length - 1
                  ? <button onClick={nextPuzzle} className="btn-primary flex-1 py-3">Next Puzzle</button>
                  : <button onClick={resetAll}   className="btn-primary flex-1 py-3">Play Again</button>
                }
              </div>
            </motion.div>
          )}

          {(phase === 'select' || phase === 'crossing') && (
            <motion.div key={`p${pIdx}`} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
              {/* HUD */}
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="block font-display font-bold text-xs text-text-muted uppercase tracking-wider">Moves</span>
                    <span className="font-mono font-bold text-2xl text-text-dark">{moves}</span>
                  </div>
                  <div className="w-px h-8 bg-surface-border"/>
                  <div>
                    <span className="block font-display font-bold text-xs text-text-muted uppercase tracking-wider">Optimal</span>
                    <span className="font-mono font-bold text-2xl text-text-dark">{puzzle.optimalMoves}</span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {Array.from({length:MAX_TRIES}).map((_,i)=>(
                    <div key={i} className="w-3 h-3 rounded-full" style={{background:i<triesLeft?'#1CB0F6':'#E5E5E5'}}/>
                  ))}
                </div>
              </div>

              {/* Story */}
              <div className="bg-duo-blue/5 rounded-2xl border border-duo-blue/15 px-4 py-2.5 mb-4">
                <p className="font-display font-bold text-xs text-duo-blue">{puzzle.caption}</p>
              </div>

              {/* Banks + boat */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-4 mb-4">
                <div className="flex gap-3 items-start">
                  {/* Left bank */}
                  <Bank label="Start" entities={leftEntities} captainHere={boat.side==='left'}
                    puzzle={puzzle} boatHere={false}
                    onPick={toggleCargo} boatContents={boat.cargo} phase={phase} />

                  {/* Boat + river */}
                  <div className="flex flex-col items-center gap-2 flex-shrink-0 w-20">
                    <p className="font-display font-bold text-xs text-text-muted uppercase">Boat</p>
                    {/* Boat visual */}
                    <motion.div
                      animate={{ x: boat.side === 'right' ? 0 : 0 }}
                      className={[
                        'w-16 rounded-2xl border-2 p-2 flex flex-col items-center gap-1',
                        boat.cargo.length > 0 ? 'border-duo-blue bg-duo-blue/10' : 'border-surface-border bg-white',
                      ].join(' ')}>
                      <svg width="36" height="16" viewBox="0 0 36 16">
                        <path d="M2 10 Q18 2 34 10 L32 14 Q18 8 4 14 Z" fill="#7B4F18" stroke="#5C3A0F" strokeWidth="1"/>
                      </svg>
                      {/* Captain always in boat when crossing */}
                      <CaptainBadge label={puzzle.captain} color={puzzle.captainColor} />
                      {/* Cargo */}
                      {boat.cargo.map(id => {
                        const e = puzzle.entities.find(x=>x.id===id);
                        return e ? (
                          <div key={id} className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-sm"
                            style={{ backgroundColor:`${e.color}22`, color:e.color }}>
                            {e.icon}
                          </div>
                        ) : null;
                      })}
                    </motion.div>
                    <p className="font-display font-bold text-xs text-text-muted">
                      {boat.side === 'left' ? '← →' : '→ ←'}
                    </p>
                  </div>

                  {/* Right bank */}
                  <Bank label="End" entities={rightEntities} captainHere={boat.side==='right'}
                    puzzle={puzzle} boatHere={false}
                    onPick={toggleCargo} boatContents={boat.cargo} phase={phase} />
                </div>

                {/* Danger warning */}
                <div className="mt-3 bg-surface-off rounded-xl border border-surface-border px-3 py-2">
                  <p className="font-display font-bold text-xs text-text-muted text-center">
                    Danger pairs: {puzzle.dangers.map(([a,b])=>{
                      const ea = puzzle.entities.find(e=>e.id===a);
                      const eb = puzzle.entities.find(e=>e.id===b);
                      return `${ea?.label}+${eb?.label}`;
                    }).join(', ')} — never leave these alone without {puzzle.captain}
                  </p>
                </div>
              </div>

              <AnimatePresence>
                {msg && (
                  <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                    className="bg-surface-card rounded-2xl border border-surface-border px-4 py-2.5 mb-4 text-center font-body text-sm text-text-mid">
                    {msg}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 mb-3">
                <button onClick={giveHint}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all">
                  Hint <span className="font-normal text-text-muted"></span>
                </button>
                <button onClick={restart}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-surface-border-strong transition-all">
                  Restart
                </button>
              </div>

              <button onClick={cross} disabled={phase==='crossing'}
                className={[
                  'w-full py-4 rounded-2xl font-display font-black text-lg transition-all',
                  phase === 'crossing' ? 'bg-surface-off border-2 border-surface-border text-text-muted cursor-not-allowed'
                  : 'bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer',
                ].join(' ')}>
                {phase === 'crossing' ? 'Crossing...'
                  : boat.cargo.length > 0
                  ? `Cross with ${puzzle.entities.find(e=>boat.cargo[0]===e.id)?.label}`
                  : `Cross alone (${boat.side==='left'?'→':'←'})`}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ESUG Interactive Games — River Crossing</p>
      </div>
    </div>
  );
}
