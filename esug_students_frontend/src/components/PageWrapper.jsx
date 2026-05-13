import { motion } from 'framer-motion';
import { pageTransition } from '../animations/presets';
import Navbar from './Navbar';

export default function PageWrapper({ children, className = '' }) {
  return (
    <div className="min-h-screen bg-surface-off">
      <Navbar />
      <motion.main
        {...pageTransition}
        className={`max-w-5xl mx-auto px-4 py-8 ${className}`}
      >
        {children}
      </motion.main>
    </div>
  );
}
