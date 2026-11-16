'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { track } from '@/track';

let last = { path: '', at: 0 };

/* A page view per route, and a click count for the links worth knowing about. */
export function Tracker() {
  const pathname = usePathname();

  useEffect(() => {
    // React can run this effect twice in development; one view per path per moment is enough
    if (last.path === pathname && Date.now() - last.at < 1500) return;
    last = { path: pathname, at: Date.now() };
    track('view', pathname);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.('a');
      const href = link?.getAttribute('href') ?? '';
      if (href.includes('instagram.com')) track('click', location.pathname, 'instagram');
      else if (href.startsWith('mailto:')) track('click', location.pathname, 'email');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
