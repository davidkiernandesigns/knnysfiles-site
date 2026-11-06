'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { about, site } from '@/content/site';
import { isSmall, prefersReducedMotion } from '@/lib';
import { SiteLink } from './SiteLink';

export function Footer() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  /* the footer is off screen at 0, so it can start flat and match the server render */
  const y = useTransform(scrollYProgress, (rise) =>
    rise <= 0 || prefersReducedMotion() ? 0 : (1 - rise) * (isSmall() ? 26 : 90),
  );

  return (
    <footer className="footer" ref={ref}>
      <div className="foot-links">
        <nav aria-label="footer">
          <SiteLink href="/#work">work</SiteLink>
          <SiteLink href="/#about">about</SiteLink>
          <SiteLink href="/#contact">contact</SiteLink>
          <a href={about.instagramUrl} target="_blank" rel="noopener">{about.instagramHandle}</a>
        </nav>
        <span>{site.email}</span>
      </div>
      <motion.p className="foot-word" aria-hidden="true" style={{ y }}>{site.name}</motion.p>
      <p className="legal">© 2026 {site.name}</p>
    </footer>
  );
}
