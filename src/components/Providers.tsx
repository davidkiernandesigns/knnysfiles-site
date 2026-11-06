'use client';

import 'lenis/dist/lenis.css';
import { ReactLenis, useLenis } from 'lenis/react';
import { MotionConfig } from 'motion/react';
import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { GrowProvider } from './GrowProvider';
import { Preload } from './Preload';
import { Sleep, SleepContext } from './Sleep';
import { prefersReducedMotion } from '@/lib';

type MenuState = { open: boolean; setOpen: (open: boolean) => void };
const MenuContext = createContext<MenuState>({ open: false, setOpen: () => {} });
export const useMenu = () => useContext(MenuContext);

/* Figma: 600ms ease-in-out to any section. */
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function useScrollTo() {
  const lenis = useLenis();
  return useCallback(
    (target: HTMLElement | number) => {
      const immediate = prefersReducedMotion();
      if (lenis) {
        lenis.scrollTo(target, { duration: 0.6, easing: inOut, immediate, force: true });
        return;
      }
      const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' });
    },
    [lenis],
  );
}

/* Lands each route at the top or at its #section, with no scroll animation. */
function RouteScroll() {
  const pathname = usePathname();
  const lenis = useLenis();
  useEffect(() => {
    const id = window.location.hash.slice(1);
    const target = id ? document.getElementById(id) : null;
    if (lenis) {
      lenis.resize();
      lenis.scrollTo(target ?? 0, { immediate: true, force: true });
    } else {
      window.scrollTo(0, target ? target.getBoundingClientRect().top + window.scrollY : 0);
    }
  }, [pathname, lenis]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menu = useMemo(() => ({ open, setOpen }), [open]);
  const [options] = useState(() => {
    const reduced = prefersReducedMotion();
    return { autoRaf: true, smoothWheel: !reduced, lerp: reduced ? 1 : 0.1 };
  });

  const [asleep, setAsleep] = useState(false);
  const sleep = useMemo(() => ({ asleep, setAsleep }), [asleep]);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <ReactLenis root options={options}>
      <MotionConfig reducedMotion="user">
        <MenuContext.Provider value={menu}>
          <SleepContext.Provider value={sleep}>
            <GrowProvider>
              <RouteScroll />
              {children}
            </GrowProvider>
            <Preload />
            <Sleep />
          </SleepContext.Provider>
        </MenuContext.Provider>
      </MotionConfig>
    </ReactLenis>
  );
}
