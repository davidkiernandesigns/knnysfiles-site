'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';
import { EASE } from '@/lib';
import { transition } from '@/transition';

type Props = { children: ReactNode; small?: boolean; delay?: number; className?: string; style?: CSSProperties };

/* Rests on a visible state: opacity starts at .25, so nothing depends on scrolling to be readable. */
export function Reveal({ children, small, delay = 0, className, style }: Props) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={`reveal ${className ?? ''}`}
      style={style}
      initial={transition.returning ? false : { opacity: 0.25, y: small ? 26 : 56 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: '0px 0px -6% 0px' }}
      transition={{ duration: reduced ? 0 : 0.9, ease: EASE, delay: reduced ? 0 : delay / 1000 }}
    >
      {children}
    </motion.div>
  );
}
