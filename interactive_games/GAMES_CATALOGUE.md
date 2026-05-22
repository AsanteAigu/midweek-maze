# Interactive Games — Full Catalogue
## 40 Puzzle Games for ISAG Midweek Maze
### Reference for building each game — read this before starting any new game folder

All games: standalone Vite + React app, light Duolingo theme, SVG graphics, no emojis.
Read `STYLE_GUIDE.md` and `README.md` before building anything.

---

## Quick Reference Table

| # | Title | Folder Name | Set | Type | Difficulty | XP | Attempts | Status |
|---|-------|-------------|-----|------|------------|-----|----------|--------|
| 1 | Math Cross | `math-cross` | Logic & Deduction | Grid Placement | Medium | 150 | 3 | Pending |
| 2 | Number Maze | `number-maze` | Logic & Deduction | Path Finding | Hard | 200 | 3 | Pending |
| 3 | Mini Sudoku | `mini-sudoku` | Logic & Deduction | Constraint Satisfaction | Medium | 150 | 3 | Pending |
| 4 | Logic Gates | `logic-gates` | Logic & Deduction | Boolean Logic | Hard | 200 | 3 | Pending |
| 5 | Cryptarithmetic | `cryptarithmetic` | Logic & Deduction | Puzzle Solving | Hard | 200 | 2 | Pending |
| 6 | Pattern Completion | `pattern-completion` | Visual & Spatial | Visual Pattern | Medium | 150 | 3 | Pending |
| 7 | Tangram Solver | `tangram-solver` | Visual & Spatial | Shape Assembly | Hard | 200 | 3 | Pending |
| 8 | Tower of Hanoi | `tower-of-hanoi` | Visual & Spatial | Move Sequence | Hard | 200 | Unlimited | Pending |
| 9 | Maze Navigator | `maze-navigator` | Visual & Spatial | Path Finding | Medium | 150 | 3 | Pending |
| 10 | Rotational Symmetry | `rotational-symmetry` | Visual & Spatial | Visual Rotation | Medium | 150 | 3 | Pending |
| 11 | Word Worm | `word-worm` | Word & Language | Word Chain | Medium | 150 | 3 | Pending |
| 12 | Anagram Solver | `anagram-solver` | Word & Language | Word Scramble | Medium | 150 | 3 | Pending |
| 13 | Mini Crossword | `mini-crossword` | Word & Language | Word Placement | Medium | 150 | 3 | Pending |
| 14 | Pangram Builder | `pangram-builder` | Word & Language | Word Selection | Hard | 200 | 2 | Pending |
| 15 | Etymology Chain | `etymology-chain` | Word & Language | Word Relationship | Hard | 200 | 3 | Pending |
| 16 | Equation Builder | `equation-builder` | Math & Arithmetic | Number Placement | Hard | 200 | 2 | Pending |
| 17 | Prime Factorization | `prime-factorization` | Math & Arithmetic | Number Decomposition | Medium | 150 | 3 | Pending |
| 18 | Fibonacci Sequence | `fibonacci-sequence` | Math & Arithmetic | Pattern Recognition | Medium | 150 | 3 | Pending |
| 19 | Modular Arithmetic | `modular-arithmetic` | Math & Arithmetic | Number Theory | Hard | 200 | 3 | Pending |
| 20 | Fraction Simplification | `fraction-simplification` | Math & Arithmetic | Number Reduction | Medium | 150 | 3 | Pending |
| 21 | Ages of Three | `ages-of-three` | Logic Puzzles | Logic Deduction | Hard | 200 | 2 | Pending |
| 22 | Knights & Knaves | `knights-and-knaves` | Logic Puzzles | Logic Deduction | Hard | 200 | 3 | Pending |
| 23 | River Crossing | `river-crossing` | Logic Puzzles | Constraint Satisfaction | Hard | 200 | 2 | Pending |
| 24 | Monty Hall | `monty-hall` | Logic Puzzles | Probability/Logic | Hard | 200 | 3 | Pending |
| 25 | Einstein's Riddle | `einsteins-riddle` | Logic Puzzles | Logic Constraint | Hard | 250 | 3 | Pending |
| 26 | Angry Roosters | `angry-roosters` | Drawing & Spatial | Drawing/Division | Medium | 150 | 3 | Pending |
| 27 | Bridges & Islands | `bridges-and-islands` | Drawing & Spatial | Graph Drawing | Hard | 200 | 3 | Pending |
| 28 | Dot Connection | `dot-connection` | Drawing & Spatial | Path Drawing | Hard | 200 | 3 | Pending |
| 29 | Pentomino Puzzle | `pentomino-puzzle` | Drawing & Spatial | Shape Assembly | Hard | 200 | 3 | Pending |
| 30 | Star Placement | `star-placement` | Drawing & Spatial | Constraint Placement | Medium | 150 | 3 | Pending |
| 31 | Polyhedral Nets | `polyhedral-nets` | Olympiad | 3D Visualization | Olympiad | 300 | 3 | Pending |
| 32 | Combinatorial Lock | `combinatorial-lock` | Olympiad | Permutation | Olympiad | 300 | 3 | Pending |
| 33 | Recursive Sequence | `recursive-sequence` | Olympiad | Pattern Recognition | Olympiad | 300 | 3 | Pending |
| 34 | Euler's Problem | `eulers-problem` | Olympiad | Graph Theory | Olympiad | 300 | 3 | Pending |
| 35 | Infinite Series | `infinite-series` | Olympiad | Mathematical Analysis | Olympiad | 300 | 3 | Pending |
| 36 | Rubik's Cube 2x2 | `rubiks-cube` | Extreme | 3D Rotation Puzzle | Olympiad+ | 400 | Unlimited | Pending |
| 37 | SAT Problem | `sat-problem` | Extreme | Boolean Satisfiability | Olympiad+ | 400 | 3 | Pending |
| 38 | Graph Coloring | `graph-coloring` | Extreme | Coloring Problem | Olympiad+ | 400 | 3 | Pending |
| 39 | Partition Problem | `partition-problem` | Extreme | NP-Hard Subset | Olympiad+ | 400 | 3 | Pending |
| 40 | Travelling Salesman | `travelling-salesman` | Extreme | Optimization | Olympiad+ | 400 | 3 | Pending |
| — | Canyon Crossing | `night-bridge` | Logic & Deduction | Constraint Crossing | Hard | 70 | 3 | **Done** |

