const cron = require('node-cron');
const { unlockChallenge, scoreChallenge } = require('../services/schedulerService');

console.log('[SCHEDULER] Initializing ESUG Quiz weekly scheduler...');

// JOB 1 — Every Wednesday at 00:00 — unlock next challenge
cron.schedule('0 0 * * 3', async () => {
  console.log('[SCHEDULER] JOB 1 — Wednesday 00:00 — unlocking challenge');
  await unlockChallenge();
}, { timezone: 'Africa/Accra' }); // Ghana timezone (WAT/GMT)

// JOB 2 — Every Wednesday at 00:01 — score previous week's challenge
cron.schedule('1 0 * * 3', async () => {
  console.log('[SCHEDULER] JOB 2 — Wednesday 00:01 — scoring previous challenge');
  await scoreChallenge();
}, { timezone: 'Africa/Accra' });

// JOB 3 — Every Tuesday at 23:59 — log close of submission window
cron.schedule('59 23 * * 2', () => {
  console.log('[SCHEDULER] JOB 3 — Tuesday 23:59 — submission window closed (enforced by closes_at timestamp)');
}, { timezone: 'Africa/Accra' });

console.log('[SCHEDULER] Weekly jobs scheduled. Timezone: Africa/Accra (GMT)');

module.exports = {};
