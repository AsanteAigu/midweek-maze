# Midweek Maze
### "Every Wednesday. Every week. Who's on top?"

A weekly challenge platform for engineering students of ISAG — featuring puzzles, quizzes, XP rankings, custom avatars, and leaderboards. Every Wednesday a new challenge drops. Submit once. Climb the board.

---

## 🚀 Quick Start

### 1. Fill in environment variables
```bash
# isag-frontend/.env — fill in Supabase values
# isag-backend/.env  — fill in ALL values (Supabase, Anthropic)
```

### 2. Install dependencies
```bash
cd isag-frontend && npm install
cd ../isag-backend && npm install
```

### 3. Start development servers
```bash
# Terminal 1
cd isag-frontend && npm run dev

# Terminal 2
cd isag-backend && npm run dev
```

### 4. Open Claude Code and paste MASTER_PROMPT from docs/MASTER_PROMPT.md

---

## 📁 Project Structure
```
isag-quiz/
├── CLAUDE.md                          ← Claude Code reads this every session
├── docs/
│   ├── MASTER_CONTEXT.md              ← Full architecture (READ ONLY)
│   ├── PRD.md                         ← Product Requirements Document
│   └── MASTER_PROMPT.md               ← Claude Code kickstart prompt
├── logs/
│   ├── BUILD_LOG.md                   ← Running build log
│   └── SUGGESTIONS.md                 ← Ideas and concerns
├── inspirations/
│   └── README.md                      ← UI inspiration sources
├── isag-frontend/                     ← React + Vite
│   ├── docs/
│   │   ├── STYLE_GUIDE.md             ← Design system
│   │   └── OBJECTIVES.md              ← Frontend build checklist
│   ├── src/
│   │   ├── animations/                ← Framer Motion presets
│   │   ├── components/                ← UI components
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── quiz/
│   │   │   ├── leaderboard/
│   │   │   ├── profile/
│   │   │   └── shared/
│   │   ├── hooks/                     ← Custom React hooks
│   │   ├── pages/                     ← Page components
│   │   ├── styles/                    ← Global styles
│   │   └── utils/                     ← Helper functions
│   ├── .env                           ← Frontend env vars (gitignored)
│   └── .gitignore
└── isag-backend/                      ← Node.js + Express
    ├── docs/
    │   └── OBJECTIVES.md              ← Backend build checklist
    ├── src/
    │   ├── config/                    ← Supabase, Anthropic clients
    │   ├── controllers/               ← Route handlers
    │   ├── middleware/                ← Auth, validation, rate limiting
    │   ├── routes/                    ← Express routes
    │   ├── services/                  ← Quiz, XP, Leaderboard, Scheduler services
    │   └── utils/                     ← Helpers
    ├── .env                           ← Backend env vars (gitignored)
    └── .gitignore
```

---

## 🛠️ Tech Stack
- **Frontend:** React 18 + Vite, Tailwind CSS, Framer Motion
- **Backend:** Node.js + Express, node-cron
- **Database:** Supabase (PostgreSQL + RLS)
- **Auth:** Supabase Auth
- **Avatars:** DiceBear Avatars API (bit/pixel style)
- **Hosting:** Vercel (frontend) + Railway (backend)

---

## 📅 Weekly Challenge Cycle
1. **Wednesday 00:00** — New challenge unlocks (quiz or puzzle)
2. **Students have 7 days** — One submission only, per student
3. **Tuesday 23:59** — Submission window closes
4. **Wednesday 00:01** — Leaderboard updates with XP, winners announced
5. **Top 10 displayed** on public leaderboard with XP earned

---

## ⚠️ Before You Launch
1. Configure Supabase tables and RLS policies
2. Set up weekly challenge cron job in backend
3. Test one full challenge cycle end-to-end
4. Add at least one active challenge to the database

---

*Built for ISAG Engineering Students — 2026*