---

## SET 1 — Logic & Deduction

---

### Game 1 — Math Cross
**Folder:** `math-cross` | **XP:** 150 | **Attempts:** 3

**Mechanic:** A 3×5 calculation grid. Operators (+, −) already placed. Six numbers fill empty cells. All 3 horizontal and 3 vertical equations must be true simultaneously.

**Layout:**
- 3×5 table — fixed operator cells (darker, non-interactive), empty value cells (dashed border)
- Number bank below grid: buttons [2] [3] [5] [7] [11] [13]
- Each number used exactly once
- Click number → click cell to place; click placed number to remove
- Move counter top-right

**Validation:** Real-time per equation — green when balanced, red when not. Status: "3/6 equations correct".

**Controls:** Check Solution | Hint (reveals one cell, −25 XP) | Restart | Give Up (−1 attempt)

**State:** `selectedNumber`, `gridState[6]`, `attempts`, `xpEarned`

**Edge cases:** Block duplicate placement; auto-validate when last number placed; highlight which equation fails.

---

### Game 2 — Number Maze
**Folder:** `number-maze` | **XP:** 200 | **Attempts:** 3

**Mechanic:** 4×4 grid of integers 1–10. Start top-left (value 1), reach bottom-right. Each move: adjacent cell (UDLR) where value differs by exactly ±1. No revisiting cells.

**Layout:**
- 4×4 clickable grid
- Start: green badge "START" | End: red badge "END" | Current: blue highlight
- Visited cells: light gray | Valid next moves: subtle glow
- Path line connecting visited cells

**Validation:** Before each move — check adjacency, check ±1 difference, check not visited. Display "Current: 5. Valid moves: 4 or 6".

**Controls:** Check Solution | Hint (highlight one valid next move, −25 XP) | Restart | Give Up

**State:** `currentPos {row,col}`, `visitedCells[]`, `path[]`, `moveCount`, `attempts`

---

### Game 3 — Mini Sudoku
**Folder:** `mini-sudoku` | **XP:** 150 | **Attempts:** 3

**Mechanic:** 4×4 Sudoku. Numbers 1–4 once per row, column, 2×2 box. 4 clue cells pre-filled.

**Layout:**
- 4×4 grid with thick borders dividing 2×2 boxes
- Clue cells: bold navy, read-only | User cells: normal black, editable
- Number selector [1][2][3][4] appears on cell click
- Conflicts: red border | Correct: subtle green

**Validation:** Real-time per placement — check row, column, box. "Valid placements: 7/12".

**Controls:** Verify | Hint (reveal one cell, −20 XP) | Restart | Give Up

**State:** `grid[4][4]`, `clues[]` (immutable), `selectedCell`, `attempts`

---

### Game 4 — Logic Gates
**Folder:** `logic-gates` | **XP:** 200 | **Attempts:** 3

**Mechanic:** Circuit with 3 input switches (A, B, C — TRUE/FALSE) and logic gates (AND, OR, NOT). Final output shown. Player deduces which inputs produced that output. 5 rounds, increasing complexity.

**Rounds:**
1. Single AND gate
2. OR with NOT
3. Combination gates
4. Nested gates
5. Complex nested gates

**Layout:** SVG circuit diagram — inputs left, gates middle, output right. Output shown as large TRUE/FALSE badge.

**Controls:** Toggle switches A/B/C | Submit Guess | Hint (reveal one input, −30 XP) | Restart Round

