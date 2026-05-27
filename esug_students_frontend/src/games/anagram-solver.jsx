import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Large dictionary ────────────────────────────────────────────────────────────
// Any valid English word that can be formed from the available letters is accepted.
// Validation = DICTIONARY.has(word) && canForm(word, letters)
const DICTIONARY = new Set([
  // 3-letter
  'ACE','ACT','ADD','AGE','AGO','AID','AIM','AIR','ALE','ALL','AND','ANE','ANI','ANT','ANY','APE','APT','ARC','ARE','ARK','ARM','ARS','ART','ASH','ASK','ATE','AWE','AXE','AYE',
  'BAD','BAG','BAN','BAR','BAT','BED','BEG','BEN','BET','BID','BIT','BOD','BOG','BOT','BOW','BOX','BOY','BUD','BUG','BUN','BUS','BUT','BUY',
  'CAB','CAN','CAP','CAR','CAT','COB','COD','COG','CON','COT','COW','CRY','CUB','CUE','CUP','CUT',
  'DAB','DAD','DAM','DAP','DAY','DEN','DEW','DIG','DIM','DIN','DIP','DOC','DOE','DON','DOT','DRY','DUB','DUE','DUN','DUO','DYE',
  'EAR','EAT','EEL','EGG','ELK','ELM','END','EON','ERA',
  'FAD','FAN','FAR','FAT','FED','FEW','FIG','FIN','FIT','FLY','FOE','FOG','FOX','FRY','FUN','FUR',
  'GAB','GAG','GAL','GAP','GAS','GAY','GEL','GEM','GET','GIN','GOD','GOT','GUM','GUN','GUT','GUY',
  'HAD','HAG','HAM','HAS','HAT','HAY','HEN','HER','HEW','HID','HIM','HIP','HIT','HOD','HOG','HOP','HOT','HOW','HUG','HUM','HUT',
  'ICE','ILL','ION','IRE',
  'JAB','JAG','JAM','JAR','JAW','JAY','JET','JIG','JOB','JOG','JOT','JOY','JUG','JUT',
  'KEG','KEN','KEY','KID','KIN','KIT',
  'LAB','LAD','LAG','LAP','LAW','LAX','LAY','LED','LEG','LET','LID','LIT','LOG','LOP','LOT','LOW','LUG',
  'MAD','MAN','MAP','MAR','MAT','MAY','MEN','MET','MID','MOB','MOD','MOP','MOW','MUD','MUG',
  'NAB','NAG','NAP','NAY','NET','NEW','NIP','NIT','NOB','NOD','NOR','NOT','NOW','NUB',
  'OAK','OAR','OAT','ODE','ODD','OIL','OLD','ONE','ORB','ORE','OWE','OWL','OWN',
  'PAD','PAN','PAP','PAR','PAT','PAW','PAY','PEA','PEG','PEN','PER','PET','PIE','PIG','PIN','PIP','PIT','POD','POP','POT','PRY','PUB','PUG','PUN','PUT',
  'RAG','RAM','RAN','RAP','RAT','RAW','RAY','RED','RIB','RID','RIG','RIM','RIP','ROB','ROD','ROE','ROT','ROW','RUB','RUG','RUM','RUN','RYE',
  'SAC','SAG','SAP','SAT','SAW','SAY','SEA','SET','SEW','SIN','SIP','SIR','SIT','SOB','SOD','SOT','SOW','SOY','SPA','SUB','SUM','SUN','SUP',
  'TAB','TAN','TAP','TAR','TAX','TEA','TEN','TIE','TIN','TIP','TOE','TON','TOP','TOW','TOY','TUB','TUG','TUN',
  'UDO','URN','USE',
  'VAN','VAT','VET','VIA','VIE','VOW',
  'WAD','WAR','WAX','WAY','WEB','WED','WET','WIG','WIN','WIT','WOE','WON',
  'YAK','YAP','YEA','YEW','YOU',
  // 4-letter
  'ABLE','ACHE','ACID','ACRE','AGED','AIDE','AINS','AIRN','AIRS','AIRY','ALOE','ALTO','AMOK','ANDS','ANEW','ANTE','ANTI','ANTS','APES','APEX','ARCH','ARES','ARIA','ARID','ARMS','ARTS','ARTY',
  'BADE','BALE','BALK','BALL','BALM','BAND','BANE','BANG','BANK','BANS','BARD','BARE','BARK','BARN','BASE','BASH','BASK','BASS','BATE','BATH','BATS','BEAD','BEAK','BEAM','BEAN','BEAR','BEAT','BEEF','BEEN','BEER','BEET','BELL','BELT','BENT','BERG','BEST','BETA','BILE','BILL','BIND','BINS','BIRD','BITE','BITS','BOAR','BOAT','BODY','BOIL','BOLD','BOLT','BOND','BONE','BOOK','BORE','BORN','BOSS','BOUT','BREW','BUCK','BULK','BULL','BUMP','BUNK','BUNT','BURN','BURY','BUST',
  'CAGE','CAKE','CALL','CALM','CAME','CAMP','CAPE','CAPS','CARD','CARE','CARP','CARS','CART','CASE','CASH','CAST','CAVE','CENT','CHAD','CHAR','CHIN','CHIP','CLAM','CLAP','CLAN','CLAW','CLAY','CLOD','CLOG','CLOP','COAL','COAT','COIL','COIN','COKE','COLD','COME','CONE','COOL','CORD','CORE','CORN','COST','COVE','CREW','CROP','CROW','CUBE','CURL',
  'DACE','DAME','DAMP','DARE','DARK','DART','DASH','DATE','DAWN','DEAD','DEAL','DEAN','DEAR','DECK','DEER','DENY','DIAL','DICE','DIKE','DILL','DINE','DING','DINT','DIRE','DIRT','DISK','DIVE','DOCK','DOME','DONE','DOOM','DOTE','DOVE','DOWN','DRAM','DRAW','DRIP','DROP','DRUM','DUCK','DUMB','DUMP','DUSK','DUST',
  'EARL','EARN','EARS','EASE','EAST','EATS','EDGE','EMIT','EVIL',
  'FACE','FACT','FAIL','FAIR','FALL','FAME','FARE','FARM','FAST','FATE','FAWN','FEAT','FEEL','FEET','FELL','FELT','FERN','FILE','FILL','FILM','FINE','FIRM','FISH','FIST','FLAG','FLAT','FLAW','FLAY','FLEW','FLEX','FLIP','FLIT','FLOG','FLOP','FLOW','FOAM','FOIL','FOLK','FOND','FONT','FORD','FORE','FORK','FORM','FORT','FOUL','FOWL','FRAY','FROG','FUEL','FULL','FUME','FUND','FURL','FUSE','FUSS',
  'GAIN','GALE','GALL','GAME','GANG','GASP','GATE','GAVE','GAZE','GEAR','GIFT','GILD','GILT','GIRL','GIST','GIVE','GLEN','GLUE','GLUT','GOAD','GOAT','GOLD','GOLF','GONE','GORE','GOWN','GUST',
  'HAIL','HAIR','HALL','HALT','HAND','HANG','HARD','HARE','HARM','HARP','HATE','HAUL','HAVE','HAWK','HAZE','HEAP','HEAR','HEAT','HEEL','HELD','HELM','HELP','HERB','HERD','HERO','HIDE','HILL','HIRE','HOLD','HOLE','HOME','HONE','HOOF','HOOK','HORN','HOSE','HOST','HULL','HUMP','HUNG','HUNT',
  'ICON','IDLE','INCH','IRIS','IRON','ITEM',
  'JADE','JAIL','JEST','JOIN','JOKE','JOLT','JUNK','JURY','JUST',
  'KEEN','KEEP','KICK','KILL','KIND','KING','KNEE','KNEW','KNOT','KNOW',
  'LACK','LAID','LAKE','LAME','LAMP','LAND','LANE','LANK','LAST','LATE','LAUD','LAWN','LAZE','LEAD','LEAF','LEAN','LEAP','LEND','LENS','LESS','LICK','LIKE','LIME','LIMP','LINE','LINK','LION','LISP','LIST','LOBE','LOCK','LODE','LONE','LONG','LOOM','LOOP','LORD','LORE','LOUT','LOVE','LUCK','LULL','LUMP','LUNG',
  'MAID','MAKE','MALL','MALT','MANE','MARK','MARS','MASK','MATE','MAZE','MEAD','MEAL','MEAN','MEAT','MELT','MERE','MILK','MILL','MIME','MIND','MINT','MIST','MODE','MONK','MOOD','MORE','MOTE','MOVE','MUCH','MULE','MUSE','MUST','MUTE',
  'NAIF','NAIL','NAPE','NAPS','NEAR','NEAT','NEON','NEST','NICE','NINE','NOTE','NOUN','NUDE','NUMB',
  'OATH','ODDS','ODOR','ONCE','ONLY','OPEN','ORAL','ORCA','ORES','OVAL','OVEN',
  'PAGE','PAIN','PAIR','PALE','PALM','PANE','PANT','PARE','PARK','PART','PAST','PAVE','PAWN','PEAR','PEAT','PEEL','PEER','PEST','PIER','PILE','PITS','PLAN','PLOD','PLOP','PLOT','PLOW','PLOY','PLUG','PLUS','POEM','POET','POLE','POLL','POND','PORE','PORT','POSE','POUR','PREY','PROD','PROP','PULL','PUMP','PURE','PUSH',
  'RACE','RACK','RAGE','RAID','RAIL','RAIN','RAKE','RAMP','RANK','RANT','RAPE','RASP','RATE','RAVE','READ','REAL','REAP','REIN','RELY','REND','RENT','RICE','RICH','RIDE','RIFE','RIFT','RING','RIOT','RISE','RISK','ROAM','ROAR','ROBE','ROCK','ROLE','ROLL','ROOD','ROOF','ROOM','ROOT','ROPE','ROSE','ROUT','RULE','RUNE','RUST',
  'SAFE','SAIL','SALE','SANE','SANG','SARI','SASH','SATE','SAVE','SCAN','SCAR','SEAL','SEAM','SEAR','SECT','SEED','SEEM','SEEP','SEER','SELF','SELL','SEND','SENT','SHIN','SHIP','SHOE','SHOP','SHOT','SHOW','SHUT','SICK','SIDE','SIGH','SILK','SILL','SING','SINK','SITE','SIZE','SKIP','SLAM','SLAP','SLED','SLIM','SLIP','SLIT','SLOW','SLUG','SLUR','SNAP','SOAR','SOCK','SOIL','SOLD','SOLE','SOME','SONG','SOON','SORT','SOUL','SOUP','SOUR','SPAN','SPAR','SPIT','SPOT','SPUR','STAB','STAG','STAR','STAY','STEM','STEP','STIR','STOP','STUB','STUN','SUCK','SUIT','SURF',
  'TACK','TALE','TALL','TAME','TARE','TART','TASK','TAXI','TELL','TEND','TEST','TICK','TIDY','TILL','TIME','TINY','TIRE','TIER','TOIL','TOLL','TOME','TONE','TOOK','TORE','TORN','TOSS','TRAM','TRAP','TRAY','TREE','TRIM','TRIO','TRIP','TROD','TROT','TROY','TRUE','TUCK','TUNE','TUFT','TURN','TYPE',
  'ULNA','UNDO','UPON','URGE','USED',
  'VAIN','VALE','VARY','VAST','VEAL','VEIN','VERB','VEST','VIEW','VILE','VINE','VISE','VOID','VOLE','VOLT','VOTE',
  'WADE','WAGE','WAIL','WANE','WARD','WARM','WARN','WART','WARY','WAVE','WEAR','WEED','WEEK','WELD','WELL','WENT','WERE','WILT','WIND','WINE','WING','WINK','WISE','WISH','WOKE','WOLF','WORD','WORE','WORK','WORM','WREN',
  'YELL','YORE','ZERO','ZEST','ZONE',
  // anagram-set specific 4-letter
  'AIRN','AINE','RINS','PIRN','RANI','PITA','NIPA','NAIP','SNIT','TAIN','TARN','TERN','SPIT','SPIN','SNIP','PINT','PINE','PANS','RAPS','RATS','ARTS','ANTS','TINS','PINS','TIPS','AIRS','PAIR','PEAR','TAPE','NAPE','RENT','REIN','RAIN','PAIN','SPAN','TEAS','TENS','APES','NEST','NETS','NIPS','RAPS','RATS',
  'COTE','DINT','NODE','NODI','NOIR','NORI','RODE','ROTE','TIDE','TIED','TINE','CORD','COIN','DOTE','DONE','DIET','DICE','DINE','ICON','INTO','IRON','RIND','RITE',
  'BALE','BALK','BANK','BASK','BELT','BENT','BEST','BETA','KALE','KENT','LAKE','LANE','LANK','LENS','LEAN','LEAK','LEST','NABS','NETS',
  // 5-letter
  'ABACK','ABIDE','ABODE','ABOUT','ABOVE','ABUSE','ACHED','ACHES','ACIDS','ACRES','ACTED','ACUTE','ADMIT','ADOBE','ADOPT','ADORE','ADORN','ADULT','AFTER','AGAIN','AGATE','AGENT','AGILE','AGREE','AISLE','ALARM','ALIEN','ALIKE','ALIVE','ALOFT','ALONE','ALONG','ALOOF','ALOUD','ALTER','AMBER','AMEND','AMISS','AMONG','AMPLE','AMUSE','ANGEL','ANGER','ANGLE','ANIME','ANODE','ANISE','ANKLE','ANNEX','ANTIC','APART','APPLE','APPLY','ARISE','ARSON','ASHEN','ASIDE',
  'BADLY','BAKER','BEGIN','BEING','BELOW','BLAND','BLAME','BLANK','BLAST','BLAZE','BLEND','BLESS','BLISS','BLOWN','BOUND','BRAND','BRAVE','BREED','BRICK','BRIDE','BRIEF','BRISK','BROKE','BROOK','BROWN','BRUSH','BUILT','BURST',
  'CATER','CAUSE','CEDAR','CHAIN','CHAIR','CHALK','CHAOS','CHASE','CHEAP','CHECK','CHEER','CHESS','CHEST','CHIME','CHINA','CHOIR','CHOSE','CIVIC','CIVIL','CLAIM','CLANG','CLASS','CLEAN','CLEAR','CLEFT','CLERK','CLIFF','CLIMB','CLING','CLOCK','CLONE','CLOSE','CLOTH','CLOUD','CLOVE','COAST','COBRA','COMET','COMIC','COMMA','CORAL','COULD','COUNT','COURT','COVER','CRACK','CRAFT','CRANE','CRASH','CRAZY','CREST','CRIME','CROWN','CRUSH','CURVE','CYCLE',
  'DAIRY','DANCE','DARTS','DECAY','DECOR','DEFER','DELTA','DEMON','DENSE','DEPTH','DERBY','DIRTY','DISCO','DITCH','DITTY','DOUBT','DOUGH','DRAFT','DRAIN','DRAMA','DRAPE','DRAWN','DREAD','DRIFT','DRINK','DRIVE','DRONE','DROVE','DROWN','DUNES',
  'EAGER','EAGLE','EARLY','EARTH','EBONY','EDGED','EIGHT','ELITE','EMPTY','ENACT','ENTER','EQUAL','ERODE','ERROR','ESSAY','EVADE','EVOKE','EXACT','EXALT','EXCEL','EXIST','EXTRA',
  'FABLE','FAINT','FAIRY','FAITH','FALSE','FANCY','FEAST','FERRY','FETCH','FIELD','FIERY','FIFTH','FIFTY','FIGHT','FINAL','FIRST','FIXED','FLANK','FLARE','FLASH','FLEET','FLESH','FLICK','FLING','FLOOR','FLOUR','FLOWN','FLUTE','FOCAL','FORCE','FORGE','FORTH','FOUND','FRAME','FRESH','FROST','FRONT',
  'GAMES','GAUGE','GLOAT','GLOBE','GLOSS','GLOVE','GRACE','GRADE','GRAIN','GRANT','GRAPH','GRASP','GRASS','GRATE','GRAVE','GRAZE','GREED','GREET','GRIPE','GROAN','GROIN','GROSS','GROUP','GROVE','GROWL','GROWN','GRUFF','GUARD','GUESS','GUILE','GUISE','GUSTO',
  'HAPPY','HARSH','HASTY','HAVEN','HEART','HEAVY','HELIX','HERON','HINGE','HOLLY','HONOR','HORSE','HOUSE','HUMAN','HUMID','HUSKY',
  'IDEAL','IMAGE','IMPLY','INDEX','INNER','INPUT','IRONY','ISSUE','IRATE',
  'JEWEL','JOUST','JUDGE','JUICE','JUICY','JUMBO',
  'KNIFE','KNELT','KNOCK','KNOWN',
  'LARGE','LATCH','LATER','LAUGH','LAYER','LEAFY','LEAKY','LEDGE','LEGAL','LEGIT','LEMON','LEVEL','LIGHT','LILAC','LIMIT','LINER','LINGO','LIVER','LOCAL','LODGE','LOGIC','LOOSE','LOWER','LUCKY','LUNAR',
  'MAGIC','MAIZE','MAJOR','MAKER','MANOR','MAPLE','MARCH','MARRY','MATCH','MAYBE','MAYOR','MEDIA','MERCY','MERIT','METAL','METRO','MINUS','MIRTH','MISER','MITRE','MODEL','MONEY','MORAL','MOTEL','MOTIF','MOTTO','MOUNT','MOUSE','MOUTH','MOVIE',
  'NADIR','NAIVE','NERVY','NEVER','NIGHT','NOBLE','NOISY','NORTH','NOTCH','NOTED','NOVEL','NURSE',
  'OCEAN','OFFER','OFTEN','OLIVE','ONSET','OPERA','ORBIT','ORDER','ORGAN','OTTER','OUTER','OZONE',
  'PAINT','PANDA','PANEL','PANIC','PANSY','PASTE','PATCH','PAUSE','PEACE','PEARL','PENAL','PENNY','PERCH','PERKY','PETTY','PHASE','PIANO','PIXEL','PLACE','PLAIN','PLANE','PLANT','PLAZA','PLEAD','PLEAT','PLUCK','PLUMB','PLUME','PLUMP','POINT','POLAR','POUND','POWER','PRESS','PRICE','PRIDE','PRIME','PRINT','PRIZE','PRONE','PROOF','PROSE','PROUD','PROVE','PROWL','PRUNE','PULSE','PUPPY','PURGE','PURSE',
  'QUAKE','QUALM','QUEEN','QUEST','QUICK','QUIET','QUILL','QUITE','QUOTA','QUOTE',
  'RAISE','RANGE','RAPID','RATED','RATIO','REALM','REBEL','REIGN','RELAX','REPAY','REPEL','RESIN','REVEL','RIDER','RIDGE','RIGHT','RIPEN','RISEN','RISKY','RIVAL','RIVER','ROBOT','ROCKY','ROUGE','ROUGH','ROUND','ROUSE','ROUTE',
  'SALTY','SAUCE','SCALE','SCENE','SCOOP','SCOPE','SCORE','SCOUT','SHACK','SHADE','SHAFT','SHAKE','SHALL','SHAME','SHAPE','SHARE','SHARK','SHARP','SHELF','SHELL','SHIFT','SHIRT','SHOCK','SHORT','SHORE','SHOWN','SIGHT','SILKY','SINCE','SINEW','SIZED','SKATE','SKILL','SKULL','SLACK','SLAIN','SLANT','SLAVE','SLEEK','SLEEP','SLEET','SLICK','SLIDE','SLOPE','SLOTH','SMART','SMASH','SMELL','SMILE','SMIRK','SMOKE','SNAIL','SNAKE','SNEAK','SNORE','SOLID','SOLVE','SORRY','SOUTH','SPACE','SPARE','SPARK','SPAWN','SPEAK','SPEAR','SPEED','SPEND','SPICE','SPICY','SPIKE','SPINE','SPITE','SPLIT','SPOON','SPORE','SPORT','SPRAY','SQUAD','SQUAT','STAIN','STALE','STALL','STAMP','STAND','STARE','START','STATE','STEAK','STEAL','STEED','STEEL','STEEP','STEER','STERN','STING','STOCK','STOMP','STOOD','STORM','STORY','STOUT','STOVE','STRAP','STRAW','STRAY','STRIP','STUCK','STYLE','SUGAR','SULKY','SUNNY','SURGE','SWAMP','SWEAR','SWEAT','SWEEP','SWEET','SWIFT','SWIRL','SWORD',
  'TAINT','TALON','TAMED','TASTE','TEACH','TENSE','TEPID','THORN','THREE','THUMB','TIGER','TIGHT','TIMER','TIRED','TITLE','TODAY','TOKEN','TORCH','TOTAL','TOUCH','TOUGH','TOWER','TOXIC','TRACK','TRADE','TRAIL','TRAIN','TRAIT','TRASH','TREAD','TREAT','TREND','TRIAL','TRICK','TRIED','TULIP','TWIRL','TWIST',
  'ULTRA','UPSET','URBAN','USHER','USUAL','UTTER',
  'VALID','VALOR','VALUE','VALVE','VAPOR','VITAL','VOCAL','VOICE',
  'WAGON','WATCH','WATER','WEARY','WIELD','WINDY','WITCH','WOMAN','WORLD','WOULD','WRATH','WREAK','WRECK','WRIST','WRITE','WRONG',
  'YOUTH',
  // 5-letter anagram-set specific
  'AIRNS','ANTES','ANTIS','ARPEN','IRATE','NAPES','OATER','PAINS','PAIRS','PANES','PANTS','PARSE','PASTE','PATER','PATIO','PENIS','PINES','PINTS','PIRNS','RAINY','RANTS','RAPES','RATES','REINS','RENIN','RIANT','RISEN','RITES','SATIN','SEPIA','SNARE','SNIPE','SPINE','SPIRE','TAPIR','TARES','TARNS','TEARS','TERNS','TRAIN','TRIPS','ATONE','REPAST','RAPIST','PIRATE','STRAIN','PRIEST','SPRINT','STRIPE','INSTEP','ENTRAP','PARENT','SATIRE','SNIPER','INSANE',
  'CRONE','DROIT','TRICE','CORED','IRKED','ONICE','TONED','NOTED','DRONE','ONTIC','RECTO','DINER','TRIED','CEDER','RECTO',
  'ANKLE','BASTE','LANES','BLANK','BLAST','STALK','STANK','SKATE','STAKE','SNEAK','STALE','SLATE','STEAL','SLAKE','LATEN','LEANT','ELKAN','KNELT',
  // 6-letter
  'ACTIVE','ADHERE','ADMIRE','APPEAR','ARTIST','ATTACH','AUTUMN',
  'BANTER','BEACON','BEAUTY','BEFORE','BEHIND','BETTER','BITTER','BONNET','BORDER','BOTTLE','BOTTOM','BREACH','BREEZE','BRIDGE','BRIGHT','BRUTAL',
  'CANOPY','CASTLE','CATTLE','CHANCE','CHANGE','CHARGE','CHOSEN','CIRCLE','CLEVER','CLOSET','COSTLY','COTTON','COURSE','CREDIT','CINDER','COINED','COINER','CORNET','CORNER','COSTER',
  'DANGER','DAPPER','DARKER','DEFINE','DETAIL','DIVINE','DOCTOR','DOUBLE','DRIVEN','DIVERT','DIRECT','DECENT',
  'EASIER','ENERGY','ERRANT','ESTATE',
  'FACTOR','FALLOW','FATHER','FIGURE','FILLER','FINGER','FLOWER','FLYING','FOLLOW','FOREST','FORMAL','FROZEN',
  'GENTLE','GLOBAL','GRAVEL',
  'HEROIC','HONEST','HUNGER','HUNTER',
  'IMPACT','INSULT','INTENT','IRONIC','ISLAND','IRONED',
  'JOINER','JUNGLE',
  'KERNEL','KINDLE',
  'MIRROR','MOLTEN','MOTION','NATURE','NORMAL','NOTICE','NAIVER',
  'OBJECT','ORIGIN',
  'PALACE','PARENT','PATRON','PATROL','PEOPLE','PERSON','PHRASE','PLENTY','POETIC','POLICE','PONDER','PRETTY','PAINTS','PIRATE','RAPIST','SATIRE','STRAIN','TRAINS','SNIPER','SPIRAL','PANIST','TAPIRS','REPAST','INSTEP','PARENT','ENTRAP','PRIEST','SPRINT','STRIPE','TAPERS','SATINS','PASTRY','STARIN',
  'RACIAL','REMOVE','REPAIR','RETURN','RODENT',
  'SCALES','SCENIC','SCHOOL','SCREEN','SEASON','SECTOR','SIMPLE','SINGLE','SLIGHT','SLOWER','SMOOTH','SOFTEN','SPIRIT','SPRING','STREET','STRIKE','STRING','STRONG','STUDIO','SUBTLE',
  'TENNIS','THRONE','TRAGIC',
  'USEFUL',
  'VALLEY','VERBAL','VICTOR','VISUAL',
  'WITHIN','WONDER','WOODEN','WRITER',
  // 6-letter anagram-set specific
  'PIRATE','PRIEST','RAPIST','SATIRE','STRAIN','TRAINS','SNIPER','TAPERS','REPAST','PASTRY','RETINA','RETAIN','STEARIN','CRETIN','NICTER','TRINES','TRIENS','CITRON','CINTER','NOTICE','NOETIC','CENSOR','CRONES','CORNED','INTROD','COINED','COINER','IRONED','CINDER','TRICED','RODENT','CORNET','DIRECT','NOITER',
  'BLANKS','ANKLET','TANKS','STALK','LATEN','LANKET',
  // 7-letter
  'PAINTER','PANTIES','PARTIES','RETAINS','NASTIER','PIRATES','SAPIENT','PERTAIN','CERTAIN','CAPTAIN','TERRAIN','POINTED',
  'NOTICES','CINDERS','COINTER','NOTICER','CORNICED','DIRECTO','TROUNCE','IRECTION',
  'BLANKET','TANKLES',
  // 8-letter
  'PAINTERS','DOCTRINE','BLANKETS','CENTROID',
  // extra common 5+ letter words for DOCTRINE set
  'CRONE','NOTER','TONIC','IONIC','INCOR','INERT','INDIE','CONTE','CLONE','COTED','DOTER','NOTER','TONER','TENOR','DRONE','ONICE',
  'COINED','IRONED','CINDER','TRICED','CORNET','DIRECT','RODENT','NOITER','COINER','NOTICE','CITRON',
  // extra common words
  'STONE','NOTES','TONES','CORDS','CORED','NODES','RIDES','TIDES','COINS','CORES','IRONS','CONES','RINDS','RITES','OILER','LONER','OGLED',
  'BALES','BALLS','BANDS','BANKS','BANES','NAILS','TALES','TALES','STEAL','STALE','SLATE','SKATE','STAKE','SNEAK','ANKLE','BLANK','BLAST','SLANT','STANK','LATTE','LANES',
  // more 3-letter specific to sets
  'ORC','TOR','ROT','NOD','DIN','COD','CON','COT','DOC','DON','DOT',
  'ETA','TAE','REI','NAE','IRE',
  // SAT / NIT / TIN etc
  'SAT','NIT','TIN','SIT','SIN','RIN','AIN',
]);

