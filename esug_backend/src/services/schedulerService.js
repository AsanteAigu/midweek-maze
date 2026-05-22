const supabase = require('../config/supabase');
const { compareAnswers, scoreAllQuestions } = require('../utils/scoring');

/**
 * JOB 1 — Wednesday 00:00
 * Unlock the next pending challenge (is_active=false, opens_at <= now)
 */
async function unlockChallenge() {
  console.log('[SCHEDULER] unlockChallenge() started at', new Date().toISOString());

  try {
    const now = new Date().toISOString();

    const { data: nextChallenge, error } = await supabase
      .from('challenges')
      .select('id, title, week_number')
      .eq('is_active', false)
      .eq('is_scored', false)
      .lte('opens_at', now)
      .order('opens_at', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!nextChallenge) {
      console.log('[SCHEDULER] unlockChallenge: No pending challenge to unlock');
      return;
    }

    const { error: updateError } = await supabase
      .from('challenges')
      .update({ is_active: true })
      .eq('id', nextChallenge.id);

    if (updateError) throw updateError;

    console.log(`[SCHEDULER] unlockChallenge: Unlocked Week ${nextChallenge.week_number} — "${nextChallenge.title}"`);
  } catch (err) {
    console.error('[SCHEDULER] unlockChallenge ERROR:', err.message);
  }
}

/**
 * Score a single submission for a challenge.
 * Handles both legacy single-answer and new multi-question JSON-answer challenges.
 *
 * @returns {{ isCorrect: boolean, xpEarned: number }}
 */
async function scoreSubmission(submission, challenge, questions) {
  if (challenge.has_questions && questions && questions.length > 0) {
    // ── Multi-question challenge ────────────────────────────────────────────
    let answerMap;
    try {
      answerMap = JSON.parse(submission.answer);
    } catch {
      return { isCorrect: false, xpEarned: 0 };
    }
    const { isCorrect, xpEarned } = scoreAllQuestions(answerMap, questions);
    return { isCorrect, xpEarned };
  }

  // ── Legacy single-answer challenge ────────────────────────────────────────
  const isCorrect = compareAnswers(submission.answer, challenge.answer_key);
  const xpEarned = isCorrect ? challenge.xp_reward : 0;
  return { isCorrect, xpEarned };
}

/**
 * JOB 2 — Wednesday 00:01
 * Score all submissions for last week's challenge, award XP, update student totals.
 * Per-student try/catch — one failure never crashes the whole job.
 */
async function scoreChallenge(specificChallengeId = null) {
  console.log('[SCHEDULER] scoreChallenge() started at', new Date().toISOString());

  try {
    let challengeQuery = supabase
      .from('challenges')
      .select('id, title, week_number, answer_key, xp_reward, partial_xp, has_questions');

    if (specificChallengeId) {
      // Manual score: target this challenge regardless of is_scored state
      challengeQuery = challengeQuery.eq('id', specificChallengeId);
    } else {
      // Scheduled score: only pick up unscored challenges that have closed
      const now = new Date().toISOString();
      challengeQuery = challengeQuery.eq('is_scored', false).lt('closes_at', now).eq('is_active', false);
    }

    const { data: challengesToScore, error: challengeError } = await challengeQuery;

    if (challengeError) throw challengeError;

    if (!challengesToScore || challengesToScore.length === 0) {
      console.log('[SCHEDULER] scoreChallenge: No challenges ready to score');
      return;
    }

    for (const challenge of challengesToScore) {
      console.log(`[SCHEDULER] Scoring Week ${challenge.week_number} — "${challenge.title}"`);

      // Fetch sub-questions once per challenge (if needed)
      let questions = [];
      if (challenge.has_questions) {
        try {
          const { data: qData } = await supabase
            .from('challenge_questions')
            .select('id, question_type, options, answer_key, xp_value, difficulty')
            .eq('challenge_id', challenge.id);
          questions = qData || [];
        } catch (qErr) {
          console.error(`[SCHEDULER] Failed to fetch questions for challenge ${challenge.id}:`, qErr.message);
        }
      }

      const { data: submissions, error: subError } = await supabase
        .from('submissions')
        .select('id, student_id, answer')
        .eq('challenge_id', challenge.id)
        .is('is_correct', null);

      if (subError) {
        console.error(`[SCHEDULER] Failed to fetch submissions for challenge ${challenge.id}:`, subError.message);
        continue;
      }

      for (const submission of submissions) {
        try {
          const { isCorrect, xpEarned } = await scoreSubmission(submission, challenge, questions);

          // Update submission
          const { error: subUpdateError } = await supabase
            .from('submissions')
            .update({ is_correct: isCorrect, xp_earned: xpEarned })
            .eq('id', submission.id);

          if (subUpdateError) throw subUpdateError;

          if (xpEarned > 0) {
            // Insert XP history record
            const { error: xpHistoryError } = await supabase
              .from('xp_history')
              .insert({
                student_id: submission.student_id,
                challenge_id: challenge.id,
                xp_earned: xpEarned,
                reason: `${isCorrect ? 'Correct answer' : 'Partial credit'} — Week ${challenge.week_number}: ${challenge.title}`,
              });

            if (xpHistoryError) throw xpHistoryError;

            // Update student's total_xp
            const { error: xpUpdateError } = await supabase.rpc('increment_xp', {
              student_uuid: submission.student_id,
              xp_amount: xpEarned,
            });

            if (xpUpdateError) {
              // Fallback: manual increment if RPC not available
              const { data: student } = await supabase
                .from('students')
                .select('total_xp')
                .eq('id', submission.student_id)
                .single();

              if (student) {
                await supabase
                  .from('students')
                  .update({ total_xp: (student.total_xp || 0) + xpEarned })
                  .eq('id', submission.student_id);
              }
            }
          }

          console.log(`[SCHEDULER] Student ${submission.student_id}: ${isCorrect ? '✓ Correct' : '✗ Incorrect'} — ${xpEarned} XP`);
        } catch (studentErr) {
          // Per-student error — log and continue, never crash the scorer
          console.error(`[SCHEDULER] Failed to score submission ${submission.id}:`, studentErr.message);
        }
      }

      // Mark challenge as scored
      const { error: markError } = await supabase
        .from('challenges')
        .update({ is_scored: true, is_active: false })
        .eq('id', challenge.id);

      if (markError) {
        console.error(`[SCHEDULER] Failed to mark challenge ${challenge.id} as scored:`, markError.message);
      } else {
        console.log(`[SCHEDULER] Week ${challenge.week_number} scoring complete`);
      }
    }
  } catch (err) {
    console.error('[SCHEDULER] scoreChallenge ERROR:', err.message);
  }
}

module.exports = { unlockChallenge, scoreChallenge };
