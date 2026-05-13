import { motion } from 'framer-motion';
import { xpPopAnimation } from '../animations/presets';
import Icon from './Icons';

export default function XpBadge({ xp, animate = false, size = 'md' }) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
    xl: 'text-2xl px-5 py-2',
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  };

  const content = (
    <>
      <Icon.Star className={`${iconSize[size]} fill-current`} />
      <span>{xp} XP</span>
    </>
  );

  if (animate) {
    return (
      <motion.span
        className={`inline-flex items-center gap-1 bg-duo-yellow text-text-dark font-display font-black rounded-full ${sizeClasses[size]}`}
        {...xpPopAnimation}
      >
        {content}
      </motion.span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 bg-duo-yellow text-text-dark font-display font-bold rounded-full ${sizeClasses[size]}`}>
      {content}
    </span>
  );
}