// ── Letter sets ─────────────────────────────────────────────────────────────────
const LETTER_SETS = [
  {
    letters: ['P','A','I','N','T','E','R','S'],
    pangram: 'PAINTERS',
    display: 'P A I N T E R S',
  },
  {
    letters: ['D','O','C','T','R','I','N','E'],
    pangram: 'DOCTRINE',
    display: 'D O C T R I N E',
  },
  {
    letters: ['B','L','A','N','K','E','T','S'],
    pangram: 'BLANKETS',
    display: 'B L A N K E T S',
  },
];

function canForm(word, letterArr) {
  const available = [...letterArr];
  for (const c of word) {
    const i = available.indexOf(c);
    if (i === -1) return false;
    available.splice(i, 1);
  }
  return true;
}

const TILE_COLORS = ['#1CB0F6','#58CC02','#CE82FF','#FF9600','#FF4B4B','#1CB0F6','#58CC02','#CE82FF'];

export default function AnagramSolver() {
  const [setIdx,  setSetIdx]  = useState(0);
  const [chosen,  setChosen]  = useState([]);
  const [found,   setFound]   = useState([]);
  const [score,   setScore]   = useState(0);
  const [phase,   setPhase]   = useState('intro');
  const [msg,     setMsg]     = useState('');
  const [msgOk,   setMsgOk]   = useState(false);

  const set = LETTER_SETS[setIdx];
  const currentWord = chosen.map(i => set.letters[i]).join('');
  const minWords = 5;

  const displayLetters = useMemo(() => {
    return LETTER_SETS.map(s => {
      const arr = s.letters.map((l,i) => ({l, i}));
      for (let j = arr.length-1; j > 0; j--) {
        const k = Math.floor(Math.random()*(j+1));
        [arr[j],arr[k]] = [arr[k],arr[j]];
      }
      return arr;
    });
  }, []);

  function toggleLetter(origIdx) {
    setChosen(prev => prev.includes(origIdx) ? prev.filter(x=>x!==origIdx) : [...prev, origIdx]);
    setMsg('');
  }

  function submitWord() {
    if (currentWord.length < 3) { setMsg('Need at least 3 letters.'); setMsgOk(false); return; }
    if (found.includes(currentWord)) { setMsg(`Already found "${currentWord}".`); setMsgOk(false); return; }

    const inDict = DICTIONARY.has(currentWord);
    const canMake = canForm(currentWord, set.letters);

    if (!inDict || !canMake) {
      setMsg(`"${currentWord}" isn't a recognised word for this puzzle.`); setMsgOk(false); return;
    }

    const xp = currentWord.length <= 3 ? 20
             : currentWord.length === 4 ? 40
             : currentWord.length === 5 ? 70
             : currentWord.length === 6 ? 100
             : currentWord.length === 7 ? 150 : 250;

    const isPangram = currentWord === set.pangram;
    const bonus = isPangram ? 200 : 0;
    setScore(s => s + xp + bonus);
    const newFound = [...found, currentWord];
    setFound(newFound);
    setChosen([]);
    setMsg(isPangram ? `PANGRAM! ${currentWord}  +${xp+bonus} XP` : `${currentWord}  +${xp} XP (${currentWord.length} letters)`);
    setMsgOk(true);

    if (newFound.length >= minWords && phase === 'playing') {
      setTimeout(() => { setPhase('won'); window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*'); }, 800);
    }
  }

  function nextSet() {
    if (setIdx >= LETTER_SETS.length - 1) { setPhase('allDone'); return; }
    setSetIdx(i=>i+1); setChosen([]); setFound([]); setMsg(''); setMsgOk(false); setPhase('playing');
  }

  function reset() {
    setSetIdx(0); setChosen([]); setFound([]);
    setScore(0); setPhase('intro'); setMsg(''); setMsgOk(false);
  }

  const bestWord = found.reduce((a,b) => b.length > a.length ? b : a, '');

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-xl">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Anagram Solver</h1>

        <AnimatePresence mode="wait">

          {/* ── INTRO ── */}
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid">Click letter tiles to spell a word. Click a tile again to deselect it.</p>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid">Words must be at least 3 letters and use only the tiles shown. Press <strong>Submit Word</strong>.</p>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid">Find at least <strong>5 words</strong> to advance to the next set. More words = more XP.</p>
                </div>
                <div className="flex gap-3 items-start bg-duo-yellow/10 rounded-2xl p-3 border border-duo-yellow/30">
                  <span className="font-display font-black text-duo-orange text-lg leading-none mt-0.5">★</span>
                  <p className="font-body text-sm text-text-mid">One hidden <strong>pangram</strong> uses ALL 8 letters. Finding it earns +200 bonus XP!</p>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-2">Example — letters: P A I N T</p>
                <p className="font-body text-sm text-text-mid">From these 5 letters you could make: <strong className="text-text-dark">PAN, TAN, PINT, PAINT</strong>…</p>
              </div>
              <button onClick={() => setPhase('playing')} className="btn-primary w-full py-3 text-base">Start Playing</button>
            </motion.div>
          )}

          {/* ── ALL DONE ── */}
          {phase === 'allDone' && (
            <motion.div key="allDone" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-green rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_6px_24px_rgba(88,204,2,0.35)]">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">Word Master!</h2>
              <div className="inline-flex items-center gap-2 bg-duo-yellow/15 border-2 border-duo-yellow/40 rounded-2xl px-5 py-2 mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                <span className="font-display font-black text-xl text-duo-yellow-dark">{score} XP</span>
              </div>
              <button onClick={reset} className="btn-primary w-full py-3 text-base">Play Again</button>
            </motion.div>
          )}

          {/* ── SET WON ── */}
          {phase === 'won' && (
            <motion.div key="won" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card text-center p-8">
              <div className="w-20 h-20 bg-duo-green rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-[0_6px_24px_rgba(88,204,2,0.35)]">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 className="font-display font-black text-3xl text-text-dark mb-1">Round Complete!</h2>
              <p className="text-text-mid text-sm mb-3">{found.length} words · Best: <strong className="text-text-dark">{bestWord}</strong></p>
              {!found.includes(set.pangram) && (
                <div className="bg-duo-blue/5 rounded-2xl border border-duo-blue/15 p-3 mb-4">
                  <p className="font-display font-bold text-xs text-duo-blue">
                    Missed pangram: <span className="font-mono font-black text-base">{set.pangram}</span> (+200 XP)
                  </p>
                </div>
              )}
              <div className="inline-flex items-center gap-2 bg-duo-yellow/15 border-2 border-duo-yellow/40 rounded-2xl px-5 py-2 mb-5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                <span className="font-display font-black text-xl text-duo-yellow-dark">{score} XP so far</span>
              </div>
              <button onClick={nextSet} className="btn-primary w-full py-3 text-base">
                {setIdx < LETTER_SETS.length-1 ? 'Next Letter Set' : 'View Final Score'}
              </button>
            </motion.div>
          )}

          {/* ── PLAYING ── */}
          {phase === 'playing' && (
            <motion.div key={`s${setIdx}`} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="block font-display font-bold text-xs text-text-muted uppercase tracking-wider">Words found</span>
                    <span className="font-mono font-bold text-2xl text-text-dark">{found.length}<span className="text-text-muted text-sm font-normal">/{minWords} min</span></span>
                  </div>
                  <div className="w-px h-8 bg-surface-border"/>
                  <div>
                    <span className="block font-display font-bold text-xs text-text-muted uppercase tracking-wider">Set</span>
                    <span className="font-mono font-bold text-2xl text-text-dark">{setIdx+1}/{LETTER_SETS.length}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-duo-yellow/15 rounded-xl px-3 py-1">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#E6AC00"><path d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"/></svg>
                  <span className="font-mono font-bold text-sm text-duo-yellow-dark">{score} XP</span>
                </div>
              </div>

              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4">
                <div className="min-h-14 flex items-center justify-center bg-surface-off rounded-2xl border-2 border-surface-border mb-4 px-4">
                  {currentWord
                    ? <span className="font-mono font-black text-3xl text-text-dark tracking-widest">{currentWord}</span>
                    : <span className="font-display font-bold text-text-muted">Click letters to build a word</span>
                  }
                </div>
                <div className="flex gap-2 flex-wrap justify-center mb-3">
                  {displayLetters[setIdx].map(({l, i: origIdx}) => {
                    const isUsed = chosen.includes(origIdx);
                    return (
                      <motion.button key={origIdx} onClick={() => toggleLetter(origIdx)} whileTap={{scale:0.88}}
                        className={['w-12 h-12 rounded-2xl border-2 font-mono font-black text-xl transition-all',
                          isUsed ? 'opacity-30 cursor-not-allowed bg-surface-off border-surface-border text-text-muted'
                          : 'cursor-pointer text-white'].join(' ')}
                        style={!isUsed ? {backgroundColor: TILE_COLORS[origIdx], borderColor:'rgba(0,0,0,0.1)'} : {}}>
                        {l}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setChosen([])} className="flex-1 py-2.5 rounded-xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-surface-border-strong transition-all">
                    Clear
                  </button>
                  <button onClick={submitWord} disabled={currentWord.length < 3}
                    className={['flex-1 py-2.5 rounded-xl font-display font-black text-sm transition-all',
                      currentWord.length >= 3 ? 'bg-duo-blue text-white shadow-blue hover:bg-duo-blue-dark cursor-pointer'
                      : 'bg-surface-off border-2 border-surface-border text-text-muted cursor-not-allowed'].join(' ')}>
                    Submit Word
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {msg && (
                  <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                    className={['rounded-2xl border px-4 py-2.5 mb-4 text-center font-body text-sm',
                      msgOk ? 'bg-duo-green/8 border-duo-green/25 text-duo-green-dark'
                      : 'bg-surface-card border-surface-border text-text-mid'].join(' ')}>
                    {msg}
                  </motion.div>
                )}
              </AnimatePresence>

              {found.length > 0 && (
                <div className="bg-surface-card rounded-2xl border border-surface-border shadow-card p-4">
                  <p className="font-display font-bold text-xs text-text-muted uppercase tracking-wider mb-2">Found words</p>
                  <div className="flex flex-wrap gap-2">
                    {[...found].sort((a,b) => b.length - a.length).map(w => (
                      <span key={w} className={['font-mono font-bold text-sm px-2.5 py-1 rounded-xl',
                        w === set.pangram ? 'bg-duo-yellow/20 border-2 border-duo-yellow/50 text-duo-yellow-dark'
                        : 'bg-surface-off border border-surface-border text-text-dark'].join(' ')}>
                        {w} <span className="text-text-muted font-normal text-xs">({w.length})</span>
                      </span>
                    ))}
                  </div>
                  {found.length < minWords && (
                    <p className="font-body text-xs text-text-muted mt-2">{minWords - found.length} more word(s) needed to advance</p>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ISAG Interactive Games — Anagram Solver</p>
      </div>
    </div>
  );
}
