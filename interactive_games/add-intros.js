// Run: node add-intros.js
// Patches every game's App.jsx to add an intro/instructions screen.
const fs = require('fs');
const path = require('path');

const INTROS = {
  'night-bridge': {
    title: 'Canyon Crossing',
    steps: [
      'Four people must cross a rope bridge at night. It holds at most 2 people at a time.',
      'One torch must always travel with any crossing — it cannot be thrown across.',
      'Each person walks at their own speed. A pair crosses at the <strong>slower</strong> person\'s pace.',
      'Get everyone across within the time limit. Plan the crossings carefully!',
    ],
    example: 'If the slowest person (10 min) and fastest (1 min) cross together, it takes 10 min — not 5.',
  },
  'math-cross': {
    title: 'Math Cross',
    steps: [
      'A 3×3 grid of equations is shown. Some cells have operators (+, −); others are blank.',
      'A bank of numbers sits below the grid. Place each number in a blank cell.',
      'Every row and column equation must balance simultaneously.',
      'Each number from the bank is used exactly once.',
    ],
    example: '_ + 3 = 8 → blank must be 5. But it also has to satisfy its column equation.',
  },
  'number-maze': {
    title: 'Number Maze',
    steps: [
      'A 4×4 grid of numbers. Start at the top-left (green), reach the bottom-right (red).',
      'Move one step at a time to an adjacent cell (up/down/left/right — no diagonals).',
      'Each step must change the cell value by exactly <strong>+1 or −1</strong>.',
      'You cannot revisit any cell.',
    ],
    example: 'Standing on value 5 → you can only move to a cell containing 4 or 6.',
  },
  'mini-sudoku': {
    title: 'Mini Sudoku',
    steps: [
      'Fill a 4×4 grid so every number 1–4 appears exactly once in each row, column, and 2×2 box.',
      'Grey cells are pre-filled clues — you cannot change them.',
      'Click an empty cell to open the number selector, then choose 1–4.',
      'Red borders highlight conflicts. Resolve all conflicts to win.',
    ],
    example: 'If row 1 already has 1, 2, 3 → the blank cell in row 1 must be 4.',
  },
  'logic-gates': {
    title: 'Logic Gates',
    steps: [
      'A circuit is shown with inputs A, B, C (TRUE/FALSE) and logic gates.',
      'The final output is displayed. Find which input combination produces it.',
      '<strong>AND</strong>: TRUE only when all inputs are TRUE. <strong>OR</strong>: TRUE if any input is TRUE. <strong>NOT</strong>: flips the value. <strong>XOR</strong>: TRUE when exactly one input is TRUE.',
      'Toggle the switches A/B/C. The live preview updates as you change them.',
    ],
    example: 'A AND B = TRUE only when A=T and B=T. A OR B = TRUE when either is T.',
  },
  'cryptarithmetic': {
    title: 'Cryptarithmetic',
    steps: [
      'A letter equation is shown (e.g. SEND + MORE = MONEY).',
      'Replace every letter with a unique digit 0–9 so the arithmetic is correct.',
      'Each letter maps to exactly one digit, and no two letters share the same digit.',
      'No leading zeros: the first letter of any word cannot be 0.',
    ],
    example: 'TWO + TWO = FOUR → T=7, W=3, O=4, F=1, U=9, R=8 gives 734 + 734 = 1468. ✓',
  },
  'pattern-completion': {
    title: 'Pattern Completion',
    steps: [
      'A 3×3 grid of visual patterns is shown with one cell missing (marked ?).',
      'Study the rows and columns to find the rule (color cycle, shape change, count, rotation…).',
      'Choose from options A–D which correctly fills the blank cell.',
      'Use the Hint button to reveal the rule name (costs XP).',
    ],
    example: 'If row 1 is circle→circle→circle and each row changes the color blue→green→purple, the missing cell is a purple circle.',
  },
  'tangram-solver': {
    title: 'Tangram Solver',
    steps: [
      'A black silhouette is shown — this is the target shape to fill.',
      'Four arrangements of tangram pieces are shown as options (A–D).',
      'Pick the arrangement that perfectly fills the silhouette with no gaps and no overlaps.',
    ],
    example: 'Two right triangles placed hypotenuse-to-hypotenuse make a square.',
  },
  'tower-of-hanoi': {
    title: 'Tower of Hanoi',
    steps: [
      'Five discs are stacked on peg A (largest at the bottom). Move them all to peg C.',
      'Only one disc may move at a time — always the topmost disc on a peg.',
      'A larger disc can <strong>never</strong> sit on top of a smaller disc.',
      'Click a disc to select it, then click the destination peg. Optimal solution: 31 moves.',
    ],
    example: 'You cannot move disc 3 onto peg B if disc 2 is already there (3 > 2).',
  },
  'maze-navigator': {
    title: 'Maze Navigator',
    steps: [
      'Find your way from START (green) to END (red) through the fog-of-war maze.',
      'Click adjacent open cells (up/down/left/right) to move. Walls block you.',
      'Only nearby cells are revealed — explore to uncover the maze.',
      'Watch for a hidden teleporter tile! Use the Hint button for the next best step.',
    ],
    example: 'You can only move to cells directly touching your current position — no jumping.',
  },
  'rotational-symmetry': {
    title: 'Rotational Symmetry',
    steps: [
      'A shape is shown. Decide whether rotating it produces an identical-looking shape.',
      'Options: No symmetry / 90° / 180° / 270° rotation.',
      'A shape has 90° symmetry if it looks the same after being turned a quarter-turn. 180° = half-turn. 270° = three-quarter-turn.',
      'Hover an option to preview a semi-transparent rotated overlay on the shape.',
    ],
    example: 'A plus sign (+) looks identical after 90°, 180°, and 270° — it has 4-fold symmetry.',
  },
  'word-worm': {
    title: 'Word Worm',
    steps: [
      'Nine nodes are arranged in a circle. One starting word is fixed (green).',
      'Fill the other eight nodes so each adjacent pair of words differs by exactly <strong>one letter</strong>.',
      'A one-letter change: same word length, one character is different (e.g. CAT → BAT).',
      'Every word must be a real English word.',
    ],
    example: 'CAT → BAT → BAD → BAG: each step changes exactly one character.',
  },
  'anagram-solver': null, // already has intro
  'mini-crossword': {
    title: 'Mini Crossword',
    steps: [
      'Fill the 5×5 crossword grid using the Across and Down clues provided.',
      'Numbers in cell corners correspond to clue numbers. Across = left→right. Down = top→bottom.',
      'Click a white cell and type a letter. Use arrow keys or Tab to move between cells.',
      'Shared cells (intersections) must satisfy both the Across and Down clue.',
    ],
    example: 'If 1-Across is CRANE and 1-Down is CLAMS, the top-left cell must be C (shared).',
  },
  'pangram-builder': null, // already has intro
  'etymology-chain': {
    title: 'Etymology Chain',
    steps: [
      'Transform the START word into the TARGET word one step at a time.',
      'Each step must produce a new real English word by changing <strong>exactly one letter</strong>.',
      'Example: CAT → BAT → BAD → DAD → DAM → DAM → RAM → RAN → TAN → TEN → HEN.',
      'Shorter chains earn bonus XP. The Hint button reveals one valid intermediate word.',
    ],
    example: 'COLD → CORD → WORD → WARD → WARE → CARE → BARE → DARE: 7 steps.',
  },
  'equation-builder': {
    title: 'Equation Builder',
    steps: [
      'Three equations are shown with blank slots.',
      'A bank of numbers is provided. Click a number, then click a blank to place it.',
      'All three equations must be correct simultaneously.',
      'Each number from the bank is used exactly once across all blanks.',
    ],
    example: '_ + _ = 10 and _ × _ = 6 and _ − _ = 3. Numbers 1,2,3,4,5,7 → place (3,7) / (2,3) / (4,1).',
  },
  'prime-factorization': {
    title: 'Prime Factorization',
    steps: [
      'A target number is shown. Break it down into its prime factors.',
      'Click prime number buttons (2, 3, 5, 7…) to build the factorization chain.',
      'The running product updates with each click. Match the target exactly.',
      'Remove the last prime with the ← button if you make a mistake.',
    ],
    example: '36 = 2 × 2 × 3 × 3. Click 2, 2, 3, 3 → running product reaches 36. ✓',
  },
  'fibonacci-sequence': {
    title: 'Fibonacci Sequence',
    steps: [
      'A number sequence is shown with some terms missing.',
      'The rule: each term = the sum of the two terms before it.',
      'Fill in the blanks using this formula: F(n) = F(n−1) + F(n−2).',
      'The Hint button reveals the formula reminder.',
    ],
    example: '1, 1, 2, 3, 5, 8, ?, ?, ? → 8+5=13, 13+8=21, 21+13=34.',
  },
  'modular-arithmetic': {
    title: 'Modular Arithmetic',
    steps: [
      'X mod M = the remainder left over when X is divided by M.',
      'An equation with one unknown is shown. Find the missing value.',
      'The mod clock shows where the answer lands on a number circle.',
    ],
    example: '(4 × 5) mod 6 = ?  →  20 ÷ 6 = 3 remainder 2  →  answer is 2.',
  },
  'fraction-simplification': {
    title: 'Fraction Simplification',
    steps: [
      'A fraction is shown (e.g. 48/64). Reduce it to its lowest terms.',
      'Divide both numerator and denominator by their GCD (Greatest Common Divisor).',
      'The fraction is fully simplified when GCD(numerator, denominator) = 1.',
      'Use the Hint button to reveal the GCD.',
    ],
    example: '48/64: GCD=16 → 48÷16=3, 64÷16=4 → simplified: 3/4.',
  },
  'ages-of-three': {
    title: 'Ages of Three',
    steps: [
      'You\'re told the <strong>product</strong> of three children\'s ages (Age₁ × Age₂ × Age₃ = N).',
      'Three house numbers are shown. <strong>One</strong> equals the sum of the ages — the other two are decoys.',
      'A clue helps you choose the right set of ages when two factorizations share the same sum.',
      'Enter the three ages from youngest to eldest, then submit.',
    ],
    example: 'Product=36, real sum=13 → triples [1,6,6] and [2,2,9] both give sum 13. Clue: "eldest is unique" → eliminates [1,6,6] (two 6-year-olds). Answer: 2, 2, 9.',
  },
  'knights-and-knaves': {
    title: 'Knights & Knaves',
    steps: [
      'Every character is either a <strong>Knight</strong> (always tells the truth) or a <strong>Knave</strong> (always lies).',
      'Each character makes a statement. You must figure out who is which.',
      'Click each character card to toggle between Knight and Knave.',
      'The assignment is correct when every statement is logically consistent with each person\'s role.',
    ],
    example: 'If A says "B is a Knave" and A is a Knight, then B really is a Knave (Knights tell the truth).',
  },
  'river-crossing': {
    title: 'River Crossing',
    steps: [
      'Move all people/items from the left bank to the right bank.',
      'The boat holds the farmer <strong>plus one other item</strong>. The farmer must always be present.',
      'Some items cannot be left unsupervised together on the same bank.',
      'Click an item to load it into the boat, then click the boat to cross.',
    ],
    example: 'Fox eats Goose if unsupervised. Goose eats Grain. The farmer must keep them apart.',
  },
  'monty-hall': {
    title: 'Monty Hall',
    steps: [
      'Five doors are shown. One hides a prize; four are empty. Pick a door.',
      'The host opens some empty doors you didn\'t pick. Then choose: <strong>Switch</strong> or <strong>Stay</strong>.',
      'Play multiple rounds and watch your win rate. The statistics reveal the better strategy!',
    ],
    example: 'With 5 doors, switching after the host reveals empties wins the prize ~80% of the time.',
  },
  'einsteins-riddle': {
    title: "Einstein's Riddle",
    steps: [
      'Four houses in a row. Each has four attributes: Color, Nationality, Drink, Pet.',
      'Eight clues are listed. Use logic to deduce every attribute for every house.',
      'Click any cell to cycle through the possible values for that attribute.',
      'When all 16 cells match the solution, you win.',
    ],
    example: 'Clue: "The Kenyan keeps fish." → set House ?\'s Nationality to Kenyan and Pet to Fish, then use other clues to find which house number.',
  },
  'angry-roosters': {
    title: 'Angry Roosters',
    steps: [
      'Four roosters are in a yard. If two share a section, they fight!',
      'Two straight fence lines divide the yard into four sections.',
      'Four fence configurations are shown. Pick the one that gives each rooster its own section.',
    ],
    example: 'A horizontal line at mid-height and a vertical line at mid-width creates four equal quadrants.',
  },
  'bridges-and-islands': {
    title: 'Bridges & Islands',
    steps: [
      'Islands are shown as circles. The number on each island = how many bridges must connect to it.',
      'Click island A, then island B to draw a bridge. Click again to remove it.',
      'Bridges run horizontally or vertically only. They cannot cross each other.',
      'When every island has exactly the right number of bridges, you win.',
    ],
    example: 'Island showing "3" must have exactly 3 bridges touching it — no more, no less.',
  },
  'dot-connection': {
    title: 'Dot Connection',
    steps: [
      'A graph of dots connected by edges is shown. Trace a path that uses every edge <strong>exactly once</strong>.',
      'Click a dot to start, then click an adjacent dot to draw the next edge.',
      'You cannot reuse an edge. Use the Undo button to backtrack.',
      'Tip: an Eulerian path exists when exactly 0 or 2 nodes have an odd number of connections.',
    ],
    example: 'If A connects to B, C, D (3 edges), A has odd degree. Start or end your path at A.',
  },
  'pentomino-puzzle': {
    title: 'Pentomino Puzzle',
    steps: [
      'Fill the 3×5 grid with three pieces. Each piece is a different colour.',
      'Select a colour from the palette, then click cells to paint them.',
      'All 15 cells must be filled — no gaps, no mixed colours in one piece.',
      'Use the Hint button to reveal where one piece fits.',
    ],
    example: 'Blue piece covers 5 cells in a horizontal row. Green piece forms an L-shape. Purple fills the rest.',
  },
  'star-placement': {
    title: 'Star Placement',
    steps: [
      'A 5×5 grid contains numbered cells (blue) and empty cells (white).',
      'Each number tells you how many stars must be directly adjacent (up/down/left/right) to it.',
      'Click empty white cells to toggle a star on or off.',
      'All number constraints must be satisfied simultaneously to win.',
    ],
    example: 'A cell showing "2" must have exactly two stars touching it — not 1, not 3.',
  },
  'polyhedral-nets': {
    title: 'Polyhedral Nets',
    steps: [
      'A 3D solid (cube, prism, pyramid…) is named and described.',
      'A net is a 2D flat shape that folds up to form that solid.',
      'Four net options are shown (A–D). Pick the one that correctly folds into the named shape.',
    ],
    example: 'A cube net: 6 squares joined edge-to-edge in a T-cross or other valid pattern.',
  },
  'combinatorial-lock': {
    title: 'Combinatorial Lock',
    steps: [
      'Crack a secret 4-digit code. Each digit is between 1 and 6.',
      'After each guess, you get feedback: <strong>●</strong> = right digit, right position. <strong>○</strong> = right digit, wrong position.',
      'Use the clues to narrow down the code. You have 6 guesses per round.',
    ],
    example: 'Guess 1234, get ●○ → one digit is perfectly placed, one is in the code but misplaced.',
  },
  'recursive-sequence': {
    title: 'Recursive Sequence',
    steps: [
      'A number sequence is shown with some terms missing at the end.',
      'Find the hidden rule and fill in the blanks.',
      'Common patterns: each term = sum of previous two, doubling, factorial, or a fixed increase.',
    ],
    example: '2, 5, 8, 11, ?, ?, ? → each increases by 3 → answers: 14, 17, 20.',
  },
  'eulers-problem': {
    title: "Euler's Problem",
    steps: [
      'A map with bridges (edges) between landmasses (nodes) is shown.',
      'Can you walk across every bridge exactly once without retracing?',
      'Rule: an Eulerian path exists if and only if exactly 0 or 2 nodes have an <strong>odd number</strong> of bridges.',
      'Count each node\'s degree, then choose "Path Exists" or "No Path".',
    ],
    example: 'Node A with 3 bridges = odd degree. If only A and D are odd, a path from A to D exists.',
  },
  'infinite-series': {
    title: 'Infinite Series',
    steps: [
      'An infinite sum is shown: a₁ + a₂ + a₃ + … stretching forever.',
      'Some infinite series converge to a finite number. Your job: find that number.',
      'Enter the answer as a fraction (numerator ÷ denominator).',
      'Use the partial-sum bar to see how the series approaches its limit.',
    ],
    example: '1/2 + 1/4 + 1/8 + … → each term halves → total approaches 1. Answer: 1/1.',
  },
  'rubiks-cube': {
    title: "Rubik's Cube 2×2",
    steps: [
      'The 2×2 cube starts scrambled. Your goal: restore every face to a single colour.',
      'Use the move buttons (U, R, F, D…) to rotate layers. A prime (′) means anticlockwise.',
      'The flat net shows all 6 faces simultaneously.',
      'Hint reveals one optimal move. Fewer moves = more XP.',
    ],
    example: 'U = rotate the top layer clockwise. U′ = rotate top layer anticlockwise.',
  },
  'sat-problem': {
    title: 'SAT Problem',
    steps: [
      'A Boolean formula is shown in CNF form: several clauses joined by AND (∧).',
      'Assign TRUE or FALSE to every variable so that <strong>all clauses</strong> evaluate to TRUE.',
      'Each clause uses OR (∨) — it\'s satisfied if at least one literal is TRUE. ¬A means NOT A.',
      'Toggle variable values. Clauses turn green (satisfied) or red (violated) in real time.',
    ],
    example: '(A ∨ B) ∧ (¬A ∨ C): try A=T, B=T, C=T → (T∨T)=T, (F∨T)=T. All satisfied! ✓',
  },
  'graph-coloring': {
    title: 'Graph Coloring',
    steps: [
      'A graph of nodes connected by edges is shown.',
      'Color every node so that no two nodes connected by an edge share the same color.',
      'Click a node to select it, then click a color from the palette to assign it.',
      'The goal: satisfy all edges using the minimum number of colors (the chromatic number).',
    ],
    example: 'A triangle (3 nodes, all connected) needs 3 different colors — one per node.',
  },
  'partition-problem': {
    title: 'Partition Problem',
    steps: [
      'A set of numbers is shown. Can you split them into two groups with <strong>equal sums</strong>?',
      'Click numbers to assign them to Subset A. The rest automatically go to Subset B.',
      'Both subset sums are shown in real time.',
      'If it\'s impossible to split equally, click the "Impossible" button instead.',
    ],
    example: '{3, 1, 4, 1, 5}: total=14, target=7. Subsets {3,4}=7 and {1,1,5}=7. ✓',
  },
  'travelling-salesman': {
    title: 'Travelling Salesman',
    steps: [
      'Five cities appear on a map with distances shown on each connection.',
      'Click cities in the order you want to visit them to build a route.',
      'You must visit every city <strong>exactly once</strong> and return to the starting city.',
      'The running distance updates as you click. Try to find the shortest possible tour.',
    ],
    example: 'A route of A→B→C→D→E→A. The total distance is the sum of all 5 segments.',
  },
};

