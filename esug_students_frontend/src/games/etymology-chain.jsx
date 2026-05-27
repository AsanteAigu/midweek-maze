import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkWords } from './gemini';

// ── Word dictionary (curated for valid chain paths) ───────────────────────────
const DICT = new Set([
  'CAT','COT','COD','COG','DOG','BAT','FAT','HAT','MAT','RAT','SAT','BOG','FOG','HOG','LOG',
  'GOD','NOD','ROD','SOD','BIT','FIT','HIT','SIT','WIT','BOT','GOT','HOT','JOT','LOT','ROT',
  'CAB','CAN','CAP','CAR','COW','COP','COB','COS','COR',
  'COLD','CORD','WORD','WARD','WARM','BOLD','GOLD','HOLD','MOLD','SOLD','TOLD','FOLD',
  'BORE','CORE','FORD','FORM','FORE','GORE','WORE','WORM','WORN','BORN','CORN','HORN',
  'CARD','HARD','HARE','BARE','CARE','DARE','FARE','MARE','RARE','WARE',
  'BARN','YARN','EARN','LARD','BARD','LORD','LORE','GORE','MORE','FORE',
  'HEAD','HEAL','REAL','RAIL','TAIL','BEAD','DEAD','DEAL','DEAR','FEAR','FEAT',
  'HEAT','HEAP','HEAR','LEAD','MEAL','MEAT','NEAR','READ','REAP','SEAL','TEAL','YEAR',
  'HAIL','JAIL','MAIL','NAIL','PAIL','SAIL','WAIL','BAIL',
  'BALE','DALE','GALE','MALE','PALE','SALE','TALE','VALE',
  'BALL','CALL','FALL','HALL','TALL','WALL','MALL','BELL','CELL','FELL','SELL','TELL','WELL','YELL',
  'BELT','MELT','FELT','WELT','PELT',
  'ABLE','ACRE','AGED','AIDE','AIMS','AIRS','ALSO','ARCH','ARMY','ARTS',
  'BACK','BAKE','BALE','BANE','BANK','BARE','BARK','BASE','BATH','BEAM','BEAN','BEAR','BEAT',
  'BEEF','BEER','BELL','BEST','BILL','BIRD','BITE','BLOT','BLUE','BLUR','BOIL','BOLT','BOND',
  'BONE','BOOK','BORE','BOWL','BUCK','BUFF','BULK','BULL','BURN','BUSH','BUSY',
  'CAKE','CALM','CAPE','CASE','CASH','CAST','CAVE','CHIP','CITE','CLAY','CLIP','CLUB','CLUE',
  'COAL','COAT','CODE','COIL','COIN','CONE','COOK','COST','COVE','CREW','CROP','CUBE',
  'DARK','DART','DASH','DATA','DAWN','DEED','DEEP','DEER','DEFT','DENT','DENY','DESK',
  'DIAL','DIRT','DISH','DOCK','DOLL','DOME','DONE','DOOR','DOSE','DRAG','DRAW','DRIP','DROP',
  'DRUM','DUSK','DUST','EACH','EARL','EASE','EAST','EASY','EDGE','EPIC','EVEN','EVER','EVIL',
  'FACE','FACT','FAIL','FAIR','FAME','FAST','FATE','FEEL','FILE','FILL','FILM','FIND','FINE',
  'FIRM','FISH','FIST','FIZZ','FLAG','FLUE','FOAM','FOIL','FOLK','FOND','FOOL','FORK','FORT',
  'FREE','FUEL','FULL','FUND','FURY','FUSE','FLAW','FLIP','FLOW',
  'GAIN','GAME','GANG','GASH','GASP','GAVE','GAZE','GEAR','GERM','GIVE','GLAD','GLEN','GLUE',
  'GOAL','GOAT','GOLF','GONE','GONG','GOOD','GOWN','GRAB','GRID','GRIN','GRIP','GRIT','GROW',
  'GULF','GULL','GUST','HACK','HALF','HALT','HAND','HANG','HARM','HARP','HASH','HAUL','HELD',
  'HELM','HELP','HERB','HERE','HIGH','HIKE','HILT','HINT','HIRE','HISS','HOLE','HOME','HOOD',
  'HOOK','HOOF','HOPE','HOSE','HOST','HOUR','HULL','HUMP','HUNG','HUNT','HURT','HUSK',
  'IDLE','IDOL','INCH','ISLE','ITCH','JOIN','JOLT','JUMP','JUST','KEEL','KEEN','KEEP',
  'KILL','KILN','KIND','KING','KNOT','LACK','LAID','LAKE','LAME','LAMP','LAND','LANE',
  'LARK','LASH','LAST','LATE','LAUD','LAVA','LAWN','LEAF','LEAK','LEAN','LEAP','LEFT',
  'LEND','LENS','LESS','LICK','LIFE','LIFT','LIME','LINE','LINK','LION','LIST','LIVE',
  'LOAD','LOAN','LOCK','LOFT','LONE','LONG','LOOK','LOOM','LOOP','LOSE','LOSS','LOUD',
  'LOVE','LUCK','LUNG','LURE','LURK','MADE','MAIN','MAKE','MANE','MANY','MARK','MARS',
  'MAST','MATE','MEAN','MEET','MEND','MESS','MILD','MILE','MILL','MIND','MINE','MINT',
  'MISS','MIST','MOAT','MODE','MOLE','MOLT','MOOD','MOON','MOST','MOVE','MUCH','MULL',
  'MUST','MYTH','NAME','NAVY','NEAT','NECK','NEED','NEST','NICK','NINE','NODE','NONE',
  'NOON','NORM','NOSE','NOTE','NOUN','NUDE','NUMB','OATH','ODDS','OMEN','ONCE','ONLY',
  'ONTO','OPEN','OVAL','OVEN','OVER','PACE','PACK','PAGE','PARK','PART','PAVE','PEAK',
  'PEAR','PEEL','PEER','PEST','PILE','PILL','PINE','PINK','PIPE','PITY','PLAN','PLAY',
  'PLOD','PLOT','PLOY','PLUG','POEM','POET','POKE','POLE','POLL','POLO','POND','PONY',
  'POOL','POOR','POPE','PORE','PORT','POSE','POUR','PULL','PUMP','PURE','PUSH',
  'RACE','RACK','RAIN','RAMP','RANG','RANK','RASH','RATE','RAVE','REEL','REIN','RENT',
  'REST','RICH','RIDE','RIFE','RIFT','RING','RIOT','RISE','RISK','ROAD','ROAM','ROAR',
  'RODE','ROLL','ROOF','ROOM','ROPE','ROSE','RUIN','RULE','RUSE','RUSH','RUST',
  'SAFE','SAGE','SAID','SAKE','SAME','SAND','SANE','SANG','SASH','SAVE','SCAN','SCAR',
  'SEAM','SEAT','SEED','SELF','SENT','SHED','SHIP','SHOE','SHOP','SHOT','SHOW','SHUT',
  'SIDE','SILK','SILL','SING','SITE','SIZE','SKIN','SKIP','SLAM','SLAP','SLED','SLIM',
  'SLIP','SLIT','SLOP','SLOT','SLOW','SLUG','SNAP','SNOW','SOAR','SOCK','SOFT','SOIL',
  'SOME','SONG','SOON','SORE','SORT','SOUL','SOUP','SOUR','SPAN','SPAR','SPIN','SPIT',
  'SPOT','STAB','STAR','STAY','STEM','STEP','STEW','STIR','STOP','STUB','STUD','STUN',
  'SUCH','SUIT','SUNG','SUNK','SURE','SURF','SWAN','SWAT','TACK','TANG','TAUT','TEND',
  'TENT','TEST','TEXT','THIN','TICK','TIDE','TIED','TILE','TILL','TIME','TINT','TINY',
  'TIRE','TOIL','TOLL','TOMB','TOME','TONE','TOOK','TOOL','TORE','TOSS','TOUR','TOWN',
  'TRAP','TRAY','TREE','TRIM','TRIP','TROD','TRUE','TUCK','TUSK','TWIN','UGLY','UNDO',
  'UNIT','VANE','VARY','VEER','VEIL','VEIN','VERB','VIEW','VILE','VINE','VOID','VOTE',
  'WADE','WAGE','WAKE','WALK','WANE','WARE','WARN','WARP','WART','WARY','WAVE','WEAK',
  'WEAL','WEAN','WEAR','WEED','WEEK','WELD','WEPT','WEST','WIDE','WIFE','WILD','WILL',
  'WILT','WIND','WINE','WING','WINK','WIRE','WISE','WISH','WISP','WOLF','WOOD','WOOL',
  'WRAP','YELL','YORE','ZONE','ZOOM','BEAD','BEAM','BEAN','BELT','BOLT','BOND',
]);

