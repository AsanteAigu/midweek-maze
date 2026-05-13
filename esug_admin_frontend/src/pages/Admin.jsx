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
                    {!challenge.is_scored && (
                      <button onClick={handleManualScore} className="flex items-center gap-1.5 bg-duo-purple text-white font-display font-bold text-sm px-3 py-2 rounded-xl hover:opacity-90 transition-opacity">
                        <Icon.Target className="w-4 h-4" />
                        Score Now
                      </button>
                    )}
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
// Main Admin Dashboard
// ─────────────────────────────────────────
export default function Admin() {
  const [adminSecret, setAdminSecret] = useState(ADMIN_SECRET);
  const [unlocked, setUnlocked] = useState(!!ADMIN_SECRET);
  const [showCreateForm, setShowCreateForm] = useState(false);
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
            <p className="font-body text-text-muted text-sm">Midweek Maze — Admin Control Center</p>
          </div>
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

        {/* Challenges List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-black text-xl text-text-dark">
              All Challenges <span className="font-mono text-text-muted font-normal text-base">({challenges.length})</span>
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

          {!isLoading && challenges.length === 0 && (
            <div className="card text-center py-12">
              <Icon.ClipboardList className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="font-display font-bold text-text-mid">No challenges yet — create your first one!</p>
            </div>
          )}

          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
            {challenges.map((challenge) => (
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
      </motion.div>
    </div>
  );
}
