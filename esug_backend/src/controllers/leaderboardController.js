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
    // All distinct week numbers that have at least one scored challenge
    const { data: scoredChallenges, error: wErr } = await supabase
      .from('challenges')
      .select('week_number')
      .eq('is_scored', true);

    if (wErr) throw wErr;

    const availableWeeks = [...new Set((scoredChallenges || []).map((c) => c.week_number))]
      .sort((a, b) => b - a); // descending — latest first

    if (availableWeeks.length === 0) {
      return res.json({ success: true, leaderboard: [], week: null, availableWeeks: [] });
    }

    // Use ?week=N to browse; default to the latest scored week
    const requestedWeek = req.query.week ? parseInt(req.query.week) : availableWeeks[0];

    if (!availableWeeks.includes(requestedWeek)) {
      return res.json({ success: true, leaderboard: [], week: requestedWeek, availableWeeks });
    }

    // All scored challenges for that week
    const { data: weekChallenges, error: cErr } = await supabase
      .from('challenges')
      .select('id')
      .eq('week_number', requestedWeek)
      .eq('is_scored', true);

    if (cErr) throw cErr;

    const challengeIds = (weekChallenges || []).map((c) => c.id);

    if (challengeIds.length === 0) {
      return res.json({ success: true, leaderboard: [], week: requestedWeek, availableWeeks });
    }

    // All submissions for those challenges
    const { data: submissions, error: subError } = await supabase
      .from('submissions')
      .select(`
        xp_earned,
        students (id, display_name, avatar_seed, level, course, show_real_name, first_name, last_name)
      `)
      .in('challenge_id', challengeIds);

    if (subError) throw subError;

    // Aggregate total XP per student for this week
    const studentMap = new Map();
    for (const sub of submissions || []) {
      const s = sub.students;
      if (!s) continue;
      if (!studentMap.has(s.id)) {
        studentMap.set(s.id, { ...s, week_xp: 0 });
      }
      studentMap.get(s.id).week_xp += sub.xp_earned || 0;
    }

    const ranked = [...studentMap.values()]
      .sort((a, b) => b.week_xp - a.week_xp)
      .map((s, index) => ({
        rank: index + 1,
        display_name: s.display_name,
        avatar_seed: s.avatar_seed,
        level: s.level,
        course: s.course,
        xp_earned: s.week_xp,
        ...(s.show_real_name ? { first_name: s.first_name, last_name: s.last_name } : {}),
      }));

    return res.json({
      success: true,
      leaderboard: ranked,
      week: requestedWeek,
      availableWeeks,
      challengeCount: challengeIds.length,
    });
  } catch (err) {
    console.error('[LEADERBOARD] Weekly error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to load weekly leaderboard', code: 500 });
  }
}

module.exports = { getAllTime, getWeekly };
