export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
};

export const slideDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.35, ease: 'easeOut' },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.85 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.3, ease: [0.175, 0.885, 0.32, 1.275] },
};

export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: 'easeInOut' },
};

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.07 } },
};

export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
};

export const bounceIn = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] },
};

export const xpPopAnimation = {
  initial: { opacity: 0, y: 0, scale: 0.5 },
  animate: {
    opacity: [0, 1, 1, 0],
    y: [0, -16, -28, -40],
    scale: [0.5, 1.2, 1, 0.8],
  },
  transition: { duration: 1.5, ease: 'easeOut' },
};

export const characterFloat = {
  animate: {
    y: [0, -12, 0],
    rotate: [-2, 2, -2],
    transition: {
      duration: 3,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};
