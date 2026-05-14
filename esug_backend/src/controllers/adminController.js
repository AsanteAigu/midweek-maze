const supabase = require('../config/supabase');
const { scoreChallenge } = require('../services/schedulerService');

function isMissingAnswerModeMigration(error) {
  return ['42703', 'PGRST204'].includes(error?.code) && /answer_(mode|options)/.test(error.message || '');
}

function missingAnswerModeResponse(res) {
  return res.status(500).json({
    error: true,
    message: 'Challenge answer-mode database columns are missing. Run the Supabase SQL migration, then try again.',
    code: 500,
  });
}

function isMissingQuestionsMigration(error) {
  return (
    ['42P01', '42703', 'PGRST116', 'PGRST200'].includes(error?.code) &&
    /challenge_questions|has_questions/.test(error.message || '')
  );
}

function missingQuestionsResponse(res) {
  return res.status(500).json({
    error: true,
    message:
      'challenge_questions table is missing. Run docs/PHASE_3_QUESTION_TYPES_MIGRATION.sql in Supabase, then try again.',
    code: 500,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CHALLENGE CRUD
// ─────────────────────────────────────────────────────────────────────────────

const MULTI_OPTION_TYPES = ['multiple_choice', 'true_false', 'image_mcq', 'image_only_mcq'];

function deriveAnswerMode(question_type) {
  return MULTI_OPTION_TYPES.includes(question_type) ? 'multiple_choice' : 'text';
}

async function createChallenge(req, res) {
  try {
    const {
      title, description, challenge_type, week_number,
      opens_at, closes_at, xp_reward = 100, partial_xp = 50,
      answer_key, hint, answer_options = [],
      question_type = 'text', time_limit_seconds = null,
    } = req.body;

    const cleanOptions = Array.isArray(answer_options)
      ? answer_options.map((option) => {
          if (option && typeof option === 'object') return option;
          return String(option).trim();
        }).filter(Boolean)
      : [];

    const answer_mode = deriveAnswerMode(question_type);

    // ordering: answer_key = items joined by |||
    const finalAnswerKey = question_type === 'ordering'
      ? cleanOptions.join('|||')
      : (answer_key || '');

    // true_false always has exactly these options
    const finalOptions = question_type === 'true_false'
      ? ['True', 'False']
      : cleanOptions;

    const insertPayload = {
      title,
      description,
      challenge_type,
      week_number: parseInt(week_number),
      opens_at,
      closes_at,
      xp_reward: parseInt(xp_reward),
      partial_xp: parseInt(partial_xp),
      answer_key: finalAnswerKey,
      answer_mode,
      answer_options: finalOptions,
      question_type,
      hint: hint || null,
      is_active: false,
      is_scored: false,
      has_questions: false,
    };
    if (time_limit_seconds) insertPayload.time_limit_seconds = parseInt(time_limit_seconds);

    let { data, error } = await supabase
      .from('challenges')
      .insert(insertPayload)
      .select('id, title, challenge_type, question_type, answer_mode, answer_options, week_number, opens_at, closes_at, xp_reward, is_active, is_scored, has_questions, created_at')
      .single();

    if (error && isMissingAnswerModeMigration(error) && answer_mode === 'text') {
      const fallbackResult = await supabase
        .from('challenges')
        .insert({
          title, description, challenge_type,
          week_number: parseInt(week_number),
          opens_at, closes_at,
          xp_reward: parseInt(xp_reward),
          partial_xp: parseInt(partial_xp),
          answer_key: answer_key || '',
          hint: hint || null,
          is_active: false, is_scored: false,
        })
        .select('id, title, challenge_type, week_number, opens_at, closes_at, xp_reward, is_active, is_scored, created_at')
        .single();

      data = fallbackResult.data
        ? { ...fallbackResult.data, answer_mode: 'text', answer_options: [], has_questions: false }
        : fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) throw error;

    return res.status(201).json({ success: true, challenge: data });
  } catch (err) {
    console.error('[ADMIN] Create challenge error:', err.message);
    if (isMissingAnswerModeMigration(err)) return missingAnswerModeResponse(res);
    return res.status(500).json({ error: true, message: 'Failed to create challenge', code: 500 });
  }
}

async function listChallenges(req, res) {
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .order('week_number', { ascending: false });

    if (error) throw error;

    // Fetch questions for all challenges
    let questions = [];
    try {
      const ids = (data || []).map((c) => c.id);
      if (ids.length > 0) {
        const { data: qData } = await supabase
          .from('challenge_questions')
          .select('*')
          .in('challenge_id', ids)
          .order('sort_order', { ascending: true });
        questions = qData || [];
      }
    } catch (_) {
      // Phase 3 migration not yet run — return challenges without questions
    }

    const challengesWithQuestions = (data || []).map((c) => ({
      ...c,
      questions: questions.filter((q) => q.challenge_id === c.id),
    }));

    return res.json({ success: true, challenges: challengesWithQuestions });
  } catch (err) {
    console.error('[ADMIN] List challenges error:', err.message);
    if (isMissingAnswerModeMigration(err)) return missingAnswerModeResponse(res);
    return res.status(500).json({ error: true, message: 'Failed to load challenges', code: 500 });
  }
}

async function getChallenge(req, res) {
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: true, message: 'Challenge not found', code: 404 });
    }

    let questions = [];
    try {
      const { data: qData } = await supabase
        .from('challenge_questions')
        .select('*')
        .eq('challenge_id', data.id)
        .order('sort_order', { ascending: true });
      questions = qData || [];
    } catch (_) {}

    return res.json({ success: true, challenge: { ...data, questions } });
  } catch (err) {
    console.error('[ADMIN] Get challenge error:', err.message);
    if (isMissingAnswerModeMigration(err)) return missingAnswerModeResponse(res);
    return res.status(500).json({ error: true, message: 'Failed to load challenge', code: 500 });
  }
}

