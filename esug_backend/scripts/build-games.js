// Builds all interactive games so the backend can serve them at /games/:slug/
// Run: node scripts/build-games.js
// In production (Railway), this runs as part of the deployment build step.

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const gamesRoot = path.join(__dirname, '../../interactive_games');

const slugs = fs.readdirSync(gamesRoot).filter((name) => {
  const dir = path.join(gamesRoot, name);
  return fs.statSync(dir).isDirectory() && fs.existsSync(path.join(dir, 'package.json'));
});

console.log(`Building ${slugs.length} games...`);

let built = 0;
let failed = 0;

for (const slug of slugs) {
  const dir = path.join(gamesRoot, slug);
  try {
    console.log(`[${slug}] installing...`);
    execSync('npm install --prefer-offline --no-audit --include=dev', { cwd: dir, stdio: 'pipe' });
    console.log(`[${slug}] building...`);
    execSync('npm run build', { cwd: dir, stdio: 'pipe' });
    console.log(`[${slug}] ✓`);
    built++;
  } catch (err) {
    console.error(`[${slug}] ✗ — ${err.message}`);
    failed++;
  }
}

console.log(`\nDone: ${built} built, ${failed} failed`);
if (failed > 0) process.exit(1);
