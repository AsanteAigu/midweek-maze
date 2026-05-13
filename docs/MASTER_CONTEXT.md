# 🧠 MASTER CONTEXT — ISAG Quiz Platform
> **READ ONLY** — Never modify this file.
> Read fully at the start of every session before writing any code.

---

## 📌 Project Identity

| Field | Value |
|-------|-------|
| **App Name** | ESUG Quiz Platform |
| **Tagline** | "Every Wednesday. Every week. Who's on top?" |
| **Type** | Weekly Engineering Challenge & XP Leaderboard |
| **Target Users** | Engineering students of ISAG (levels 100–400) |
| **Core Value Prop** | One challenge per week. One submission per student. XP earned. Leaderboard bragging rights. |

---

## 🎯 What the Platform Does

1. Student registers with: Student ID, First Name, Last Name, Level (100/200/300/400), Engineering Course
2. Student sets display preferences: show real name or anonymous, custom pixel avatar
3. Every Wednesday at 00:00 — a new challenge unlocks (quiz, puzzle, or problem)
4. Student has 7 days to solve it — **one submission only**, no edits after submit
5. Tuesday 23:59 — submission window closes
6. Wednesday 00:01 — XP is awarded, leaderboard updates, new challenge goes live
7. Top 10 leaderboard (weekly + all-time) visible to all students
8. Students can view their own XP history and rank at any time

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite | Fast component-based UI |
| Styling | Tailwind CSS | Utility-first styling |
| Animations | Framer Motion | Smooth professional animations |
| Routing | React Router v6 | Client-side navigation |
| Data Fetching | TanStack Query | Server state management + caching |
| HTTP Client | Axios | API calls frontend → backend |
| Backend | Node.js + Express | REST API + scheduler host |
| Scheduler | node-cron | Weekly challenge cycle automation |
| Validation | express-validator | Sanitize all user inputs |
| Rate Limiting | express-rate-limit | Protect API routes |
| Security Headers | helmet.js | HTTP security headers |
| Database | Supabase (PostgreSQL) | Data storage + RLS |
| Auth | Supabase Auth | Email/password login |
| Avatars | DiceBear Avatars API | Pixel-art bit avatar generation |
| Frontend Host | Vercel | Free tier, instant deploys |
| Backend Host | Railway | Free tier, always-on Node.js |

---

## 🗃️ Database Architecture (Supabase)

### Table 1: `students`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Auto |
| student_id | text | NOT NULL, UNIQUE | e.g. "ISAG/CE/100/001" |
| first_name | text | NOT NULL | |
| last_name | text | NOT NULL | |
| email | text | NOT NULL, UNIQUE | Login email |
| level | integer | NOT NULL, CHECK (level IN (100,200,300,400)) | Year level |
| course | text | NOT NULL, CHECK (course IN ('computer_engineering','agriculture_engineering','biomedical_engineering','material_engineering','food_processing')) | |
| display_name | text | NOT NULL | What shows on leaderboard — can be alias or real name |
| show_real_name | boolean | DEFAULT false | If false, only display_name shows publicly |
| avatar_seed | text | NOT NULL | DiceBear seed string for pixel avatar |
| total_xp | integer | DEFAULT 0 | All-time XP total |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### Table 2: `challenges`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Auto |
| title | text | NOT NULL | e.g. "Week 7: Binary Tree Puzzle" |
| description | text | NOT NULL | Full challenge description (markdown supported) |
| challenge_type | text | NOT NULL, CHECK (type IN ('quiz','puzzle','problem')) | |
| week_number | integer | NOT NULL | e.g. 7 |
| opens_at | timestamptz | NOT NULL | Wednesday 00:00 |
| closes_at | timestamptz | NOT NULL | Following Tuesday 23:59 |
| xp_reward | integer | NOT NULL, DEFAULT 100 | XP for correct answer |
| partial_xp | integer | DEFAULT 50 | XP for partial credit (optional) |
| answer_key | text | NOT NULL | Correct answer (stored server-side only) |
| hint | text | | Optional hint |
| is_active | boolean | DEFAULT false | Scheduler flips this |
| is_scored | boolean | DEFAULT false | Scheduler flips this after scoring |
| created_at | timestamptz | DEFAULT now() | |

### Table 3: `submissions`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Auto |
| student_id | uuid | FK → students.id, ON DELETE CASCADE | |
| challenge_id | uuid | FK → challenges.id, ON DELETE CASCADE | |
| answer | text | NOT NULL | Student's submitted answer |
| is_correct | boolean | | Null until scored |
| xp_earned | integer | DEFAULT 0 | 0 until scored |
| submitted_at | timestamptz | DEFAULT now() | |
| UNIQUE | (student_id, challenge_id) | | One submission per student per challenge |

### Table 4: `xp_history`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Auto |
| student_id | uuid | FK → students.id, ON DELETE CASCADE | |
| challenge_id | uuid | FK → challenges.id | |
| xp_earned | integer | NOT NULL | |
| reason | text | NOT NULL | e.g. "Correct answer — Week 7" |
| awarded_at | timestamptz | DEFAULT now() | |

### Row Level Security Policies
```sql
-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;

-- Students can read their own profile, update display preferences
CREATE POLICY "students_own_profile" ON students
  FOR ALL USING (auth.uid() = id);

-- Challenges are readable by all authenticated users
CREATE POLICY "challenges_public_read" ON challenges
  FOR SELECT USING (auth.role() = 'authenticated');

-- Students own their submissions (read only after submit)
CREATE POLICY "students_own_submissions" ON submissions
  FOR ALL USING (auth.uid() = student_id);

-- Students can read their own XP history
CREATE POLICY "students_own_xp" ON xp_history
  FOR SELECT USING (auth.uid() = student_id);
```

