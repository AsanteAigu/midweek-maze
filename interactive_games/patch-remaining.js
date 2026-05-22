// Patches the 7 games that the first script couldn't handle
const fs = require('fs');
const path = require('path');

const BASE = __dirname;

const INTRO_HTML = (title, steps, example) => `
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — ${title}</h2>
              <div className="space-y-3 mb-5">
${steps.map((s,i)=>`                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">${i+1}</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "${s.replace(/"/g,'\\"')}"}}/>
                </div>`).join('\n')}
              </div>${example ? `
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "${example.replace(/"/g,'\\"')}"}}/>
              </div>` : ''}
              <button onClick={() => setPhase('playing')} className="btn-primary w-full py-3 text-base">Got it — Start Playing</button>
            </motion.div>
          )}`;

const GAMES = [
  {
    dir: 'rotational-symmetry',
    marker: "{phase==='won'&&(",
    init: "useState('playing')",
    title: 'Rotational Symmetry',
    steps: [
      'A shape is displayed. Decide whether rotating it produces an identical-looking shape.',
      'Options: No symmetry / 90° rotation / 180° rotation / 270° rotation.',
      'A shape has <strong>90° symmetry</strong> if it looks the same after a quarter-turn.',
      'Hover over an option to see a semi-transparent rotated preview overlaid on the shape.',
    ],
    example: 'A plus sign (+) looks identical after 90°, 180°, and 270°. A letter F has no rotational symmetry.',
  },
  {
    dir: 'pattern-completion',
    marker: "{phase==='won'&&(",
    init: "useState('playing')",
    title: 'Pattern Completion',
    steps: [
      'A 3×3 grid of visual patterns is shown with one cell missing (marked ?).',
      'Study the rows and columns to find the hidden rule — color cycle, shape change, count, or rotation.',
      'Choose from four options (A–D) which fills the missing cell correctly.',
      'Use the Hint button to reveal the rule name (costs XP).',
    ],
    example: 'If shapes change circle→square→triangle across rows and colors cycle blue→green→purple, find the option with the right shape AND color.',
  },
  {
    dir: 'word-worm',
    marker: "{phase==='won'&&(",
    init: "useState('playing')",
    title: 'Word Worm',
    steps: [
      'Nine nodes form a circle. One node is pre-filled (green) — it\'s your starting word.',
      'Fill each remaining node so adjacent words differ by <strong>exactly one letter</strong>.',
      'One-letter change = same length, one character is different. E.g. CAT → BAT (C→B).',
      'Every word must be a real English word. Green border = valid, red = invalid.',
    ],
    example: 'CAT → COT → COD → COG → DOG: each step changes one letter.',
  },
  {
    dir: 'mini-crossword',
    marker: "{phase==='won' && (",
    init: "useState('playing')",
    title: 'Mini Crossword',
    steps: [
      'Fill the 5×5 crossword grid using the Across and Down clues.',
      'Numbers in the top-left corner of cells correspond to clue numbers. Across = left→right. Down = top→bottom.',
      'Click a white cell and type a letter. Use arrow keys or Tab to navigate.',
      'Shared cells (intersections) must satisfy both their Across and Down clue.',
    ],
    example: 'If 1-Across is CRANE and 2-Down starts in the same row at column 2, the cell at (row 0, col 2) must be A — satisfying both.',
  },
  {
    dir: 'monty-hall',
    marker: "{phase === 'done' && (",
    init: "useState('playing')",
    title: 'Monty Hall',
    steps: [
      'Five doors are shown. One hides a prize; four are empty. Click a door to pick it.',
      'The host then opens some empty doors you didn\'t pick, leaving one alternative.',
      'Choose: <strong>Switch</strong> to the remaining unopened door, or <strong>Stay</strong> with your original choice.',
      'Play 8 rounds and track your win rate. The maths reveals which strategy wins more!',
    ],
    example: 'With 5 doors, the prize is behind your chosen door 1/5 of the time. Switching wins when it\'s behind any of the other 4 — so switching wins 4/5 = 80% of the time.',
  },
];

// River crossing has a different phase structure ('select' not 'playing')
const RIVER_INTRO = INTRO_HTML('River Crossing', [
  'Move all characters from the left bank to the right bank.',
  'The boat holds the farmer <strong>plus one other character</strong>. The farmer must always be in the boat.',
  'Some characters cannot be left alone together without the farmer (e.g. fox eats goose, goose eats grain).',
  'Click a character to load them into the boat, then click the boat arrow to cross.',
], 'Goose + Grain cannot be left alone. Fox + Goose cannot be left alone. The farmer keeps the peace.');

const NIGHT_INTRO = INTRO_HTML('Canyon Crossing', [
  'Four people must cross a rope bridge at night using one torch.',
  'The bridge holds at most <strong>2 people</strong> at a time. The torch must always travel with a crossing.',
  'Each person moves at their own speed. A pair crosses at the <strong>slower</strong> person\'s speed.',
  'Get everyone across within the time limit. Plan each trip carefully!',
], 'If the 1-min and 10-min person cross together, it takes 10 min — not 5. Then someone must bring the torch back.');

for (const g of GAMES) {
  const fp = path.join(BASE, g.dir, 'src', 'App.jsx');
  let c = fs.readFileSync(fp, 'utf8');
  if (c.includes("phase === 'intro'")) { console.log(`SKIP ${g.dir} (already patched)`); continue; }
  c = c.replace(g.init, g.init.replace('playing', 'intro'));
  const intro = INTRO_HTML(g.title, g.steps, g.example);
  c = c.replace(g.marker, intro + '\n\n          ' + g.marker);
  fs.writeFileSync(fp, c, 'utf8');
  console.log(`OK   ${g.dir}`);
}

// River crossing — intro before {phase === 'won' && (
{
  const fp = path.join(BASE, 'river-crossing', 'src', 'App.jsx');
  let c = fs.readFileSync(fp, 'utf8');
  if (!c.includes("phase === 'intro'")) {
    // Add intro phase: initial phase is 'select', add 'intro' before it
    c = c.replace("useState('select')", "useState('intro')");
    // Add phase === 'intro' handler in reset to go to 'select' not 'intro'
    c = c.replace(RIVER_INTRO + '\n\n          ' + "{phase === 'won' && (", "{phase === 'won' && ("); // safety clear
    c = c.replace("{phase === 'won' && (", RIVER_INTRO.replace("setPhase('playing')", "setPhase('select')") + '\n\n          ' + "{phase === 'won' && (");
    fs.writeFileSync(fp, c, 'utf8');
    console.log('OK   river-crossing');
  } else { console.log('SKIP river-crossing'); }
}

// Night bridge — intro before the main return block
{
  const fp = path.join(BASE, 'night-bridge', 'src', 'App.jsx');
  let c = fs.readFileSync(fp, 'utf8');
  if (!c.includes("phase === 'intro'")) {
    c = c.replace("useState('playing')", "useState('intro')");
    // Night bridge uses if-statements not ternaries, find the return statement and insert before first if
    const introBlock = NIGHT_INTRO.replace("setPhase('playing')", "setPhase('playing')");
    // Insert after AnimatePresence opening
    c = c.replace(
      "<AnimatePresence mode=\"wait\">",
      "<AnimatePresence mode=\"wait\">\n" + introBlock
    );
    fs.writeFileSync(fp, c, 'utf8');
    console.log('OK   night-bridge');
  } else { console.log('SKIP night-bridge'); }
}

console.log('\nDone.');
