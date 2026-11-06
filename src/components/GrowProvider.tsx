'use client';

import { useLenis } from 'lenis/react';
import { animate } from 'motion';
import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { projectPath } from '@/content/site';
import { isSmall, prefersReducedMotion } from '@/lib';
import { transition } from '@/transition';
import { SiteLink } from './SiteLink';

type Kind = 'folder' | 'icon';
type Origin = { slug: string; kind: Kind; scrollY: number; href: string };
type Grow = {
  open: (art: HTMLElement, slug: string, kind: Kind) => void;
  close: (slug: string, push: boolean) => void;
};

const GrowContext = createContext<Grow>({ open: () => {}, close: () => {} });
const DURATION = { duration: 0.46, ease: [0.3, 0.8, 0.2, 1] as const };
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/* The window grows out of the clicked folder and shrinks back into it on the way home. */
export function GrowProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();
  const ref = useRef<HTMLDivElement>(null);
  const origin = useRef<Origin | null>(null);
  const pending = useRef<{ path: string; run: () => void } | null>(null);
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  const place = (rect: { left: number; top: number; width: number; height: number }) => {
    const el = ref.current!;
    Object.assign(el.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      opacity: '1',
      transform: 'none',
    });
    el.hidden = false;
  };

  useEffect(() => {
    if (pending.current?.path !== pathname) return;
    const { run } = pending.current;
    pending.current = null;
    run();
  }, [pathname]);

  const open = useCallback<Grow['open']>(
    async (art, slug, kind) => {
      const el = ref.current;
      if (!el) return;
      const from = art.getBoundingClientRect();
      const path = projectPath(slug);
      if (pathRef.current === '/') {
        origin.current = { slug, kind, scrollY: window.scrollY, href: window.location.hash ? '/#work' : '/' };
      }
      const small = isSmall();
      const to = small
        ? { left: 0, top: 48, width: window.innerWidth, height: window.innerHeight - 48 }
        : { left: 24, top: 72, width: window.innerWidth - 48, height: window.innerHeight - 96 };
      place(to);
      await animate(
        el,
        {
          x: [from.left - to.left, 0],
          y: [from.top - to.top, 0],
          scaleX: [from.width / to.width, 1],
          scaleY: [from.height / to.height, 1],
          opacity: [0.4, 1],
        },
        DURATION,
      );
      const finish = async () => {
        await new Promise((resolve) => setTimeout(resolve, 40));
        await animate(el, { opacity: 0 }, { duration: 0.2 });
        el.hidden = true;
      };
      if (path === window.location.pathname) {
        void finish();
        return;
      }
      pending.current = { path, run: finish };
      router.push(path);
    },
    [router],
  );

  const close = useCallback<Grow['close']>(
    (slug, push) => {
      const el = ref.current;
      const win = document.querySelector('.project-stage .window');
      if (!el || !win || prefersReducedMotion()) {
        if (push) router.push('/#work');
        return;
      }
      const from = win.getBoundingClientRect();
      const known = origin.current?.slug === slug ? origin.current : null;
      place(from);
      transition.returning = true;

      pending.current = {
        path: '/',
        run: async () => {
          const work = document.getElementById('work');
          const y = known ? known.scrollY : (work?.offsetTop ?? 0);
          if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
          else window.scrollTo(0, y);
          await frame();
          await frame();
          const selector = known?.kind === 'icon' ? `[data-grow-icon="${slug}"]` : `[data-grow="${slug}"]`;
          const to = document.querySelector(selector)?.getBoundingClientRect();
          transition.returning = false;
          if (to) {
            await animate(
              el,
              {
                x: [0, to.left - from.left],
                y: [0, to.top - from.top],
                scaleX: [1, to.width / from.width],
                scaleY: [1, to.height / from.height],
                opacity: [1, 0.4],
              },
              DURATION,
            );
          }
          el.hidden = true;
        },
      };
      if (push) router.push(known?.href ?? '/#work', { scroll: false });
    },
    [router, lenis],
  );

  /* The browser back button gets the same shrink. Next swaps the page before popstate fires, so this
     listens to the Navigation API, which runs first. Browsers without it fall back to the page dissolve. */
  useEffect(() => {
    const navigation = (window as unknown as { navigation?: EventTarget }).navigation;
    if (!navigation) return;
    const onNavigate = (event: Event) => {
      const { navigationType, destination } = event as Event & {
        navigationType: string;
        destination: { url: string };
      };
      const [, section, slug] = pathRef.current.split('/');
      if (navigationType !== 'traverse' || section !== 'work' || !slug) return;
      if (new URL(destination.url).pathname === '/') close(slug, false);
    };
    navigation.addEventListener('navigate', onNavigate);
    return () => navigation.removeEventListener('navigate', onNavigate);
  }, [close]);

  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <GrowContext.Provider value={value}>
      {children}
      <div ref={ref} className="grow" hidden aria-hidden="true" />
    </GrowContext.Provider>
  );
}

/* Spread onto a folder or desktop icon link, and put artRef on its artwork. */
export function useGrowClick(slug: string, kind: Kind, art: React.RefObject<HTMLElement | null>) {
  const { open } = useContext(GrowContext);
  return (event: MouseEvent) => {
    if (event.metaKey || event.ctrlKey || prefersReducedMotion() || !art.current) return;
    event.preventDefault();
    open(art.current, slug, kind);
  };
}

/* Any link from a project back to the work section. */
export function BackLink(props: Omit<ComponentProps<typeof SiteLink>, 'href'>) {
  const { close } = useContext(GrowContext);
  const pathname = usePathname();
  const handle = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || prefersReducedMotion()) return;
    event.preventDefault();
    close(pathname.split('/')[2], true);
  };
  return <SiteLink href="/#work" {...props} onClick={handle} />;
}
