const supabase = require('../config/supabase');

async function updateProfile(req, res) {
  try {
    const allowedFields = ['display_name', 'avatar_seed', 'show_real_name', 'level', 'course'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: true, message: 'No valid fields to update', code: 400 });
    }

    if (updates.level !== undefined) {
      const level = Number(updates.level);
      if (![100, 200, 300, 400].includes(level)) {
        return res.status(400).json({ error: true, message: 'Level must be 100, 200, 300, or 400', code: 400 });
      }
      updates.level = level;
    }

    if (updates.course !== undefined) {
      const validCourses = ['computer_engineering', 'agriculture_engineering', 'biomedical_engineering', 'material_engineering', 'food_processing'];
      if (!validCourses.includes(updates.course)) {
        return res.status(400).json({ error: true, message: 'Invalid course selected', code: 400 });
      }
    }

    // If changing display_name, check uniqueness
    if (updates.display_name) {
      const { data: existing } = await supabase
        .from('students')
        .select('id')
        .eq('display_name', updates.display_name)
        .neq('id', req.userId)
        .single();

      if (existing) {
        return res.status(409).json({
          error: true,
          message: 'Display name is already taken',
          code: 409,
        });
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', req.userId)
      .select('id, display_name, avatar_seed, show_real_name, total_xp, level, course, updated_at')
      .single();

    if (error) throw error;

    return res.json({ success: true, student: data });
  } catch (err) {
    console.error('[PROFILE] Update error:', err.message);
    return res.status(500).json({ error: true, message: 'Profile update failed', code: 500 });
  }
}

async function getXpHistory(req, res) {
  try {
    const { data, error } = await supabase
      .from('xp_history')
      .select(`
        id, xp_earned, reason, awarded_at,
        challenges (id, title, week_number, challenge_type)
      `)
      .eq('student_id', req.userId)
      .order('awarded_at', { ascending: false });

    if (error) throw error;

    return res.json({ success: true, history: data });
  } catch (err) {
    console.error('[XP HISTORY] Error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to load XP history', code: 500 });
  }
}

async function getPublicProfile(req, res) {
  try {
    const { displayName } = req.params;

    const { data: student, error } = await supabase
      .from('students')
      .select('id, display_name, avatar_seed, level, course, total_xp, show_real_name, first_name, last_name, created_at')
      .eq('display_name', displayName)
      .single();

    if (error || !student) {
      return res.status(404).json({ error: true, message: 'Student not found', code: 404 });
    }

    const publicProfile = {
      display_name: student.display_name,
      avatar_seed: student.avatar_seed,
      level: student.level,
      course: student.course,
      total_xp: student.total_xp,
      created_at: student.created_at,
      ...(student.show_real_name
        ? { first_name: student.first_name, last_name: student.last_name }
        : {}),
    };

    // Get their XP history (public)
    const { data: history } = await supabase
      .from('xp_history')
      .select('xp_earned, reason, awarded_at, challenges (title, week_number)')
      .eq('student_id', student.id)
      .order('awarded_at', { ascending: false });

    return res.json({ success: true, profile: publicProfile, history: history || [] });
  } catch (err) {
    console.error('[PUBLIC PROFILE] Error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to load profile', code: 500 });
  }
}

async function deleteAccount(req, res) {
  try {
    // Delete student row — cascades to submissions and xp_history
    const { error: dbError } = await supabase
      .from('students')
      .delete()
      .eq('id', req.userId);

    if (dbError) throw dbError;

    // Remove the Supabase Auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(req.userId);
    if (authError) throw authError;

    return res.json({ success: true, message: 'Account deleted' });
  } catch (err) {
    console.error('[PROFILE] Delete account error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to delete account', code: 500 });
  }
}

module.exports = { updateProfile, getXpHistory, getPublicProfile, deleteAccount };
