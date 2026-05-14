const supabase = require('../config/supabase');


/**
 * Strip answer_key from a challenge_questions row before sending to students.
 * Also strips image_only_mcq individual option image labels that could leak info.
 */
function safeQuestion(q) {
  return {
    id: q.id,
    challenge_id: q.challenge_id,
    difficulty: q.difficulty,
    question_type: q.question_type,
    question_text: q.question_text,
    image_url: q.image_url || null,
    // For image_only_mcq the options contain { label, image_url } objects — safe to return
    options: Array.isArray(q.options) ? q.options : [],
    xp_value: q.xp_value,
    sort_order: q.sort_order,
    // answer_key is NEVER included
  };
}

// Safe challenge (NEVER include answer_key)
function safeChallenge(challenge, questions = []) {
  return {
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    challenge_type: challenge.challenge_type,
    question_type: challenge.question_type || challenge.answer_mode || 'text',
    answer_mode: challenge.answer_mode || 'text',
    answer_options: Array.isArray(challenge.answer_options) ? challenge.answer_options : [],
    week_number: challenge.week_number,
    opens_at: challenge.opens_at,
    closes_at: challenge.closes_at,
    xp_reward: challenge.xp_reward,
    partial_xp: challenge.partial_xp,
    hint: challenge.hint,
    is_active: challenge.is_active,
    is_scored: challenge.is_scored,
    image_url: challenge.image_url || null,
    has_questions: challenge.has_questions || false,
    questions: questions.map(safeQuestion),
    time_limit_seconds: challenge.time_limit_seconds || null,
    created_at: challenge.created_at,
  };
}

async function getCurrentChallenge(req, res) {
  try {
    const now = new Date().toISOString();

    // SELECT * — safeChallenge() strips answer_key before sending to client, so this is safe
    const { data: challenge, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .lte('opens_at', now)
      .gt('closes_at', now)
      .order('opens_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!challenge) {
      return res.json({
        success: true,
        challenge: null,
        message: 'No active challenge — next challenge drops Wednesday at midnight',
      });
    }

    // Fetch sub-questions (only if challenge uses the multi-question model)
    let questions = [];
    if (challenge.has_questions) {
      try {
        const { data: qData } = await supabase
          .from('challenge_questions')
          .select('id, challenge_id, difficulty, question_type, question_text, image_url, options, xp_value, sort_order')
          .eq('challenge_id', challenge.id)
          .order('sort_order', { ascending: true });
        questions = qData || [];
      } catch (_) {
        // challenge_questions table not yet created — return without questions
      }
    }

    // Check if this student already submitted
    const { data: submission } = await supabase
      .from('submissions')
      .select('id, answer, submitted_at, is_correct, xp_earned')
      .eq('student_id', req.userId)
      .eq('challenge_id', challenge.id)
      .single();

    return res.json({
      success: true,
      challenge: safeChallenge(challenge, questions),
      submission: submission || null,
    });
  } catch (err) {
    console.error('[CHALLENGE] Get current error:', err.message);
    return res.status(500).json({
      error: true,
      message: process.env.NODE_ENV === 'production' ? 'Failed to load challenge' : err.message,
      code: 500,
    });
  }
}

async function getAllChallenges(req, res) {
  try {
    // SELECT * — safeChallenge() strips answer_key, so this is safe
    const { data: challenges, error } = await supabase
      .from('challenges')
      .select('*')
      .order('week_number', { ascending: false });

    if (error) throw error;

    return res.json({ success: true, challenges: (challenges || []).map((c) => safeChallenge(c)) });
  } catch (err) {
    console.error('[CHALLENGE] Get all error:', err.message);
    return res.status(500).json({
      error: true,
      message: process.env.NODE_ENV === 'production' ? 'Failed to load challenges' : err.message,
      code: 500,
    });
  }
}

module.exports = { getCurrentChallenge, getAllChallenges };
