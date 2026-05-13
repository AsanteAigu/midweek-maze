# 💡 SUGGESTIONS & OBSERVATIONS — ISAG Quiz Platform
> Log ideas and concerns here. NEVER act without developer approval.
> NEVER remove entries. Only append and update status.

---

## Format
```
### [Session] — [Idea | Concern | Warning | Observation]
Triggered By: What caused this
Suggestion: What to consider
Priority: Low | Medium | High | Critical
Status: Pending | Accepted | Rejected | Deferred
```

---

## Entries

### [Initial] — ⚠️ Warning — Critical
**Triggered By:** Challenge scoring design
**Suggestion:** The answer_key field in the challenges table must NEVER be returned in any API response to the frontend. Enforce this at the controller level — always explicitly select columns in Supabase queries and exclude answer_key. A SELECT * is a security breach for challenges.
**Priority:** Critical
**Status:** Pending

---

### [Initial] — ⚠️ Warning — Critical
**Triggered By:** XP integrity
**Suggestion:** Students must never be able to update their own total_xp column. The Supabase RLS policy on students should only allow users to update their display preferences (display_name, avatar_seed, show_real_name) — not total_xp. Consider using a separate service role for the scheduler that bypasses RLS to write XP.
**Priority:** Critical
**Status:** Pending

---

### [Initial] — ⚠️ Warning — High
**Triggered By:** One-submission rule
**Suggestion:** The unique constraint on submissions(student_id, challenge_id) is the final safety net, but the backend should also check for existing submissions before inserting. Return a clear 409 Conflict with a message like "You've already submitted an answer for this challenge." Never silently overwrite.
**Priority:** High
**Status:** Pending

---

### [Initial] — 💡 Idea — High
**Triggered By:** Leaderboard privacy
**Suggestion:** When show_real_name = false, the backend should never return first_name or last_name in ANY leaderboard or profile endpoint — even if the client doesn't display it. Strip these fields server-side, not client-side. A motivated student could inspect network responses.
**Priority:** High
**Status:** Pending

---

### [Initial] — 💡 Idea — Medium
**Triggered By:** Avatar system
**Suggestion:** DiceBear's pixel-art style is perfect for this. Allow students to change their avatar_seed at any time in profile settings. Show a live preview as they type or randomize. The seed is just a string — any string produces a consistent avatar. Consider adding a "Random" button that generates a UUID as the seed.
**Priority:** Medium
**Status:** Pending

---

### [Initial] — 💡 Idea — Medium
**Triggered By:** Challenge types
**Suggestion:** For MVP, treat all challenge types (quiz, puzzle, problem) the same way — a single text answer compared to answer_key. In a future version, quiz could be multiple-choice (store options as JSON), and puzzle could require a specific numeric answer. Design the schema to accommodate this without breaking changes.
**Priority:** Medium
**Status:** Pending

---

### [Initial] — 📊 Observation — Medium
**Triggered By:** Leaderboard filtering
**Suggestion:** The course and level filters on the leaderboard could create small groups (e.g. "Level 100 Computer Engineering" might be 10 students). Consider showing the group size alongside the filter label so students know how many they're competing against in their cohort.
**Priority:** Medium
**Status:** Pending

---

### [Initial] — 💡 Idea — Low
**Triggered By:** Student engagement
**Suggestion:** After the first few weeks, add a "streak" feature — students who submit every week in a row get a streak badge. Store streak_count in the students table. Award bonus XP for streaks (e.g. 5-week streak = +25 bonus XP). This requires adding streak logic to the scorer.
**Priority:** Low
**Status:** Pending

---

### [Initial] — 💡 Idea — Low
**Triggered By:** Admin workflow
**Suggestion:** For MVP, challenges are created via POST /api/admin/challenges with the ADMIN_SECRET header. In a future version, build a simple admin dashboard (protected by admin role in Supabase) where challenges can be created and scheduled via a form. For now, document the API request format clearly so any team member can create challenges via curl or Postman.
**Priority:** Low
**Status:** Pending

---

### [2026-05-12] — ⚠️ Design Deviation — High
**Triggered By:** Developer explicitly requested "Duolingo style" with characters and bright colors
**Suggestion:** STYLE_GUIDE.md specifies a dark sci-fi theme (#0D0F14 background, teal accents). Developer's explicit instruction overrides this. Adopting Duolingo-inspired bright design: white backgrounds, green primary (#58CC02), yellow/blue accents, rounded fun UI, DiceBear adventurer avatars.
**Priority:** High
**Status:** Accepted — developer explicitly requested this

---

### [2026-05-12] — 💡 New Feature — Medium
**Triggered By:** Developer requested admin ability to upload reader.mp4 files
**Suggestion:** This is not in the original PRD. Interpreting as: challenges can have an attached video (stored in Supabase Storage). Admin uploads the .mp4 when creating a challenge. Students see a video player on the challenge page before answering. Adding video_url column to challenges table and Supabase Storage bucket "challenge-videos".
**Priority:** Medium
**Status:** Accepted — developer requested this

---

*(Claude appends new entries below)*

### [2026-05-12] — 🎨 Design Update — High
**Triggered By:** Developer requested blue labels and an engineering-student mascot instead of the owl/green look.
**Suggestion:** Keep the playful bright UI direction, but switch the primary token to engineering blue and replace the landing mascot with a cap-wearing engineering student visual.
**Priority:** High
**Status:** Accepted — developer requested this directly
