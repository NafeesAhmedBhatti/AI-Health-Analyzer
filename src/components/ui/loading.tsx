'use client';

import { motion } from 'framer-motion';

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-3' };
  return (
    <div className={`${sizeMap[size]} border-neon-blue/30 border-t-neon-blue rounded-full animate-spin`} />
  );
}

export function PageLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center py-20"
    >
      <Spinner size="lg" />
    </motion.div>
  );
}

export default PageLoader;