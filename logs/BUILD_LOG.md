# 📋 BUILD LOG — ISAG Quiz Platform
> Append EVERY significant action here. NEVER remove entries.
> Log errors IMMEDIATELY when they occur — before fixing them.

---

## Log Format
```
### [Phase X — Task] — [Started | Completed | Blocked]
Action: What was done
Files Changed: Every file touched
Result: Success / failure / partial
Errors: Exact error messages (copy-paste)
Time: How long it took
Notes: Anything important
```

---

## ⚠️ Error Registry
| # | Phase | Error | File | Status | Fix |
|---|-------|-------|------|--------|-----|
| — | — | None yet | — | — | — |

## ⏱️ Performance Tracker
| # | Task | Expected | Actual | Cause |
|---|------|---------|--------|-------|
| — | — | — | — | — |

## 🔄 Architecture Changes
| # | Change | Why | Approved | Impact |
|---|--------|-----|---------|--------|
| — | None yet | — | — | — |

---

## 📌 Session Log

### [Initial Planning — 2026] — Setup
**Action:** Full project planning, architecture, and documentation session
**Files Changed:** All markdown files created, full project structure scaffolded
**Result:** Ready to build
**Errors:** None
**Notes:** Platform for ISAG engineering students. Weekly quiz/puzzle/problem every Wednesday. One submission per student per challenge. XP-based leaderboard. Pixel-art DiceBear avatars. 5 engineering courses, 4 levels (100/200/300/400). Supabase backend. Node.js + Express + node-cron. React + Vite frontend. Dark teal design system.

