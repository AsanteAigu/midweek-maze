import { lazy, Suspense } from 'react';

const GAMES = {
  'ages-of-three':        lazy(() => import('./ages-of-three.jsx')),
  'anagram-solver':       lazy(() => import('./anagram-solver.jsx')),
  'angry-roosters':       lazy(() => import('./angry-roosters.jsx')),
  'bridges-and-islands':  lazy(() => import('./bridges-and-islands.jsx')),
  'combinatorial-lock':   lazy(() => import('./combinatorial-lock.jsx')),
  'cryptarithmetic':      lazy(() => import('./cryptarithmetic.jsx')),
  'dot-connection':       lazy(() => import('./dot-connection.jsx')),
  'einsteins-riddle':     lazy(() => import('./einsteins-riddle.jsx')),
  'equation-builder':     lazy(() => import('./equation-builder.jsx')),
  'eulers-problem':       lazy(() => import('./eulers-problem.jsx')),
  'fibonacci-sequence':   lazy(() => import('./fibonacci-sequence.jsx')),
  'fraction-simplification': lazy(() => import('./fraction-simplification.jsx')),
  'graph-coloring':       lazy(() => import('./graph-coloring.jsx')),
  'infinite-series':      lazy(() => import('./infinite-series.jsx')),
  'knights-and-knaves':   lazy(() => import('./knights-and-knaves.jsx')),
  'logic-gates':          lazy(() => import('./logic-gates.jsx')),
  'math-cross':           lazy(() => import('./math-cross.jsx')),
  'maze-navigator':       lazy(() => import('./maze-navigator.jsx')),
  'mini-crossword':       lazy(() => import('./mini-crossword.jsx')),
  'mini-sudoku':          lazy(() => import('./mini-sudoku.jsx')),
  'modular-arithmetic':   lazy(() => import('./modular-arithmetic.jsx')),
  'monty-hall':           lazy(() => import('./monty-hall.jsx')),
  'night-bridge':         lazy(() => import('./night-bridge.jsx')),
  'number-maze':          lazy(() => import('./number-maze.jsx')),
  'pangram-builder':      lazy(() => import('./pangram-builder.jsx')),
  'partition-problem':    lazy(() => import('./partition-problem.jsx')),
  'pattern-completion':   lazy(() => import('./pattern-completion.jsx')),
  'pentomino-puzzle':     lazy(() => import('./pentomino-puzzle.jsx')),
  'polyhedral-nets':      lazy(() => import('./polyhedral-nets.jsx')),
  'prime-factorization':  lazy(() => import('./prime-factorization.jsx')),
  'recursive-sequence':   lazy(() => import('./recursive-sequence.jsx')),
  'river-crossing':       lazy(() => import('./river-crossing.jsx')),
  'rotational-symmetry':  lazy(() => import('./rotational-symmetry.jsx')),
  'rubiks-cube':          lazy(() => import('./rubiks-cube.jsx')),
  'sat-problem':          lazy(() => import('./sat-problem.jsx')),
  'star-placement':       lazy(() => import('./star-placement.jsx')),
  'tangram-solver':       lazy(() => import('./tangram-solver.jsx')),
  'tower-of-hanoi':       lazy(() => import('./tower-of-hanoi.jsx')),
  'travelling-salesman':  lazy(() => import('./travelling-salesman.jsx')),
};

export default function GameRenderer({ slug }) {
  const Game = GAMES[slug];
  if (!Game) {
    return (
      <div className="p-10 text-center text-text-mid font-body">
        Game not found: <span className="font-mono">{slug}</span>
      </div>
    );
  }
  return (
    <Suspense fallback={
      <div className="p-10 text-center text-text-mid font-body animate-pulse">
        Loading game...
      </div>
    }>
      <Game />
    </Suspense>
  );
}
