import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { pageTransition, slideUp } from '../animations/presets';
import Navbar from '../components/Navbar';
import AvatarPicker from '../components/AvatarPicker';
import Icon from '../components/Icons';
import { generateRandomSeed } from '../utils/avatar';
import apiClient from '../utils/axiosClient';
import { useAuth } from '../context/AuthContext';

const COURSES = [
  { value: 'computer_engineering', label: 'Computer Engineering' },
  { value: 'agriculture_engineering', label: 'Agriculture Engineering' },
  { value: 'biomedical_engineering', label: 'Biomedical Engineering' },
  { value: 'material_engineering', label: 'Material Engineering' },
  { value: 'food_processing', label: 'Food Processing Engineering' },
];

const LEVELS = [100, 200, 300, 400];

export default function Register() {
  const navigate = useNavigate();
  const { applyBackendSession } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    level: '',
    course: '',
    display_name: '',
    show_real_name: false,
    avatar_seed: generateRandomSeed(),
  });

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    setLoading(true);
    try {
      const response = await apiClient.post('/api/auth/register', form);
      await applyBackendSession(response.data.session);
      toast.success('Welcome to Midweek Maze!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-off">
      <Navbar />
      <motion.div {...pageTransition} className="max-w-lg mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-duo-blue rounded-3xl flex items-center justify-center shadow-blue">
              <Icon.AcademicCap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="font-display font-black text-3xl text-text-dark mb-2">Create Your Account</h1>
          <p className="font-body text-text-mid">Join the Midweek Maze engineering challenge community</p>
        </div>

        {/* Progress */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step ? 'w-8 bg-duo-blue' : s < step ? 'w-4 bg-duo-blue/40' : 'w-4 bg-surface-border'
              }`}
            />
          ))}
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 && (
              <motion.div {...slideUp} className="space-y-5">
                <h2 className="font-display font-black text-xl text-text-dark">Your Details</h2>

                <FormField label="Student ID" required>
                  <input type="text" value={form.student_id} onChange={(e) => handleChange('student_id', e.target.value)} placeholder="e.g. ESUG/CE/100/001" className="input" required />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="First Name" required>
                    <input type="text" value={form.first_name} onChange={(e) => handleChange('first_name', e.target.value)} placeholder="Kwame" className="input" required minLength={2} />
                  </FormField>
                  <FormField label="Last Name" required>
                    <input type="text" value={form.last_name} onChange={(e) => handleChange('last_name', e.target.value)} placeholder="Mensah" className="input" required minLength={2} />
                  </FormField>
                </div>

                <FormField label="Email" required>
                  <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="you@student.isag.edu.gh" className="input" required />
                </FormField>

                <FormField label="Password" required>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => handleChange('password', e.target.value)} placeholder="Minimum 8 characters" className="input pr-12" required minLength={8} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-dark">
                      {showPassword ? <Icon.EyeOff className="w-5 h-5" /> : <Icon.Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Level" required>
                    <select value={form.level} onChange={(e) => handleChange('level', e.target.value)} className="input" required>
                      <option value="">Select level</option>
                      {LEVELS.map((l) => <option key={l} value={l}>Level {l}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Course" required>
                    <select value={form.course} onChange={(e) => handleChange('course', e.target.value)} className="input" required>
                      <option value="">Select course</option>
                      {COURSES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </FormField>
                </div>

                <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  Continue
                  <Icon.ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div {...slideUp} className="space-y-6">
                <h2 className="font-display font-black text-xl text-text-dark">Build Your Identity</h2>

                <FormField label="Display Name" required hint="shown on the leaderboard">
                  <input type="text" value={form.display_name} onChange={(e) => handleChange('display_name', e.target.value)} placeholder="e.g. QuizMaster42" className="input" required minLength={2} maxLength={30} />
                </FormField>

                <div>
                  <label className="block text-sm font-display font-bold text-text-dark mb-3">Your Avatar</label>
                  <AvatarPicker seed={form.avatar_seed} onSeedChange={(seed) => handleChange('avatar_seed', seed)} />
                </div>

                {/* Privacy toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-off border-2 border-surface-border">
                  <div>
                    <p className="font-display font-bold text-text-dark">Show real name on leaderboard</p>
                    <p className="font-body text-xs text-text-mid mt-0.5">Off = only your display name is public</p>
                  </div>
                  <button type="button" onClick={() => handleChange('show_real_name', !form.show_real_name)}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${form.show_real_name ? 'bg-duo-blue' : 'bg-surface-border'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form.show_real_name ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3 flex items-center justify-center gap-2">
                    <Icon.ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? 'Registering...' : (
                      <>
                        <Icon.Check className="w-4 h-4" />
                        Join Midweek Maze
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </form>
        </div>

        <p className="text-center font-body text-text-mid mt-6">
          Already registered?{' '}
          <Link to="/login" className="text-duo-blue font-bold hover:underline">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
}

function FormField({ label, children, required, hint }) {
  return (
    <div>
      <label className="block text-sm font-display font-bold text-text-dark mb-1.5">
        {label} {required && <span className="text-duo-red">*</span>}
        {hint && <span className="font-normal text-text-muted ml-1">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}
