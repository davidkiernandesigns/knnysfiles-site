'use client';

import { useEffect, useRef, useState } from 'react';

/* Startup screen, first load of the session on the home page only. The inline script in layout.tsx sets data-preload
   before paint. The intro animations stay paused until this lifts, so they play as the screen fades. */
export function Preload() {
  const [gone, setGone] = useState(false);
  const [ready, setReady] = useState(false);
  const [out, setOut] = useState(false);
  const [run, setRun] = useState(false);
  const [fill, setFill] = useState(250);
  const started = useRef(0);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.dataset.preload) return setGone(true);
    started.current = performance.now();
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setRun(true)));
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      const left = Math.max(250, 1500 - (performance.now() - started.current));
      setFill(left);
      setReady(true);
      const wait = left + 200;
      setTimeout(() => {
        setOut(true);
        delete root.dataset.preload;
        setTimeout(() => setGone(true), 500);
      }, wait);
    };
    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish, { once: true });
    const cap = setTimeout(finish, 3500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(cap);
      window.removeEventListener('load', finish);
    };
  }, []);

  if (gone) return null;
  return (
    <div className={`preload${run ? ' run' : ''}${ready ? ' ready' : ''}${out ? ' out' : ''}`} aria-hidden="true">
      <div className="preload-word">knnysfiles</div>
      <div className="preload-bar"><i style={ready ? { transitionDuration: `${fill}ms` } : undefined} /></div>
    </div>
  );
}
