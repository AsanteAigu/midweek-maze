# ✅ BACKEND OBJECTIVES — ISAG Quiz Platform
> Work phases in strict order. Never skip ahead.
> [ ] not started | [~] in progress | [x] complete | [!] blocked
> NEVER remove entries. Only update status and append notes.

---

## 🔴 PHASE 1 — Setup & Foundation
> Goal: Server boots. DB connected. Security configured.

- [x] Initialize Node.js + Express project (if not already done)
- [x] Install all dependencies: express, cors, dotenv, helmet, express-rate-limit, express-validator, @supabase/supabase-js, node-cron
- [x] **FIRST ACTION:** Verify .env exists and is in .gitignore before anything else
- [x] Create server.js with: helmet(), cors(), express.json(), rate limiting, global error handler
- [x] Create src/config/supabase.js — Supabase client with service role key
- [x] Create src/middleware/auth.js — JWT verification middleware
- [x] Create src/middleware/validate.js — express-validator error handler
- [x] Create src/middleware/rateLimiter.js — submission limiter (5 req/min), general limiter
- [x] Create src/middleware/adminAuth.js — checks ADMIN_SECRET header
- [x] Create src/utils/scoring.js — compare answer to answer_key (case-insensitive, trimmed)
- [x] Create Supabase tables: students, challenges, submissions, xp_history (or confirm already created)
- [x] Add unique constraint: submissions(student_id, challenge_id)
- [x] Enable RLS on all 4 tables with policies from MASTER_CONTEXT.md
- [x] Add all database indexes from MASTER_CONTEXT.md
- [x] Test Supabase: confirm read/write operations work

**Phase 1 Checkpoint → wait for "proceed"**

---

## 🟡 PHASE 2 — Auth & Student Routes
> Goal: Registration, login, profile update all working.

- [x] Build POST /api/auth/register
  - [x] Validate: student_id, first_name, last_name, email, password, level, course, display_name
  - [x] Check student_id uniqueness (return 409 if taken)
  - [x] Check email uniqueness (return 409 if taken)
  - [x] Check display_name uniqueness (return 409 if taken)
  - [x] Create Supabase Auth user (email + password)
  - [x] Insert row in students table with generated avatar_seed
  - [x] Return JWT + student profile
- [x] Build POST /api/auth/login
  - [x] Supabase Auth signInWithPassword
  - [x] Return JWT + student profile
- [x] Build GET /api/auth/me
  - [x] Requires auth middleware
  - [x] Return current student profile (never return answer_key from challenges)
- [x] Build PATCH /api/profile
  - [x] Requires auth middleware
  - [x] Allowed fields: display_name, avatar_seed, show_real_name ONLY
  - [x] Validate display_name uniqueness if changed
  - [x] Update students table
- [x] Build GET /api/profile/:displayName
  - [x] Public route — no auth required
  - [x] Returns profile respecting show_real_name setting
  - [x] Returns XP history for that student

**Phase 2 Checkpoint → wait for "proceed"**

---

## 🟢 PHASE 3 — Challenge & Submission Routes
> Goal: Students can view challenges and submit answers.

- [ ] Build GET /api/challenge/current
  - [ ] Requires auth middleware
  - [ ] Return current active challenge (is_active = true AND opens_at <= now AND closes_at > now)
  - [ ] NEVER include answer_key in response
  - [ ] Include whether current user has already submitted (and their submission if so)
  - [ ] If no active challenge: return { challenge: null, message: "Next challenge drops Wednesday" }
- [ ] Build POST /api/submit
  - [ ] Requires auth middleware
  - [ ] Rate limit: 5 req/min per student
  - [ ] Validate: challenge_id, answer (non-empty, max 2000 chars)
  - [ ] Check: challenge is_active = true
  - [ ] Check: closes_at > now (window still open)
  - [ ] Check: no existing submission for this student + challenge (unique constraint will also catch this)
  - [ ] Insert into submissions table (is_correct = null, xp_earned = 0 until scored)
  - [ ] Return: { success: true, message: "Answer submitted — results on Wednesday" }
  - [ ] On duplicate: return 409 with friendly message
- [ ] Build GET /api/submissions/me
  - [ ] Requires auth middleware
  - [ ] Return all of current student's submissions with challenge titles
  - [ ] Include is_correct and xp_earned (null until scored)
- [ ] Build POST /api/admin/challenges
  - [ ] Requires adminAuth middleware (checks ADMIN_SECRET header)
  - [ ] Validate all challenge fields
  - [ ] Insert into challenges table
  - [ ] Return created challenge (without answer_key in response)

**Phase 3 Checkpoint → wait for "proceed"**

---

## 🔵 PHASE 4 — Leaderboard & Scheduler
> Goal: Leaderboard works. Scheduler scores challenges and awards XP.

- [ ] Build GET /api/leaderboard/alltime
  - [ ] Public route
  - [ ] Query: students ordered by total_xp DESC
  - [ ] Respect show_real_name — never expose first_name/last_name if false
  - [ ] Include: rank, display_name, avatar_seed, level, course, total_xp
  - [ ] Pagination: ?page=1&limit=10
  - [ ] Optional filters: ?course=computer_engineering, ?level=200
- [ ] Build GET /api/leaderboard/weekly
  - [ ] Public route
  - [ ] Find most recently scored challenge
  - [ ] Query: submissions for that challenge, ordered by xp_earned DESC, submitted_at ASC
  - [ ] Join with students, respect show_real_name
  - [ ] Return top N with rank
- [ ] Build GET /api/xp-history/me
  - [ ] Requires auth middleware
  - [ ] Return all xp_history rows for current student
  - [ ] Join with challenges for title
- [ ] Create src/services/schedulerService.js
  - [ ] `unlockChallenge()` — set is_active = true on next challenge
  - [ ] `scoreChallenge(challengeId)` — score all submissions, award XP, update student totals
  - [ ] `closeChallengeWindow()` — no action needed (closes_at enforced in submit route)
  - [ ] Per-challenge and per-student try/catch — never crash the scheduler
- [ ] Create src/config/scheduler.js — node-cron jobs
  - [ ] Wednesday 00:00 — call unlockChallenge()
  - [ ] Wednesday 00:01 — call scoreChallenge() on previous week's challenge
  - [ ] Log all scheduler runs to console with timestamps

**Phase 4 Checkpoint → wait for "proceed"**

---

## ⚫ PHASE 5 — Polish & Deploy
> Goal: Bug-free, deployed on Railway, scheduler confirmed running.

- [ ] Test full submission pipeline end-to-end with real data
- [ ] Confirm unique constraint rejects duplicate submissions with friendly error
- [ ] Confirm answer_key never appears in any API response
- [ ] Fix all unhandled promise rejections
- [ ] Add request logging middleware (morgan)
- [ ] Set NODE_ENV=production in Railway environment variables
- [ ] Deploy to Railway — confirm server boots
- [ ] Confirm node-cron is firing on Railway (check logs)
- [ ] Test deployed backend with frontend

**Phase 5 Checkpoint → ready to launch**

---

## 📝 Update Log
| Session | Update |
|---------|--------|
| Initial — 2026 | All objectives created. Ready to build. |
| 2026-05-12 — Phase 2 checkpoint | Phase 1 and Phase 2 backend implementation confirmed. Auth routes and profile routes are present; frontend session handoff bug fixed and backend auth syntax checks passed. |
