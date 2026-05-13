/**
 * Generate a DiceBear adventurer-style avatar URL.
 * Using 'adventurer' style for fun character look (Duolingo vibe).
 * Fallback to 'pixel-art' as specified in the project docs.
 */
export function getAvatarUrl(seed, style = 'adventurer', size = 64) {
  const safeSeed = encodeURIComponent(seed || 'default');
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${safeSeed}&size=${size}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

export function getPixelAvatarUrl(seed, size = 64) {
  const safeSeed = encodeURIComponent(seed || 'default');
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${safeSeed}&size=${size}`;
}

export function generateRandomSeed() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export const COURSE_LABELS = {
  computer_engineering: 'Computer Eng.',
  agriculture_engineering: 'Agriculture Eng.',
  biomedical_engineering: 'Biomedical Eng.',
  material_engineering: 'Material Eng.',
  food_processing: 'Food Processing Eng.',
};

export const LEVEL_LABELS = {
  100: 'Level 100',
  200: 'Level 200',
  300: 'Level 300',
  400: 'Level 400',
};