const GAMES_DIR = path.join(__dirname);

function buildIntroJSX(gameName) {
  const data = INTROS[gameName];
  if (!data) return null;

  const stepsJSX = data.steps.map((step, i) => `
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">${i+1}</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "${step.replace(/"/g, '\\"')}"}}/>
                </div>`).join('');

  const exampleJSX = data.example ? `
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "${data.example.replace(/"/g, '\\"')}"}}/>
              </div>` : '';

  return `
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — ${data.title}</h2>
              <div className="space-y-3 mb-5">${stepsJSX}
              </div>${exampleJSX}
              <button onClick={() => setPhase('playing')} className="btn-primary w-full py-3 text-base">Got it — Start Playing</button>
            </motion.div>
          )}`;
}

let patched = 0;
let skipped = 0;
const dirs = fs.readdirSync(GAMES_DIR).filter(d => {
  const p = path.join(GAMES_DIR, d, 'src', 'App.jsx');
  return fs.existsSync(p);
});

for (const dir of dirs) {
  if (INTROS[dir] === null) { skipped++; console.log(`  SKIP ${dir} (already has intro)`); continue; }
  if (!INTROS[dir]) { skipped++; console.log(`  SKIP ${dir} (no intro defined)`); continue; }

  const filePath = path.join(GAMES_DIR, dir, 'src', 'App.jsx');
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already patched
  if (content.includes("phase === 'intro'")) {
    skipped++;
    console.log(`  SKIP ${dir} (already patched)`);
    continue;
  }

  // 1. Change initial phase to 'intro'
  const phaseRe = /useState\('playing'\)/;
  if (!phaseRe.test(content)) {
    skipped++;
    console.log(`  SKIP ${dir} (no useState('playing') found)`);
    continue;
  }
  content = content.replace(phaseRe, "useState('intro')");

  // 2. Insert intro block before the first {phase === 'won' occurrence
  const wonMarker = "{phase === 'won' && (";
  const introJSX = buildIntroJSX(dir);
  if (!introJSX || !content.includes(wonMarker)) {
    skipped++;
    console.log(`  SKIP ${dir} (can't insert intro block)`);
    continue;
  }
  content = content.replace(wonMarker, introJSX + '\n\n          ' + wonMarker);

  fs.writeFileSync(filePath, content, 'utf8');
  patched++;
  console.log(`  OK    ${dir}`);
}

console.log(`\nDone: ${patched} patched, ${skipped} skipped.`);
