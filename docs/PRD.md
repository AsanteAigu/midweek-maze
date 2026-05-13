# 📋 PRODUCT REQUIREMENTS DOCUMENT (PRD)
## ISAG Quiz Platform — Weekly Engineering Challenges
**Version:** 1.0 MVP
**Date:** 2026
**Status:** In Development

---

## 1. Executive Summary

Engineering students at ISAG need a platform that gamifies learning, encourages friendly competition, and creates a weekly ritual around problem-solving. ISAG Quiz Platform delivers a weekly challenge (quiz, puzzle, or engineering problem), awards XP for correct answers, and shows a public leaderboard of who's winning the semester.

---

## 2. Problem Statement

**Who experiences this:**
Engineering students at ISAG across levels 100–400 in five disciplines: Computer Engineering, Agriculture Engineering, Biomedical Engineering, Material Engineering, and Food Processing.

**What the platform solves:**
- Lack of engaging, low-stakes academic competitions
- No central platform for engineering-focused weekly challenges
- Students have no way to track their academic performance gamification
- No cross-level, cross-discipline visibility of who's excelling

---

## 3. Goals & Success Metrics

### Product Goals
- Every student can register in under 3 minutes
- New challenge unlocks automatically every Wednesday
- Leaderboard updates automatically after scoring
- Top 10 students visible publicly without login

### Success Metrics
- 80%+ of registered students submit at least one challenge per month
- Zero leaderboard errors (XP calculated server-side, never client-side)
- Challenge cycle runs fully automated with no manual admin intervention

---

## 4. User Stories

### Registration & Profile
| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| US-01 | New student | Register with my student ID, name, level, and course | I can join the platform |
| US-02 | New student | Choose a display name and avatar | My identity on the leaderboard is customized |
| US-03 | New student | Opt out of showing my real name | I appear anonymously on the leaderboard |
| US-04 | Returning student | Log in and see my dashboard | I can check my XP and current challenge |
| US-05 | Any student | Edit my avatar seed and display preferences | I can update how I appear |

### Weekly Challenge
| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| US-06 | Logged-in student | See this week's challenge | I know what to solve |
| US-07 | Logged-in student | Submit my answer (once only) | I lock in my attempt |
| US-08 | Logged-in student | See that my answer is submitted | I know it was received |
| US-09 | Logged-in student | See if I was correct after scoring | I learn from the challenge |
| US-10 | Logged-in student | See how much XP I earned | I track my progress |

### Leaderboard
| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| US-11 | Any visitor | See the Top 10 all-time leaderboard | I see who the top performers are |
| US-12 | Any visitor | See the Top 10 for the most recent week | I see who won last week |
| US-13 | Logged-in student | See my rank on the leaderboard | I know where I stand |
| US-14 | Any visitor | Filter leaderboard by course or level | I see rankings within my group |

### Profile & History
| ID | As a... | I want to... | So that... |
|----|---------|-------------|-----------|
| US-15 | Logged-in student | See my full XP history | I track my progress over time |
| US-16 | Logged-in student | See all challenges I submitted | I review my past answers |
| US-17 | Logged-in student | See my rank trend over weeks | I understand my improvement |

---

## 5. Functional Requirements

### FR-01: Student Registration
- Required: student_id (unique), first_name, last_name, email (unique), password, level (100/200/300/400), course (5 options), display_name, avatar_seed
- Optional: show_real_name (default false)
- Student ID must be unique — duplicate registration rejected with friendly error
- Display name must be unique — suggest alternatives if taken

### FR-02: Authentication
- Email + password login via Supabase Auth
- Session persists across page refreshes
- Logout clears session

### FR-03: Weekly Challenge Display
- Show current active challenge (if within opens_at to closes_at window)
- Show challenge title, description, type (quiz/puzzle/problem), week number
- If no active challenge: show "Next challenge drops Wednesday at midnight"
- If student already submitted: show submission confirmation, not the form

### FR-04: Answer Submission
- Single text/select input depending on challenge type
- Submit button disabled after first submission
- POST to /api/submit with answer + challenge_id
- Backend checks: challenge is active, closes_at not passed, no prior submission
- On success: show "Answer submitted ✓ — results on Wednesday"
- One submission per student per challenge — enforced at DB level

### FR-05: Automated Scoring (Scheduler)
- Runs server-side via node-cron
- Wednesday 00:00 — unlock new challenge
- Wednesday 00:01 — score previous challenge, award XP, update totals
- Tuesday 23:59 — mark challenge closed (submissions rejected by timestamp check)
- Scoring: exact match (case-insensitive, trimmed) for full XP
- All XP updates via backend only — clients cannot write to total_xp

