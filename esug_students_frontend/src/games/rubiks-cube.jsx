import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 2×2 Rubik's Cube solver.
// State: 6 faces × 4 cells. Faces: U(top), D(bottom), F(front), B(back), L(left), R(right).
// Index layout per face: [0,1,2,3] = top-left, top-right, bottom-left, bottom-right.
// Moves: U, U', D, D', F, F', B, B', L, L', R, R'.
// Solved state: each face is uniform color.

const FACE_COLORS = ['#FFFFFF','#FFFF00','#FF4B4B','#FF9600','#1CB0F6','#58CC02'];
// Faces: U=0(white), D=1(yellow), F=2(red), B=3(orange), L=4(blue), R=5(green)
const [U,D,F,B,L,R] = [0,1,2,3,4,5];
const FACE_NAMES = ['U','D','F','B','L','R'];

function solvedState() {
  return FACE_COLORS.map(color => [color,color,color,color]);
}

function cloneState(state) {
  return state.map(face => [...face]);
}

// Apply move U (clockwise): top face rotates CW, adjacent top row cycles
function applyMove(state, move) {
  const s = cloneState(state);
  switch(move) {
    case 'U': {
      // Top face CW: 0→1→3→2→0
      [s[U][0],s[U][1],s[U][3],s[U][2]] = [s[U][2],s[U][0],s[U][1],s[U][3]];
      // Adjacent: F-top→R-top→B-top→L-top (each is [0,1])
      const tmp = [s[F][0],s[F][1]];
      s[F][0]=s[R][0]; s[F][1]=s[R][1];
      s[R][0]=s[B][0]; s[R][1]=s[B][1];
      s[B][0]=s[L][0]; s[B][1]=s[L][1];
      s[L][0]=tmp[0]; s[L][1]=tmp[1];
      break;
    }
    case "U'": return applyMove(applyMove(applyMove(state,'U'),'U'),'U');
    case 'D': {
      [s[D][0],s[D][1],s[D][3],s[D][2]] = [s[D][2],s[D][0],s[D][1],s[D][3]];
      const tmp = [s[F][2],s[F][3]];
      s[F][2]=s[L][2]; s[F][3]=s[L][3];
      s[L][2]=s[B][2]; s[L][3]=s[B][3];
      s[B][2]=s[R][2]; s[B][3]=s[R][3];
      s[R][2]=tmp[0]; s[R][3]=tmp[1];
      break;
    }
    case "D'": return applyMove(applyMove(applyMove(state,'D'),'D'),'D');
    case 'R': {
      [s[R][0],s[R][1],s[R][3],s[R][2]] = [s[R][2],s[R][0],s[R][1],s[R][3]];
      const tmp = [s[U][1],s[U][3]];
      s[U][1]=s[F][1]; s[U][3]=s[F][3];
      s[F][1]=s[D][1]; s[F][3]=s[D][3];
      s[D][1]=s[B][2]; s[D][3]=s[B][0];
      s[B][2]=tmp[0]; s[B][0]=tmp[1];
      break;
    }
    case "R'": return applyMove(applyMove(applyMove(state,'R'),'R'),'R');
    case 'F': {
      [s[F][0],s[F][1],s[F][3],s[F][2]] = [s[F][2],s[F][0],s[F][1],s[F][3]];
      const tmp = [s[U][2],s[U][3]];
      s[U][2]=s[L][3]; s[U][3]=s[R][0];
      s[L][3]=s[D][0]; s[R][0]=s[D][3];
      s[D][0]=tmp[0]; s[D][3]=tmp[1];
      break;
    }
    case "F'": return applyMove(applyMove(applyMove(state,'F'),'F'),'F');
    default: return s;
  }
  return s;
}

function applyMoves(state, moves) {
  return moves.reduce((s, m) => applyMove(s, m), state);
}

function isSolved(state) {
  return state.every(face => face.every(c => c === face[0]));
}

// Scrambles (3-5 moves each, with solution move sequences)
const SCRAMBLES = [
  { moves: ['R','U',"R'"], hint: "R' U' R to solve" },
  { moves: ['F','R',"F'","R'"], hint: "R F R' F' to solve" },
  { moves: ['U','R',"U'","R'","U"], hint: "U' R U R' U' to solve" },
];

const MOVE_BUTTONS = ['U',"U'",'R',"R'",'F',"F'",'D',"D'"];