// ── Puzzles ────────────────────────────────────────────────────────────────────
// Unique twist: 5 steps instead of 4 for the hard puzzle, and a "bonus route"
// shown at the end if player finds the optimal (fewest-step) path.
const PUZZLES = [
  {
    start: 'CAT', end: 'DOG', steps: 4,
    // Optimal: CAT→COT→COD→COG→DOG
    blanks: 3, // intermediate words to fill in
    optimal: ['COT','COD','COG'],
  },
  {
    start: 'COLD', end: 'WARM', steps: 4,
    // Optimal: COLD→CORD→WORD→WARD→WARM
    blanks: 3,
    optimal: ['CORD','WORD','WARD'],
  },
  {
    start: 'HEAD', end: 'TAIL', steps: 4,
    // Optimal: HEAD→HEAL→REAL→RAIL→TAIL
    blanks: 3,
    optimal: ['HEAL','REAL','RAIL'],
  },
];

const MAX_TRIES = 3;

function diffByOne(a, b) {
  if (a.length !== b.length) return false;
  let diffs = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diffs++;
    if (diffs > 1) return false;
  }
  return diffs === 1;
}

// ── Word tile ─────────────────────────────────────────────────────────────────
function WordTile({ value, locked, status, onChange, wordLen = 3 }) {
  const border = status === 'correct' ? '#58CC02'
               : status === 'wrong'   ? '#FF4B4B'
               : status === 'invalid' ? '#FF9600'
               : '#E5E5E5';
  const bg     = status === 'correct' ? '#E8FFD4'
               : status === 'wrong'   ? '#FFECEC'
               : status === 'invalid' ? '#FFF0D4'
               : '#FFFFFF';

  if (locked) return (
    <div className="flex flex-col items-center gap-1">
      <div className="px-4 py-3 rounded-2xl border-2 font-mono font-black text-xl"
        style={{ borderColor: '#1CB0F6', backgroundColor: '#DFF4FF', color: '#0F8FC0', minWidth: 72, textAlign:'center' }}>
        {value}
      </div>
      <span className="font-body text-xs text-text-muted">fixed</span>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-1">
      <input type="text" maxLength={wordLen}
        value={value || ''}
        onChange={e => onChange(e.target.value.toUpperCase())}
        className="px-4 py-3 rounded-2xl border-2 font-mono font-black text-xl text-center
          outline-none focus:ring-4 focus:ring-duo-blue/15 transition-all uppercase"
        style={{ borderColor: border, backgroundColor: bg, width: 72 }}
        placeholder="?" />
      {status === 'correct' && <span className="font-body text-xs text-duo-green-dark">✓</span>}
      {status === 'wrong'   && <span className="font-body text-xs text-duo-red">✗ diff</span>}
      {status === 'invalid' && <span className="font-body text-xs text-duo-orange" style={{color:'#FF9600'}}>?word</span>}
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function EtymologyChain() {
  const [pIdx,     setPIdx]    = useState(0);
  const [inputs,   setInputs]  = useState(['','','']);
  const [triesLeft,setTries]   = useState(MAX_TRIES);
  const [score,    setScore]   = useState(0);
  const [phase,    setPhase]   = useState('intro');
  const [status,   setStatus]  = useState([null,null,null]);
  const [msg,      setMsg]     = useState('');
  const [hints,    setHints]   = useState(0);
  const [checking, setChecking]= useState(false);

  const puzzle = PUZZLES[pIdx];
  const chain  = [puzzle.start, ...inputs, puzzle.end];

  function setInput(i, v) {
    const next = [...inputs];
    next[i] = v;
    setInputs(next);
    setStatus([null,null,null]);
  }

  async function validate() {
    if (inputs.some(w => w.trim() === '')) { setMsg('Fill in all steps first.'); return; }
    setChecking(true);
    setMsg('Checking words…');

    const upperInputs = inputs.map(w => w.toUpperCase());
    const toCheck = upperInputs.filter(w => !DICT.has(w));
    let gemini = {};
    if (toCheck.length > 0) gemini = await checkWords(toCheck);

    const wordOk = w => DICT.has(w) || gemini[w] === true;

    const st = upperInputs.map((w, i) => {
      if (!wordOk(w)) return 'invalid';
      const prev = i === 0 ? puzzle.start.toUpperCase() : upperInputs[i - 1];
      const next = i === upperInputs.length - 1 ? puzzle.end.toUpperCase() : upperInputs[i + 1];
      return (diffByOne(w, prev) && diffByOne(w, next)) ? 'correct' : 'wrong';
    });
    setStatus(st);
    setChecking(false);

    const allCorrect = st.every(s => s === 'correct');
    if (allCorrect) {
      const isOptimal = JSON.stringify(upperInputs) === JSON.stringify(puzzle.optimal);
      const xp = Math.max(150 - hints * 20, 30) + (isOptimal ? 30 : 0);
      setScore(s => s + xp);
      setMsg(isOptimal ? `Optimal path! +${xp} XP` : `Valid chain! +${xp} XP`);
      setHints(0);
      setTimeout(() => {
        if (pIdx >= PUZZLES.length - 1) setPhase('won');
        else { setPIdx(i => i + 1); setInputs(['', '', '']); setStatus([null, null, null]); setMsg(''); }
      }, 900);
    } else {
      const t = triesLeft - 1; setTries(t);
      if (t <= 0) { setPhase('lost'); return; }
      setMsg(`Some steps are wrong — see highlights. ${t} tries left.`);
    }
  }

  function giveHint() {
    const emptyIdx = inputs.findIndex(w => w.trim() === '');
    if (emptyIdx === -1) return;
    const next = [...inputs];
    next[emptyIdx] = puzzle.optimal[emptyIdx];
    setInputs(next);
    setHints(h => h+1);
    setMsg(`Hint: step ${emptyIdx+2} revealed  (−20 XP)`);
    setStatus([null,null,null]);
  }

  function reset() {
    setPIdx(0); setInputs(['','','']); setTries(MAX_TRIES);
    setScore(0); setPhase('playing'); setStatus([null,null,null]); setMsg(''); setHints(0);
  }

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-xl">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Etymology Chain</h1>
        <p className="text-center text-text-mid text-sm mb-5">
          Transform the start word into the end word. Each step changes exactly one letter. Bonus XP for the optimal path.
        </p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Etymology Chain</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Transform the START word into the TARGET word one step at a time."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Each step must produce a new real English word by changing <strong>exactly one letter</strong>."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Example: CAT → BAT → BAD → DAD → DAM → DAM → RAM → RAN → TAN → TEN → HEN."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Shorter chains earn bonus XP. The Hint button reveals one valid intermediate word."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "COLD → CORD → WORD → WARD → WARE → CARE → BARE → DARE: 7 steps."}}/>
              </div>
              <button onClick={() => setPhase('playing')} className="btn-primary w-full py-3 text-base">Got it — Start Playing</button>
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
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">All Chains Complete!</h2>
              <div className="inline-flex items-center gap-2 bg-duo-yellow/15 border-2 border-duo-yellow/40 rounded-2xl px-5 py-2 mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                <span className="font-display font-black text-xl text-duo-yellow-dark">{score} XP</span>
              </div>
              <button onClick={reset} className="btn-primary w-full py-3 text-base">Play Again</button>
            </motion.div>
          )}

          {phase === 'lost' && (
            <motion.div key="lost" initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-red/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border-2 border-duo-red/25">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" strokeWidth="3">
                  <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className="font-display font-black text-2xl text-text-dark mb-3">No More Tries</h2>
              <div className="bg-duo-blue/5 rounded-2xl border border-duo-blue/15 p-4 mb-5">
                <p className="font-display font-bold text-xs text-duo-blue mb-2">Optimal path:</p>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  {[puzzle.start, ...puzzle.optimal, puzzle.end].map((w, i, arr) => (
                    <span key={i} className="flex items-center gap-2">
                      <span className="font-mono font-black text-base text-text-dark bg-white rounded-xl border border-surface-border px-2 py-1">{w}</span>
                      {i < arr.length-1 && <span className="text-text-muted">→</span>}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div key={`p${pIdx}`} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
              {/* HUD */}
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xs text-text-muted uppercase tracking-wider">Puzzle</span>
                  <span className="font-mono font-bold text-xl text-text-dark">{pIdx+1}<span className="text-text-muted text-sm font-normal">/{PUZZLES.length}</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-duo-yellow/15 rounded-xl px-3 py-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                    <span className="font-mono font-bold text-sm text-duo-yellow-dark">{score} XP</span>
                  </div>
                  <div className="flex gap-1.5">
                    {Array.from({length:MAX_TRIES}).map((_,i)=>(
                      <div key={i} className="w-3 h-3 rounded-full" style={{background:i<triesLeft?'#1CB0F6':'#E5E5E5'}}/>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chain */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1CB0F6" strokeWidth="2">
                    <path d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" strokeLinecap="round"/>
                  </svg>
                  <h2 className="font-display font-black text-lg text-text-dark">
                    {puzzle.start} → {puzzle.end}  <span className="text-text-muted font-normal text-base">({puzzle.steps} steps)</span>
                  </h2>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-center">
                  {chain.map((word, i) => {
                    const isFixed = i === 0 || i === chain.length - 1;
                    const st      = isFixed ? null : status[i-1];
                    return (
                      <span key={i} className="flex items-center gap-2">
                        <WordTile
                          value={isFixed ? word : inputs[i-1]}
                          locked={isFixed}
                          status={st}
                          onChange={v => setInput(i-1, v)}
                          wordLen={puzzle.start.length} />
                        {i < chain.length - 1 && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#AFAFAF" strokeWidth="2">
                            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                    );
                  })}
                </div>

                <div className="mt-4 bg-surface-off rounded-xl border border-surface-border px-3 py-2.5">
                  <p className="font-display font-bold text-xs text-text-muted text-center">
                    Each word must differ from its neighbour by exactly 1 letter and be a valid English word.
                    Optimal path earns +30 XP bonus.
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
                  Hint <span className="font-normal text-text-muted">(−20 XP)</span>
                </button>
                <button onClick={()=>{setInputs(['','','']);setStatus([null,null,null]);setMsg('');}}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-surface-border-strong transition-all">
                  Clear
                </button>
              </div>
              <button onClick={validate} disabled={inputs.some(w=>w.trim()=='') || checking}
                className={[
                  'w-full py-4 rounded-2xl font-display font-black text-lg transition-all flex items-center justify-center gap-2',
                  !inputs.some(w=>w.trim()=='') && !checking
                    ? 'bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer'
                    : 'bg-surface-off border-2 border-surface-border text-text-muted cursor-not-allowed',
                ].join(' ')}>
                {checking ? (
                  <>
                    <motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:1,ease:'linear'}}
                      className="w-5 h-5 border-2 border-duo-blue border-t-transparent rounded-full"/>
                    Checking with AI…
                  </>
                ) : 'Check Chain'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ISAG Interactive Games — Etymology Chain</p>
      </div>
    </div>
  );
}