---
### [Phase 1 — Full Build — 2026-05-12] — Completed
**Action:** Built complete frontend + backend from scratch
**Files Changed:**
- esug_backend/package.json
- esug_backend/server.js
- esug_backend/src/config/supabase.js
- esug_backend/src/config/scheduler.js
- esug_backend/src/middleware/auth.js, validate.js, rateLimiter.js, adminAuth.js
- esug_backend/src/utils/scoring.js
- esug_backend/src/routes/auth.js, challenges.js, submissions.js, leaderboard.js, profile.js, admin.js
- esug_backend/src/controllers/authController.js, challengeController.js, submissionController.js, leaderboardController.js, profileController.js, adminController.js
- esug_backend/src/services/schedulerService.js
- esug_frontend/package.json, vite.config.js, postcss.config.js, tailwind.config.js, index.html
- esug_frontend/src/index.css, main.jsx, App.jsx
- esug_frontend/src/context/AuthContext.jsx
- esug_frontend/src/utils/supabaseClient.js, axiosClient.js, avatar.js
- esug_frontend/src/animations/presets.js
- esug_frontend/src/components/Navbar.jsx, ProtectedRoute.jsx, SkeletonLoader.jsx, AvatarPicker.jsx, XpBadge.jsx, PageWrapper.jsx
- esug_frontend/src/pages/Landing.jsx, Register.jsx, Login.jsx, Dashboard.jsx, Challenge.jsx, Leaderboard.jsx, Profile.jsx, PublicProfile.jsx, Admin.jsx
**Result:** Complete build — ready for npm install + Supabase configuration
**Errors:** None — design deviated from STYLE_GUIDE.md dark theme to Duolingo bright theme per developer explicit instruction (logged in SUGGESTIONS.md)
**Notes:**
- Design: Duolingo-inspired (white background, Nunito font, green #58CC02 primary, rounded fun UI)
- Admin: full dashboard at /admin — password-protected with ADMIN_SECRET
- Video upload: admin uploads reader.mp4 per challenge → stored in Supabase Storage bucket "challenge-videos"
- Avatars: DiceBear adventurer style with live seed preview + style picker
- Scheduler: node-cron fires Wed 00:00 (unlock), Wed 00:01 (score), Tue 23:59 (log close)
- Security: .env verified in .gitignore for both frontend and backend ✓
- One submission per challenge: enforced at both controller and DB unique constraint level
- answer_key: never returned to frontend in any challenge endpoint
- XP updates: backend scheduler only, never client-side

*(Claude appends new entries below)*

### [Phase 2 — Auth/Login Fix + Blue Engineer Branding — Completed]
**Action:** Read required project markdown/logs, verified `.env` is gitignored, fixed frontend login/register session handoff, changed the primary visual theme from green to blue, replaced the owl landing mascot with an engineering student wearing an academic cap, and synchronized Phase 1/2 objective checkboxes with the implemented codebase.
**Files Changed:**
- esug_frontend/src/context/AuthContext.jsx
- esug_frontend/src/pages/Login.jsx
- esug_frontend/src/pages/Register.jsx
- esug_frontend/src/pages/Landing.jsx
- esug_frontend/src/pages/Dashboard.jsx
- esug_frontend/src/main.jsx
- esug_frontend/src/components/Icons.jsx
- esug_frontend/tailwind.config.js
- esug_frontend/docs/OBJECTIVES.md
- esug_backend/docs/OBJECTIVES.md
- logs/BUILD_LOG.md
- logs/SUGGESTIONS.md
**Result:** Success
**Errors:** Initial `npm run build` failed in the sandbox with `Error: spawn EPERM` while Vite/esbuild loaded config. Re-ran with approved elevated command and build succeeded.
**Time:** 2026-05-12
**Notes:** Login failure was caused by ignoring the backend-returned Supabase session; frontend now calls `supabase.auth.setSession()` before loading `/api/auth/me`.

### [Phase 2 — Custom Name Login — Completed]
**Action:** Changed login from email/password to custom display name/password while keeping Supabase email authentication behind the backend.
**Files Changed:**
- esug_frontend/src/pages/Login.jsx
- esug_backend/src/routes/auth.js
- esug_backend/src/controllers/authController.js
- logs/BUILD_LOG.md
**Result:** Success
**Errors:** None
**Time:** 2026-05-12
**Notes:** The login form now sends `display_name`; the backend looks up the matching student email and returns the same Supabase session shape for the frontend.

### [Phase 2 — Remove Remaining Green UI Classes — Completed]
**Action:** Replaced all remaining `duo-green` Tailwind classes with explicit `duo-blue` classes across the frontend, updated the primary button component styles, changed the favicon from green/owl to blue/academic cap, rebuilt the frontend, and restarted the Vite dev server.
**Files Changed:**
- esug_frontend/src/index.css
- esug_frontend/src/components/AvatarPicker.jsx
- esug_frontend/src/components/Navbar.jsx
- esug_frontend/src/components/Icons.jsx
- esug_frontend/src/pages/Admin.jsx
- esug_frontend/src/pages/Dashboard.jsx
- esug_frontend/src/pages/Challenge.jsx
- esug_frontend/src/pages/Login.jsx
- esug_frontend/src/pages/Leaderboard.jsx
- esug_frontend/src/pages/Profile.jsx
- esug_frontend/src/pages/Landing.jsx
- esug_frontend/src/pages/Register.jsx
- esug_frontend/public/favicon.svg
- logs/BUILD_LOG.md
**Result:** Success
**Errors:** Browser-level Playwright verification could not run because the local Node REPL environment does not have `playwright` installed. Verified instead by grepping source/built files and the running Vite-served CSS/JS.
**Time:** 2026-05-12
**Notes:** `rg` now finds no `duo-green`, old green hex values, `bg-green-50`, or owl favicon in frontend source/public/build output.

### [Branding — Rename Site — Completed]
**Action:** Renamed the visible site branding to Midweek Maze.
**Files Changed:**
- esug_frontend/index.html
- esug_frontend/src/components/Navbar.jsx
- esug_frontend/src/pages/Register.jsx
- esug_frontend/src/pages/Admin.jsx
- esug_backend/package.json
- README.md
- logs/BUILD_LOG.md
**Result:** Success
**Errors:** None
**Time:** 2026-05-12
**Notes:** Kept ISAG/engineering references where they describe the audience rather than the app name.

### [Phase 2 — Registration Rate Limit Fix — Completed]
**Action:** Reproduced registration failure and traced it to Supabase Auth public signup returning `email rate limit exceeded`. Switched backend registration to server-side `supabase.auth.admin.createUser({ email_confirm: true })`, then signs in with password to return a session.
**Files Changed:**
- esug_backend/src/controllers/authController.js
- logs/BUILD_LOG.md
**Result:** Success
**Errors:** Supabase Auth returned `over_email_send_rate_limit` / `email rate limit exceeded` during public `signUp`.
**Time:** 2026-05-12
**Notes:** No SQL change required. Registration now avoids Supabase confirmation-email rate limits.

### [Architecture — Split Student/Admin Frontends — Completed]
**Action:** Split the React frontend into two Vite modes: student mode on port 5173 and admin mode on port 5174. Student mode redirects `/admin` away; admin mode serves only the admin dashboard at `/`. Removed the student navbar from the admin app and updated backend CORS to allow both local frontend origins.
**Files Changed:**
- esug_frontend/src/App.jsx
- esug_frontend/src/pages/Admin.jsx
- esug_frontend/package.json
- esug_frontend/vite.config.js
- esug_backend/server.js
- logs/BUILD_LOG.md
**Result:** Success
**Errors:** None
**Time:** 2026-05-12
**Notes:** Use `npm run dev:student` for `http://127.0.0.1:5173/` and `npm run dev:admin` for `http://127.0.0.1:5174/`.

### [Phase 2 — Challenge Creation Formats — In Progress]
**Action:** Updated admin challenge creation to support typed-answer alternatives and multiple-choice answer options, converted admin date inputs to ISO before API submission, improved admin secret placeholder handling, added student-side multiple-choice answer buttons, and added backend validation/scoring support for answer alternatives.
**Files Changed:**
- esug_frontend/src/pages/Admin.jsx
- esug_frontend/src/pages/Challenge.jsx
- esug_backend/src/routes/admin.js
- esug_backend/src/controllers/adminController.js
- esug_backend/src/controllers/challengeController.js
- esug_backend/src/controllers/submissionController.js
- esug_backend/src/services/schedulerService.js
- esug_backend/src/utils/scoring.js
- docs/SUPABASE_SETUP.sql
- docs/PHASE_2_CHALLENGE_FORMAT_MIGRATION.sql
- logs/BUILD_LOG.md
**Result:** Code complete. Typed challenge creation works before the migration; multiple-choice challenges require the Supabase migration.
**Errors:** Live Supabase returned `column challenges.answer_mode does not exist`; multiple-choice admin API now returns a clear migration message instead of a generic failure.
**Time:** 2026-05-12
**Notes:** Run `docs/PHASE_2_CHALLENGE_FORMAT_MIGRATION.sql` in Supabase SQL Editor before creating multiple-choice challenges. Temporary API test challenges were deleted after verification.

---
### [Phase 3 — Multi-Type Questions + Difficulty Tiers — Completed]
**Action:** Added 8 question types (text, multiple_choice, true_false, fill_blank, ordering, image_mcq, image_guess, image_only_mcq) and 4 difficulty tiers (beginner/intermediate/advanced/general) to challenge creation. Each challenge can now hold multiple sub-questions, each with independent XP, type, image, and answer key. Students see all questions rendered with the correct UI per type. Scoring and the scheduler updated to handle JSON answer maps.
**Files Changed:**
- docs/PHASE_3_QUESTION_TYPES_MIGRATION.sql (NEW)
- esug_backend/src/utils/scoring.js
- esug_backend/src/controllers/adminController.js
- esug_backend/src/routes/admin.js
- esug_backend/src/controllers/challengeController.js
- esug_backend/src/controllers/submissionController.js
- esug_backend/src/services/schedulerService.js
- esug_admin_frontend/src/components/QuestionBuilder.jsx (NEW)
- esug_admin_frontend/src/pages/Admin.jsx
- esug_students_frontend/src/pages/Challenge.jsx
**Result:** Code complete. Requires `docs/PHASE_3_QUESTION_TYPES_MIGRATION.sql` run in Supabase before creating multi-question challenges.
**Errors:** None during implementation
**Time:** 2026-05-13
**Notes:**
- Backward compat: old single-answer challenges still work unchanged
- answer_key is NEVER returned to students in any endpoint
- Ordering type: answer stored as items joined by |||; students use chevron buttons to reorder
- image_only_mcq: options contain labels; images uploaded per-question via POST /api/admin/questions/:id/image
- question-images Supabase Storage bucket must be created (see migration SQL comment)
