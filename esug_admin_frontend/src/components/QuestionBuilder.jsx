import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Icon from './Icons';
import apiClient from '../utils/axiosClient';

// ── Constants ────────────────────────────────────────────────────────────────
const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 'advanced', label: 'Advanced', color: 'bg-rose-100 text-rose-700 border-rose-300' },
  { value: 'general', label: 'General', color: 'bg-blue-100 text-blue-700 border-blue-300' },
];

const QUESTION_TYPES = [
  { value: 'text', label: 'Typed Answer', desc: 'Free text response', icon: <Icon.Pencil className="w-5 h-5" /> },
  { value: 'multiple_choice', label: 'Multiple Choice', desc: 'Pick one text option', icon: <Icon.ClipboardList className="w-5 h-5" /> },
  { value: 'true_false', label: 'True / False', desc: 'Binary choice', icon: <Icon.Check className="w-5 h-5" /> },
  { value: 'fill_blank', label: 'Fill in the Blank', desc: 'Complete the sentence', icon: <Icon.Pencil className="w-5 h-5" /> },
  { value: 'ordering', label: 'Ordering', desc: 'Sort items in correct order', icon: <Icon.ChevronDown className="w-5 h-5" /> },
  { value: 'image_mcq', label: 'Image + MCQ', desc: 'Picture stimulus, text options', icon: <Icon.Image className="w-5 h-5" /> },
  { value: 'image_guess', label: 'Image Guess', desc: 'Picture is the question', icon: <Icon.Image className="w-5 h-5" /> },
  { value: 'image_only_mcq', label: 'Image Options', desc: 'Pick the correct picture', icon: <Icon.Image className="w-5 h-5" /> },
];

const emptyForm = {
  difficulty: 'beginner',
  question_type: 'text',
  question_text: '',
  options: ['', '', '', ''],
  answer_key: '',
  xp_value: 50,
};

