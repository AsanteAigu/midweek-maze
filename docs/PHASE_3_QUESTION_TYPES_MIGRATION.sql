-- Phase 3: Multi-type, multi-difficulty sub-questions per challenge.
-- Run ONCE in the Supabase SQL Editor for your active project.
-- Safe to run: all statements use IF NOT EXISTS / IF NOT EXISTS guards.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Flag on challenges table — marks challenges that use the new question model
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS has_questions boolean NOT NULL DEFAULT false;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. challenge_questions table
--    One row per sub-question. A challenge can have multiple questions
--    organised by difficulty tier (beginner / intermediate / advanced / general).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenge_questions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id  uuid        NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  difficulty    text        NOT NULL DEFAULT 'general'
                            CHECK (difficulty IN ('beginner','intermediate','advanced','general')),
  question_type text        NOT NULL DEFAULT 'text'
                            CHECK (question_type IN (
                              'text',
                              'multiple_choice',
                              'true_false',
                              'fill_blank',
                              'ordering',
                              'image_mcq',
                              'image_guess',
                              'image_only_mcq'
                            )),
  question_text text        NOT NULL,
  image_url     text,
  -- options stores:
  --   multiple_choice / image_mcq / true_false → array of text option strings
  --   ordering                                → array of items in CORRECT order
  --   image_only_mcq                          → array of { label, image_url } objects
  --   text / fill_blank / image_guess         → [] (unused)
  options       jsonb       NOT NULL DEFAULT '[]'::jsonb,
  answer_key    text        NOT NULL,   -- never returned to students
  xp_value      integer     NOT NULL DEFAULT 50,
  sort_order    integer     NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE challenge_questions ENABLE ROW LEVEL SECURITY;

-- Students can read questions (answer_key is stripped in the backend query)
CREATE POLICY "questions_authenticated_read" ON challenge_questions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admins write via service role (backend uses service-role key for mutations)

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Indexes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_challenge_questions_challenge
  ON challenge_questions(challenge_id);

CREATE INDEX IF NOT EXISTS idx_challenge_questions_difficulty
  ON challenge_questions(challenge_id, difficulty);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Storage bucket for question images (run in Supabase Dashboard → Storage
--    if it doesn't already exist, or use the SQL below)
-- ─────────────────────────────────────────────────────────────────────────────
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('question-images', 'question-images', true)
-- ON CONFLICT (id) DO NOTHING;