**Scoring:** Per round: `200 / guessCount` XP. Show "Round 3 of 5 | +150 XP".

**State:** `round`, `inputA/B/C`, `circuitDef`, `expectedOutput`, `guessCount`, `roundScore`

---

### Game 5 — Cryptarithmetic
**Folder:** `cryptarithmetic` | **XP:** 200 | **Attempts:** 2

**Mechanic:** Letter equation (e.g., SEND + MORE = MONEY). Each letter = unique digit 0–9. No leading zeros. Player assigns digits to all letters.

**Puzzles:**
- SEND + MORE = MONEY
- CROSS + ROADS = DANGER
- THIS + IS = MATH

**Layout:** Equation displayed large. Letter list with dropdown per letter (0–9). Real-time equation preview as digits assigned.

**Validation:** Uniqueness of digits | No leading zeros (S≠0, M≠0) | Arithmetic correct. Three checkmarks when all satisfied.

**Controls:** Check Solution | Hint (reveal one letter-digit pair, −50 XP) | Restart | Give Up

**State:** `letterAssignments{}`, `usedDigits[]`, `currentPuzzle`, `attempts`

---

## SET 2 — Visual & Spatial

---

### Game 6 — Pattern Completion
**Folder:** `pattern-completion` | **XP:** 150 | **Attempts:** 3

**Mechanic:** 3×3 grid — 8 cells with SVG patterns, 1 blank. Player picks from 4 options (A/B/C/D) which completes the sequence. 5 puzzles, increasing complexity.

**Pattern rules (vary per puzzle):** Color progression | Shape rotation (90°/180°/270°) | Complexity increase | Symmetry | Element count changes

**Layout:** 3×3 grid top. 4 answer option boxes below labeled A–D. Hover shows pattern name hint.

**Controls:** Submit Answer | Hint (reveals rule name, −25 XP) | Skip (−1 attempt)

**Scoring:** +150 XP first try | −50 XP second try. Streak bonus +50 XP per consecutive correct.

**State:** `puzzle`, `gridPatterns[8]`, `blankIndex`, `options[4]`, `correctIndex`, `selected`, `score`

---

### Game 7 — Tangram Solver
**Folder:** `tangram-solver` | **XP:** 200 | **Attempts:** 3

**Mechanic:** 7 tangram pieces (2 large triangles, 1 medium triangle, 2 small triangles, 1 square, 1 parallelogram). Drag and rotate to fill target silhouette. No gaps or overlaps.

**Layout:** Target silhouette (black outline, left). Piece tray (right/below). Canvas (center). Snap-to-grid.

**Interaction:** Click to select | Drag to canvas | Rotate button (90° increments) | Pieces snap to grid | Green = correctly placed, Red = overlapping

**Controls:** Check Solution | Hint (place one piece, −40 XP) | Restart | Undo Last

**State:** `pieces[7]` with `{def, pos, rotation}`, `selectedPiece`, `moveCount`, `attempts`

---

### Game 8 — Tower of Hanoi
**Folder:** `tower-of-hanoi` | **XP:** 200 | **Attempts:** Unlimited (move-based)

**Mechanic:** 5 discs, 3 pegs (A, B, C). Move all from A to C. Rules: one disc at a time, no larger on smaller. Optimal: 31 moves.

**Layout:** 3 SVG pegs with stacked discs (wider = larger, distinct colors). Move counter. "Optimal: 31 moves" shown.

**Interaction:** Click disc to select (highlight) | Click peg to move | Only topmost disc selectable | Error if violates rules.

**XP:** 200 base | +100 bonus if ≤31 moves | −10 per hint used.

**Controls:** Hint (next optimal move, −30 XP) | Restart | Show Optimal Path

**State:** `pegA/B/C[]`, `selectedDisc`, `moveCount`, `hintCount`, `solved`

---

### Game 9 — Maze Navigator
**Folder:** `maze-navigator` | **XP:** 150 | **Attempts:** 3

**Mechanic:** 10×10 grid maze. Start (green, top-left area), end (red, bottom-right area). Click adjacent open cells to trace path. Cannot cross walls or backtrack.

**Layout:** Walls: black | Open: white | Visited: light blue | Current: bright blue circle | Start: green badge | End: red badge

**Validation:** Adjacent only (UDLR) | Not a wall | Not visited. "Steps from goal: 8".

**Controls:** Hint (highlight next move toward end, −25 XP) | Restart | Give Up

**Bonus:** Show "Optimal: X moves | Your path: Y moves". Bonus XP if near-optimal.

**State:** `mazeGrid[10][10]`, `currentPos`, `visitedCells`, `pathTrace[]`, `moveCount`, `attempts`

---

### Game 10 — Rotational Symmetry
**Folder:** `rotational-symmetry` | **XP:** 150 | **Attempts:** 3

**Mechanic:** SVG image shown. Player decides: no rotational symmetry / 90° / 180° / 270°. 5–10 puzzles.

