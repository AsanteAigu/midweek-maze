-- PHASE 4: Add question_type column to challenges table
-- Run this in Supabase SQL Editor

ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS question_type text NOT NULL DEFAULT 'text'
  CHECK (question_type IN (
    'text', 'multiple_choice', 'true_false', 'fill_blank',
    'ordering', 'image_mcq', 'image_guess', 'image_only_mcq'
  ));
