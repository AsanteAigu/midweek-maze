import { useState } from 'react';
import { motion } from 'framer-motion';
import { getAvatarUrl, generateRandomSeed } from '../utils/avatar';
import { scaleIn } from '../animations/presets';
import Icon from './Icons';

const AVATAR_STYLES = [
  { id: 'adventurer', label: 'Adventurer' },
  { id: 'pixel-art', label: 'Pixel Art' },
  { id: 'lorelei', label: 'Lorelei' },
  { id: 'micah', label: 'Micah' },
  { id: 'fun-emoji', label: 'Fun Emoji' },
];

export default function AvatarPicker({ seed, onSeedChange }) {
  const [style, setStyle] = useState('adventurer');
  const [inputSeed, setInputSeed] = useState(seed || '');

  function handleSeedChange(newSeed) {
    setInputSeed(newSeed);
    onSeedChange(newSeed);
  }

  function handleRandomize() {
    handleSeedChange(generateRandomSeed());
  }

  return (
    <div className="space-y-4">
      {/* Avatar preview */}
      <div className="flex flex-col items-center gap-3">
        <motion.div {...scaleIn} key={`${seed}-${style}`}>
          <img
            src={getAvatarUrl(seed || 'preview', style, 120)}
            alt="Your avatar"
            className="w-28 h-28 rounded-3xl border-4 border-surface-border shadow-card bg-white"
          />
        </motion.div>
        <span className="text-sm font-body text-text-mid">Live preview</span>
      </div>

      {/* Style selector */}
      <div>
        <label className="block text-sm font-display font-bold text-text-dark mb-2">
          Avatar Style
        </label>
        <div className="flex flex-wrap gap-2">
          {AVATAR_STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStyle(s.id)}
              className={`px-3 py-1.5 rounded-xl text-sm font-body font-semibold transition-all ${
                style === s.id
                  ? 'bg-duo-blue text-white shadow-blue'
                  : 'bg-white border-2 border-surface-border text-text-mid hover:border-duo-blue'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Seed input */}
      <div>
        <label className="block text-sm font-display font-bold text-text-dark mb-2">
          Avatar Seed <span className="text-text-muted font-normal">(any text generates a unique avatar)</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputSeed}
            onChange={(e) => handleSeedChange(e.target.value)}
            placeholder="e.g. cool-engineer-42"
            className="input flex-1"
          />
          <button
            type="button"
            onClick={handleRandomize}
            title="Randomize avatar"
            className="btn-secondary px-4 py-3"
          >
            <Icon.Dice className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