**Puzzle examples:**
- 5-pointed star → no perfect rotational symmetry
- Pinwheel → 90°
- Yin-Yang → 180°

**Layout:** Large centered image. 4 radio options below. Hover shows semi-transparent rotated overlay preview.

**Controls:** Submit Answer | Hint (reveal yes/no symmetry exists, −20 XP) | Skip (−1 attempt)

**Scoring:** +150 XP correct | +50 XP streak bonus per consecutive correct.

**State:** `puzzleIndex`, `correctAnswer`, `selectedOption`, `totalScore`, `streakCount`

---

## SET 3 — Word & Language

---

### Game 11 — Word Worm
**Folder:** `word-worm` | **XP:** 150 | **Attempts:** 3

**Mechanic:** 10 hexagons in a circular loop (SVG). One pre-filled (e.g., "RANG"). Adjacent hexagons must differ by exactly one letter. All 9 empty hexagons must be filled.

**Layout:** Hexagons in circle, connecting lines between neighbors. Starting hex: green fill. Empty: white dashed border with input. Valid: blue fill. Invalid: red border.

**Validation:** Real-time per hex — (1) word exists in dictionary, (2) differs by 1 letter from both neighbors.

**Controls:** Check Solution | Hint (reveal one valid word, −30 XP) | Restart

**State:** `words[10]` (index 0 fixed), `validationStatus[10]`, `attempts`

**Key function:** `diffByOneLetter(word1, word2)` — same length, exactly one character position differs.

---

### Game 12 — Anagram Solver
**Folder:** `anagram-solver` | **XP:** 150 | **Attempts:** 3

**Mechanic:** 8–10 random letters. Click letters in sequence to form valid English words. Multiple words from same set. Longer = more XP. Find the longest possible word.

**Layout:** Large letter buttons (colorful). Word builder area below. Found words list (right/below). Selected letters highlighted.

**Scoring:** XP = `word_length × 10` (min 40, max 300). +100 XP bonus for longest word found.

**Controls:** Clear | Submit Word | Hint (reveal one hidden valid word, −30 XP) | Dictionary Toggle

**State:** `availableLetters[]`, `selectedLetters[]`, `foundWords (Set)`, `currentWord`, `totalScore`

---

### Game 13 — Mini Crossword
**Folder:** `mini-crossword` | **XP:** 150 | **Attempts:** 3

**Mechanic:** 5×5 crossword, 5 clues (3 Across, 2 Down), words 4–5 letters. Words must intersect correctly at shared letters.

**Layout:** Grid with black cells and white input cells. Clue numbers in cell corners. Clues listed beside grid (Across left, Down right). Auto-advance on letter entry.

**Validation:** Real-time — shared letter conflict → red border. Valid word → checkmark.

**Controls:** Verify | Hint (reveal one letter, −20 XP) | Restart | Check Word

**State:** `grid[5][5]`, `selectedCell`, `wordList{across[], down[]}`, `validationStatus`, `solved`

---

### Game 14 — Pangram Builder
**Folder:** `pangram-builder` | **XP:** 200 | **Attempts:** 2

**Mechanic:** Build a sentence using all 26 letters A–Z in exactly N words. N varies per puzzle level.

**Difficulty levels:** 15 words (easy) → 10 words (medium) → 8 words (hard) → 7 words (very hard)

**Layout:** Challenge text at top. Alphabet grid A–Z (letters highlight as used). Large text area. Word counter and letter counter update in real-time. Missing letters shown: "Missing: B, F, Q…"

**Validation:** All 26 letters present (case-insensitive) | Exactly N words | Word count must match.

**Controls:** Check Solution | Show Examples | Hint (show missing letters, −40 XP) | Clear

**Bonus:** Solved with fewer words than required → +50 XP.

**State:** `sentence`, `usedLetters (Set)`, `wordCount`, `targetWordCount`, `attempts`

---

### Game 15 — Etymology Chain
**Folder:** `etymology-chain` | **XP:** 200 | **Attempts:** 3

**Mechanic:** Start word → target word in exactly N steps. Each step: change one letter to form a new valid word. Example: CAT → BAT → BAD → DAD (3 steps).

**Layout:** Start word (green) and end word (red) displayed. N blank input fields between them. Each input: type a word, validation shows ✓/✗ in real-time.

**Validation:** Per step — (1) word exists in dictionary, (2) differs by exactly 1 letter from previous. Show path status.

**Controls:** Check Solution | Hint (reveal one step, −35 XP) | Restart

**Bonus:** Show if solution is minimal (optimal step count). Bonus XP if solved in fewer steps than N.

**State:** `startWord`, `targetWord`, `steps`, `userPath[]`, `validationStatus[]`, `attempts`

---

## SET 4 — Math & Arithmetic

---

### Game 16 — Equation Builder
**Folder:** `equation-builder` | **XP:** 200 | **Attempts:** 2

