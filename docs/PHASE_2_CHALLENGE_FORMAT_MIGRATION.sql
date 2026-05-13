-- Phase 2: allow typed-answer and multiple-choice challenge formats.
-- Run this once in the Supabase SQL Editor for the active project.

ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS answer_mode text NOT NULL DEFAULT 'text'
    CHECK (answer_mode IN ('text', 'multiple_choice'));

ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS answer_options jsonb NOT NULL DEFAULT '[]'::jsonb;