export default function RubiksCube() {
  const [scrambleIdx] = useState(() => Math.floor(Math.random() * SCRAMBLES.length));
  const sc = SCRAMBLES[scrambleIdx];
  const [state, setState] = useState(() => applyMoves(solvedState(), sc.moves));
  const [moves, setMoves] = useState(0);
  const [setScore] = useState(0);
  const [phase, setPhase] = useState('intro');
  const [msg, setMsg] = useState('');

  function applyBtn(move) {
    setState(s => {
      const ns = applyMove(s, move);
      const newMoves = moves + 1;
      setMoves(newMoves);
      if (isSolved(ns)) {
        setPhase('won');
        // Signal completion to parent challenge page for time-based XP award
        window.parent.postMessage({ type: 'MAZE_COMPLETE' }, '*');
      }
      return ns;
    });
  }

  function resetCube() {
    setState(applyMoves(solvedState(), sc.moves));
    setMoves(0); setPhase('playing'); setMsg('');
  }

  // Render flat cross layout: B(top), L/U/R/D(middle row), F(bottom)
  // Actually render as: U center top, L left, F center, R right, D below, B far
  const FaceBlock = ({ faceIdx, label }) => (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-mono text-xs text-text-muted mb-0.5">{label}</span>
      <div className="grid grid-cols-2 gap-0.5">
        {state[faceIdx].map((color, i) => (
          <div key={i} className="w-8 h-8 rounded-md border border-white/20" style={{backgroundColor: color}}/>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-off flex flex-col items-center py-8 px-4 font-body">
      <div className="w-full max-w-lg">
        <p className="text-center font-mono text-xs text-text-muted uppercase tracking-widest mb-1">Interactive Puzzle</p>
        <h1 className="text-center font-display font-black text-4xl text-text-dark mb-1">Rubik's Cube 2×2</h1>
        <p className="text-center text-text-mid text-sm mb-5">Restore each face to a single colour. Apply moves using the buttons below.</p>

        <AnimatePresence mode="wait">
          
          {phase === 'intro' && (
            <motion.div key="intro" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
              className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-6">
              <h2 className="font-display font-black text-xl text-text-dark mb-3">How to Play — Rubik's Cube 2×2</h2>
              <div className="space-y-3 mb-5">
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">1</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "The 2×2 cube starts scrambled. Your goal: restore every face to a single colour."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">2</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Use the move buttons (U, R, F, D…) to rotate layers. A prime (′) means anticlockwise."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">3</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "The flat net shows all 6 faces simultaneously."}}/>
                </div>
                <div className="flex gap-3 items-start bg-surface-off rounded-2xl p-3 border border-surface-border">
                  <span className="font-display font-black text-duo-blue text-lg leading-none mt-0.5">4</span>
                  <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "Hint reveals one optimal move. Fewer moves = more XP."}}/>
                </div>
              </div>
              <div className="bg-[#1CB0F6]/8 rounded-2xl p-4 mb-5 border border-[#1CB0F6]/20">
                <p className="font-display font-black text-xs text-duo-blue uppercase tracking-wider mb-1">Example</p>
                <p className="font-body text-sm text-text-mid" dangerouslySetInnerHTML={{__html: "U = rotate the top layer clockwise. U′ = rotate top layer anticlockwise."}}/>
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
              <h2 className="font-display font-black text-3xl text-text-dark mb-2">Solved in {moves} moves!</h2>
              <p className="font-body text-text-mid text-sm mb-5">XP earned — check the challenge page!</p>
              <button onClick={resetCube} className="btn-primary w-full py-3 text-base">New Scramble</button>
            </motion.div>
          )}
          {phase === 'playing' && (
            <motion.div key="playing" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
              <div className="flex items-center justify-between bg-surface-card rounded-2xl border border-surface-border shadow-card px-5 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xs text-text-muted">Scramble:</span>
                  <span className="font-mono text-xs text-text-dark">{sc.moves.join(' ')}</span>
                </div>
                <span className="font-mono text-xs text-text-muted">{moves} moves</span>
              </div>

              {/* Cube net display */}
              <div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5 mb-4">
                <div className="flex flex-col items-center gap-2">
                  <FaceBlock faceIdx={U} label="U (top)"/>
                  <div className="flex gap-3 items-center">
                    <FaceBlock faceIdx={L} label="L"/>
                    <FaceBlock faceIdx={F} label="F (front)"/>
                    <FaceBlock faceIdx={R} label="R"/>
                  </div>
                  <FaceBlock faceIdx={D} label="D"/>
                  <FaceBlock faceIdx={B} label="B"/>
                </div>
              </div>

              {/* Move buttons */}
              <div className="bg-surface-card rounded-2xl border border-surface-border shadow-card px-4 py-3 mb-4">
                <p className="font-display font-bold text-xs text-text-muted mb-2">Face rotations (clockwise / counter-clockwise):</p>
                <div className="grid grid-cols-4 gap-2">
                  {MOVE_BUTTONS.map(m => (
                    <motion.button key={m} onClick={() => applyBtn(m)} whileTap={{scale:0.9}}
                      className="py-3 rounded-xl bg-surface-off border-2 border-surface-border font-mono font-bold text-sm text-text-dark hover:border-duo-blue hover:text-duo-blue transition-all cursor-pointer">
                      {m}
                    </motion.button>
                  ))}
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

              <div className="flex gap-3">
                <button onClick={() => setMsg(`Hint: ${sc.hint}`)}
                  className="flex-1 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid hover:border-duo-blue hover:text-duo-blue transition-all">
                  Hint
                </button>
                <button onClick={resetCube}
                  className="px-5 py-3 rounded-2xl font-display font-bold text-sm bg-white border-2 border-surface-border text-text-mid transition-all">
                  Reset
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-text-muted text-xs font-mono text-center">ISAG Interactive Games — Rubik's Cube 2×2</p>
      </div>
    </div>
  );
}
