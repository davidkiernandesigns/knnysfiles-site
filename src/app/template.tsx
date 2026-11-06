'use client';

import { motion } from 'motion/react';
import { useEffect, type ReactNode } from 'react';
import { transition } from '@/transition';

/* Figma: every page change is a 300ms dissolve. The first load is left to the intro. */
let firstRender = true;

export default function Template({ children }: { children: ReactNode }) {
  const initial = firstRender || transition.returning ? false : { opacity: 0 };
  useEffect(() => {
    firstRender = false;
  }, []);
  return (
    <motion.div initial={initial} animate={{ opacity: 1 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}