// ── Image uploader for a specific question ────────────────────────────────────
function QuestionImageUpload({ questionId, currentUrl, adminSecret, onDone }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  function pick(e) {
    const f = e.target.files[0];
    if (!f || !f.type.startsWith('image/')) { toast.error('Images only'); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error('Max 10MB'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function upload() {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      await apiClient({ method: 'post', url: `/api/admin/questions/${questionId}/image`, data: fd, headers: { 'x-admin-secret': adminSecret, 'Content-Type': 'multipart/form-data' } });
      toast.success('Image uploaded');
      setFile(null); setPreview(null);
      onDone();
    } catch (err) { toast.error(err.message); }
    finally { setUploading(false); }
  }

  return (
    <div className="space-y-2">
      {currentUrl && <img src={currentUrl} alt="question" className="w-full max-h-40 object-contain rounded-xl border border-surface-border" />}
      <div className="border-2 border-dashed border-surface-border rounded-xl p-4 text-center cursor-pointer hover:border-duo-blue transition-colors" onClick={() => fileRef.current?.click()}>
        <input ref={fileRef} type="file" accept="image/*" onChange={pick} className="hidden" />
        {preview
          ? <img src={preview} alt="preview" className="max-h-28 mx-auto rounded-lg object-contain" />
          : <div className="flex flex-col items-center gap-1"><Icon.Upload className="w-7 h-7 text-text-muted" /><p className="text-xs text-text-muted">Click to upload image</p></div>
        }
      </div>
      {file && (
        <div className="flex gap-2">
          <button onClick={() => { setFile(null); setPreview(null); }} className="btn-secondary flex-1 text-xs py-2">Cancel</button>
          <button onClick={upload} disabled={uploading} className="btn-primary flex-1 text-xs py-2 disabled:opacity-60">{uploading ? 'Uploading…' : 'Upload'}</button>
        </div>
      )}
    </div>
  );
}

// ── Single question editor ────────────────────────────────────────────────────
function QuestionEditor({ challengeId, adminSecret, question, onSaved, onDeleted }) {
  const isNew = !question;
  const [form, setForm] = useState(() => {
    if (!question) return { ...emptyForm };
    return {
      difficulty: question.difficulty,
      question_type: question.question_type,
      question_text: question.question_text,
      options: Array.isArray(question.options) && question.options.length >= 2 ? question.options : ['', '', '', ''],
      answer_key: question.answer_key || '',
      xp_value: question.xp_value || 50,
    };
  });
  const [loading, setLoading] = useState(false);
  const [showImg, setShowImg] = useState(false);

  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })); }

  function setOption(i, val) {
    setForm(prev => {
      const opts = [...prev.options];
      const old = opts[i];
      opts[i] = val;
      return { ...prev, options: opts, answer_key: prev.answer_key === old ? val : prev.answer_key };
    });
  }

  function addOption() { setForm(prev => ({ ...prev, options: [...prev.options, ''] })); }
  function removeOption(i) {
    setForm(prev => {
      const opts = prev.options.filter((_, idx) => idx !== i);
      return { ...prev, options: opts, answer_key: opts.includes(prev.answer_key) ? prev.answer_key : '' };
    });
  }

  // Build ordering answer_key from current options order
  const orderingKey = form.options.filter(Boolean).join('|||');

  async function save(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanOpts = form.options.map(o => String(o).trim()).filter(Boolean);

      if (['multiple_choice', 'image_mcq'].includes(form.question_type)) {
        if (cleanOpts.length < 2) { toast.error('Need at least 2 options'); setLoading(false); return; }
        if (!cleanOpts.includes(form.answer_key.trim())) { toast.error('Select the correct option'); setLoading(false); return; }
      }
      if (form.question_type === 'true_false') {
        if (!['True', 'False'].includes(form.answer_key)) { toast.error('Pick True or False'); setLoading(false); return; }
      }
      if (form.question_type === 'ordering') {
        if (cleanOpts.length < 2) { toast.error('Need at least 2 items to order'); setLoading(false); return; }
      }
      if (['text', 'fill_blank', 'image_guess'].includes(form.question_type)) {
        if (!form.answer_key.trim()) { toast.error('Answer key required'); setLoading(false); return; }
      }

      const payload = {
        difficulty: form.difficulty,
        question_type: form.question_type,
        question_text: form.question_text,
        options: form.question_type === 'true_false' ? ['True', 'False'] : cleanOpts,
        answer_key: form.question_type === 'ordering' ? orderingKey : form.answer_key.trim(),
        xp_value: parseInt(form.xp_value) || 50,
        sort_order: DIFFICULTIES.findIndex(d => d.value === form.difficulty),
      };

      if (isNew) {
        const res = await apiClient({ method: 'post', url: `/api/admin/challenges/${challengeId}/questions`, data: payload, headers: { 'x-admin-secret': adminSecret } });
        toast.success('Question added!');
        onSaved(res.data.question);
      } else {
        const res = await apiClient({ method: 'patch', url: `/api/admin/questions/${question.id}`, data: payload, headers: { 'x-admin-secret': adminSecret } });
        toast.success('Question updated!');
        onSaved(res.data.question);
      }
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  async function del() {
    if (!confirm('Delete this question?')) return;
    try {
      await apiClient({ method: 'delete', url: `/api/admin/questions/${question.id}`, headers: { 'x-admin-secret': adminSecret } });
      toast.success('Question deleted');
      onDeleted(question.id);
    } catch (err) { toast.error(err.message); }
  }

  const diff = DIFFICULTIES.find(d => d.value === form.difficulty);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border-2 border-surface-border rounded-2xl overflow-hidden bg-white">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-off border-b border-surface-border">
        <span className={`text-xs font-display font-bold px-2 py-0.5 rounded-full border ${diff?.color}`}>{diff?.label}</span>
        <div className="flex items-center gap-1">
          {!isNew && (
            <>
              <button onClick={() => setShowImg(!showImg)} className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1 ${showImg ? 'bg-duo-blue text-white' : 'bg-white border border-surface-border text-text-mid hover:border-duo-blue'}`}>
                <Icon.Image className="w-3 h-3" /> Image
              </button>
              <button onClick={del} className="text-xs px-2 py-1 rounded-lg border border-duo-red/40 text-duo-red hover:bg-duo-red/10 flex items-center gap-1">
                <Icon.Trash className="w-3 h-3" /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      <form onSubmit={save} className="p-4 space-y-4">
        {/* Difficulty + Type selectors */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-display font-bold text-text-dark mb-1">Difficulty</label>
            <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} className="input text-sm">
              {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-display font-bold text-text-dark mb-1">XP Value</label>
            <input type="number" min="1" value={form.xp_value} onChange={e => set('xp_value', e.target.value)} className="input text-sm" />
          </div>
        </div>

        {/* Question type picker */}
        <div>
          <label className="block text-xs font-display font-bold text-text-dark mb-2">Question Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {QUESTION_TYPES.map(t => (
              <button key={t.value} type="button" onClick={() => set('question_type', t.value)}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-center transition-all ${form.question_type === t.value ? 'border-duo-blue bg-duo-blue text-white' : 'border-surface-border bg-white text-text-mid hover:border-duo-blue'}`}>
                {t.icon}
                <span className="text-xs font-display font-bold leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Question text */}
        <div>
          <label className="block text-xs font-display font-bold text-text-dark mb-1">
            Question Text *{form.question_type === 'fill_blank' && <span className="font-normal text-text-muted ml-1">— use ___ for the blank</span>}
          </label>
          <textarea value={form.question_text} onChange={e => set('question_text', e.target.value)} rows={2} className="input resize-none text-sm" required placeholder={form.question_type === 'fill_blank' ? 'The ___ is the powerhouse of the cell.' : 'Enter your question here...'} />
        </div>

        {/* Type-specific fields */}
        {form.question_type === 'true_false' && (
          <div>
            <label className="block text-xs font-display font-bold text-text-dark mb-2">Correct Answer *</label>
            <div className="flex gap-2">
              {['True', 'False'].map(opt => (
                <button key={opt} type="button" onClick={() => set('answer_key', opt)}
                  className={`flex-1 py-2.5 rounded-xl border-2 font-display font-bold text-sm transition-all ${form.answer_key === opt ? 'border-duo-blue bg-duo-blue text-white' : 'border-surface-border bg-white text-text-mid hover:border-duo-blue'}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {['multiple_choice', 'image_mcq'].includes(form.question_type) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-display font-bold text-text-dark">Options *</label>
              <button type="button" onClick={addOption} className="btn-secondary text-xs px-2 py-1 flex items-center gap-1"><Icon.Plus className="w-3 h-3" /> Add</button>
            </div>
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button type="button" onClick={() => set('answer_key', opt)} disabled={!opt.trim()}
                  className={`h-9 w-9 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all ${form.answer_key === opt && opt.trim() ? 'border-duo-blue bg-duo-blue text-white' : 'border-surface-border bg-white text-text-muted disabled:opacity-40'}`}>
                  <Icon.Check className="w-3.5 h-3.5" />
                </button>
                <input type="text" value={opt} onChange={e => setOption(i, e.target.value)} placeholder={`Option ${i + 1}`} className="input flex-1 text-sm" />
                {form.options.length > 2 && (
                  <button type="button" onClick={() => removeOption(i)} className="btn-secondary h-9 w-9 flex items-center justify-center flex-shrink-0"><Icon.XMark className="w-3.5 h-3.5" /></button>
                )}
              </div>
            ))}
            <p className="text-xs text-text-muted">Click ✓ to mark the correct option.</p>
          </div>
        )}

        {form.question_type === 'ordering' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-display font-bold text-text-dark">Items in Correct Order *</label>
              <button type="button" onClick={addOption} className="btn-secondary text-xs px-2 py-1 flex items-center gap-1"><Icon.Plus className="w-3 h-3" /> Add item</button>
            </div>
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="h-9 w-9 rounded-xl bg-surface-off border border-surface-border flex items-center justify-center flex-shrink-0 text-xs font-mono font-bold text-text-muted">{i + 1}</span>
                <input type="text" value={opt} onChange={e => setOption(i, e.target.value)} placeholder={`Item ${i + 1}`} className="input flex-1 text-sm" />
                {form.options.length > 2 && (
                  <button type="button" onClick={() => removeOption(i)} className="btn-secondary h-9 w-9 flex items-center justify-center flex-shrink-0"><Icon.XMark className="w-3.5 h-3.5" /></button>
                )}
              </div>
            ))}
            <p className="text-xs text-text-muted">List items in the <strong>correct</strong> order — students will see them shuffled.</p>
            {form.options.filter(Boolean).length >= 2 && (
              <div className="bg-surface-off rounded-xl p-2 border border-surface-border">
                <p className="text-xs font-mono text-text-muted">Stored answer key: <span className="text-text-dark">{orderingKey}</span></p>
              </div>
            )}
          </div>
        )}

        {form.question_type === 'image_only_mcq' && (
          <div className="space-y-2">
            <label className="text-xs font-display font-bold text-text-dark">Option Labels * (upload images after saving)</label>
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button type="button" onClick={() => set('answer_key', opt)} disabled={!opt.trim()}
                  className={`h-9 w-9 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all ${form.answer_key === opt && opt.trim() ? 'border-duo-blue bg-duo-blue text-white' : 'border-surface-border bg-white text-text-muted disabled:opacity-40'}`}>
                  <Icon.Check className="w-3.5 h-3.5" />
                </button>
                <input type="text" value={opt} onChange={e => setOption(i, e.target.value)} placeholder={`Label ${i + 1} (e.g. "Option A")`} className="input flex-1 text-sm" />
                {form.options.length > 2 && (
                  <button type="button" onClick={() => removeOption(i)} className="btn-secondary h-9 w-9 flex items-center justify-center flex-shrink-0"><Icon.XMark className="w-3.5 h-3.5" /></button>
                )}
              </div>
            ))}
            <button type="button" onClick={addOption} className="btn-secondary text-xs px-2 py-1 flex items-center gap-1"><Icon.Plus className="w-3 h-3" /> Add option</button>
          </div>
        )}

        {['text', 'fill_blank', 'image_guess'].includes(form.question_type) && (
          <div>
            <label className="block text-xs font-display font-bold text-text-dark mb-1 flex items-center gap-1">
              <Icon.Key className="w-3.5 h-3.5 text-duo-red" /> Answer Key * <span className="font-normal text-duo-red">(never shown to students)</span>
            </label>
            <input type="text" value={form.answer_key} onChange={e => set('answer_key', e.target.value)} placeholder="Correct answer. Use | between alternatives" className="input text-sm font-mono" required />
            <p className="text-xs text-text-muted mt-1">Alternatives: beam | beams | a beam</p>
          </div>
        )}

        {/* Image upload (existing questions only) */}
        {!isNew && showImg && (
          <div className="p-3 rounded-xl bg-duo-blue/5 border border-duo-blue/20">
            <p className="text-xs font-display font-bold text-duo-blue mb-2 flex items-center gap-1"><Icon.Image className="w-3.5 h-3.5" /> Question Image</p>
            <QuestionImageUpload questionId={question.id} currentUrl={question.image_url} adminSecret={adminSecret} onDone={onSaved} />
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-60 text-sm">
          {loading ? 'Saving…' : isNew ? <><Icon.Plus className="w-4 h-4" /> Add Question</> : <><Icon.Check className="w-4 h-4" /> Save Question</>}
        </button>
      </form>
    </motion.div>
  );
}

// ── Main QuestionBuilder ──────────────────────────────────────────────────────
export default function QuestionBuilder({ challengeId, adminSecret, initialQuestions = [] }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [showNew, setShowNew] = useState(false);

  function onSaved(q) {
    setQuestions(prev => {
      const idx = prev.findIndex(x => x.id === q.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = q; return next; }
      return [...prev, q];
    });
    setShowNew(false);
  }

  function onDeleted(id) { setQuestions(prev => prev.filter(q => q.id !== id)); }

  const byDifficulty = { beginner: [], intermediate: [], advanced: [], general: [] };
  questions.forEach(q => { byDifficulty[q.difficulty]?.push(q); });

  return (
    <div className="space-y-4">
      {/* Existing questions grouped by difficulty */}
      {DIFFICULTIES.map(diff => {
        const qs = byDifficulty[diff.value];
        if (qs.length === 0) return null;
        return (
          <div key={diff.value}>
            <div className={`inline-flex items-center gap-1.5 text-xs font-display font-bold px-3 py-1 rounded-full border mb-2 ${diff.color}`}>
              {diff.label} — {qs.length} question{qs.length > 1 ? 's' : ''}
            </div>
            <div className="space-y-3">
              {qs.sort((a, b) => a.sort_order - b.sort_order).map(q => (
                <QuestionEditor key={q.id} challengeId={challengeId} adminSecret={adminSecret} question={q} onSaved={onSaved} onDeleted={onDeleted} />
              ))}
            </div>
          </div>
        );
      })}

      {questions.length === 0 && !showNew && (
        <div className="text-center py-8 bg-surface-off rounded-2xl border-2 border-dashed border-surface-border">
          <Icon.ClipboardList className="w-10 h-10 text-text-muted mx-auto mb-2" />
          <p className="font-display font-bold text-text-mid text-sm">No questions yet</p>
          <p className="text-xs text-text-muted mt-1">Add sub-questions by difficulty tier below</p>
        </div>
      )}

      {/* New question editor */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="border-2 border-duo-blue/30 rounded-2xl overflow-hidden">
              <div className="px-4 py-2 bg-duo-blue/5 border-b border-duo-blue/20 flex items-center justify-between">
                <p className="font-display font-bold text-sm text-duo-blue">New Question</p>
                <button onClick={() => setShowNew(false)} className="text-text-muted hover:text-duo-red transition-colors"><Icon.XMark className="w-4 h-4" /></button>
              </div>
              <QuestionEditor challengeId={challengeId} adminSecret={adminSecret} question={null} onSaved={onSaved} onDeleted={() => {}} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showNew && (
        <button onClick={() => setShowNew(true)} className="w-full border-2 border-dashed border-duo-blue/40 rounded-2xl py-3 flex items-center justify-center gap-2 font-display font-bold text-sm text-duo-blue hover:border-duo-blue hover:bg-duo-blue/5 transition-all">
          <Icon.Plus className="w-4 h-4" /> Add Question
        </button>
      )}
    </div>
  );
}
