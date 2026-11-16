'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import Link from 'next/link';
import { useEffect, useRef, type CSSProperties } from 'react';
import { useContent } from '@/content/context';
import { projectPath } from '@/content/site';
import { clamp, isSmall, prefersReducedMotion } from '@/lib';
import { useGrowClick } from './GrowProvider';
import { AliasIcon, FolderIcon, TextIcon } from './Icons';
import { SiteLink } from './SiteLink';
import { Wallpaper } from './SiteImage';

function FolderLink({ slug, label, index }: { slug: string; label: string; index: number }) {
  const art = useRef<HTMLSpanElement>(null);
  const open = useGrowClick(slug, 'icon', art);
  return (
    <Link className="icon" href={projectPath(slug)} style={{ '--i': index } as CSSProperties} onClick={open}>
      <span className="icon-art" ref={art} data-grow-icon={slug}><FolderIcon /></span>
      <span className="icon-label">{label}</span>
    </Link>
  );
}

/* macOS Dock magnification: icons swell as the pointer passes over the row. Mouse and trackpad only. */
function useDock() {
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = row.current;
    if (!box || prefersReducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const arts = Array.from(box.querySelectorAll<HTMLElement>('.icon-art'));
    let x: number | null = null;
    let frame = 0;
    const apply = () => {
      frame = 0;
      for (const art of arts) {
        if (x === null) {
          art.style.removeProperty('--dock');
          continue;
        }
        const r = art.getBoundingClientRect();
        const d = Math.min(1, Math.abs(x - (r.left + r.width / 2)) / 170);
        art.style.setProperty('--dock', (1 + 0.42 * (Math.cos(d * Math.PI) + 1) / 2).toFixed(3));
      }
    };
    const move = (e: MouseEvent) => {
      x = e.clientX;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const leave = () => {
      x = null;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    box.addEventListener('mousemove', move);
    box.addEventListener('mouseleave', leave);
    return () => {
      cancelAnimationFrame(frame);
      box.removeEventListener('mousemove', move);
      box.removeEventListener('mouseleave', leave);
    };
  }, []);
  return row;
}

export function Hero() {
  const { about, projects, site } = useContent();
  const dock = useDock();
  const { scrollY } = useScroll();
  const drift = (rate: number) => (y: number) =>
    prefersReducedMotion() ? 0 : y * rate * (isSmall() ? 0.35 : 1);
  const wallY = useTransform(scrollY, drift(0.28));
  const titleY = useTransform(scrollY, drift(0.12));
  const wordOpacity = useTransform(scrollY, (y) =>
    typeof window === 'undefined' || prefersReducedMotion() ? 1 : clamp(1 - y / (window.innerHeight * 0.75), 0, 1),
  );

  return (
    <section className="hero" id="top">
      <motion.div className="hero-wall" style={{ y: wallY }}>
        <Wallpaper large={site.heroWallpaper} small={site.heroWallpaperSmall} />
      </motion.div>
      <motion.div className="hero-title" style={{ y: titleY }}>
        <div className="hero-head">
          <motion.div style={{ opacity: wordOpacity }}>
            <h1 className="wordmark">{site.name}</h1>
          </motion.div>
          <p className="visually-hidden">{site.tagline}</p>
        </div>
        <div className="icons" ref={dock}>
          {projects.map((p, i) => (
            <FolderLink key={p.slug} slug={p.slug} label={p.name} index={i} />
          ))}
          <SiteLink className="icon" href="/#about" style={{ '--i': 4 } as CSSProperties}>
            <span className="icon-art"><TextIcon /></span>
            <span className="icon-label">about.txt</span>
          </SiteLink>
          <a className="icon" href={about.instagramUrl} target="_blank" rel="noopener" style={{ '--i': 5 } as CSSProperties}>
            <span className="icon-art"><AliasIcon /></span>
            <span className="icon-label">instagram</span>
          </a>
        </div>
      </motion.div>
    </section>
  );
}
