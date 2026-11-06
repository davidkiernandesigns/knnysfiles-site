'use client';

import { useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { clamp, prefersReducedMotion } from '@/lib';

/* How far a section's center sits from the viewport's center, in viewport heights, clamped to ±1.2. */
export function useDrift<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const drift = useTransform(scrollYProgress, (t) => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return 0;
    const vh = window.innerHeight;
    return clamp((1 + el.offsetHeight / vh) * (0.5 - t), -1.2, 1.2);
  });
  return { ref, drift };
}
