const supabase = require('../config/supabase');
const { compareAnswers, scoreAllQuestions } = require('../utils/scoring');

async function submit(req, res) {
  try {
    const { challenge_id, answer, xp_earned: clientXpEarned } = req.body;
    const studentId = req.userId;
    const now = new Date().toISOString();

    // ── 1. Fetch challenge (SELECT * so no column-missing errors) ──────────
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challenge_id)
      .single();

    if (challengeError || !challenge) {
      return res.status(404).json({ error: true, message: 'Challenge not found', code: 404 });
    }

    // ── 2. Window checks ───────────────────────────────────────────────────
    if (!challenge.is_active) {
      return res.status(400).json({ error: true, message: 'This challenge is not currently active', code: 400 });
    }
    if (now > challenge.closes_at) {
      return res.status(400).json({ error: true, message: 'Submission window has closed — results coming Wednesday', code: 400 });
    }
    if (now < challenge.opens_at) {
      return res.status(400).json({ error: true, message: 'This challenge has not opened yet', code: 400 });
    }

    // ── 3. Answer validation ───────────────────────────────────────────────
    let answerToStore = String(answer || '').trim();

    if (challenge.has_questions) {
      // Multi-question challenge — answer must be a JSON object { [questionId]: value }
      let answerMap;
      try {
        answerMap = typeof answer === 'object' && answer !== null ? answer : JSON.parse(answer);
      } catch {
        return res.status(400).json({ error: true, message: 'Answer must be a JSON object mapping question IDs to responses', code: 400 });
      }
      if (typeof answerMap !== 'object' || Array.isArray(answerMap)) {
        return res.status(400).json({ error: true, message: 'Answer must be a JSON object mapping question IDs to responses', code: 400 });
      }

      // Fetch questions for validation (options needed for MC/TF type validation)
      const { data: questions } = await supabase
        .from('challenge_questions')
        .select('id, question_type, options, answer_key, xp_value, difficulty')
        .eq('challenge_id', challenge_id);

      if (!questions || questions.length === 0) {
        return res.status(400).json({ error: true, message: 'No questions found for this challenge', code: 400 });
      }

      // Validate each answered question
      for (const question of questions) {
        const studentAnswer = answerMap[question.id];
        if (studentAnswer === undefined || studentAnswer === null || String(studentAnswer).trim() === '') continue; // unanswered is OK

        const submitted = String(studentAnswer).trim();
        if (['multiple_choice', 'image_mcq', 'true_false', 'image_only_mcq'].includes(question.question_type)) {
          const opts = Array.isArray(question.options) ? question.options : [];
          // For image_only_mcq options are objects { label, image_url }; compare by label
          const validLabels = question.question_type === 'image_only_mcq'
            ? opts.map((o) => (typeof o === 'object' ? String(o.label) : String(o)))
            : opts.map(String);
          if (opts.length > 0 && !validLabels.includes(submitted)) {
            return res.status(400).json({
              error: true,
              message: `Invalid answer for question "${question.id}" — choose one of the provided options`,
              code: 400,
            });
          }
        }
      }

      answerToStore = JSON.stringify(answerMap);
    } else if (challenge.answer_mode === 'multiple_choice') {
      // Legacy single-question MC
      const options = Array.isArray(challenge.answer_options) ? challenge.answer_options : [];
      if (!options.includes(answerToStore)) {
        return res.status(400).json({ error: true, message: 'Choose one of the available answer options', code: 400 });
      }
    }

    if (!answerToStore) {
      return res.status(400).json({ error: true, message: 'Answer cannot be empty', code: 400 });
    }

    // ── 4. Duplicate check ─────────────────────────────────────────────────
    const { data: existing } = await supabase
      .from('submissions')
      .select('id')
      .eq('student_id', studentId)
      .eq('challenge_id', challenge_id)
      .single();

    if (existing) {
      return res.status(409).json({
        error: true,
        message: "You've already submitted an answer for this challenge — one submission only",
        code: 409,
      });
    }

    // ── 5a. Midweek Maze — award XP immediately based on time ─────────────
    if (challenge.challenge_type === 'midweek_maze') {
      // Clamp client-sent XP to [0, xp_reward]
      const earnedXp = Math.min(
        challenge.xp_reward || 0,
        Math.max(0, parseInt(clientXpEarned) || 0),
      );

      const { data: submission, error: insertError } = await supabase
        .from('submissions')
        .insert({
          student_id: studentId,
          challenge_id,
          answer: answerToStore,
          is_correct: earnedXp > 0,
          xp_earned: earnedXp,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          return res.status(409).json({ error: true, message: "You've already submitted an answer for this challenge — one submission only", code: 409 });
        }
        throw insertError;
      }

      if (earnedXp > 0) {
        await supabase.from('xp_history').insert({
          student_id: studentId,
          challenge_id,
          xp_earned: earnedXp,
          reason: `Midweek Maze — ${challenge.title}`,
        });
        const { error: rpcErr } = await supabase.rpc('increment_xp', { student_uuid: studentId, xp_amount: earnedXp });
        if (rpcErr) {
          const { data: student } = await supabase.from('students').select('total_xp').eq('id', studentId).single();
          if (student) await supabase.from('students').update({ total_xp: (student.total_xp || 0) + earnedXp }).eq('id', studentId);
        }
      }

      return res.status(201).json({
        success: true,
        message: earnedXp > 0 ? `${earnedXp} XP earned!` : 'Submitted — better luck next time',
        submission: { id: submission.id, submitted_at: submission.submitted_at, is_correct: earnedXp > 0, xp_earned: earnedXp },
      });
    }

    // ── 5b. Standard challenge — insert unscored submission ────────────────
    const { data: submission, error: insertError } = await supabase
      .from('submissions')
      .insert({
        student_id: studentId,
        challenge_id,
        answer: answerToStore,
        is_correct: null,
        xp_earned: 0,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return res.status(409).json({
          error: true,
          message: "You've already submitted an answer for this challenge — one submission only",
          code: 409,
        });
      }
      throw insertError;
    }

    return res.status(201).json({
      success: true,
      message: 'Answer submitted — results update Wednesday at midnight',
      submission: {
        id: submission.id,
        submitted_at: submission.submitted_at,
      },
    });
  } catch (err) {
    console.error('[SUBMIT] Error:', err.message);
    return res.status(500).json({ error: true, message: 'Submission failed — please try again', code: 500 });
  }
}

async function getMySubmissions(req, res) {
  try {
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(`
        id, answer, submitted_at, is_correct, xp_earned,
        challenges (id, title, week_number, challenge_type, xp_reward, has_questions)
      `)
      .eq('student_id', req.userId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return res.json({ success: true, submissions });
  } catch (err) {
    console.error('[SUBMISSIONS] Get mine error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to load submissions', code: 500 });
  }
}

module.exports = { submit, getMySubmissions };
