const supabase = require('../config/supabase');

function publicStudent(student, rank) {
  return {
    rank,
    id: student.id,
    display_name: student.display_name,
    avatar_seed: student.avatar_seed,
    level: student.level,
    course: student.course,
    total_xp: student.total_xp,
    // Only include real name if student opted in
    ...(student.show_real_name
      ? { first_name: student.first_name, last_name: student.last_name }
      : {}),
  };
}

async function getAllTime(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('students')
      .select('id, display_name, avatar_seed, level, course, total_xp, show_real_name, first_name, last_name', { count: 'exact' })
      .order('total_xp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (req.query.course) {
      query = query.eq('course', req.query.course);
    }
    if (req.query.level) {
      query = query.eq('level', parseInt(req.query.level));
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const ranked = data.map((student, index) => publicStudent(student, offset + index + 1));

    return res.json({
      success: true,
      leaderboard: ranked,
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    console.error('[LEADERBOARD] All-time error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to load leaderboard', code: 500 });
  }
}

async function getWeekly(req, res) {
  try {
    // Find most recently scored challenge
    const { data: latestChallenge, error: challengeError } = await supabase
      .from('challenges')
      .select('id, title, week_number')
      .eq('is_scored', true)
      .order('closes_at', { ascending: false })
      .limit(1)
      .single();

    if (challengeError || !latestChallenge) {
      return res.json({
        success: true,
        leaderboard: [],
        challenge: null,
        message: 'No scored challenges yet',
      });
    }

    const { data: submissions, error: subError } = await supabase
      .from('submissions')
      .select(`
        xp_earned, submitted_at,
        students (id, display_name, avatar_seed, level, course, show_real_name, first_name, last_name)
      `)
      .eq('challenge_id', latestChallenge.id)
      .order('xp_earned', { ascending: false })
      .order('submitted_at', { ascending: true });

    if (subError) throw subError;

    const ranked = submissions.map((sub, index) => ({
      rank: index + 1,
      display_name: sub.students.display_name,
      avatar_seed: sub.students.avatar_seed,
      level: sub.students.level,
      course: sub.students.course,
      xp_earned: sub.xp_earned,
      submitted_at: sub.submitted_at,
      ...(sub.students.show_real_name
        ? { first_name: sub.students.first_name, last_name: sub.students.last_name }
        : {}),
    }));

    return res.json({
      success: true,
      leaderboard: ranked,
      challenge: { id: latestChallenge.id, title: latestChallenge.title, week_number: latestChallenge.week_number },
    });
  } catch (err) {
    console.error('[LEADERBOARD] Weekly error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to load weekly leaderboard', code: 500 });
  }
}

module.exports = { getAllTime, getWeekly };
