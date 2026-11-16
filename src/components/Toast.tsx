'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { EASE } from '@/lib';

/* A macOS-style notification banner. Rendered into <body> so no transformed section can trap it. */
export function Toast({ show, onDone, title, body }: { show: boolean; onDone: () => void; title: string; body: string }) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDone, 5200);
    return () => clearTimeout(t);
  }, [show, onDone]);

  if (!mounted) return null;
  return createPortal(
    <div className="toast-zone" role="status" aria-live="polite">
      <AnimatePresence>
        {show && (
          <motion.button
            type="button"
            className="toast"
            onClick={onDone}
            aria-label={`${title}: ${body}. dismiss`}
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: 'calc(100% + 24px)' }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: 'calc(100% + 24px)' }}
            transition={reduced ? { duration: 0.2 } : { type: 'spring', stiffness: 420, damping: 34 }}
          >
            <span className="toast-icon" aria-hidden="true">k</span>
            <span className="toast-text">
              <span className="toast-head"><b>{title}</b><time>now</time></span>
              <span>{body}</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