**Mechanic:** 3 equations with blanks (e.g., `_ + _ = 10`, `_ × _ = 12`, `_ − _ = 3`). Pool of 6 numbers — each used exactly once across all blanks. All 3 equations must be satisfied simultaneously.

**Layout:** 3 equation rows with blank slots. Number bank buttons below. Click number → click blank to place.

**Validation:** Per equation — green check when balanced. "0/3 equations correct" → "3/3".

**Controls:** Check Solution | Hint (reveal one number placement, −25 XP) | Restart | Give Up

**State:** `equations[3]`, `blanks[6]`, `selectedNumber`, `attempts`

---

### Game 17 — Prime Factorization
**Folder:** `prime-factorization` | **XP:** 150 | **Attempts:** 3

**Mechanic:** A target number shown (e.g., 144). Build its prime factorization by clicking prime number buttons (2, 3, 5, 7, 11, 13…). Running product shown. Match target exactly. 5 rounds, increasing difficulty.

**Layout:** Target number large at top. Running product display: "2 × 2 × 3 = 12". Prime buttons below. Progress: "Round 2 of 5".

**Validation:** Running product updates per click. Exceeds target → error. Matches → success.

**Controls:** Remove Last Prime | Restart Round | Hint (reveal one prime factor, −20 XP)

**State:** `targetNumber`, `selectedPrimes[]`, `runningProduct`, `round`, `attempts`

---

### Game 18 — Fibonacci Sequence
**Folder:** `fibonacci-sequence` | **XP:** 150 | **Attempts:** 3

**Mechanic:** A Fibonacci-like sequence with blanks. Player fills in missing terms. Rule: each term = sum of previous two. 5 rounds, increasing complexity.

**Example:** `1, 1, 2, ?, 5, 8, 13` → fill in `3`

**Layout:** Sequence displayed horizontally with input boxes for blanks. Formula reminder shown: `F(n) = F(n−1) + F(n−2)`.

**Validation:** Each blank validated on submit. Highlight correct (green) and incorrect (red).

**Controls:** Check Round | Hint (show formula, −15 XP) | Next Round

**State:** `sequences[5]`, `currentRound`, `userAnswers[]`, `attempts`

---

### Game 19 — Modular Arithmetic
**Folder:** `modular-arithmetic` | **XP:** 200 | **Attempts:** 3

**Mechanic:** Equation with modulo: `(_ × _) mod _ = _`. Four number inputs. Player fills them so the equation holds. Multiple rounds, increasing complexity.

**Example:** `(7 × 3) mod 10 = 1`

**Layout:** Equation template with 4 input fields. Running calculation preview. Round tracker.

**Hint:** Explains modulo operation: "X mod Y = remainder when X is divided by Y".

**Controls:** Check Round | Hint (explain modulo concept, −25 XP) | Next Round | Restart

**State:** `round`, `inputs[4]`, `expectedResult`, `attempts`

---

### Game 20 — Fraction Simplification
**Folder:** `fraction-simplification` | **XP:** 150 | **Attempts:** 3

**Mechanic:** A fraction shown (e.g., 48/64). Player reduces to lowest terms — inputs numerator and denominator. 5 fractions per game, increasing complexity.

**Validation:** Check if fully simplified (GCD of inputs = 1) and mathematically equivalent.

**Layout:** Large fraction display. Two number inputs (numerator / denominator). Progress: "Fraction 2 of 5".

**Controls:** Submit | Hint (show GCD, −20 XP) | Next Fraction

**Bonus:** Fast completion bonus XP per fraction.

**State:** `fractions[5]`, `currentIndex`, `numeratorInput`, `denominatorInput`, `attempts`

---

## SET 5 — Logic Puzzles (Statement-Based)

---

### Game 21 — Ages of Three Children
**Folder:** `ages-of-three` | **XP:** 200 | **Attempts:** 2

**Mechanic:** "The product of three children's ages is 72. Their sum equals the house number (shown). The eldest child is unique (no tie for oldest)." From these clues, determine the three ages.

**House number:** chosen so only one valid age set satisfies all clues (product 72, sum = house number, unique eldest).

**Layout:** Story card with clues. Three number inputs (enter ages in ascending order). Constraint list shown as checkmarks.

**Validation:** Product = 72 | Sum = house number | Unique eldest (no two equal ages at the max).

**Controls:** Check Solution | Hint (reveal one age, −40 XP) | Restart

**State:** `houseNumber`, `ageInputs[3]`, `attempts`

---

### Game 22 — Knights & Knaves
**Folder:** `knights-and-knaves` | **XP:** 200 | **Attempts:** 3

**Mechanic:** 3 characters — Knights always tell truth, Knaves always lie. Each makes a statement. Player identifies each as Knight or Knave. 5–10 puzzles, increasing complexity.

**Layout:** 3 character cards, each showing name, SVG figure, and their statement. Player clicks each card to toggle Knight/Knave. Visual: shield icon for Knight, dagger icon for Knave.

