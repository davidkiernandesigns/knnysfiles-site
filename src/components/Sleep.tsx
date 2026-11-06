'use client';

import { createContext, useContext, useEffect } from 'react';

type SleepState = { asleep: boolean; setAsleep: (v: boolean) => void };
export const SleepContext = createContext<SleepState>({ asleep: false, setAsleep: () => {} });
export const useSleep = () => useContext(SleepContext);

/* Black screen with a quiet hint. Any click or key wakes it. */
export function Sleep() {
  const { asleep, setAsleep } = useSleep();
  useEffect(() => {
    if (!asleep) return;
    const wake = () => setAsleep(false);
    window.addEventListener('keydown', wake);
    return () => window.removeEventListener('keydown', wake);
  }, [asleep, setAsleep]);
  return (
    <div className={`sleep${asleep ? ' on' : ''}`} role="dialog" aria-modal="true" aria-label="tab closed" aria-hidden={!asleep} onClick={() => setAsleep(false)}>
      <div className="preload-word">knnysfiles</div>
      <p>you can close this tab now. click anywhere to wake.</p>
    </div>
  );
}
