# Interactive Games — Style Guide

Every game must look like it belongs to the same platform as the Midweek Maze. Match this guide exactly.

---

## Page layout

```
bg-surface-off (#F7F7F7)  ← entire page background
  └── max-w-xl centered column, py-8 px-4
        ├── Page header (title, subtitle, HUD bar)
        ├── Game card  (white card containing the scene)
        ├── Controls   (status strip + primary action button)
        ├── Log / feedback  (white card)
        └── Result overlay  (white card, AnimatePresence)
```

The **page** is always light. Only the **game scene** inside its card is dark.

---

## Color tokens

Use these Tailwind class names — never raw hex in className strings.

### Surface (light theme)
| Token | Hex | Use |
|-------|-----|-----|
| `bg-surface-off` | `#F7F7F7` | Page background |
| `bg-surface-card` | `#FFFFFF` | Cards, panels |
| `border-surface-border` | `#E5E5E5` | Card borders |
| `border-surface-border-strong` | `#AFAFAF` | Dividers, strong borders |

### Text
| Token | Hex | Use |
|-------|-----|-----|
| `text-text-dark` | `#3C3C3C` | Headings, primary text |
| `text-text-mid` | `#777777` | Body / secondary text |
| `text-text-muted` | `#AFAFAF` | Labels, captions |

### Duolingo brand palette
| Token | Hex | Use |
|-------|-----|-----|
| `duo-blue` | `#1CB0F6` | Primary CTA buttons, active states |
| `duo-blue-dark` | `#0F8FC0` | Button hover, shadow-blue |
| `duo-blue-light` | `#DFF4FF` | Soft blue highlight backgrounds |
| `duo-green` | `#58CC02` | Success, correct, Base Camp label |
| `duo-green-dark` | `#3D8F01` | Green hover |
| `duo-yellow` | `#FFC800` | XP badges, timer neutral |
| `duo-yellow-dark` | `#E6AC00` | Yellow text on light bg |
| `duo-red` | `#FF4B4B` | Errors, failures, critical timer |
| `duo-purple` | `#CE82FF` | Secondary accent |
| `duo-orange` | `#FF9600` | Warnings, urgent timer |

### Scene colors (dark zone inside the game card only)
| Token | Hex | Use |
|-------|-----|-----|
| `scene-bg` | `#050D1E` | Night sky |
| `scene-mid` | `#0A1628` | Mid-tone |
| `scene-ground` | `#071A10` | Ground/grass |

For scene gradients use inline style: `style={{ background: 'linear-gradient(180deg, #050D1E 0%, #071A10 100%)' }}`

---

## Typography

```js
fontFamily: {
  display: ['"Nunito"', 'sans-serif'],      // headings, buttons, labels
  body:    ['"DM Sans"', 'system-ui'],       // body text, descriptions
  mono:    ['"JetBrains Mono"', 'monospace'] // logs, code, timers
}
```

**Google Fonts import in index.html:**
```html
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
```

### Heading scale
| Class combo | Use |
|-------------|-----|
| `font-display font-black text-4xl text-text-dark` | Page title (h1) |
| `font-display font-black text-3xl text-text-dark` | Result heading |
| `font-display font-black text-2xl text-text-dark` | Section heading |
| `font-display font-bold text-xs text-text-muted uppercase tracking-widest` | Small label / eyebrow |
| `font-body text-sm text-text-mid` | Body / description |
| `font-mono text-xs text-text-mid` | Log entries, timers |

---

## Component patterns

### Card
```jsx
<div className="bg-surface-card rounded-3xl border border-surface-border shadow-card p-5">
```

### Primary button (Duolingo press effect)
```jsx
<button className="btn-primary w-full py-4 text-lg">Cross the Bridge</button>
```
Disabled state:
```jsx
<button disabled className="bg-surface-off border-2 border-surface-border text-text-muted rounded-2xl ...">
```

### HUD bar
```jsx
<div className="flex items-center justify-between bg-surface-card rounded-2xl
  border border-surface-border shadow-card px-5 py-3">
  <Timer />
  <TriesDots triesLeft={n} max={3} />
</div>
```

### Tries dots
```jsx
{Array.from({ length: MAX }).map((_, i) => (
  <div key={i} className="w-3.5 h-3.5 rounded-full transition-all"
    style={{ background: i < triesLeft ? '#1CB0F6' : '#E5E5E5' }} />
))}
```

### Timer
- Neutral (0–10 min): `text-duo-green`
- Warning (11–14 min): `text-duo-orange`
- Critical (15+ min): `text-duo-red`

### Zone label strip (inside game card, above scene)
```jsx
<div className="flex justify-between items-center px-5 py-2.5
  border-b border-surface-border bg-surface-off">
  <span className="font-display font-black text-xs text-duo-green uppercase tracking-widest">
    Zone A
  </span>
  <span className="font-mono text-xs text-text-muted">bridge / path / zone</span>
  <span className="font-display font-black text-xs text-duo-blue uppercase tracking-widest">
    Zone B
  </span>
</div>
```

---

## Character figures

Characters must be **SVG stick figures** with animated arms, legs, and body. Never use emoji or static images as characters.

### Anatomy
```
Head    — <circle> filled with char.color
Eyes    — two small dark circles + white shine circles
Smile   — <path> arc
Torso   — <rect rx="5"> with slight opacity + sheen rect
Arms    — <line> inside a <g> with transformOrigin at shoulder
Hands   — <circle> at end of arm line
Legs    — <line> inside a <g> with transformOrigin at hip
Feet    — <ellipse> at end of leg line
Shadow  — <ellipse> at bottom, char.color at ~12% opacity
```