### Database Indexes
```sql
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_total_xp ON students(total_xp DESC);
CREATE INDEX idx_students_course ON students(course);
CREATE INDEX idx_students_level ON students(level);
CREATE INDEX idx_challenges_week ON challenges(week_number);
CREATE INDEX idx_challenges_active ON challenges(is_active) WHERE is_active = true;
CREATE INDEX idx_challenges_opens_at ON challenges(opens_at DESC);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_challenge ON submissions(challenge_id);
CREATE INDEX idx_xp_history_student ON xp_history(student_id);
CREATE INDEX idx_xp_history_awarded_at ON xp_history(awarded_at DESC);
```

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────┐
│           STUDENT BROWSER               │
│   React + Tailwind + Framer Motion      │
│   Avatar rendered via DiceBear API      │
└──────────────┬──────────────────────────┘
               │ HTTPS REST API
               ▼
┌─────────────────────────────────────────┐
│        EXPRESS BACKEND (Railway)         │
│  helmet → cors → rate-limit → validate  │
│  Routes → Controllers → Services        │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     node-cron SCHEDULER         │   │
│  │  Wednesday 00:00 — unlock new   │   │
│  │  Tuesday 23:59 — close window   │   │
│  │  Wednesday 00:01 — score + XP   │   │
│  └─────────────────────────────────┘   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌──────────┐
│ SUPABASE │
│ Database │
│ Auth     │
│ RLS      │
└──────────┘
```

---

## ⚙️ Weekly Cycle — Scheduler Logic

```
node-cron runs 3 times per week:

JOB 1 — Wednesday 00:00 ("unlock")
  1. Find the next challenge (is_active = false, opens_at <= now)
  2. Set is_active = true
  3. Notify students (future feature — in-app notification)

JOB 2 — Wednesday 00:01 ("score previous week")
  1. Find last week's challenge (is_active = false, is_scored = false, closes_at < now)
  2. For each submission on that challenge:
     a. Compare answer to answer_key (case-insensitive, trimmed)
     b. Set is_correct = true/false
     c. Set xp_earned = xp_reward (if correct) or partial_xp (if partial) or 0
     d. Insert row into xp_history
     e. Update students.total_xp += xp_earned
  3. Set challenge.is_scored = true
  4. Rank students by XP for leaderboard

JOB 3 — Tuesday 23:59 ("close")
  1. Find current active challenge
  2. No new submissions accepted after this point (enforced by closes_at timestamp check)
```

---

## 🎨 Avatar System

Students use DiceBear pixel-art avatars. Each student has an `avatar_seed` string stored in their profile. The frontend renders avatars as:

```
https://api.dicebear.com/7.x/pixel-art/svg?seed={avatar_seed}&size=64
```

Students can change their `avatar_seed` at any time in their profile settings. Seed is any string — we generate a random one on registration and let the student change it. Show a live preview when editing.

---

## 🏆 Leaderboard Logic

### All-Time Leaderboard
- Ordered by `students.total_xp DESC`
- Show: rank, avatar, display_name (or alias if show_real_name=false), level, course, total_xp
- Always public — visible without login for Top 10

### Weekly Leaderboard  
- For the most recently scored challenge
- Ordered by `submissions.xp_earned DESC`, tie-broken by `submitted_at ASC` (earlier = better rank)
- Show: rank, avatar, display_name, xp_earned, submitted_at

### Privacy Rules
- If `show_real_name = false`: show `display_name` only — never first_name/last_name
- If `show_real_name = true`: show full name alongside display_name

---

## 📝 Registration Fields

| Field | Type | Validation |
|-------|------|-----------|
| Student ID | text | Required, unique, format: alphanumeric |
| First Name | text | Required, 2–50 chars |
| Last Name | text | Required, 2–50 chars |
| Email | email | Required, valid email, unique |
| Password | password | Required, min 8 chars |
| Level | select | 100, 200, 300, or 400 |
| Course | select | computer_engineering, agriculture_engineering, biomedical_engineering, material_engineering, food_processing |
| Display Name | text | Required, shown on leaderboard, 2–30 chars |
| Show Real Name | boolean | Default: false |
| Avatar Seed | text | Auto-generated, editable |

---

## 🧩 Software Engineering Principles

### Clean Architecture Layers
```
Frontend:
  Pages → Components → Hooks → Utils → API calls

Backend:
  Routes → Controllers → Services → Utils
  (Routes handle HTTP, Controllers handle logic, Services handle DB/external)
```

### Error Handling
```
Frontend: axios interceptors → toast notifications → never show raw errors
Backend:  try/catch in all controllers → global error handler middleware
          → structured JSON error responses {error, message, code}
Scheduler: per-challenge try/catch → log failure → continue
           → never let one scoring failure crash the entire job
```

---

## 🔐 Security

- Supabase RLS on all 4 tables
- answer_key never sent to frontend — scoring is backend only
- Students cannot update their own XP directly — only scheduler can
- One submission per student per challenge — unique constraint at DB level
- express-validator on all POST/PATCH routes
- Rate limiting: 5 req/min on /api/submit
- JWT verified on all protected routes
- CORS: FRONTEND_URL only

---

## 🎓 Course Display Names

| DB Value | Display Label |
|---------|--------------|
| computer_engineering | Computer Engineering |
| agriculture_engineering | Agriculture Engineering |
| biomedical_engineering | Biomedical Engineering |
| material_engineering | Material Engineering |
| food_processing | Food Processing Engineering |

---

*MASTER CONTEXT v1.0 — ISAG Quiz Platform — 2026*
