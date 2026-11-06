'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import Link from 'next/link';
import { useRef, type CSSProperties } from 'react';
import { about, projectPath, projects, site } from '@/content/site';
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

export function Hero() {
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
        <div className="icons">
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
