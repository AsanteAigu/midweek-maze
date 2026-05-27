import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkWords } from './gemini';

// ── Puzzle rings ───────────────────────────────────────────────────────────────
// Each ring: 1 fixed word + 8 blank nodes. Adjacent pairs (including node8→node0 wrap)
// must each differ by exactly 1 letter. ANY valid English word accepted.
const CHAINS = [
  {
    fixed: 'CAT',
    exampleAnswer: ['BAT','BAD','BAG','TAG','TAD','CAD','CAP','CAR'],
    // CAT→BAT→BAD→BAG→TAG→TAD→CAD→CAP→CAR→CAT (all differ by 1)
  },
  {
    fixed: 'COLD',
    exampleAnswer: ['CORD','WORD','WARD','WARE','CARE','CORE','BORE','BOLD'],
    // COLD→CORD→WORD→WARD→WARE→CARE→CORE→BORE→BOLD→COLD
  },
  {
    fixed: 'HEAD',
    exampleAnswer: ['HEAL','REAL','RAIL','TAIL','TALL','BALL','BELL','BELT'],
    wrapOff: true, // belt→head wraps, but no wrap required for this ring
  },
];

// ── Fallback local dictionary (common 3-letter + common 4-letter English words)
// Gemini is the primary validator; this avoids an API call for very common words.
const LOCAL_DICT = new Set([
  // 3-letter
  'ACE','ACT','ADD','AGE','AGO','AID','AIM','AIR','ALE','ALL','AND','ANE','ANI','ANT','APE','APT',
  'ARC','ARE','ARK','ARM','ARS','ART','ASH','ASK','ATE','AWE','AXE','AYE','BAD','BAG','BAN','BAR',
  'BAT','BED','BEG','BEN','BET','BID','BIT','BOD','BOG','BOT','BOW','BOX','BOY','BUD','BUG','BUN',
  'BUS','BUT','BUY','CAB','CAN','CAP','CAR','CAT','COB','COD','COG','CON','COT','COW','CRY','CUB',
  'CUE','CUP','CUT','DAB','DAD','DAM','DEN','DIG','DIM','DIN','DIP','DOC','DOE','DON','DOT','DRY',
  'DUE','DUN','DYE','EAR','EAT','EEL','EGG','ELK','ELM','END','EON','ERA','FAD','FAN','FAR','FAT',
  'FED','FEW','FIG','FIN','FIT','FLY','FOE','FOG','FOX','FRY','FUN','FUR','GAB','GAP','GAS','GEL',
  'GEM','GET','GIN','GOD','GOT','GUM','GUN','GUT','GUY','HAD','HAG','HAM','HAS','HAT','HAY','HEN',
  'HER','HEW','HID','HIM','HIP','HIT','HOD','HOG','HOP','HOT','HOW','HUG','HUM','HUT','ICE','ION',
  'IRE','JAB','JAG','JAM','JAR','JAW','JAY','JET','JIG','JOB','JOG','JOT','JOY','JUG','JUT','KEG',
  'KEN','KEY','KID','KIN','KIT','LAB','LAD','LAG','LAP','LAW','LAY','LED','LEG','LET','LID','LIT',
  'LOG','LOP','LOT','LOW','LUG','MAD','MAN','MAP','MAR','MAT','MAY','MEN','MET','MID','MOB','MOD',
  'MOP','MOW','MUD','MUG','NAB','NAG','NAP','NAY','NET','NIP','NIT','NOB','NOD','NOR','NOT','NOW',
  'OAK','OAR','OAT','ODD','ODE','OIL','OLD','ONE','ORB','ORE','OWE','OWL','OWN','PAD','PAN','PAP',
  'PAR','PAT','PAW','PAY','PEA','PEG','PEN','PER','PET','PIE','PIG','PIN','PIT','POD','POP','POT',
  'PRY','PUB','PUG','PUN','PUT','RAG','RAM','RAN','RAP','RAT','RAW','RAY','RED','RIB','RID','RIG',
  'RIM','RIP','ROB','ROD','ROE','ROT','ROW','RUB','RUG','RUM','RUN','RYE','SAC','SAG','SAP','SAT',
  'SAW','SAY','SEA','SET','SEW','SIN','SIP','SIR','SIT','SOB','SOD','SOT','SOW','SOY','SPA','SUB',
  'SUM','SUN','TAB','TAN','TAP','TAR','TAX','TEA','TEN','TIE','TIN','TIP','TOE','TON','TOP','TOW',
  'TOY','TUB','TUG','URN','VAN','VAT','VET','VIA','VOW','WAD','WAR','WAX','WAY','WEB','WED','WET',
  'WIG','WIN','WIT','WOE','WON','YAP','YEA','YEW',
  // 4-letter
  'ABLE','ACHE','ACID','ACRE','AGED','AIDE','AIMS','AIRS','ALOE','ALSO','AMOK','ANDS','ANEW','ANTE',
  'ANTI','ANTS','APES','APEX','ARCH','ARES','ARIA','ARID','ARKS','ARMS','ARTS','BADE','BALE','BALK',
  'BALL','BALM','BAND','BANE','BANG','BANK','BANS','BARD','BARE','BARK','BARN','BASE','BASH','BASK',
  'BASS','BATE','BATH','BATS','BEAD','BEAK','BEAM','BEAN','BEAR','BEAT','BEEF','BEER','BEET','BELL',
  'BELT','BENT','BERG','BEST','BILE','BILL','BIND','BINS','BIRD','BITE','BITS','BOAR','BOAT','BODY',
  'BOIL','BOLD','BOLT','BOND','BONE','BOOK','BORE','BORN','BOSS','BOUT','BUCK','BULK','BULL','BUMP',
  'BUNK','BUNT','BURN','BURY','BUST','CAGE','CAKE','CALL','CALM','CAME','CAMP','CARD','CARE','CARP',
  'CART','CASE','CASH','CAST','CAVE','CENT','CHAR','CHIP','CLAM','CLAN','CLAW','CLAY','CLOD','CLOG',
  'COAL','COAT','COIL','COIN','COKE','COLD','COME','CONE','COOL','CORD','CORE','CORN','COST','COVE',
  'CREW','CROP','CROW','CUBE','CURL','DACE','DAME','DAMP','DARE','DARK','DART','DASH','DATE','DAWN',
  'DEAD','DEAL','DEAN','DEAR','DECK','DEER','DENY','DICE','DIKE','DILL','DINE','DING','DINT','DIRE',
  'DIRT','DISK','DIVE','DOCK','DOME','DONE','DOOM','DOTE','DOVE','DOWN','DRAM','DRAW','DRIP','DROP',
  'DRUM','DUCK','DUMB','DUMP','DUSK','DUST','EARL','EARN','EARS','EASE','EAST','EATS','EDGE','EMIT',
  'FACE','FACT','FAIL','FAIR','FALL','FAME','FARE','FARM','FAST','FATE','FAWN','FEAT','FEEL','FEET',
  'FELL','FELT','FERN','FILE','FILL','FILM','FINE','FIRM','FISH','FIST','FLAG','FLAT','FLAW','FLAY',
  'FLEW','FLIP','FLIT','FOAM','FOIL','FOLK','FOND','FORD','FORE','FORK','FORM','FORT','FOUL','FOWL',
  'FRAY','FREE','FUEL','FULL','FUME','FUND','FURL','FUSE','FUSS','GAIN','GALE','GALL','GAME','GANG',
  'GASP','GATE','GAVE','GAZE','GEAR','GIFT','GILD','GILT','GIRL','GIST','GIVE','GLEN','GLUE','GLUT',
  'GOAD','GOAT','GOLD','GOLF','GONE','GORE','GOWN','GUST','HAIL','HAIR','HALL','HALT','HAND','HANG',
  'HARD','HARE','HARM','HARP','HATE','HAUL','HAVE','HAWK','HAZE','HEAP','HEAR','HEAT','HEEL','HELD',
  'HELM','HELP','HERB','HERD','HERO','HIDE','HILL','HIRE','HOLD','HOLE','HOME','HONE','HOOF','HOOK',
  'HORN','HOSE','HOST','HULL','HUMP','HUNG','HUNT','IDLE','INCH','IRIS','IRON','JADE','JAIL','JEST',
  'JOIN','JOKE','JOLT','JUST','KEEN','KEEP','KICK','KILL','KIND','KING','KNEE','KNOT','KNOW','LACK',
  'LAID','LAKE','LAME','LAMP','LAND','LANE','LANK','LAST','LATE','LAUD','LAWN','LEAD','LEAF','LEAN',
  'LEAP','LEND','LENS','LESS','LICK','LIKE','LIME','LIMP','LINE','LINK','LION','LISP','LIST','LOBE',
  'LOCK','LODE','LONE','LONG','LOOP','LORD','LORE','LOUT','LOVE','LUCK','LULL','LUMP','LUNG','MAID',
  'MAKE','MALL','MALT','MANE','MARK','MARS','MASK','MATE','MAZE','MEAD','MEAL','MEAN','MEAT','MELT',
  'MERE','MILK','MILL','MIME','MIND','MINT','MIST','MODE','MONK','MOOD','MORE','MOTE','MOVE','MUCH',
  'MULE','MUSE','MUST','MUTE','NAIL','NAPE','NEAR','NEAT','NEST','NICE','NINE','NOTE','NOUN','NUDE',
  'OATH','ODDS','ODOR','ONCE','ONLY','OPEN','ORAL','ORCA','OVAL','OVEN','PAGE','PAIN','PAIR','PALE',
  'PALM','PANE','PANT','PARE','PARK','PART','PAST','PAVE','PAWN','PEAR','PEAT','PEEL','PEER','PEST',
  'PIER','PILE','PLAN','PLOT','PLOW','PLOY','PLUG','POEM','POET','POLE','POLL','POND','PORE','PORT',
  'POSE','POUR','PREY','PROD','PROP','PULL','PUMP','PURE','PUSH','RACE','RACK','RAGE','RAID','RAIL',
  'RAIN','RAKE','RAMP','RANK','RANT','RAPE','RASP','RATE','RAVE','READ','REAL','REAP','REIN','RELY',
  'REND','RENT','RICE','RICH','RIDE','RIFE','RIFT','RING','RIOT','RISE','RISK','ROAM','ROAR','ROBE',
  'ROCK','ROLE','ROLL','ROOF','ROOM','ROOT','ROPE','ROSE','ROUT','RULE','RUNE','RUST','SAFE','SAIL',
  'SALE','SANE','SANG','SASH','SATE','SAVE','SEAL','SEAM','SEAR','SECT','SEED','SELF','SELL','SEND',
  'SENT','SHIN','SHIP','SHOE','SHOP','SHOT','SHOW','SHUT','SILK','SILL','SING','SINK','SITE','SIZE',
  'SKIP','SLAM','SLAP','SLIM','SLIP','SLIT','SLOW','SLUG','SNAP','SOAR','SOCK','SOIL','SOLD','SOLE',
  'SOME','SONG','SOON','SORT','SOUL','SOUP','SOUR','SPAN','SPAR','SPIT','SPOT','STAB','STAG','STAR',
  'STAY','STEM','STEP','STIR','STOP','STUB','STUN','SUCK','SUIT','SURF','TACK','TALE','TALL','TAME',
  'TARE','TART','TASK','TELL','TEND','TEST','TICK','TIDE','TIED','TILE','TILL','TIME','TINY','TIRE',
  'TIER','TOIL','TOLL','TOME','TONE','TOOK','TORE','TORN','TOSS','TRAM','TRAP','TRAY','TREE','TRIM',
  'TRIO','TRIP','TROD','TROT','TRUE','TUCK','TUNE','TURN','UGLY','UNDO','UPON','URGE','USED','VAIN',
  'VALE','VARY','VAST','VEAL','VEIN','VERB','VEST','VIEW','VILE','VINE','VOID','VOTE','WADE','WAGE',
  'WAIL','WANE','WARD','WARM','WARN','WART','WARY','WAVE','WEAR','WEED','WELD','WELL','WENT','WERE',
  'WILT','WIND','WINE','WING','WINK','WISE','WISH','WOLF','WORD','WORE','WORK','WORM','WRAP','WREN',
  'YELL','YORE','ZERO','ZEST','ZONE','WARE','BORE','CORD','FORD','BOLT','BOLT','BARN','BORN',
  'HALL','HEAL','MEAL','SEAL','TEAL','REAL','BAIL','FAIL','HAIL','JAIL','MAIL','NAIL','PAIL','SAIL',
  'WAIL','BALE','DALE','GALE','MALE','PALE','SALE','TALE','VALE','BALL','CALL','FALL','WALL','BELL',
  'CELL','FELL','SELL','TELL','YELL','BEAD','BEAT','FEAT','HEAT','DEAR','FEAR','HEAD','LEAD','READ',
  'TEAL','DEAL','PEAL','HEAL','YEAR','NEAR','HEAR','HEAP','REAP','REEL','FEEL','PEEL','KEEL','HEEL',
]);