### FR-06: Leaderboard
- All-time: ordered by total_xp DESC, paginated (10 per page)
- Weekly: ordered by xp_earned DESC, tie-break by submitted_at ASC
- Filtering: by course, by level
- Top 10 visible without login
- Full leaderboard requires login
- Avatar rendered via DiceBear pixel-art API using avatar_seed
- Privacy: show display_name only if show_real_name = false

### FR-07: Student Profile
- Shows: avatar, display_name, level, course, total_xp, rank
- XP history table: week, challenge title, xp_earned, correct/incorrect
- Settings: edit display_name, avatar_seed, show_real_name toggle
- Cannot edit: student_id, level, course (require admin to change)

### FR-08: Admin Challenge Management
- Admin-only route: POST /api/admin/challenges — create new challenge
- Fields: title, description, challenge_type, week_number, opens_at, closes_at, xp_reward, partial_xp, answer_key, hint
- Admin protected by a separate ADMIN_SECRET env var header check
- No admin UI for MVP — challenges created via API calls or direct Supabase dashboard

---

## 6. Non-Functional Requirements

### NFR-01: Security
- Supabase RLS on all 4 tables
- answer_key never exposed to frontend
- XP updates server-side only
- One submission per student enforced at DB level (unique constraint)
- Rate limiting on submission endpoint (5 req/min)

### NFR-02: Performance
- Leaderboard loads in under 2 seconds
- Challenge page loads in under 1.5 seconds
- Zero blank screens — skeleton loaders everywhere

### NFR-03: Reliability
- Scheduler must handle errors per-student without crashing
- Duplicate submission attempts return friendly error, not server error

### NFR-04: Usability
- Mobile responsive — works on 375px screens
- Accessible: color contrast passes WCAG AA
- All error messages are human-readable

---

## 7. Out of Scope (MVP)

- Push notifications / email notifications for new challenges
- Challenge comments or discussion threads
- Multi-answer quiz format (MVP is single text answer)
- Admin frontend UI (use Supabase dashboard + API calls)
- Teams or group submissions
- Badges / achievements beyond XP
- Social sharing
- Dark mode

---

## 8. User Flow Diagram

```
LANDING PAGE (public leaderboard preview)
     │
     ▼
REGISTER
(ID + Name + Level + Course + Avatar + Display prefs)
     │
     ▼
EMAIL VERIFICATION (Supabase handles)
     │
     ▼
DASHBOARD
(Current challenge + My XP + Leaderboard preview)
     │
  [See Challenge]
     │
     ▼
CHALLENGE PAGE
(Description + Answer input)
     │
  [Submit]
     │
     ▼
SUBMISSION CONFIRMED
("Results on Wednesday")
     │
  [Wednesday arrives]
     │
     ▼
LEADERBOARD UPDATES
(XP awarded, ranks shift)
```

---

## 9. Screens Summary

| Screen | Route | Auth Required | Purpose |
|--------|-------|--------------|---------| 
| Landing | / | No | Hero + public Top 10 leaderboard |
| Register | /register | No | Student signup |
| Login | /login | No | Return student login |
| Dashboard | /dashboard | Yes | XP, current challenge, leaderboard preview |
| Challenge | /challenge | Yes | View + submit current challenge |
| Leaderboard | /leaderboard | No (Top 10) / Yes (full) | All-time + weekly rankings |
| Profile | /profile | Yes | Student profile + XP history |
| Profile (other) | /profile/:displayName | No | Public view of any student's profile |

---

## 10. Technical Dependencies

| Dependency | Version | Purpose |
|-----------|---------|---------| 
| react | ^18.0.0 | Frontend framework |
| vite | ^5.0.0 | Frontend build tool |
| tailwindcss | ^3.0.0 | Styling |
| framer-motion | ^11.0.0 | Animations |
| react-router-dom | ^6.0.0 | Routing |
| @tanstack/react-query | ^5.0.0 | Data fetching |
| axios | ^1.0.0 | HTTP client |
| @supabase/supabase-js | ^2.0.0 | Database + Auth |
| express | ^4.18.0 | Backend framework |
| node-cron | ^3.0.0 | Weekly scheduler |
| helmet | ^7.0.0 | Security headers |
| express-rate-limit | ^7.0.0 | Rate limiting |
| express-validator | ^7.0.0 | Input validation |
| cors | ^2.8.0 | CORS handling |
| dotenv | ^16.0.0 | Environment variables |

---

*PRD v1.0 — ISAG Quiz Platform — 2026*
