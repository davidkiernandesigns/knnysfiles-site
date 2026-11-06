export const EASE = [0.22, 0.8, 0.24, 1] as const;
export const SMALL = '(max-width: 767px)';

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isSmall = () => typeof window !== 'undefined' && window.matchMedia(SMALL).matches;