**Validation:** Check logical consistency — all statement truths/falsities must match assigned roles.

**Controls:** Submit Assignments | Hint (reveal one character's type, −30 XP) | Next Puzzle

**State:** `puzzle`, `statements[3]`, `assignments[3]`, `puzzleIndex`, `attempts`

---

### Game 23 — River Crossing
**Folder:** `river-crossing` | **XP:** 200 | **Attempts:** 2

**Mechanic:** Classic-style but rephrased. e.g., Farmer, Fox, Grain, Goose. Boat holds farmer + one item. Constraints: Fox eats Goose if unsupervised. Goose eats Grain if unsupervised. Get all across safely.

**Layout:** Two banks (left/right) with SVG character figures. Boat in the middle, clickable. Player clicks items to load into boat, clicks boat to cross.

**Validation:** After each crossing — check if any constraint is violated on either bank.

**Controls:** Cross River | Hint (suggest next valid move, −35 XP) | Restart

**State:** `leftBank[]`, `rightBank[]`, `boatContents[]`, `boatSide`, `moveCount`, `attempts`

---

### Game 24 — Monty Hall
**Folder:** `monty-hall` | **XP:** 200 | **Attempts:** 3

**Mechanic:** 5 doors, 1 prize, 4 empty. Player picks a door. Host opens 2 empty doors. Player chooses: Switch or Stay. 5 rounds. Track success rate and learn probability strategy.

**Layout:** 5 SVG door cards. Selected door: highlighted. Revealed doors: open (show empty). Two buttons: "Switch" and "Stay".

**Post-round:** Show probability math — "Switching wins 4/5 of the time". Running success rate display.

**Controls:** Switch | Stay | Next Round

**Scoring:** Track win rate across rounds. Display "Rounds: 4/5 | Wins: 3".

**State:** `prizeDoor`, `playerChoice`, `revealedDoors[]`, `round`, `wins`, `phase`

---

### Game 25 — Einstein's Riddle
**Folder:** `einsteins-riddle` | **XP:** 250 | **Attempts:** 3

**Mechanic:** 5 houses (1–5), 5 attributes each (color, nationality, pet, drink, job). 15–20 clues given. Player deduces all 25 attribute assignments.

**Layout:** 5×5 grid (houses × attributes). Each cell: dropdown or click to cycle through options. Clue list on the side. Real-time conflict highlighting.

**Validation:** All clues satisfied | No duplicate values in any attribute column.

**Controls:** Check Solution | Hint (reveal one cell, −50 XP) | Restart

**State:** `grid[5][5]`, `clues[]`, `validationErrors[]`, `attempts`

---

## SET 6 — Drawing & Spatial Puzzles

---

### Game 26 — Angry Roosters
**Folder:** `angry-roosters` | **XP:** 150 | **Attempts:** 3

**Mechanic:** A yard (SVG canvas) with 9 roosters. Player draws 2 straight lines to create exactly 2 squares such that each rooster is isolated in its own section.

**Layout:** Canvas with rooster SVG figures positioned. Player clicks two points to define each line. Lines extend across canvas. Sections highlight as created.

**Validation:** Exactly 2 closed squares formed | Each rooster in a separate section.

**Controls:** Draw Line | Clear Lines | Check Solution | Hint (suggest first line direction, −30 XP) | Restart

**State:** `roosters[9]`, `lines[2]`, `sections[]`, `attempts`

---

### Game 27 — Bridges & Islands
**Folder:** `bridges-and-islands` | **XP:** 200 | **Attempts:** 3

**Mechanic:** Islands (circle nodes) with numbers (required bridge count). Player draws bridges between islands. Constraint: each island has exactly N bridges. Bridges cannot cross.

**Layout:** SVG canvas with island circles showing required counts. Click two islands to draw a bridge. Bridge count per island shown as: `used/required` (e.g., 2/3).

**Validation:** Real-time — count bridges per island. Flag if over/under limit. No crossing lines.

**Controls:** Undo Last Bridge | Check Solution | Hint (suggest one valid bridge, −30 XP) | Restart

**State:** `islands[]`, `bridges[]`, `bridgeCount[]`, `attempts`

---

### Game 28 — Dot Connection
**Folder:** `dot-connection` | **XP:** 200 | **Attempts:** 3

**Mechanic:** Grid of dots. Player draws a continuous path visiting every edge exactly once (Eulerian path). No edge reused, path must be connected.

**Layout:** SVG dot grid. Click dot → click adjacent dot to draw edge. Drawn edges highlight. Already-drawn edges cannot be redrawn.

**Validation:** All edges used | No edge reused | Connected path.

**Controls:** Undo Last Edge | Check Solution | Hint (−30 XP) | Restart

**State:** `dots[]`, `edges[]`, `drawnEdges[]`, `path[]`, `attempts`

---

### Game 29 — Pentomino Puzzle
**Folder:** `pentomino-puzzle` | **XP:** 200 | **Attempts:** 3

**Mechanic:** 12 pentomino pieces (each = 5 unit squares). Arrange all into a 10×6 rectangle. No gaps, no overlaps.

**Layout:** 10×6 target grid. Piece tray with 12 colored SVG pentominoes. Drag to grid, snap to cells. Rotation button (90° increments). Pieces highlight green when correctly placed.

**Controls:** Rotate Piece | Undo | Check Solution | Hint (place one piece, −40 XP) | Restart

**State:** `pieces[12]` with `{cells[], color, pos, rotation}`, `grid[10][6]`, `placed[]`, `attempts`

---

### Game 30 — Star Placement
**Folder:** `star-placement` | **XP:** 150 | **Attempts:** 3

**Mechanic:** 7×7 grid. Some cells show numbers indicating how many stars are adjacent (UDLR) to that cell. Player places stars in empty cells. All number constraints must be satisfied.

**Layout:** 7×7 grid. Number cells: show digit. Empty cells: click to toggle star. Real-time count updates around each number cell. Conflict: number cell highlighted red if count is wrong.

**Validation:** All number cells satisfied | Total star count valid.

**Controls:** Check Solution | Hint (place one correct star, −25 XP) | Restart

**State:** `grid[7][7]`, `stars[]`, `numberCells[]`, `attempts`

---

## SET 7 — Olympiad Level

---

### Game 31 — Polyhedral Nets
**Folder:** `polyhedral-nets` | **XP:** 300 | **Attempts:** 3

**Mechanic:** A 3D polyhedron shown (cube, tetrahedron, octahedron). Player picks from 4 SVG 2D nets which one folds into the polyhedron. 5 puzzles.

**Layout:** 3D model SVG left. 4 flat net options right (A–D). Hover: animate folding preview.

**Controls:** Submit Answer | Hint (eliminate one wrong option, −40 XP) | Next Puzzle

**State:** `puzzleIndex`, `polyhedron`, `nets[4]`, `correctIndex`, `selected`, `score`

---

### Game 32 — Combinatorial Lock
**Folder:** `combinatorial-lock` | **XP:** 300 | **Attempts:** 3 (per round)

**Mechanic:** N-digit lock (each digit 0–9). Player makes guesses. After each guess, feedback: "2 correct digits in correct position" / "1 correct digit in wrong position" / "0 correct". Deduce the combination. Multiple rounds.

**Layout:** N input dials. Submit button. Guess history list showing feedback per guess.

**Controls:** Submit Guess | Hint (reveal one digit category, −40 XP) | New Round

**State:** `target[]`, `guesses[]`, `feedback[]`, `round`, `attempts`

---

### Game 33 — Recursive Sequence
**Folder:** `recursive-sequence` | **XP:** 300 | **Attempts:** 3

**Mechanic:** A sequence with a non-obvious recurrence relation (e.g., `a(n) = 2×a(n−1) + a(n−2) − 1`). Initial terms given. Player computes next 3 terms. 5 sequences per game.

**Layout:** Sequence displayed with blanks at the end. Input fields for 3 missing terms.

**Controls:** Check Answers | Hint (show recurrence formula, −50 XP) | Next Sequence

**State:** `sequences[5]`, `currentIndex`, `userAnswers[3]`, `attempts`

---

### Game 34 — Euler's Problem
**Folder:** `eulers-problem` | **XP:** 300 | **Attempts:** 3

**Mechanic:** City map with bridges (graph). Determine if an Eulerian path exists (traverse each bridge exactly once). If yes: draw path. If no: explain (odd-degree vertices). Multiple maps.

**Layout:** SVG graph — circles (landmasses/nodes), lines (bridges/edges). Player selects "Path exists" or "No path". If path exists, click nodes in order to draw path.

**Validation:** Check degree of each node. If 0 or 2 odd-degree nodes → path exists. Otherwise → no path. Path correctness: each edge used exactly once.

**Controls:** Submit Decision | Draw Path (click nodes) | Hint (show degree of one node, −40 XP) | Next Map

**State:** `graph{nodes[], edges[]}`, `playerDecision`, `playerPath[]`, `mapIndex`, `attempts`

---

### Game 35 — Infinite Series
**Folder:** `infinite-series` | **XP:** 300 | **Attempts:** 3

**Mechanic:** Infinite series displayed (geometric, telescoping, partial harmonic). Player determines sum. Input as fraction or decimal. 3 series per game.

**Examples:**
- `1/2 + 1/4 + 1/8 + … = 1`
- `1 − 1/2 + 1/4 − … = 2/3`
- `1/(1×2) + 1/(2×3) + 1/(3×4) + … = 1` (telescoping)

**Layout:** Series written out with `…` to indicate infinite. Fraction input (numerator/denominator) or decimal input.

**Controls:** Submit | Hint (reveal series type name, −30 XP) | Next Series

**State:** `series[3]`, `currentIndex`, `userAnswer`, `attempts`

---

## SET 8 — Extreme Difficulty (Olympiad+)

---

### Game 36 — Rubik's Cube 2×2
**Folder:** `rubiks-cube` | **XP:** 400 | **Attempts:** Unlimited (move-based)

**Mechanic:** 2×2 Rubik's Cube in scrambled state. Solve to all-matching faces. Optimal: ~11 moves.

**Layout:** 3D SVG cube — 6 visible faces, each divided into 4 colored squares. Click face arrows to rotate layers.

**Controls:** Face rotation buttons (U/D/L/R/F/B) | Hint (show one optimal rotation, −50 XP) | Restart (new scramble) | Undo

**XP:** 400 base | +100 bonus if ≤11 moves | −10 per hint.

**State:** `cubeState[6][4]` (face/cell colors), `moveCount`, `moveHistory[]`, `hintCount`

---

### Game 37 — SAT Problem
**Folder:** `sat-problem` | **XP:** 400 | **Attempts:** 3

**Mechanic:** Boolean formula in CNF (Conjunctive Normal Form). Example: `(A ∨ B ∨ ¬C) ∧ (¬A ∨ C) ∧ (B ∨ ¬D)`. Player assigns TRUE/FALSE to each variable so all clauses are satisfied.

**Layout:** Formula displayed. Variable toggles (A=T/F, B=T/F, …). Real-time clause evaluation — each clause highlights green (satisfied) or red (violated).

**Controls:** Submit | Hint (reveal one correct variable assignment, −50 XP) | New Formula

**State:** `formula (CNF)`, `variables{}`, `clauseStatus[]`, `attempts`

---

### Game 38 — Graph Coloring
**Folder:** `graph-coloring` | **XP:** 400 | **Attempts:** 3

**Mechanic:** Undirected graph (N nodes, E edges). Color nodes with minimum colors so no two adjacent nodes share a color (chromatic number challenge).

**Layout:** SVG graph with draggable nodes. Color palette (3–5 colors). Click node → click color to assign. Adjacent nodes with same color: red border conflict.

**Validation:** No adjacent same-color | Using minimum number of colors.

**Controls:** Check Solution | Hint (color one node correctly, −50 XP) | Restart | New Graph

**State:** `graph{nodes[], edges[]}`, `nodeColors[]`, `chromaticNumber`, `attempts`

---

### Game 39 — Partition Problem
**Folder:** `partition-problem` | **XP:** 400 | **Attempts:** 3

**Mechanic:** Set of N integers. Partition into two subsets with equal sum. Player selects integers for subset 1 (rest go to subset 2). If impossible: select "No solution".

**Layout:** Integer cards (clickable). Subset 1 tray and Subset 2 tray. Running sum display per subset. "Sum A: 24 | Sum B: 18 | Target: 21".

**Controls:** Submit Partition | Declare Impossible | Hint (reveal subset size, −40 XP) | New Puzzle

**State:** `integers[]`, `subsetA[]`, `subsetB[]`, `targetSum`, `attempts`

---

### Game 40 — Travelling Salesman
**Folder:** `travelling-salesman` | **XP:** 400 | **Attempts:** 3

**Mechanic:** 5–6 cities on a map. Distances between all pairs given. Find shortest route visiting all cities exactly once and returning to start (Hamiltonian cycle with minimum total distance).

**Layout:** SVG map with city nodes. Distances shown on edges. Player clicks cities in order to build route. Running total distance updates. "Your route: 847km | Optimal: 712km".

**Validation:** All cities visited exactly once | Returns to start. Compare to pre-computed optimal.

**Controls:** Submit Route | Clear Route | Hint (suggest one optimal next city, −50 XP) | New Map

**Bonus:** +100 XP if matches optimal route.

**State:** `cities[]`, `distances{}`, `playerRoute[]`, `totalDistance`, `optimalDistance`, `attempts`

---

## Build Order Recommendation

Build games in this order — simpler mechanics first, complex last:

**Phase 1 (start here):**
Games 3 (Mini Sudoku), 18 (Fibonacci), 20 (Fraction), 10 (Rotational Symmetry), 30 (Star Placement)

**Phase 2:**
Games 2 (Number Maze), 9 (Maze Navigator), 8 (Tower of Hanoi), 17 (Prime Factorization), 24 (Monty Hall)

**Phase 3:**
Games 1 (Math Cross), 16 (Equation Builder), 4 (Logic Gates), 22 (Knights & Knaves), 23 (River Crossing)

**Phase 4:**
Games 5 (Cryptarithmetic), 21 (Ages of Three), 25 (Einstein's Riddle), 27 (Bridges), 34 (Euler's Problem)

**Phase 5 (hardest):**
Games 36 (Rubik's), 37 (SAT), 38 (Graph Coloring), 39 (Partition), 40 (Travelling Salesman)
