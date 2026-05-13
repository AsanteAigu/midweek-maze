# ISAG Quiz Platform — Claude Code Configuration

## What This Project Is
ISAG Quiz Platform is a weekly engineering challenge system for students of ISAG. Every Wednesday a new quiz or puzzle drops. Students register with their student ID, name, level (100–400), and engineering course. They get one submission per challenge. XP is awarded on Tuesday night when the window closes. A public leaderboard shows the Top 10 weekly and all-time rankings. Students can opt into or out of displaying their real name, and can design a custom bit/pixel avatar.

## Project Structure
```
isag-quiz/                          ← project root (you are here)
├── CLAUDE.md                       ← this file — read every session
├── docs/                           ← root-level markdown docs
│   ├── MASTER_CONTEXT.md           ← READ ONLY project bible
│   ├── PRD.md                      ← Product Requirements Document
│   └── MASTER_PROMPT.md            ← kickstart prompt reference
├── logs/                           ← running logs updated during build
│   ├── BUILD_LOG.md
│   └── SUGGESTIONS.md
├── inspirations/                   ← UI inspiration images
├── isag-frontend/                  ← React + Vite app
│   └── docs/
│       ├── STYLE_GUIDE.md          ← design system — follow exactly
│       └── OBJECTIVES.md           ← frontend build checklist
└── isag-backend/                   ← Node.js + Express app
    └── docs/
        └── OBJECTIVES.md           ← backend build checklist
```

## Tech Stack
- **Frontend:** React 18 + Vite, Tailwind CSS, Framer Motion, React Router v6, TanStack Query, Axios
- **Backend:** Node.js + Express, node-cron scheduler
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Auth:** Supabase Auth (email/password)
- **Avatars:** DiceBear Avatars API (pixel-art style)
- **Deployment:** Vercel (frontend), Railway (backend)

## Read These Files First — In This Order
1. `docs/MASTER_CONTEXT.md` — full architecture, data models, XP logic, challenge cycle
2. `docs/PRD.md` — product requirements and user stories
3. `isag-frontend/docs/STYLE_GUIDE.md` — every design decision
4. `isag-frontend/docs/OBJECTIVES.md` — frontend build checklist
5. `isag-backend/docs/OBJECTIVES.md` — backend build checklist
6. `logs/BUILD_LOG.md` — what has been done so far
7. `logs/SUGGESTIONS.md` — pending ideas and concerns

## Hard Rules — Non-Negotiable
- `.env` is gitignored — verify this BEFORE writing any other code
- Supabase RLS enabled on ALL tables
- One submission per student per challenge — enforced at DB level (unique constraint)
- Student ID must be validated on registration — no duplicates
- All user input validated via express-validator before processing
- One React component per file
- Tailwind classes only — zero inline styles
- All animations via Framer Motion
- Mobile-first layouts always
- node-cron scheduler runs in backend only
- Leaderboard updates happen server-side only — never trust client XP

## Behavior Rules
- Read ALL files listed above before writing any code
- Explain what you are about to do BEFORE doing it
- Summarize what you did AFTER completing it
- Ask ONE specific question if unclear — never assume
- Log ideas to logs/SUGGESTIONS.md — never act on them without approval
- After each phase: deliver checkpoint report and wait for "proceed"

## What Claude Gets Wrong — Watch For These
- Allowing multiple submissions per student per challenge
- Updating XP on the client side
- Showing real names without checking the student's display_name preference
- Skipping skeleton loaders (blank screens are never acceptable)
- Using inline styles instead of Tailwind
- Starting Phase 2 before Phase 1 is fully complete
- Hardcoding any API key, secret, or credential
