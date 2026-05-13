const supabase = require('../config/supabase');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Helper: create anon client for auth operations
function getAnonClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Safe student profile (never expose sensitive fields)
function safeProfile(student) {
  return {
    id: student.id,
    student_id: student.student_id,
    first_name: student.first_name,
    last_name: student.last_name,
    email: student.email,
    level: student.level,
    course: student.course,
    display_name: student.display_name,
    show_real_name: student.show_real_name,
    avatar_seed: student.avatar_seed,
    total_xp: student.total_xp,
    created_at: student.created_at,
  };
}

async function register(req, res) {
  try {
    const {
      student_id, first_name, last_name, email, password,
      level, course, display_name, show_real_name = false, avatar_seed,
    } = req.body;

    // Check student_id uniqueness
    const { data: existingById } = await supabase
      .from('students')
      .select('id')
      .eq('student_id', student_id)
      .single();

    if (existingById) {
      return res.status(409).json({ error: true, message: 'Student ID is already registered', code: 409 });
    }

    // Check display_name uniqueness
    const { data: existingByName } = await supabase
      .from('students')
      .select('id')
      .eq('display_name', display_name)
      .single();

    if (existingByName) {
      return res.status(409).json({
        error: true,
        message: 'Display name is already taken — choose a different one',
        code: 409,
      });
    }

    // Create Supabase Auth user server-side to avoid public signup email rate limits.
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.toLowerCase().includes('already')) {
        return res.status(409).json({ error: true, message: 'Email is already registered', code: 409 });
      }
      throw authError;
    }

    const userId = authData.user.id;

    // Insert student profile (uses service role to bypass RLS on insert)
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .insert({
        id: userId,
        student_id,
        first_name,
        last_name,
        email,
        level: parseInt(level),
        course,
        display_name,
        show_real_name: Boolean(show_real_name),
        avatar_seed,
        total_xp: 0,
      })
      .select()
      .single();

    if (studentError) {
      console.error('[REGISTER] Student insert failed:', studentError.message);
      await supabase.auth.admin.deleteUser(userId);
      throw studentError;
    }

    const anonClient = getAnonClient();
    const { data: sessionData, error: sessionError } = await anonClient.auth.signInWithPassword({ email, password });

    if (sessionError) {
      console.error('[REGISTER] Session creation failed:', sessionError.message);
      return res.status(201).json({
        success: true,
        message: 'Registration successful — log in with your custom name',
        student: safeProfile(studentData),
        session: null,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      student: safeProfile(studentData),
      session: sessionData.session,
    });
  } catch (err) {
    console.error('[REGISTER] Error:', err.message);
    return res.status(500).json({ error: true, message: 'Registration failed — please try again', code: 500 });
  }
}

async function login(req, res) {
  try {
    const { display_name, password } = req.body;

    const { data: accountStudent, error: accountError } = await supabase
      .from('students')
      .select('email')
      .eq('display_name', display_name)
      .single();

    if (accountError || !accountStudent) {
      return res.status(401).json({ error: true, message: 'Incorrect display name or password', code: 401 });
    }

    const anonClient = getAnonClient();
    const { data, error } = await anonClient.auth.signInWithPassword({
      email: accountStudent.email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: true, message: 'Incorrect display name or password', code: 401 });
    }

    // Fetch student profile
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (studentError || !studentData) {
      return res.status(404).json({ error: true, message: 'Student profile not found', code: 404 });
    }

    return res.json({
      success: true,
      student: safeProfile(studentData),
      session: data.session,
    });
  } catch (err) {
    console.error('[LOGIN] Error:', err.message);
    return res.status(500).json({ error: true, message: 'Login failed — please try again', code: 500 });
  }
}

async function getMe(req, res) {
  try {
    const { data: studentData, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', req.userId)
      .single();

    if (error || !studentData) {
      return res.status(404).json({ error: true, message: 'Profile not found', code: 404 });
    }

    return res.json({ success: true, student: safeProfile(studentData) });
  } catch (err) {
    console.error('[GET ME] Error:', err.message);
    return res.status(500).json({ error: true, message: 'Failed to load profile', code: 500 });
  }
}

async function logout(req, res) {
  return res.json({ success: true, message: 'Logged out successfully' });
}

module.exports = { register, login, getMe, logout };
