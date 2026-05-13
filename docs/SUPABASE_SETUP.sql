-- ============================================================
-- ESUG Quiz Platform — Supabase Database Setup
-- Run this in your Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- 1. TABLES

CREATE TABLE IF NOT EXISTS students (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      text NOT NULL UNIQUE,
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  email           text NOT NULL UNIQUE,
  level           integer NOT NULL CHECK (level IN (100, 200, 300, 400)),
  course          text NOT NULL CHECK (course IN (
    'computer_engineering',
    'agriculture_engineering',
    'biomedical_engineering',
    'material_engineering',
    'food_processing'
  )),
  display_name    text NOT NULL UNIQUE,
  show_real_name  boolean DEFAULT false,
  avatar_seed     text NOT NULL,
  total_xp        integer DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  description     text NOT NULL,
  challenge_type  text NOT NULL CHECK (challenge_type IN ('quiz', 'puzzle', 'problem')),
  week_number     integer NOT NULL,
  opens_at        timestamptz NOT NULL,
  closes_at       timestamptz NOT NULL,
  xp_reward       integer NOT NULL DEFAULT 100,
  partial_xp      integer DEFAULT 50,
  answer_key      text NOT NULL,
  answer_mode     text NOT NULL DEFAULT 'text' CHECK (answer_mode IN ('text', 'multiple_choice')),
  answer_options  jsonb NOT NULL DEFAULT '[]'::jsonb,
  hint            text,
  is_active       boolean DEFAULT false,
  is_scored       boolean DEFAULT false,
  image_url       text,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  challenge_id    uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  answer          text NOT NULL,
  is_correct      boolean,
  xp_earned       integer DEFAULT 0,
  submitted_at    timestamptz DEFAULT now(),
  UNIQUE (student_id, challenge_id)
);

CREATE TABLE IF NOT EXISTS xp_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  challenge_id    uuid REFERENCES challenges(id),
  xp_earned       integer NOT NULL,
  reason          text NOT NULL,
  awarded_at      timestamptz DEFAULT now()
);

-- 2. INDEXES

-- Existing installs: keep older challenge tables compatible with newer challenge formats.
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS answer_mode text NOT NULL DEFAULT 'text'
    CHECK (answer_mode IN ('text', 'multiple_choice'));

ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS answer_options jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_students_student_id  ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_total_xp    ON students(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_students_course       ON students(course);
CREATE INDEX IF NOT EXISTS idx_students_level        ON students(level);
CREATE INDEX IF NOT EXISTS idx_challenges_week       ON challenges(week_number);
CREATE INDEX IF NOT EXISTS idx_challenges_active     ON challenges(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_challenges_opens_at   ON challenges(opens_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_student   ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_challenge ON submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_student   ON xp_history(student_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_awarded   ON xp_history(awarded_at DESC);

-- 3. ROW LEVEL SECURITY

ALTER TABLE students    ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges  ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_history  ENABLE ROW LEVEL SECURITY;

-- Students can read/update their own profile (not total_xp — that's scheduler only)
CREATE POLICY "students_own_profile_select" ON students
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "students_own_profile_update" ON students
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Public read of students for leaderboard (service role handles XP updates)
CREATE POLICY "students_public_read" ON students
  FOR SELECT USING (true);

-- Challenges are readable by all authenticated users
CREATE POLICY "challenges_authenticated_read" ON challenges
  FOR SELECT USING (auth.role() = 'authenticated');

-- Students own their submissions
CREATE POLICY "students_own_submissions_select" ON submissions
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "students_own_submissions_insert" ON submissions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Students can read their own XP history
CREATE POLICY "students_own_xp_history" ON xp_history
  FOR SELECT USING (auth.uid() = student_id);

-- 4. XP INCREMENT FUNCTION (used by scheduler)
-- This function is called by the backend scheduler to safely increment XP

CREATE OR REPLACE FUNCTION increment_xp(student_uuid uuid, xp_amount integer)
RETURNS void AS $$
BEGIN
  UPDATE students
  SET total_xp = total_xp + xp_amount,
      updated_at = now()
  WHERE id = student_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. SUPABASE STORAGE
-- Go to Storage → Create bucket: "challenge-images"
-- Set it to PUBLIC (so image URLs work without auth)
-- Or run:
INSERT INTO storage.buckets (id, name, public) VALUES ('challenge-images', 'challenge-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DONE. Next steps:
-- 1. Go to Authentication → Settings → enable Email auth
-- 2. Storage bucket "challenge-images" is created by the INSERT above (public)
-- 3. Fill in .env files with your project URL + keys
-- 4. Run: npm install in both esug_backend/ and esug_frontend/
-- 5. npm run dev in both folders
-- ============================================================