async function updateChallenge(req, res) {
  try {
    const allowedFields = [
      'title', 'description', 'challenge_type', 'week_number',
      'opens_at', 'closes_at', 'xp_reward', 'partial_xp',
      'answer_key', 'answer_mode', 'answer_options', 'question_type', 'hint', 'is_active', 'has_questions', 'time_limit_seconds',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        // Skip time_limit_seconds if null/falsy — avoids error if column not yet migrated
        if (field === 'time_limit_seconds' && !req.body[field]) continue;
        updates[field] = field === 'answer_options' && Array.isArray(req.body[field])
          ? req.body[field].map((option) => String(option).trim()).filter(Boolean)
          : req.body[field];
      }
    }

    const { error } = await supabase
      .from('challenges')
      .update(updates)
      .eq('id', req.params.id);

    if (error) throw error;

    return res.json({ success: true });
  } catch (err) {
    console.error('[ADMIN] Update challenge error:', err.message);
    if (isMissingAnswerModeMigration(err)) return missingAnswerModeResponse(res);
    return res.status(500).json({ error: true, message: 'Failed to update challenge', code: 500 });
  }
}

async function deleteChallenge(req, res) {
  try {
    const { id } = req.params;

    // Delete submissions first (FK constraint), then the challenge itself
    await supabase.from('submissions').delete().eq('challenge_id', id);

    const { error } = await supabase.from('challenges').delete().eq('id', id);
    if (error) throw error;

    return res.json({ success: true, message: 'Challenge deleted' });
  } catch (err) {
    console.error('[ADMIN] Delete challenge error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to delete challenge', code: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHALLENGE IMAGE
// ─────────────────────────────────────────────────────────────────────────────

async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: true, message: 'No image file provided', code: 400 });
    }

    const challengeId = req.params.id;
    const ext = req.file.mimetype.split('/')[1] || 'jpg';
    const fileName = `challenge-${challengeId}-image.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('question-images')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error('[ADMIN] Image upload to storage error:', uploadError);
      return res.status(500).json({ error: true, message: `Storage error: ${uploadError.message}`, code: 500 });
    }

    const { data: urlData } = supabase.storage.from('question-images').getPublicUrl(fileName);
    const imageUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from('challenges')
      .update({ image_url: imageUrl })
      .eq('id', challengeId);

    if (updateError) throw updateError;

    return res.json({ success: true, message: 'Image uploaded successfully', image_url: imageUrl });
  } catch (err) {
    console.error('[ADMIN] Upload image error:', err.message);
    return res.status(500).json({ error: true, message: err.message || 'Image upload failed', code: 500 });
  }
}

async function deleteImage(req, res) {
  try {
    const challengeId = req.params.id;

    await Promise.allSettled([
      supabase.storage.from('question-images').remove([`challenge-${challengeId}-image.jpg`]),
      supabase.storage.from('question-images').remove([`challenge-${challengeId}-image.png`]),
      supabase.storage.from('question-images').remove([`challenge-${challengeId}-image.gif`]),
      supabase.storage.from('question-images').remove([`challenge-${challengeId}-image.webp`]),
    ]);

    const { data, error } = await supabase
      .from('challenges')
      .update({ image_url: null })
      .eq('id', challengeId)
      .select('id, title')
      .single();

    if (error) throw error;

    return res.json({ success: true, message: 'Image removed', challenge: data });
  } catch (err) {
    console.error('[ADMIN] Delete image error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to remove image', code: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHALLENGE QUESTIONS CRUD
// ─────────────────────────────────────────────────────────────────────────────

async function createQuestion(req, res) {
  try {
    const challengeId = req.params.id;
    const {
      difficulty = 'general',
      question_type = 'text',
      question_text,
      options = [],
      answer_key,
      xp_value = 50,
      sort_order = 0,
    } = req.body;

    if (!question_text) {
      return res.status(400).json({ error: true, message: 'question_text is required', code: 400 });
    }
    if (!answer_key) {
      return res.status(400).json({ error: true, message: 'answer_key is required', code: 400 });
    }

    const cleanOptions = Array.isArray(options)
      ? options.map((o) => (typeof o === 'object' ? o : String(o).trim())).filter(Boolean)
      : [];

    const { data: question, error } = await supabase
      .from('challenge_questions')
      .insert({
        challenge_id: challengeId,
        difficulty,
        question_type,
        question_text,
        options: cleanOptions,
        answer_key,
        xp_value: parseInt(xp_value),
        sort_order: parseInt(sort_order),
      })
      .select('*')
      .single();

    if (error) {
      if (isMissingQuestionsMigration(error)) return missingQuestionsResponse(res);
      throw error;
    }

    // Mark challenge as having sub-questions
    await supabase.from('challenges').update({ has_questions: true }).eq('id', challengeId);

    return res.status(201).json({ success: true, question });
  } catch (err) {
    console.error('[ADMIN] Create question error:', err.message);
    if (isMissingQuestionsMigration(err)) return missingQuestionsResponse(res);
    return res.status(500).json({ error: true, message: 'Failed to create question', code: 500 });
  }
}

async function updateQuestion(req, res) {
  try {
    const { questionId } = req.params;
    const allowedFields = [
      'difficulty', 'question_type', 'question_text', 'options',
      'answer_key', 'xp_value', 'sort_order',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'options') {
          updates[field] = Array.isArray(req.body[field])
            ? req.body[field].map((o) => (typeof o === 'object' ? o : String(o).trim())).filter(Boolean)
            : [];
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    const { data: question, error } = await supabase
      .from('challenge_questions')
      .update(updates)
      .eq('id', questionId)
      .select('*')
      .single();

    if (error) {
      if (isMissingQuestionsMigration(error)) return missingQuestionsResponse(res);
      throw error;
    }

    if (!question) {
      return res.status(404).json({ error: true, message: 'Question not found', code: 404 });
    }

    return res.json({ success: true, question });
  } catch (err) {
    console.error('[ADMIN] Update question error:', err.message);
    if (isMissingQuestionsMigration(err)) return missingQuestionsResponse(res);
    return res.status(500).json({ error: true, message: 'Failed to update question', code: 500 });
  }
}

async function deleteQuestion(req, res) {
  try {
    const { questionId } = req.params;

    // Get challenge_id before delete so we can update has_questions flag
    const { data: existing } = await supabase
      .from('challenge_questions')
      .select('challenge_id')
      .eq('id', questionId)
      .single();

    const { error } = await supabase.from('challenge_questions').delete().eq('id', questionId);

    if (error) {
      if (isMissingQuestionsMigration(error)) return missingQuestionsResponse(res);
      throw error;
    }

    // If no questions remain for this challenge, clear the flag
    if (existing?.challenge_id) {
      const { count } = await supabase
        .from('challenge_questions')
        .select('id', { count: 'exact', head: true })
        .eq('challenge_id', existing.challenge_id);

      if (count === 0) {
        await supabase.from('challenges').update({ has_questions: false }).eq('id', existing.challenge_id);
      }
    }

    return res.json({ success: true, message: 'Question deleted' });
  } catch (err) {
    console.error('[ADMIN] Delete question error:', err.message);
    if (isMissingQuestionsMigration(err)) return missingQuestionsResponse(res);
    return res.status(500).json({ error: true, message: 'Failed to delete question', code: 500 });
  }
}

async function uploadQuestionImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: true, message: 'No image file provided', code: 400 });
    }

    const { questionId } = req.params;
    const ext = req.file.mimetype.split('/')[1] || 'jpg';
    const fileName = `question-${questionId}-image.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('question-images')
      .upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: true });

    if (uploadError) {
      console.error('[ADMIN] Question image upload error:', uploadError.message);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage.from('question-images').getPublicUrl(fileName);
    const imageUrl = urlData.publicUrl;

    const { data: question, error } = await supabase
      .from('challenge_questions')
      .update({ image_url: imageUrl })
      .eq('id', questionId)
      .select('id, image_url')
      .single();

    if (error) throw error;

    return res.json({ success: true, image_url: imageUrl, question });
  } catch (err) {
    console.error('[ADMIN] Upload question image error:', err.message);
    return res.status(500).json({ error: true, message: 'Question image upload failed', code: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORING & STATS
// ─────────────────────────────────────────────────────────────────────────────

async function manualScore(req, res) {
  try {
    const { challengeId } = req.params;
    await scoreChallenge(challengeId);
    return res.json({ success: true, message: `Challenge ${challengeId} scored successfully` });
  } catch (err) {
    console.error('[ADMIN] Manual score error:', err.message);
    return res.status(500).json({ error: true, message: 'Scoring failed', code: 500 });
  }
}

async function getStats(req, res) {
  try {
    const [studentsResult, challengesResult, submissionsResult] = await Promise.all([
      supabase.from('students').select('id', { count: 'exact', head: true }),
      supabase.from('challenges').select('id', { count: 'exact', head: true }),
      supabase.from('submissions').select('id', { count: 'exact', head: true }),
    ]);

    return res.json({
      success: true,
      stats: {
        total_students: studentsResult.count || 0,
        total_challenges: challengesResult.count || 0,
        total_submissions: submissionsResult.count || 0,
      },
    });
  } catch (err) {
    console.error('[ADMIN] Stats error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to load stats', code: 500 });
  }
}

async function getChallengeSubmissions(req, res) {
  try {
    const { challengeId } = req.params;

    const { data, error } = await supabase
      .from('submissions')
      .select(`
        id, answer, submitted_at, is_correct, xp_earned,
        students (student_id, display_name, level, course)
      `)
      .eq('challenge_id', challengeId)
      .order('submitted_at', { ascending: true });

    if (error) throw error;

    return res.json({ success: true, submissions: data });
  } catch (err) {
    console.error('[ADMIN] Get submissions error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to load submissions', code: 500 });
  }
}

module.exports = {
  createChallenge, listChallenges, getChallenge, updateChallenge, deleteChallenge,
  uploadImage, deleteImage,
  createQuestion, updateQuestion, deleteQuestion, uploadQuestionImage,
  manualScore, getStats, getChallengeSubmissions,
};
