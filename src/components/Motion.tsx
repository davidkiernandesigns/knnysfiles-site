'use client';

import { motion, useInView, useReducedMotion } from 'motion/react';
import { createElement, useEffect, useRef, useState, type ReactNode } from 'react';
import { EASE } from '@/lib';
import { transition } from '@/transition';

/* Section animations. Each one plays once, rests on a readable state, and switches off for reduced motion. */

/* macOS-style window open: scales up from 92% and comes into focus. Spread onto any motion element. */
export function useWindowOpen(delay = 0) {
  const reduced = useReducedMotion();
  if (reduced || transition.returning) return {};
  return {
    initial: { opacity: 0.25, scale: 0.92, filter: 'blur(6px)' },
    whileInView: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: 0.75, ease: EASE, delay },
  };
}

/* Big titles drop in letter by letter, grouped by word so lines still wrap between words. */
export function SplitTitle({ text, as = 'h2', className, delay = 0 }: { text: string; as?: 'h1' | 'h2'; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  const Tag = motion[as];
  let n = 0;
  return (
    <Tag
      className={className}
      aria-label={text}
      initial={reduced || transition.returning ? false : 'hidden'}
      whileInView="show"
      viewport={{ once: true, amount: 0.6 }}
    >
      {text.split(' ').map((word, w, words) => (
        <span key={w} aria-hidden="true">
          <span className="split-word">
            {Array.from(word).map((ch) => {
              const i = n++;
              return (
                <span key={i} className="split-mask">
                  <motion.span
                    className="split-char"
                    variants={{ hidden: { y: '105%' }, show: { y: '0%', transition: { duration: 0.6, ease: EASE, delay: delay + i * 0.035 } } }}
                  >
                    {ch}
                  </motion.span>
                </span>
              );
            })}
          </span>
          {w < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </Tag>
  );
}

/* Text that types itself out like a file being written, with a caret. The untyped part keeps its space, so nothing reflows. */
export function TypeText({ text, className, as = 'h2' }: { text: string; className?: string; as?: 'h2' | 'p' }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(text.length);
  const [caret, setCaret] = useState(false);
  const armed = useRef(false);

  useEffect(() => {
    if (reduced || transition.returning) return;
    armed.current = true;
    setShown(0);
  }, [reduced, text]);

  useEffect(() => {
    if (!inView || !armed.current) return;
    armed.current = false;
    setCaret(true);
    const duration = Math.min(1600, text.length * 22);
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setShown(Math.round(t * text.length));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const off = setTimeout(() => setCaret(false), duration + 1800);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(off);
    };
  }, [inView, text]);

  return createElement(
    as,
    { ref, className, 'aria-label': text },
    <span aria-hidden="true">{text.slice(0, shown)}</span>,
    caret ? <span className="type-caret" aria-hidden="true" /> : null,
    <span className="type-rest" aria-hidden="true">{text.slice(shown)}</span>,
  ) as ReactNode;
}
