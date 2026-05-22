-- PHASE 5: Add midweek_maze as a valid challenge_type
-- Run this in: Supabase Dashboard → SQL Editor → New query

-- 1. Drop the old CHECK constraint on challenge_type
ALTER TABLE challenges
  DROP CONSTRAINT IF EXISTS challenges_challenge_type_check;

-- 2. Add the updated constraint that includes midweek_maze
ALTER TABLE challenges
  ADD CONSTRAINT challenges_challenge_type_check
  CHECK (challenge_type IN ('quiz', 'puzzle', 'problem', 'midweek_maze'));