const MAX_TRIES = 3;

function diffByOne(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) d++; if (d > 1) return false; }
  return d === 1;
}

// ── Node component ─────────────────────────────────────────────────────────────
function RingNode({ pos, word, isFixed, status, onChange }) {
  const angle = (pos / 9) * 360 - 90;
  const r = 110;
  const x = Math.cos((angle * Math.PI) / 180) * r;
  const y = Math.sin((angle * Math.PI) / 180) * r;

  const border = status === 'correct' ? '#58CC02'
               : status === 'wrong'   ? '#FF4B4B'
               : status === 'invalid' ? '#FF9600'
               : isFixed              ? '#1CB0F6'
               : '#E5E5E5';
  const bg     = status === 'correct' ? '#E8FFD4'
               : status === 'wrong'   ? '#FFECEC'
               : isFixed              ? '#DFF4FF'
               : '#FFFFFF';

  return (
    <div className="absolute flex flex-col items-center gap-0.5"
      style={{ left: `calc(50% + ${x}px - 36px)`, top: `calc(50% + ${y}px - 28px)`, width: 72 }}>
      {isFixed ? (
        <div className="w-16 rounded-xl border-2 px-1 py-2 text-center font-mono font-black text-base"
          style={{ borderColor: border, backgroundColor: bg, color: '#0F8FC0' }}>
          {word}
        </div>
      ) : (
        <input type="text"
          maxLength={word?.length > 0 ? Math.max(word.length + 1, 4) : 4}
          value={word}
          onChange={e => onChange(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
          className="w-16 rounded-xl border-2 px-1 py-2 text-center font-mono font-black text-base outline-none focus:ring-2 focus:ring-duo-blue/20 uppercase"
          style={{ borderColor: border, backgroundColor: bg }}
          placeholder="?" />
      )}
      {status === 'correct' && <span className="text-[9px] font-display font-bold text-duo-green-dark">✓</span>}
      {status === 'wrong'   && <span className="text-[9px] font-display font-bold text-duo-red">diff</span>}
      {status === 'invalid' && <span className="text-[9px] font-display font-bold" style={{color:'#FF9600'}}>?word</span>}
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function WordWorm() {
  const [cIdx,     setCIdx]    = useState(0);
  const [inputs,   setInputs]  = useState(Array(8).fill(''));
  const [triesLeft,setTries]   = useState(MAX_TRIES);
  const [score,    setScore]   = useState(0);
  const [phase,    setPhase]   = useState('intro');
  const [status,   setStatus]  = useState(Array(8).fill(null));
  const [msg,      setMsg]     = useState('');
  const [hints,    setHints]   = useState(0);
  const [checking, setChecking]= useState(false);

  const chain = CHAINS[cIdx];
  const allWords = [chain.fixed, ...inputs];

  function setInput(i, v) {
    const next = [...inputs]; next[i] = v;
    setInputs(next);
    setStatus(Array(8).fill(null));
    setMsg('');
  }

  async function validate() {
    if (inputs.some(w => !w.trim())) { setMsg('Fill in all 8 positions first.'); return; }

    setChecking(true);
    setMsg('Checking words…');

    // Gather all unique words to validate (excluding the fixed word which is always correct)
    const upperInputs = inputs.map(w => w.toUpperCase());

    // Step 1: check local dict, collect unknowns for Gemini
    const toCheck = upperInputs.filter(w => !LOCAL_DICT.has(w));
    let geminiResults = {};
    if (toCheck.length > 0) {
      geminiResults = await checkWords(toCheck);
    }

    // Step 2: compute status for each input node
    const words = [chain.fixed.toUpperCase(), ...upperInputs];
    const st = upperInputs.map((w, i) => {
      // Is it a valid word?
      const wordOk = LOCAL_DICT.has(w) || geminiResults[w] === true;
      if (!wordOk) return 'invalid';

      // Does it differ by exactly 1 letter from its predecessor?
      const prev = words[i]; // words[0]=fixed, words[i]=inputs[i-1]
      const prevOk = diffByOne(w, prev);

      // Does it differ by exactly 1 letter from its successor?
      const nextWord = i < 7 ? upperInputs[i + 1] : null;
      const nextOk = nextWord ? diffByOne(w, nextWord) : true;

      return prevOk && nextOk ? 'correct' : 'wrong';
    });

    // Step 3: wrap-around check (last input → fixed word) for rings that loop
    if (!chain.wrapOff) {
      const last = upperInputs[7];
      if (!diffByOne(last, chain.fixed.toUpperCase())) {
        st[7] = 'wrong';
      }
    }

    setStatus(st);
    setChecking(false);

    const allOk = st.every(s => s === 'correct');
    if (allOk) {
      const xp = Math.max(150 - hints * 25, 30);
      setScore(s => s + xp);
      setMsg(`Ring complete!  +${xp} XP`);
      setHints(0);
      setTimeout(() => {
        if (cIdx >= CHAINS.length - 1) setPhase('won');
        else { setCIdx(i => i+1); setInputs(Array(8).fill('')); setStatus(Array(8).fill(null)); setMsg(''); }
      }, 900);
    } else {
      const invalidCount = st.filter(s => s === 'invalid').length;
      const wrongCount   = st.filter(s => s === 'wrong').length;
      const t = triesLeft - 1; setTries(t);
      if (t <= 0) { setPhase('lost'); return; }
      let detail = [];
      if (invalidCount) detail.push(`${invalidCount} word${invalidCount > 1 ? 's' : ''} not recognised (orange)`);
      if (wrongCount)   detail.push(`${wrongCount} don't differ by exactly 1 letter from neighbours (red)`);
      setMsg(detail.join(' · ') + `. ${t} tries left.`);
    }
  }

  function giveHint() {
    const emptyIdx = inputs.findIndex(w => !w.trim());
    if (emptyIdx === -1) return;
    const next = [...inputs];
    next[emptyIdx] = chain.exampleAnswer[emptyIdx];
    setInputs(next);
    setHints(h => h + 1);
    setMsg(`Hint: one possible word at position ${emptyIdx + 2} revealed (−25 XP)`);
    setStatus(Array(8).fill(null));
  }

  function reset() {
    setCIdx(0); setInputs(Array(8).fill('')); setTries(MAX_TRIES);
    setScore(0); setPhase('playing'); setStatus(Array(8).fill(null)); setMsg(''); setHints(0); setChecking(false);
  }

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-xl">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Word Worm</h1>
        <p className="text-center text-text-mid text-sm mb-5">
          Fill the ring: each word must differ from its neighbour by exactly one letter. The ring wraps around.
        </p>

        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Word Worm</h2>
              <div className="space-y-3 mb-5">
                {[
                  'Nine nodes form a circle. One is fixed (blue) — all other nodes are blank.',
                  'Fill each blank so every adjacent pair of words differs by <strong>exactly one letter</strong> (same length, one character swapped).',
                  'The ring wraps — the last word must also differ by one letter from the fixed starting word.',
                  'Any real English word that fits is accepted. There are many valid solutions!',
                ].map((s, i) => (
                  <div key={i} className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                    <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">{i+1}</span>
                    <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: s}}/>
                  </div>
                ))}
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example ring (CAT fixed)</p>
                <p className="font-body text-sm text-text-mid">CAT→<strong>BAT→BAN→TAN→CAN→PAN→PAR→PAY→PAT</strong>→CAT — each step changes one letter ✓</p>
              </div>
              <button onClick={() => setPhase('playing')} className="btn-primary w-full py-3 text-base">Got it — Start Playing</button>
            </motion.div>
          )}

          {phase === 'won' && (
            <motion.div key="won" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-green rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_6px_24px_rgba(88,204,2,0.35)]">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">All Rings Complete!</h2>
              <div className="inline-flex items-center gap-2 bg-duo-yellow/15 border-2 border-duo-yellow/40 rounded-2xl px-5 py-2 mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                <span className="font-display font-black text-xl text-duo-yellow-dark">{score} XP</span>
              </div>
              <button onClick={reset} className="btn-primary w-full py-3 text-base">Play Again</button>
            </motion.div>
          )}

          {phase === 'lost' && (
            <motion.div key="lost" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-red/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border-2 border-duo-red/25">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#FF4B4B" strokeWidth="3"><path d="M6 18 18 6M6 6l12 12" strokeLinecap="round"/></svg>
              </div>
              <h2 className="font-display font-black text-2xl text-text-dark mb-3">No More Tries</h2>
              <div className="bg-duo-blue/5 rounded-2xl border border-duo-blue/15 p-4 mb-5">
                <p className="font-display font-bold text-xs text-duo-blue uppercase mb-2">One possible answer</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {[chain.fixed, ...chain.exampleAnswer].map((w,i) => (
                    <span key={i} className="font-mono font-bold text-sm bg-white rounded-xl border border-surface-border px-2 py-1">{w}</span>
                  ))}
                </div>
              </div>
              <button onClick={reset} className="btn-primary w-full py-3">Start Over</button>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div key={`c${cIdx}`} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <span className="font-display font-bold text-xs text-text-muted">Ring {cIdx+1}/{CHAINS.length} · Start: <strong className="text-text-dark">{chain.fixed}</strong></span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-duo-yellow/15 rounded-xl px-3 py-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                    <span className="font-mono font-bold text-sm text-duo-yellow-dark">{score} XP</span>
                  </div>
                  <div className="flex gap-1.5">{Array.from({length:MAX_TRIES}).map((_,i) => (
                    <div key={i} className="w-3 h-3 rounded-full" style={{background:i<triesLeft?'#1CB0F6':'#E5E5E5'}}/>
                  ))}</div>
                </div>
              </div>

              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-4 mb-4">
                <div className="relative mx-auto" style={{width:280,height:280}}>
                  <svg className="absolute inset-0" width="280" height="280" viewBox="0 0 280 280">
                    <circle cx="140" cy="140" r="110" fill="none" stroke="#E5E5E5" strokeWidth="2" strokeDasharray="6 4"/>
                  </svg>
                  {allWords.map((word, i) => (
                    <RingNode key={i} pos={i} word={word}
                      isFixed={i===0}
                      status={i===0?null:status[i-1]}
                      onChange={v=>setInput(i-1,v)}/>
                  ))}
                </div>
                <p className="text-center font-display font-bold text-xs text-text-muted mt-2">
                  Blue = fixed · Fill all 8 blanks · Words checked by AI — any valid English word accepted
                </p>
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
                <button onClick={giveHint} disabled={checking}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all disabled:opacity-40">
                  Hint <span className="font-normal text-text-muted">(−25 XP)</span>
                </button>
                <button onClick={()=>{setInputs(Array(8).fill(''));setStatus(Array(8).fill(null));setMsg('');}} disabled={checking}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid transition-all disabled:opacity-40">
                  Clear
                </button>
              </div>
              <button onClick={validate} disabled={inputs.some(w=>!w.trim()) || checking}
                className={['w-full py-4 rounded-2xl font-display font-black text-lg transition-all flex items-center justify-center gap-2',
                  !inputs.some(w=>!w.trim()) && !checking
                    ? 'bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer'
                    : 'bg-surface-off border-2 border-surface-border text-text-muted cursor-not-allowed'].join(' ')}>
                {checking ? (
                  <>
                    <motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:1,ease:'linear'}}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"/>
                    Checking with AI…
                  </>
                ) : 'Check Ring'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ISAG Interactive Games — Word Worm</p>
      </div>
    </div>
  );
}
