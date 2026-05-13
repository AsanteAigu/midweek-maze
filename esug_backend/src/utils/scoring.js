/**
 * Per-question and per-challenge answer scoring utilities.
 * Supports all 8 question types.
 */

/**
 * Original single-answer comparison (kept for backward-compat challenges
 * that use the top-level answer_key / answer_mode fields).
 * Supports alternatives separated by | or newlines.
 */
function compareAnswers(submittedAnswer, answerKey) {
  if (!submittedAnswer || !answerKey) return false;
  const normalizedSubmission = submittedAnswer.trim().toLowerCase();
  return String(answerKey)
    .split(/\||\r?\n/)
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean)
    .some((a) => a === normalizedSubmission);
}

/**
 * Score a single challenge_questions row against a student's submitted answer.
 *
 * @param {string} submittedAnswer  - Raw string from the student's submission JSON value
 * @param {object} question         - Row from challenge_questions (includes question_type, options, answer_key)
 * @returns {boolean}
 */
function scoreQuestion(submittedAnswer, question) {
  if (submittedAnswer === undefined || submittedAnswer === null) return false;
  const submitted = String(submittedAnswer).trim();
  const { question_type, answer_key, options } = question;

  switch (question_type) {
    // ── Text types: case-insensitive, pipe-separated alternatives ──────────
    case 'text':
    case 'fill_blank':
    case 'image_guess':
      return compareAnswers(submitted, answer_key);

    // ── Exact-match types ───────────────────────────────────────────────────
    case 'multiple_choice':
    case 'image_mcq':
    case 'true_false': {
      // Validate that the submitted answer is one of the declared options
      const optionList = Array.isArray(options) ? options : [];
      if (optionList.length > 0 && !optionList.includes(submitted)) return false;
      return submitted.toLowerCase() === String(answer_key).trim().toLowerCase();
    }

    // ── Ordering: student submits items joined by "|||" ─────────────────────
    // answer_key is stored as items joined by "|||" in the correct order
    case 'ordering': {
      const correct = String(answer_key).trim();
      return submitted === correct;
    }

    // ── Image-as-options: student submits the label of the correct image ────
    case 'image_only_mcq': {
      return submitted.toLowerCase() === String(answer_key).trim().toLowerCase();
    }

    default:
      return false;
  }
}

/**
 * Score all sub-questions for a challenge.
 *
 * @param {object} answerMap   - { [questionId]: submittedAnswer } (parsed from submission.answer JSON)
 * @param {Array}  questions   - Rows from challenge_questions (full rows incl. answer_key, xp_value)
 * @returns {{ isCorrect: boolean, xpEarned: number, questionResults: object }}
 */
function scoreAllQuestions(answerMap, questions) {
  let xpEarned = 0;
  const questionResults = {};

  for (const question of questions) {
    const submitted = answerMap[question.id];
    const correct = scoreQuestion(submitted, question);
    questionResults[question.id] = correct;
    if (correct) xpEarned += question.xp_value;
  }

  const isCorrect = Object.values(questionResults).some(Boolean);
  return { isCorrect, xpEarned, questionResults };
}

module.exports = { compareAnswers, scoreQuestion, scoreAllQuestions };
