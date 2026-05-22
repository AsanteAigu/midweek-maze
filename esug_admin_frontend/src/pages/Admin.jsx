import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { pageTransition, staggerContainer, staggerItem, scaleIn } from '../animations/presets';
import { CardSkeleton } from '../components/SkeletonLoader';
import Icon from '../components/Icons';
import apiClient from '../utils/axiosClient';
import QuestionBuilder from '../components/QuestionBuilder';

const RAW_ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || '';
const ADMIN_SECRET = RAW_ADMIN_SECRET.startsWith('change_this') ? '' : RAW_ADMIN_SECRET;

// ─────────────────────────────────────────
// Admin Lock Screen
// ─────────────────────────────────────────
function AdminLock({ onUnlock }) {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!secret.trim()) {
      setError('Enter your admin secret key');
      return;
    }
    apiClient({
      method: 'get',
      url: '/api/admin/stats',
      headers: { 'x-admin-secret': secret },
    })
      .then(() => onUnlock(secret))
      .catch((err) => setError(err.message || 'Invalid admin secret — try again'));
  }

  return (
    <div className="min-h-screen bg-surface-off flex items-center justify-center px-4">
      <motion.div {...scaleIn} className="card max-w-sm w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-duo-blue rounded-3xl flex items-center justify-center shadow-blue">
            <Icon.Lock className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="font-display font-black text-2xl text-text-dark mb-2">Admin Access</h1>
        <p className="font-body text-text-mid text-sm mb-6">Enter your admin secret key to continue</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={secret}
            onChange={(e) => { setSecret(e.target.value); setError(''); }}
            placeholder="Admin secret key"
            className="input text-center font-mono"
            autoFocus
          />
          {error && <p className="text-duo-red font-display font-bold text-sm">{error}</p>}
          <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <Icon.Key className="w-4 h-4" />
            Unlock Admin Panel
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────
// Challenge Form (Create / Edit)
// ─────────────────────────────────────────
const emptyChallengeForm = {
  title: '',
  description: '',
  challenge_type: 'quiz',
  week_number: '',
  opens_at: '',
  closes_at: '',
  xp_reward: 100,
  partial_xp: 50,
  time_limit_minutes: '',
  question_type: 'text',
  answer_options: ['', '', '', ''],
  answer_key: '',
  hint: '',
};

const QUESTION_TYPES = [
  { value: 'text',          label: 'Typed Answer',    desc: 'Free text response',              icon: <Icon.Pencil className="w-4 h-4" /> },
  { value: 'multiple_choice', label: 'Multiple Choice', desc: 'Pick one text option',           icon: <Icon.ClipboardList className="w-4 h-4" /> },
  { value: 'true_false',    label: 'True / False',    desc: 'Binary choice',                   icon: <Icon.Check className="w-4 h-4" /> },
  { value: 'fill_blank',    label: 'Fill in the Blank', desc: 'Complete the sentence',         icon: <Icon.Pencil className="w-4 h-4" /> },
  { value: 'ordering',      label: 'Ordering',        desc: 'Sort items into correct order',   icon: <Icon.ChevronDown className="w-4 h-4" /> },
  { value: 'image_mcq',     label: 'Image + MCQ',     desc: 'Picture stimulus, text options',  icon: <Icon.Image className="w-4 h-4" /> },
  { value: 'image_guess',   label: 'Image Guess',     desc: 'Picture is the question',         icon: <Icon.Image className="w-4 h-4" /> },
  { value: 'image_only_mcq', label: 'Image Options',  desc: 'Pick the correct picture',        icon: <Icon.Image className="w-4 h-4" /> },
];

function formatDateForInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function normalizeChallengeForm(challenge) {
  if (!challenge) return emptyChallengeForm;
  const options = Array.isArray(challenge.answer_options) && challenge.answer_options.length > 0
    ? challenge.answer_options
    : ['', '', '', ''];
  return {
    ...emptyChallengeForm,
    ...challenge,
    opens_at: formatDateForInput(challenge.opens_at),
    closes_at: formatDateForInput(challenge.closes_at),
    question_type: challenge.question_type || challenge.answer_mode || 'text',
    answer_options: options.length >= 2 ? options : [...options, '', ''].slice(0, 4),
    time_limit_minutes: challenge.time_limit_seconds ? String(Math.round(challenge.time_limit_seconds / 60)) : '',
  };
}

function toIsoDate(value) {
  return value ? new Date(value).toISOString() : value;
}

const IMAGE_QUESTION_TYPES = ['image_mcq', 'image_guess', 'image_only_mcq'];

function ChallengeForm({ adminSecret, onSuccess, editChallenge = null }) {
  const fileRef = useRef(null);
  const [form, setForm] = useState(() => normalizeChallengeForm(editChallenge));
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Images only'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleOptionChange(index, value) {
    setForm((prev) => {
      const nextOptions = [...prev.answer_options];
      const oldValue = nextOptions[index];
      nextOptions[index] = value;
      return {
        ...prev,
        answer_options: nextOptions,
        answer_key: prev.answer_key === oldValue ? value : prev.answer_key,
      };
    });
  }

  function addOption() {
    setForm((prev) => ({ ...prev, answer_options: [...prev.answer_options, ''] }));
  }

  function removeOption(index) {
    setForm((prev) => {
      const nextOptions = prev.answer_options.filter((_, optionIndex) => optionIndex !== index);
      return {
        ...prev,
        answer_options: nextOptions,
        answer_key: nextOptions.includes(prev.answer_key) ? prev.answer_key : '',
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const qt = form.question_type;
      const cleanedOptions = form.answer_options
        .map((o) => (o && typeof o === 'object' ? o : String(o).trim()))
        .filter(Boolean);

      // Validation per type
      if (['multiple_choice', 'image_mcq', 'image_only_mcq'].includes(qt)) {
        if (cleanedOptions.length < 2) { toast.error('Add at least two options'); setLoading(false); return; }
        if (!cleanedOptions.includes(form.answer_key.trim())) { toast.error('Select the correct option'); setLoading(false); return; }
      } else if (qt === 'true_false') {
        if (!['True', 'False'].includes(form.answer_key)) { toast.error('Pick True or False'); setLoading(false); return; }
      } else if (qt === 'ordering') {
        if (cleanedOptions.length < 2) { toast.error('Add at least two items to order'); setLoading(false); return; }
      } else {
        if (!form.answer_key.trim()) { toast.error('Answer key is required'); setLoading(false); return; }
      }

      const payload = {
        ...form,
        week_number: parseInt(form.week_number),
        xp_reward: parseInt(form.xp_reward),
        partial_xp: parseInt(form.partial_xp),
        time_limit_seconds: form.time_limit_minutes ? parseInt(form.time_limit_minutes) * 60 : null,
        opens_at: toIsoDate(form.opens_at),
        closes_at: toIsoDate(form.closes_at),
        question_type: qt,
        answer_key: qt === 'ordering' ? cleanedOptions.join('|||') : form.answer_key.trim(),
        answer_options: qt === 'true_false' ? ['True', 'False'] : cleanedOptions,
        has_questions: false,
      };
      if (editChallenge) {
        await apiClient({ method: 'patch', url: `/api/admin/challenges/${editChallenge.id}`, data: payload, headers: { 'x-admin-secret': adminSecret } });
        toast.success('Challenge updated!');
      } else {
        const res = await apiClient({ method: 'post', url: '/api/admin/challenges', data: payload, headers: { 'x-admin-secret': adminSecret } });
        const newId = res.data.challenge?.id;
        // Upload image immediately if one was selected
        if (imageFile && newId) {
          const fd = new FormData();
          fd.append('image', imageFile);
          await apiClient({ method: 'post', url: `/api/admin/challenges/${newId}/image`, data: fd, headers: { 'x-admin-secret': adminSecret, 'Content-Type': 'multipart/form-data' } });
          toast.success('Challenge created with image!');
        } else {
          toast.success('Challenge created!');
        }
      }
      onSuccess();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  const typeOptions = [
    { value: 'quiz', label: 'Quiz' },
    { value: 'puzzle', label: 'Puzzle' },
    { value: 'problem', label: 'Engineering Problem' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-display font-bold text-text-dark mb-1.5">Challenge Title *</label>
          <input type="text" value={form.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="Week 7: Binary Tree Puzzle" className="input" required />
        </div>

        <div>
          <label className="block text-sm font-display font-bold text-text-dark mb-1.5">Type *</label>
          <select value={form.challenge_type} onChange={(e) => handleChange('challenge_type', e.target.value)} className="input" required>
            {typeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-display font-bold text-text-dark mb-1.5">Week Number *</label>
          <input type="number" min="1" value={form.week_number} onChange={(e) => handleChange('week_number', e.target.value)} placeholder="7" className="input" required />
        </div>

        <div>
          <label className="block text-sm font-display font-bold text-text-dark mb-1.5">Opens At *</label>
          <div className="flex gap-2">
            <input type="datetime-local" value={form.opens_at} onChange={(e) => handleChange('opens_at', e.target.value)} className="input flex-1" required />
            <button type="button" onClick={() => handleChange('opens_at', formatDateForInput(new Date().toISOString()))}
              className="px-3 py-2 rounded-xl border-2 border-duo-blue text-duo-blue font-display font-bold text-xs hover:bg-duo-blue hover:text-white transition-colors flex-shrink-0">
              Now
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-display font-bold text-text-dark mb-1.5">Closes At *</label>
          <input type="datetime-local" value={form.closes_at} onChange={(e) => handleChange('closes_at', e.target.value)} className="input" required />
        </div>

        <div>
          <label className="block text-sm font-display font-bold text-text-dark mb-1.5">XP Reward</label>
          <input type="number" min="1" value={form.xp_reward} onChange={(e) => handleChange('xp_reward', e.target.value)} className="input" />
        </div>

        <div>
          <label className="block text-sm font-display font-bold text-text-dark mb-1.5">Partial XP</label>
          <input type="number" min="0" value={form.partial_xp} onChange={(e) => handleChange('partial_xp', e.target.value)} className="input" />
        </div>

        <div>
          <label className="block text-sm font-display font-bold text-text-dark mb-1.5">
            Time Limit <span className="font-normal text-text-muted">(minutes, optional)</span>
          </label>
          <input
            type="number"
            min="1"
            max="180"
            value={form.time_limit_minutes}
            onChange={(e) => handleChange('time_limit_minutes', e.target.value)}
            placeholder="e.g. 10 — leave blank for no limit"
            className="input"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-display font-bold text-text-dark mb-1.5">
            Description * <span className="font-normal text-text-muted">(supports line breaks)</span>
          </label>
          <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={5} placeholder="Full challenge description. You can add a picture after creating it." className="input resize-none" required />
        </div>

        {/* Question Type */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-display font-bold text-text-dark mb-2">Question Type *</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {QUESTION_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => { handleChange('question_type', t.value); handleChange('answer_key', ''); }}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2.5 text-center transition-all ${
                  form.question_type === t.value
                    ? 'border-duo-blue bg-duo-blue text-white shadow-blue'
                    : 'border-surface-border bg-white text-text-mid hover:border-duo-blue'
                }`}
              >
                {t.icon}
                <span className="text-xs font-display font-bold leading-tight">{t.label}</span>
                <span className={`text-xs font-normal leading-tight ${form.question_type === t.value ? 'text-white/70' : 'text-text-muted'}`}>{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* True / False answer picker */}
        {form.question_type === 'true_false' && (
          <div className="sm:col-span-2">
            <label className="block text-sm font-display font-bold text-text-dark mb-2">Correct Answer *</label>
            <div className="grid grid-cols-2 gap-3">
              {['True', 'False'].map((opt) => (
                <button key={opt} type="button" onClick={() => handleChange('answer_key', opt)}
                  className={`py-3 rounded-2xl border-2 font-display font-black text-base transition-all flex items-center justify-center gap-2 ${
                    form.answer_key === opt
                      ? opt === 'True' ? 'border-duo-blue bg-duo-blue text-white' : 'border-duo-red bg-duo-red text-white'
                      : 'border-surface-border bg-white text-text-mid hover:border-duo-blue'
                  }`}>
                  {opt === 'True' ? <Icon.Check className="w-4 h-4" /> : <Icon.XMark className="w-4 h-4" />}
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Options list — multiple choice, image MCQ, image-only MCQ */}
        {['multiple_choice', 'image_mcq', 'image_only_mcq'].includes(form.question_type) && (
          <div className="sm:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-display font-bold text-text-dark">
                {form.question_type === 'image_only_mcq' ? 'Option Labels *' : 'Answer Options *'}
              </label>
              <button type="button" onClick={addOption} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                <Icon.Plus className="w-3.5 h-3.5" /> Add option
              </button>
            </div>
            {form.answer_options.map((option, index) => (
              <div key={`option-${index}`} className="flex items-center gap-2">
                <button type="button" onClick={() => handleChange('answer_key', option)}
                  disabled={!String(option).trim()}
                  className={`h-11 w-11 rounded-xl border-2 flex items-center justify-center transition-all ${
                    form.answer_key === option && String(option).trim()
                      ? 'border-duo-blue bg-duo-blue text-white'
                      : 'border-surface-border bg-white text-text-muted disabled:opacity-40'
                  }`} title="Mark as correct">
                  <Icon.Check className="w-4 h-4" />
                </button>
                <input type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={form.question_type === 'image_only_mcq' ? `Label ${index + 1} (e.g. Option A)` : `Option ${index + 1}`}
                  className="input flex-1" />
                {form.answer_options.length > 2 && (
                  <button type="button" onClick={() => removeOption(index)} className="btn-secondary h-11 w-11 flex items-center justify-center">
                    <Icon.XMark className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {form.question_type === 'image_only_mcq' && (
              <p className="font-body text-xs text-text-muted">Upload images per option after saving, using the challenge image upload.</p>
            )}
          </div>
        )}

        {/* Ordering — items in correct order */}
        {form.question_type === 'ordering' && (
          <div className="sm:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-display font-bold text-text-dark">Items in Correct Order *</label>
              <button type="button" onClick={addOption} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                <Icon.Plus className="w-3.5 h-3.5" /> Add item
              </button>
            </div>
            {form.answer_options.map((option, index) => (
              <div key={`option-${index}`} className="flex items-center gap-2">
                <span className="h-11 w-11 rounded-xl bg-surface-off border border-surface-border flex items-center justify-center flex-shrink-0 font-mono text-xs font-bold text-text-muted">
                  {index + 1}
                </span>
                <input type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Item ${index + 1}`} className="input flex-1" />
                {form.answer_options.length > 2 && (
                  <button type="button" onClick={() => removeOption(index)} className="btn-secondary h-11 w-11 flex items-center justify-center">
                    <Icon.XMark className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <p className="font-body text-xs text-text-muted">List items in the <strong>correct</strong> order — students see them shuffled.</p>
          </div>
        )}

        {/* Answer key — text / fill_blank / image_guess */}
        {['text', 'fill_blank', 'image_guess'].includes(form.question_type) && (
          <div className="sm:col-span-2">
            <label className="block text-sm font-display font-bold text-text-dark mb-1.5 flex items-center gap-1.5">
              <Icon.Key className="w-4 h-4 text-duo-red" />
              Answer Key * <span className="font-normal text-duo-red">(NEVER shown to students)</span>
            </label>
            <input type="text" value={form.answer_key} onChange={(e) => handleChange('answer_key', e.target.value)}
              placeholder={form.question_type === 'fill_blank' ? 'The missing word' : 'Correct answer. Use | between alternatives'}
              className="input font-mono" />
            <p className="font-body text-xs text-text-muted mt-1.5">
              {form.question_type === 'fill_blank'
                ? 'Use ___ in the description to mark the blank.'
                : 'Alternatives separated by | e.g. beam | beams'}
            </p>
          </div>
        )}

        {/* Inline image picker for image question types */}
        {IMAGE_QUESTION_TYPES.includes(form.question_type) && (
          <div className="sm:col-span-2">
            <label className="block text-sm font-display font-bold text-text-dark mb-2">
              Question Image *
            </label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            <div
              onClick={() => fileRef.current?.click()}
              className="border-4 border-dashed border-surface-border rounded-2xl p-6 text-center cursor-pointer hover:border-duo-blue transition-colors"
            >
              {imagePreview ? (
                <div>
                  <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-xl object-contain mb-2" />
                  <p className="font-display font-bold text-sm text-text-dark">{imageFile?.name}</p>
                  <p className="font-mono text-xs text-text-muted">{((imageFile?.size || 0) / 1024).toFixed(0)} KB · Click to change</p>
                </div>
              ) : (
                <div>
                  <Icon.Upload className="w-10 h-10 text-text-muted mx-auto mb-2" />
                  <p className="font-display font-bold text-sm text-text-dark mb-1">Upload question image</p>
                  <p className="font-body text-xs text-text-muted">Click to browse — JPG, PNG, GIF, WebP · max 10MB</p>
                </div>
              )}
            </div>
            {imageFile && (
              <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="mt-2 text-xs text-duo-red font-display font-bold hover:opacity-75">
                Remove image
              </button>
            )}
          </div>
        )}

        <div className="sm:col-span-2">
          <label className="block text-sm font-display font-bold text-text-dark mb-1.5">Hint (optional)</label>
          <input type="text" value={form.hint} onChange={(e) => handleChange('hint', e.target.value)} placeholder="A nudge in the right direction..." className="input" />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60">
        {loading ? 'Saving...' : editChallenge ? (
          <>
            <Icon.Check className="w-4 h-4" />
            Save Changes
          </>
        ) : (
          <>
            <Icon.Rocket className="w-4 h-4" />
            Create Challenge
          </>
        )}
      </button>
    </form>
  );
}

// ─────────────────────────────────────────
// Image Upload Component
// ─────────────────────────────────────────
function ImageUpload({ challenge, adminSecret, onDone }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed (JPG, PNG, GIF, WebP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image is too large — maximum 10MB');
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      await apiClient({
        method: 'post',
        url: `/api/admin/challenges/${challenge.id}/image`,
        data: formData,
        headers: { 'x-admin-secret': adminSecret, 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      toast.success('Challenge picture uploaded!');
      setSelectedFile(null);
      setPreview(null);
      onDone();
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  async function handleRemove() {
    if (!confirm('Remove the picture from this challenge?')) return;
    try {
      await apiClient({
        method: 'delete',
        url: `/api/admin/challenges/${challenge.id}/image`,
        headers: { 'x-admin-secret': adminSecret },
      });
      toast.success('Picture removed');
      onDone();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-4">
      {/* Existing picture */}
      {challenge.image_url && (
        <div className="p-4 rounded-2xl bg-duo-blue/10 border-2 border-duo-blue/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon.Image className="w-5 h-5 text-duo-blue" />
              <p className="font-display font-bold text-sm text-duo-blue">Challenge picture attached</p>
            </div>
            <button onClick={handleRemove} className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1">
              <Icon.Trash className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>
          <img src={challenge.image_url} alt="Challenge" className="w-full rounded-xl max-h-64 object-contain bg-white border border-surface-border" />
        </div>
      )}

      {/* Upload drop zone */}
      <div
        className="border-4 border-dashed border-surface-border rounded-2xl p-8 text-center cursor-pointer hover:border-duo-blue transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        {preview ? (
          <div>
            <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-xl object-contain mb-2" />
            <p className="font-display font-bold text-sm text-text-dark">{selectedFile?.name}</p>
            <p className="font-mono text-xs text-text-muted">{((selectedFile?.size || 0) / 1024).toFixed(0)} KB</p>
          </div>
        ) : (
          <div>
            <div className="flex justify-center mb-3">
              <Icon.Image className="w-12 h-12 text-text-muted" />
            </div>
            <p className="font-display font-bold text-text-dark mb-1">
              {challenge.image_url ? 'Replace challenge picture' : 'Upload challenge picture'}
            </p>
            <p className="font-body text-sm text-text-muted">Click to browse — max 10MB · JPG, PNG, GIF, WebP</p>
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="space-y-3">
          {uploading && (
            <div>
              <div className="flex justify-between text-xs font-mono text-text-muted mb-1">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-surface-border rounded-full h-3">
                <div className="bg-duo-blue h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => { setSelectedFile(null); setPreview(null); }} className="btn-secondary flex-1 py-2.5 text-sm" disabled={uploading}>
              Cancel
            </button>
            <button type="button" onClick={handleUpload} disabled={uploading} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              <Icon.Upload className="w-4 h-4" />
              {uploading ? `Uploading ${progress}%...` : 'Upload Picture'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Challenge Row in list
// ─────────────────────────────────────────
function ChallengeRow({ challenge, adminSecret, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const [view, setView] = useState('details'); // 'details' | 'edit' | 'image' | 'questions' | 'submissions'
  const queryClient = useQueryClient();

  async function handleToggleActive() {
    try {
      await apiClient({
        method: 'patch',
        url: `/api/admin/challenges/${challenge.id}`,
        data: { is_active: !challenge.is_active },
        headers: { 'x-admin-secret': adminSecret },
      });
      toast.success(challenge.is_active ? 'Challenge deactivated' : 'Challenge activated!');
      onAction();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${challenge.title}"? This also removes all submissions. This cannot be undone.`)) return;
    try {
      await apiClient({
        method: 'delete',
        url: `/api/admin/challenges/${challenge.id}`,
        headers: { 'x-admin-secret': adminSecret },
      });
      toast.success('Challenge deleted');
      onAction();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleManualScore() {
    if (!confirm('Manually score all submissions for this challenge now?')) return;
    try {
      await apiClient({
        method: 'post',
        url: `/api/admin/score/${challenge.id}`,
        headers: { 'x-admin-secret': adminSecret },
      });
      toast.success('Challenge scored successfully! Results updated.');
      onAction();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const typeIcon = {
    quiz: <Icon.ClipboardList className="w-5 h-5 text-duo-blue flex-shrink-0" />,
    puzzle: <Icon.Target className="w-5 h-5 text-duo-purple flex-shrink-0" />,
    problem: <Icon.Wrench className="w-5 h-5 text-duo-orange flex-shrink-0" />,
  };

  return (
    <div className={`border-2 rounded-2xl overflow-hidden transition-all ${
      challenge.is_active ? 'border-duo-blue' : challenge.is_scored ? 'border-surface-border' : 'border-duo-yellow/50'
    }`}>
      {/* Row header */}
      <div
        className="flex items-center gap-3 p-4 bg-white cursor-pointer hover:bg-surface-off transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {typeIcon[challenge.challenge_type] || <Icon.ClipboardList className="w-5 h-5 text-text-muted flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-bold text-text-dark truncate">
              Week {challenge.week_number}: {challenge.title}
            </p>
            {challenge.is_active && (
              <span className="bg-duo-blue text-white font-display font-bold text-xs px-2 py-0.5 rounded-full animate-pulse flex-shrink-0">LIVE</span>
            )}
            {challenge.is_scored && (
              <span className="flex items-center gap-1 bg-surface-border text-text-mid font-display font-bold text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                <Icon.Check className="w-3 h-3" />
                SCORED
              </span>
            )}
            {challenge.image_url && (
              <span className="flex items-center gap-1 bg-duo-blue/10 text-duo-blue font-display font-bold text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                <Icon.Image className="w-3 h-3" />
                IMAGE
              </span>
            )}
          </div>
          <p className="font-mono text-xs text-text-muted mt-0.5">
            Opens: {new Date(challenge.opens_at).toLocaleString('en-GB')} · Closes: {new Date(challenge.closes_at).toLocaleString('en-GB')}
          </p>
        </div>
        {expanded
          ? <Icon.ChevronUp className="w-5 h-5 text-text-muted flex-shrink-0" />
          : <Icon.ChevronDown className="w-5 h-5 text-text-muted flex-shrink-0" />
        }
      </div>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t-2 border-surface-border p-4 bg-surface-off">
              {/* Tab bar */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {[
                  { id: 'details', label: 'Details', icon: <Icon.ClipboardList className="w-3.5 h-3.5" /> },
                  { id: 'edit', label: 'Edit', icon: <Icon.Pencil className="w-3.5 h-3.5" /> },
                  { id: 'image', label: 'Challenge Picture', icon: <Icon.Image className="w-3.5 h-3.5" /> },
                  {
                    id: 'questions',
                    label: `Questions${challenge.questions?.length ? ` (${challenge.questions.length})` : ''}`,
                    icon: <Icon.Target className="w-3.5 h-3.5" />,
                  },
                  { id: 'submissions', label: 'Submissions', icon: <Icon.ChartBar className="w-3.5 h-3.5" /> },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setView(t.id)}
                    className={`flex items-center gap-1.5 text-xs font-display font-bold px-3 py-1.5 rounded-xl transition-all ${
                      view === t.id ? 'bg-duo-blue text-white' : 'bg-white border border-surface-border text-text-mid hover:border-duo-blue'
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>

              {view === 'details' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <InfoField label="XP Reward" value={`${challenge.xp_reward} XP`} />
                    <InfoField label="Partial XP" value={`${challenge.partial_xp} XP`} />
                    <InfoField label="Status" value={challenge.is_active ? 'LIVE' : challenge.is_scored ? 'Scored' : 'Inactive'} />
                    <InfoField label="Type" value={challenge.challenge_type} />
                    <InfoField label="Answer Format" value={challenge.answer_mode === 'multiple_choice' ? 'Multiple choice' : 'Typed answer'} />
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-surface-border">
                    <p className="text-xs font-display font-bold text-text-muted mb-1">Description</p>
                    <p className="font-body text-sm text-text-dark whitespace-pre-wrap">{challenge.description}</p>
                  </div>
                  {challenge.hint && (
                    <div className="bg-duo-yellow/10 rounded-xl p-3 border border-duo-yellow/30">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon.Info className="w-3.5 h-3.5 text-duo-yellow-dark" />
                        <p className="text-xs font-display font-bold text-text-muted">Hint</p>
                      </div>
                      <p className="font-body text-sm text-text-dark">{challenge.hint}</p>
                    </div>
                  )}
                  <div className="bg-duo-red/5 rounded-xl p-3 border border-duo-red/20">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon.Key className="w-3.5 h-3.5 text-duo-red" />
                      <p className="text-xs font-display font-bold text-duo-red">Answer Key (admin only)</p>
                    </div>
                    <p className="font-mono text-sm text-text-dark">{challenge.answer_key}</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap pt-2">
                    <button onClick={handleToggleActive} className={`flex items-center gap-1.5 text-sm px-3 py-2 ${challenge.is_active ? 'btn-secondary' : 'btn-primary'}`}>
                      {challenge.is_active
                        ? <><Icon.Pause className="w-4 h-4" /> Deactivate</>
                        : <><Icon.Play className="w-4 h-4" /> Activate</>
                      }
                    </button>
                    <button onClick={handleManualScore} className="flex items-center gap-1.5 bg-duo-purple text-white font-display font-bold text-sm px-3 py-2 rounded-xl hover:opacity-90 transition-opacity">
                      <Icon.Target className="w-4 h-4" />
                      Score Now
                    </button>
                    <button onClick={handleDelete} className="flex items-center gap-1.5 bg-duo-red text-white font-display font-bold text-sm px-3 py-2 rounded-xl hover:opacity-90 transition-opacity ml-auto">
                      <Icon.Trash className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {view === 'edit' && (
                <ChallengeForm
                  adminSecret={adminSecret}
                  editChallenge={challenge}
                  onSuccess={onAction}
                />
              )}

              {view === 'image' && (
                <ImageUpload
                  challenge={challenge}
                  adminSecret={adminSecret}
                  onDone={onAction}
                />
              )}

              {view === 'questions' && (
                <QuestionBuilder
                  challengeId={challenge.id}
                  adminSecret={adminSecret}
                  initialQuestions={challenge.questions || []}
                />
              )}

              {view === 'submissions' && (
                <SubmissionsView challengeId={challenge.id} adminSecret={adminSecret} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div className="bg-white rounded-xl p-2.5 border border-surface-border">
      <p className="text-xs font-mono text-text-muted">{label}</p>
      <p className="font-display font-bold text-sm text-text-dark">{value}</p>
    </div>
  );
}

function SubmissionsView({ challengeId, adminSecret }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-submissions', challengeId],
    queryFn: () =>
      apiClient({
        method: 'get',
        url: `/api/admin/submissions/${challengeId}`,
        headers: { 'x-admin-secret': adminSecret },
      }).then((r) => r.data),
    staleTime: 30_000,
  });

  const submissions = data?.submissions || [];

  if (isLoading) return <CardSkeleton />;

  return (
    <div className="space-y-2">
      <p className="font-display font-bold text-sm text-text-mid mb-3">{submissions.length} submission(s)</p>
      {submissions.length === 0 && (
        <p className="font-body text-text-muted text-sm">No submissions yet</p>
      )}
      {submissions.map((sub) => (
        <div key={sub.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-surface-border">
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm text-text-dark">
              {sub.students?.display_name} <span className="font-normal text-text-muted">· {sub.students?.student_id}</span>
            </p>
            <p className="font-mono text-xs text-text-muted truncate">{sub.answer}</p>
          </div>
          <div className="flex-shrink-0">
            {sub.is_correct === null ? (
              <span className="text-xs font-mono text-text-muted bg-surface-off px-2 py-1 rounded-lg">pending</span>
            ) : sub.is_correct ? (
              <span className="flex items-center gap-1 text-xs font-display font-bold text-duo-blue bg-duo-blue/10 px-2 py-1 rounded-lg">
                <Icon.Check className="w-3 h-3" />
                +{sub.xp_earned} XP
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-display font-bold text-duo-red bg-duo-red/10 px-2 py-1 rounded-lg">
                <Icon.XMark className="w-3 h-3" />
                wrong
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Midweek Maze — Game Catalogue & Publisher
// ─────────────────────────────────────────

const CATEGORY_META = {
  'Logic & Deduction': { color: 'bg-duo-blue/10 text-duo-blue border-duo-blue/30', dot: 'bg-duo-blue' },
  'Visual & Spatial':  { color: 'bg-duo-purple/10 text-duo-purple border-duo-purple/30', dot: 'bg-duo-purple' },
  'Word & Language':   { color: 'bg-duo-green/10 text-duo-green border-duo-green/30', dot: 'bg-duo-green' },
  'Math & Arithmetic': { color: 'bg-duo-orange/10 text-duo-orange border-duo-orange/30', dot: 'bg-duo-orange' },
  'Logic Puzzles':     { color: 'bg-duo-red/10 text-duo-red border-duo-red/30', dot: 'bg-duo-red' },
  'Drawing & Spatial': { color: 'bg-teal-100 text-teal-700 border-teal-200', dot: 'bg-teal-500' },
  'Olympiad':          { color: 'bg-duo-yellow/20 text-yellow-700 border-duo-yellow/40', dot: 'bg-duo-yellow' },
  'Extreme':           { color: 'bg-gray-100 text-gray-700 border-gray-300', dot: 'bg-gray-500' },
};

const GAMES_LIST = [
  // Logic & Deduction
  { slug: 'math-cross',            name: 'Math Cross',             category: 'Logic & Deduction', xp: 150, diff: 'Medium'   },
  { slug: 'number-maze',           name: 'Number Maze',            category: 'Logic & Deduction', xp: 200, diff: 'Hard'     },
  { slug: 'mini-sudoku',           name: 'Mini Sudoku',            category: 'Logic & Deduction', xp: 150, diff: 'Medium'   },
  { slug: 'logic-gates',           name: 'Logic Gates',            category: 'Logic & Deduction', xp: 200, diff: 'Hard'     },
  { slug: 'cryptarithmetic',       name: 'Cryptarithmetic',        category: 'Logic & Deduction', xp: 200, diff: 'Hard'     },
  { slug: 'night-bridge',          name: 'Canyon Crossing',        category: 'Logic & Deduction', xp: 70,  diff: 'Hard'     },
  // Visual & Spatial
  { slug: 'pattern-completion',    name: 'Pattern Completion',     category: 'Visual & Spatial',  xp: 150, diff: 'Medium'   },
  { slug: 'tangram-solver',        name: 'Tangram Solver',         category: 'Visual & Spatial',  xp: 200, diff: 'Hard'     },
  { slug: 'tower-of-hanoi',        name: 'Tower of Hanoi',         category: 'Visual & Spatial',  xp: 200, diff: 'Hard'     },
  { slug: 'maze-navigator',        name: 'Maze Navigator',         category: 'Visual & Spatial',  xp: 150, diff: 'Medium'   },
  { slug: 'rotational-symmetry',   name: 'Rotational Symmetry',    category: 'Visual & Spatial',  xp: 150, diff: 'Medium'   },
  // Word & Language
  { slug: 'word-worm',             name: 'Word Worm',              category: 'Word & Language',   xp: 150, diff: 'Medium'   },
  { slug: 'anagram-solver',        name: 'Anagram Solver',         category: 'Word & Language',   xp: 150, diff: 'Medium'   },
  { slug: 'mini-crossword',        name: 'Mini Crossword',         category: 'Word & Language',   xp: 150, diff: 'Medium'   },
  { slug: 'pangram-builder',       name: 'Pangram Builder',        category: 'Word & Language',   xp: 200, diff: 'Hard'     },
  { slug: 'etymology-chain',       name: 'Etymology Chain',        category: 'Word & Language',   xp: 200, diff: 'Hard'     },
  // Math & Arithmetic
  { slug: 'equation-builder',      name: 'Equation Builder',       category: 'Math & Arithmetic', xp: 200, diff: 'Hard'     },
  { slug: 'prime-factorization',   name: 'Prime Factorization',    category: 'Math & Arithmetic', xp: 150, diff: 'Medium'   },
  { slug: 'fibonacci-sequence',    name: 'Fibonacci Sequence',     category: 'Math & Arithmetic', xp: 150, diff: 'Medium'   },
  { slug: 'modular-arithmetic',    name: 'Modular Arithmetic',     category: 'Math & Arithmetic', xp: 200, diff: 'Hard'     },
  { slug: 'fraction-simplification', name: 'Fraction Simplification', category: 'Math & Arithmetic', xp: 150, diff: 'Medium' },
  // Logic Puzzles
  { slug: 'ages-of-three',         name: 'Ages of Three',          category: 'Logic Puzzles',     xp: 200, diff: 'Hard'     },
  { slug: 'knights-and-knaves',    name: 'Knights & Knaves',       category: 'Logic Puzzles',     xp: 200, diff: 'Hard'     },
  { slug: 'river-crossing',        name: 'River Crossing',         category: 'Logic Puzzles',     xp: 200, diff: 'Hard'     },
  { slug: 'monty-hall',            name: 'Monty Hall',             category: 'Logic Puzzles',     xp: 200, diff: 'Hard'     },
  { slug: 'einsteins-riddle',      name: "Einstein's Riddle",      category: 'Logic Puzzles',     xp: 250, diff: 'Hard'     },
  // Drawing & Spatial
  { slug: 'angry-roosters',        name: 'Angry Roosters',         category: 'Drawing & Spatial', xp: 150, diff: 'Medium'   },
  { slug: 'bridges-and-islands',   name: 'Bridges & Islands',      category: 'Drawing & Spatial', xp: 200, diff: 'Hard'     },
  { slug: 'dot-connection',        name: 'Dot Connection',         category: 'Drawing & Spatial', xp: 200, diff: 'Hard'     },
  { slug: 'pentomino-puzzle',      name: 'Pentomino Puzzle',       category: 'Drawing & Spatial', xp: 200, diff: 'Hard'     },
  { slug: 'star-placement',        name: 'Star Placement',         category: 'Drawing & Spatial', xp: 150, diff: 'Medium'   },
  // Olympiad
  { slug: 'polyhedral-nets',       name: 'Polyhedral Nets',        category: 'Olympiad',          xp: 300, diff: 'Olympiad' },
  { slug: 'combinatorial-lock',    name: 'Combinatorial Lock',     category: 'Olympiad',          xp: 300, diff: 'Olympiad' },
  { slug: 'recursive-sequence',    name: 'Recursive Sequence',     category: 'Olympiad',          xp: 300, diff: 'Olympiad' },
  { slug: 'eulers-problem',        name: "Euler's Problem",        category: 'Olympiad',          xp: 300, diff: 'Olympiad' },
  { slug: 'infinite-series',       name: 'Infinite Series',        category: 'Olympiad',          xp: 300, diff: 'Olympiad' },
  // Extreme
  { slug: 'rubiks-cube',           name: "Rubik's Cube 2×2",       category: 'Extreme',           xp: 400, diff: 'Extreme'  },
  { slug: 'sat-problem',           name: 'SAT Problem',            category: 'Extreme',           xp: 400, diff: 'Extreme'  },
  { slug: 'graph-coloring',        name: 'Graph Coloring',         category: 'Extreme',           xp: 400, diff: 'Extreme'  },
  { slug: 'partition-problem',     name: 'Partition Problem',      category: 'Extreme',           xp: 400, diff: 'Extreme'  },
  { slug: 'travelling-salesman',   name: 'Travelling Salesman',    category: 'Extreme',           xp: 400, diff: 'Extreme'  },
];

const DIFF_BADGE = {
  Medium:  'bg-duo-blue/10 text-duo-blue',
  Hard:    'bg-duo-red/10 text-duo-red',
  Olympiad:'bg-duo-yellow/20 text-yellow-700',
  Extreme: 'bg-gray-100 text-gray-600',
};

const emptyMazeForm = { opens_at: '', closes_at: '', week_number: '', xp_reward: '' };

function PublishGameForm({ game, adminSecret, onSuccess, onCancel }) {
  const [form, setForm] = useState({ ...emptyMazeForm, xp_reward: String(game.xp) });
  const [loading, setLoading] = useState(false);

  function set(field, value) { setForm((p) => ({ ...p, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.opens_at || !form.closes_at || !form.week_number) {
      toast.error('Fill in opens at, closes at, and week number');
      return;
    }
    setLoading(true);
    try {
      await apiClient({
        method: 'post',
        url: '/api/admin/challenges',
        data: {
          title: `Midweek Maze: ${game.name}`,
          description: `This week's Midweek Maze challenge is ${game.name} — a ${game.category} puzzle. Complete it before the window closes to earn XP!`,
          challenge_type: 'midweek_maze',
          answer_key: game.slug,
          question_type: 'text',
          week_number: parseInt(form.week_number),
          opens_at: new Date(form.opens_at).toISOString(),
          closes_at: new Date(form.closes_at).toISOString(),
          xp_reward: parseInt(form.xp_reward) || game.xp,
          partial_xp: 0,
        },
        headers: { 'x-admin-secret': adminSecret },
      });
      toast.success(`${game.name} published!`);
      onSuccess();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleSubmit}
      className="overflow-hidden border-t border-surface-border bg-surface-off p-4 space-y-3"
    >
      <p className="font-display font-bold text-sm text-text-dark">Publish: {game.name}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-display font-bold text-text-mid mb-1">Opens At *</label>
          <div className="flex gap-1">
            <input type="datetime-local" value={form.opens_at} onChange={(e) => set('opens_at', e.target.value)} className="input text-xs flex-1" required />
            <button type="button" onClick={() => set('opens_at', formatDateForInput(new Date().toISOString()))}
              className="px-2 py-1.5 rounded-lg border-2 border-duo-blue text-duo-blue font-display font-bold text-xs hover:bg-duo-blue hover:text-white transition-colors flex-shrink-0">
              Now
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-display font-bold text-text-mid mb-1">Closes At *</label>
          <input type="datetime-local" value={form.closes_at} onChange={(e) => set('closes_at', e.target.value)} className="input text-xs" required />
        </div>
        <div>
          <label className="block text-xs font-display font-bold text-text-mid mb-1">Week Number *</label>
          <input type="number" min="1" value={form.week_number} onChange={(e) => set('week_number', e.target.value)} placeholder="e.g. 7" className="input text-xs" required />
        </div>
        <div>
          <label className="block text-xs font-display font-bold text-text-mid mb-1">XP Reward</label>
          <input type="number" min="1" value={form.xp_reward} onChange={(e) => set('xp_reward', e.target.value)} className="input text-xs" />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-1.5 disabled:opacity-60">
          <Icon.Rocket className="w-3.5 h-3.5" />
          {loading ? 'Publishing…' : 'Publish Game'}
        </button>
      </div>
    </motion.form>
  );
}

function GameCard({ game, adminSecret, onPublished, publishedSlug }) {
  const [publishing, setPublishing] = useState(false);
  const isLive = publishedSlug === game.slug;
  const meta = CATEGORY_META[game.category] || CATEGORY_META['Extreme'];

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all ${isLive ? 'border-duo-blue shadow-blue' : 'border-surface-border bg-white'}`}>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="font-display font-bold text-sm text-text-dark leading-tight">{game.name}</p>
          {isLive && <span className="bg-duo-blue text-white font-display font-bold text-xs px-2 py-0.5 rounded-full animate-pulse flex-shrink-0">LIVE</span>}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`inline-block text-xs font-display font-bold px-2 py-0.5 rounded-full border ${meta.color}`}>
            {game.category}
          </span>
          <span className={`inline-block text-xs font-display font-bold px-2 py-0.5 rounded-full ${DIFF_BADGE[game.diff] || DIFF_BADGE.Hard}`}>
            {game.diff}
          </span>
          <span className="inline-block text-xs font-mono text-text-muted bg-surface-off px-2 py-0.5 rounded-full">
            {game.xp} XP
          </span>
        </div>
        <button
          onClick={() => setPublishing(!publishing)}
          className={`w-full py-2 text-xs font-display font-bold rounded-xl border-2 transition-all flex items-center justify-center gap-1 ${
            publishing
              ? 'border-surface-border text-text-mid bg-surface-off'
              : 'border-duo-blue text-duo-blue hover:bg-duo-blue hover:text-white'
          }`}
        >
          {publishing ? (
            <><Icon.XMark className="w-3.5 h-3.5" /> Cancel</>
          ) : (
            <><Icon.Rocket className="w-3.5 h-3.5" /> Publish</>
          )}
        </button>
      </div>
      <AnimatePresence>
        {publishing && (
          <PublishGameForm
            game={game}
            adminSecret={adminSecret}
            onSuccess={() => { setPublishing(false); onPublished(); }}
            onCancel={() => setPublishing(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MidweekMazeTab({ challenges, adminSecret, onAction }) {
  const mazeChallenges = challenges.filter((c) => c.challenge_type === 'midweek_maze');
  const liveSlug = mazeChallenges.find((c) => c.is_active)?.answer_key || null;

  const categories = [...new Set(GAMES_LIST.map((g) => g.category))];

  async function handleToggleMaze(challenge) {
    try {
      await apiClient({
        method: 'patch',
        url: `/api/admin/challenges/${challenge.id}`,
        data: { is_active: !challenge.is_active },
        headers: { 'x-admin-secret': adminSecret },
      });
      toast.success(challenge.is_active ? 'Game deactivated' : 'Game activated!');
      onAction();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDeleteMaze(challenge) {
    if (!confirm(`Remove "${challenge.title}" from the schedule? This also removes all submissions.`)) return;
    try {
      await apiClient({
        method: 'delete',
        url: `/api/admin/challenges/${challenge.id}`,
        headers: { 'x-admin-secret': adminSecret },
      });
      toast.success('Removed');
      onAction();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Published maze challenges */}
      <div>
        <h3 className="font-display font-black text-lg text-text-dark mb-3">
          Scheduled Games
          <span className="font-mono text-text-muted font-normal text-sm ml-2">({mazeChallenges.length})</span>
        </h3>

        {mazeChallenges.length === 0 ? (
          <div className="card text-center py-8">
            <Icon.Rocket className="w-10 h-10 text-text-muted mx-auto mb-2" />
            <p className="font-display font-bold text-text-mid text-sm">No games scheduled yet — publish one below</p>
          </div>
        ) : (
          <div className="space-y-2">
            {mazeChallenges.map((c) => {
              const game = GAMES_LIST.find((g) => g.slug === c.answer_key);
              const meta = game ? CATEGORY_META[game.category] : CATEGORY_META['Extreme'];
              return (
                <div key={c.id} className={`flex items-center gap-3 p-3 rounded-2xl border-2 bg-white ${c.is_active ? 'border-duo-blue' : 'border-surface-border'}`}>
                  {game && (
                    <span className={`inline-block text-xs font-display font-bold px-2 py-1 rounded-xl border ${meta.color} flex-shrink-0`}>
                      {game.category}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-display font-bold text-sm text-text-dark truncate">{game?.name ?? c.title}</p>
                      {c.is_active && <span className="bg-duo-blue text-white font-display font-bold text-xs px-2 py-0.5 rounded-full animate-pulse flex-shrink-0">LIVE</span>}
                    </div>
                    <p className="font-mono text-xs text-text-muted">
                      Wk {c.week_number} · {new Date(c.opens_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {' — '}
                      {new Date(c.closes_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {' · '}{c.xp_reward} XP
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleMaze(c)}
                      className={`text-xs font-display font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 ${c.is_active ? 'btn-secondary' : 'btn-primary'}`}
                    >
                      {c.is_active ? <><Icon.Pause className="w-3.5 h-3.5" /> Deactivate</> : <><Icon.Play className="w-3.5 h-3.5" /> Activate</>}
                    </button>
                    <button onClick={() => handleDeleteMaze(c)} className="text-xs font-display font-bold px-2 py-1.5 rounded-xl bg-duo-red/10 text-duo-red hover:bg-duo-red hover:text-white transition-colors">
                      <Icon.Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Game library by category */}
      <div>
        <h3 className="font-display font-black text-lg text-text-dark mb-1">Game Library</h3>
        <p className="font-body text-sm text-text-muted mb-4">41 puzzle games — click Publish to schedule any game as this week's Midweek Maze</p>

        {categories.map((cat) => {
          const games = GAMES_LIST.filter((g) => g.category === cat);
          const meta = CATEGORY_META[cat] || CATEGORY_META['Extreme'];
          return (
            <div key={cat} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                <h4 className="font-display font-bold text-base text-text-dark">{cat}</h4>
                <span className="font-mono text-xs text-text-muted">({games.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {games.map((game) => (
                  <GameCard
                    key={game.slug}
                    game={game}
                    adminSecret={adminSecret}
                    onPublished={onAction}
                    publishedSlug={liveSlug}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Main Admin Dashboard
// ─────────────────────────────────────────
export default function Admin() {
  const [adminSecret, setAdminSecret] = useState(ADMIN_SECRET);
  const [unlocked, setUnlocked] = useState(!!ADMIN_SECRET);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('challenges');
  const queryClient = useQueryClient();

  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () =>
      apiClient({ method: 'get', url: '/api/admin/stats', headers: { 'x-admin-secret': adminSecret } }).then((r) => r.data),
    enabled: unlocked,
    staleTime: 60_000,
  });

  const { data: challengesData, isLoading } = useQuery({
    queryKey: ['admin-challenges'],
    queryFn: () =>
      apiClient({ method: 'get', url: '/api/admin/challenges', headers: { 'x-admin-secret': adminSecret } }).then((r) => r.data),
    enabled: unlocked,
    staleTime: 30_000,
  });

  function handleUnlock(secret) {
    setAdminSecret(secret);
    setUnlocked(true);
  }

  function refreshAll() {
    queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-surface-off">
        <AdminLock onUnlock={handleUnlock} />
      </div>
    );
  }

  const challenges = challengesData?.challenges || [];
  const stats = statsData?.stats;

  const statCards = [
    { label: 'Students', value: stats?.total_students, icon: <Icon.Users className="w-6 h-6 text-duo-blue" /> },
    { label: 'Challenges', value: stats?.total_challenges, icon: <Icon.Lightning className="w-6 h-6 text-duo-blue" /> },
    { label: 'Submissions', value: stats?.total_submissions, icon: <Icon.ClipboardList className="w-6 h-6 text-duo-purple" /> },
  ];

  return (
    <div className="min-h-screen bg-surface-off">
      <motion.div {...pageTransition} className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Icon.Wrench className="w-6 h-6 text-duo-blue" />
              <h1 className="font-display font-black text-2xl text-text-dark">Admin Dashboard</h1>
            </div>
            <p className="font-body text-text-muted text-sm">ISAG Quiz Platform — Admin Control Center</p>
          </div>
          {activeTab === 'challenges' && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 btn-primary px-5 py-2.5 text-sm"
            >
              {showCreateForm ? (
                <><Icon.XMark className="w-4 h-4" /> Cancel</>
              ) : (
                <><Icon.Plus className="w-4 h-4" /> New Challenge</>
              )}
            </button>
          )}
        </div>

        {/* Tab Bar */}
        <div className="flex gap-2 border-b-2 border-surface-border pb-0">
          {[
            { id: 'challenges', label: 'Weekly Challenges', icon: <Icon.ClipboardList className="w-4 h-4" /> },
            { id: 'maze',       label: 'Midweek Maze',      icon: <Icon.Target className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setShowCreateForm(false); }}
              className={`flex items-center gap-2 font-display font-bold text-sm px-4 py-3 border-b-2 -mb-0.5 transition-all ${
                activeTab === tab.id
                  ? 'border-duo-blue text-duo-blue'
                  : 'border-transparent text-text-mid hover:text-text-dark'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        {stats && (
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-3 gap-4">
            {statCards.map((s) => (
              <motion.div key={s.label} variants={staggerItem} className="card text-center">
                <div className="flex justify-center mb-1">{s.icon}</div>
                <p className="font-mono font-black text-2xl text-duo-blue">{s.value}</p>
                <p className="font-body text-xs text-text-muted">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Create Challenge Form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="card border-2 border-duo-blue/30">
                <div className="flex items-center gap-2 mb-5">
                  <Icon.Plus className="w-5 h-5 text-duo-blue" />
                  <h2 className="font-display font-black text-xl text-text-dark">Create New Challenge</h2>
                </div>
                <ChallengeForm
                  adminSecret={adminSecret}
                  onSuccess={() => { setShowCreateForm(false); refreshAll(); }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-black text-xl text-text-dark">
                All Challenges <span className="font-mono text-text-muted font-normal text-base">({challenges.filter((c) => c.challenge_type !== 'midweek_maze').length})</span>
              </h2>
              <button onClick={refreshAll} className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5">
                <Icon.Refresh className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>

            {isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            )}

            {!isLoading && challenges.filter((c) => c.challenge_type !== 'midweek_maze').length === 0 && (
              <div className="card text-center py-12">
                <Icon.ClipboardList className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="font-display font-bold text-text-mid">No challenges yet — create your first one!</p>
              </div>
            )}

            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
              {challenges.filter((c) => c.challenge_type !== 'midweek_maze').map((challenge) => (
                <motion.div key={challenge.id} variants={staggerItem}>
                  <ChallengeRow
                    challenge={challenge}
                    adminSecret={adminSecret}
                    onAction={refreshAll}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}

        {/* Midweek Maze Tab */}
        {activeTab === 'maze' && (
          <div>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : (
              <MidweekMazeTab
                challenges={challenges}
                adminSecret={adminSecret}
                onAction={refreshAll}
              />
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
