# Interactive Games

Each game lives in its own subfolder and is a **standalone Vite + React app** — no shared node_modules, no monorepo tooling. You `cd` into the folder and run `npm run dev`.

---

## Folder structure

```
interactive_games/
├── README.md            ← you are here — how to add a new game
├── STYLE_GUIDE.md       ← design system every game must follow
│
├── night-bridge/        ← Canyon Crossing puzzle (rope bridge logic)
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx      ← all game logic lives here
│       └── index.css    ← Tailwind layers + custom keyframes
│
└── your-next-game/      ← copy the scaffold below
```

---

## How to add a new game

### 1. Create the folder

```
interactive_games/your-game-name/
```

Use **kebab-case**. The folder name becomes the game's identity.

### 2. Copy these five config files verbatim from `night-bridge/`

| File | What to change |
|------|----------------|
| `package.json` | Change `"name"` field only |
| `vite.config.js` | Nothing |
| `tailwind.config.js` | Nothing — never change the token names |
| `postcss.config.js` | Nothing |
| `index.html` | Change `<title>` only |

### 3. Create `src/`

```
src/
├── main.jsx      ← copy verbatim from night-bridge
├── index.css     ← copy verbatim from night-bridge (keep all keyframes)
└── App.jsx       ← write from scratch for your game
```

### 4. Install and run

```bash
cd interactive_games/your-game-name
npm install
npm run dev
```

---

## Rules — non-negotiable

- **One game = one subfolder** with its own `package.json`. Never put two games in the same Vite project.
- **No emojis** anywhere in the UI. Use SVG icons only.
- **No inline styles** for colors or spacing — Tailwind classes only. Inline `style` is only allowed for dynamic values (e.g. `style={{ color: char.color }}`).
- **No dark-mode page backgrounds.** The page background must be `bg-surface-off` (`#F7F7F7`). A game's *scene area* (the animated play area) can be dark — wrap it in a white card.
- **Framer Motion for all animations** — no raw CSS `transition` on layout changes.
- **3 tries maximum** for puzzle games — show remaining tries as dots in the HUD.
- **Walking/moving characters must be SVG figures**, not emoji or static images.
- Read `STYLE_GUIDE.md` before writing a single line of App.jsx.

---

## Games index

Full specs for all 40 games live in `GAMES_CATALOGUE.md` — read that before building any game.

| # | Folder | Title | Set | Difficulty | Status |
|---|--------|-------|-----|------------|--------|
| — | `night-bridge` | Canyon Crossing | Logic | Hard | **Done** |
| 1 | `math-cross` | Math Cross | Logic & Deduction | Medium | Pending |
| 2 | `number-maze` | Number Maze | Logic & Deduction | Hard | Pending |
| 3 | `mini-sudoku` | Mini Sudoku | Logic & Deduction | Medium | Pending |
| 4 | `logic-gates` | Logic Gates | Logic & Deduction | Hard | Pending |
| 5 | `cryptarithmetic` | Cryptarithmetic | Logic & Deduction | Hard | Pending |
| 6 | `pattern-completion` | Pattern Completion | Visual & Spatial | Medium | Pending |
| 7 | `tangram-solver` | Tangram Solver | Visual & Spatial | Hard | Pending |
| 8 | `tower-of-hanoi` | Tower of Hanoi | Visual & Spatial | Hard | Pending |
| 9 | `maze-navigator` | Maze Navigator | Visual & Spatial | Medium | Pending |
| 10 | `rotational-symmetry` | Rotational Symmetry | Visual & Spatial | Medium | Pending |
| 11 | `word-worm` | Word Worm | Word & Language | Medium | Pending |
| 12 | `anagram-solver` | Anagram Solver | Word & Language | Medium | Pending |
| 13 | `mini-crossword` | Mini Crossword | Word & Language | Medium | Pending |
| 14 | `pangram-builder` | Pangram Builder | Word & Language | Hard | Pending |
| 15 | `etymology-chain` | Etymology Chain | Word & Language | Hard | Pending |
| 16 | `equation-builder` | Equation Builder | Math & Arithmetic | Hard | Pending |
| 17 | `prime-factorization` | Prime Factorization | Math & Arithmetic | Medium | Pending |
| 18 | `fibonacci-sequence` | Fibonacci Sequence | Math & Arithmetic | Medium | Pending |
| 19 | `modular-arithmetic` | Modular Arithmetic | Math & Arithmetic | Hard | Pending |
| 20 | `fraction-simplification` | Fraction Simplification | Math & Arithmetic | Medium | Pending |
| 21 | `ages-of-three` | Ages of Three Children | Logic Puzzles | Hard | Pending |
| 22 | `knights-and-knaves` | Knights & Knaves | Logic Puzzles | Hard | Pending |
| 23 | `river-crossing` | River Crossing | Logic Puzzles | Hard | Pending |
| 24 | `monty-hall` | Monty Hall | Logic Puzzles | Hard | Pending |
| 25 | `einsteins-riddle` | Einstein's Riddle | Logic Puzzles | Hard | Pending |
| 26 | `angry-roosters` | Angry Roosters | Drawing & Spatial | Medium | Pending |
| 27 | `bridges-and-islands` | Bridges & Islands | Drawing & Spatial | Hard | Pending |
| 28 | `dot-connection` | Dot Connection | Drawing & Spatial | Hard | Pending |
| 29 | `pentomino-puzzle` | Pentomino Puzzle | Drawing & Spatial | Hard | Pending |
| 30 | `star-placement` | Star Placement | Drawing & Spatial | Medium | Pending |
| 31 | `polyhedral-nets` | Polyhedral Nets | Olympiad | Olympiad | Pending |
| 32 | `combinatorial-lock` | Combinatorial Lock | Olympiad | Olympiad | Pending |
| 33 | `recursive-sequence` | Recursive Sequence | Olympiad | Olympiad | Pending |
| 34 | `eulers-problem` | Euler's Problem | Olympiad | Olympiad | Pending |
| 35 | `infinite-series` | Infinite Series | Olympiad | Olympiad | Pending |
| 36 | `rubiks-cube` | Rubik's Cube 2×2 | Extreme | Olympiad+ | Pending |
| 37 | `sat-problem` | SAT Problem | Extreme | Olympiad+ | Pending |
| 38 | `graph-coloring` | Graph Coloring | Extreme | Olympiad+ | Pending |
| 39 | `partition-problem` | Partition Problem | Extreme | Olympiad+ | Pending |
| 40 | `travelling-salesman` | Travelling Salesman | Extreme | Olympiad+ | Pending |