### Walking animation — CSS class toggle
Add these classes to the `<g>` wrappers when `isWalking === true`:

```css
.walk-leg-left  { animation: leg-left  0.4s ease-in-out infinite; }
.walk-leg-right { animation: leg-right 0.4s ease-in-out infinite; }
.walk-arm-left  { animation: arm-left  0.4s ease-in-out infinite; }
.walk-arm-right { animation: arm-right 0.4s ease-in-out infinite; }
.walk-body      { animation: body-bob  0.4s ease-in-out infinite; }
```

The `transformOrigin` must be set via inline `style` on the `<g>` tag pointing to the joint pivot:
```jsx
<g className={walking ? 'walk-leg-left' : ''} style={{ transformOrigin: '19px 39px' }}>
```

### Each character needs a unique `color` (hex) and a soft `bg` (15–20% tint of same hue):

| Slot | Color | Background |
|------|-------|------------|
| Fastest | `#1CB0F6` | `#DFF4FF` |
| Second | `#58CC02` | `#E8FFD4` |
| Third | `#CE82FF` | `#F5E8FF` |
| Slowest | `#FF9600` | `#FFF0D4` |

---

## Scene / environment

### Night sky (inside game card)
- Background gradient: `linear-gradient(180deg, #050D1E 0%, #071A10 100%)`
- Stars: 10 small `<div>` circles, 2–3px, white, absolute positioned, `.star` class (twinkle animation)
- Moon: one rounded-full div, `bg-yellow-50`, `moon-pulse` class, crater detail circle

### Bridge / path / obstacle (center of scene)
- Use an inline `<svg viewBox>` with a `bridge-sway` animation class
- Rope: `<path>` with a quadratic bezier sag, stroke `#92651A`
- Planks: `<rect rx="2">`, alternating fills `#7B4F18` / `#5C3A0F`
- Anchors: `<rect rx="3">` at each end, fill `#4A3000`

### Environment decoration ideas for other games
- Forest path: trees as triangle + rect, path as rect strip
- Room interior: walls as rects, floor line, window as rect with cross
- City street: building silhouettes, road as rect, lane lines
- Underwater: wave path at top, bubbles as circles with fade animation

---

## Animation keyframes (copy into every game's index.css)

```css
@keyframes leg-left   { 0%,100%{transform:rotate(24deg)} 50%{transform:rotate(-24deg)} }
@keyframes leg-right  { 0%,100%{transform:rotate(-24deg)} 50%{transform:rotate(24deg)} }
@keyframes arm-left   { 0%,100%{transform:rotate(-20deg)} 50%{transform:rotate(20deg)} }
@keyframes arm-right  { 0%,100%{transform:rotate(20deg)} 50%{transform:rotate(-20deg)} }
@keyframes body-bob   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
@keyframes lantern-float { 0%,100%{transform:translateY(0) rotate(-4deg)} 50%{transform:translateY(-5px) rotate(4deg)} }
@keyframes star-twinkle  { 0%,100%{opacity:.25;transform:scale(1)} 50%{opacity:1;transform:scale(1.5)} }
@keyframes moon-glow     { 0%,100%{box-shadow:0 0 18px 6px rgba(255,240,160,.2)} 50%{box-shadow:0 0 28px 12px rgba(255,240,160,.38)} }
@keyframes bridge-sway   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(1.5px)} }
```

---

## Game state shape

Every puzzle game should follow this state structure as a baseline:

```js
// Characters / entities
const [entities, setEntities] = useState(INITIAL_ENTITIES);

// Game meta
const [phase,     setPhase]     = useState('playing'); // 'playing' | 'won' | 'lost' | 'gameover'
const [triesLeft, setTriesLeft] = useState(MAX_TRIES); // always 3
const [elapsed,   setElapsed]   = useState(0);         // numeric progress metric

// Interaction
const [selected,  setSelected]  = useState([]);        // currently selected entity ids
const [animating, setAnimating] = useState(false);     // lock input during animation

// Feedback
const [log,   setLog]   = useState([]);  // move history strings
const [error, setError] = useState(''); // inline error message
```

### Win/loss check order — always check failure first
```js
// WRONG — if player exceeds limit but completes the goal, incorrectly shows win
if (goalMet) { setPhase('won'); }
else if (limitExceeded) { ... fail ... }

// CORRECT
if (limitExceeded) {
  const next = triesLeft - 1;
  setTriesLeft(next);
  setPhase(next <= 0 ? 'gameover' : 'lost');
} else if (goalMet) {
  setPhase('won');
}
```

---

## Result screens

### Won
- Green rounded-square icon with checkmark
- `font-display font-black text-3xl` heading
- Yellow XP/time badge (`bg-duo-yellow/20 border-duo-yellow/40`)
- Move summary in `bg-surface-off rounded-2xl border`
- `btn-primary` "Play Again" button

### Lost (tries remaining)
- Red icon, red tints (`bg-duo-red/15 border-duo-red/30`)
- Show `triesLeft` remaining
- `btn-primary` "Try Again" button

### Game Over (no tries left)
- Gray icon, neutral card
- Show the optimal solution or a hint
- `btn-primary` "Start Over" button

---

## Footer

Every game ends with:
```jsx
<p className="mt-10 text-text-muted text-xs font-mono text-center">
  ISAG Interactive Games — [Game Title]
</p>
```
