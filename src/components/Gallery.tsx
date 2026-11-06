'use client';

import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import type { Photo, Project } from '@/content/site';
import { site } from '@/content/site';
import { prefersReducedMotion } from '@/lib';
import { BackLink } from './GrowProvider';
import { Back, Forward, GalleryIcon, Grid, List } from './Icons';
import { useMenu } from './Providers';
import { SiteImage } from './SiteImage';
import { SiteLink } from './SiteLink';
import { PathBar, Sidebar, TitleBar } from './Window';

type View = 'icons' | 'list' | 'gallery';

function Shot({ photo, label, sizes }: { photo: Photo; label?: boolean; sizes: string }) {
  if (photo.image) return <SiteImage src={photo.image} alt={label ? photo.alt : ''} sizes={sizes} />;
  return <span className={`ph tone-${photo.tone}`}>{label ? photo.alt : ''}</span>;
}

const viewButtons: { id: View; label: string; Icon: () => React.JSX.Element }[] = [
  { id: 'icons', label: 'icon view', Icon: Grid },
  { id: 'list', label: 'list view', Icon: List },
  { id: 'gallery', label: 'gallery view', Icon: GalleryIcon },
];

export function Gallery({ project }: { project: Project }) {
  const { photos, name, slug, description } = project;
  const total = photos.length;
  const { open: menuOpen } = useMenu();
  const [index, setIndex] = useState(0);
  const [view, setView] = useState<View>('gallery');
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0, 1, photos.length - 1]));
  const indexRef = useRef(0);
  const stage = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const swipeStart = useRef<number | null>(null);
  const offset = useMotionValue(0);
  const x = useTransform(offset, (v) => `${v}%`);

  const show = useCallback(
    async (to: number, mode: 'slide' | 'instant' = 'slide') => {
      const from = indexRef.current;
      indexRef.current = to;
      setIndex(to);
      /* full-size photos load on demand: the current one and its neighbours */
      setSeen((s) => new Set([...s, to, (to + 1) % total, (to - 1 + total) % total]));
      const target = -to * 100;
      if (mode === 'instant' || prefersReducedMotion()) {
        offset.set(target);
      } else if (Math.abs(to - from) > 1 && stage.current) {
        /* wrapping past the ends cuts through a quick fade instead of racing across every photo */
        await animate(stage.current, { opacity: 0 }, { duration: 0.14 });
        offset.set(target);
        await animate(stage.current, { opacity: 1 }, { duration: 0.14 });
      } else {
        animate(offset, target, { duration: 0.38, ease: 'easeInOut' });
      }
    },
    [offset, total],
  );

  const step = useCallback((d: number) => show((indexRef.current + d + total) % total), [show, total]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (menuOpen || view !== 'gallery') return;
      if (/INPUT|TEXTAREA|SELECT/.test((document.activeElement as HTMLElement)?.tagName)) return;
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen, step, view]);

  useEffect(() => {
    const el = strip.current;
    const thumb = el?.children[index] as HTMLElement | undefined;
    if (!el || !thumb || el.scrollWidth <= el.clientWidth) return;
    el.scrollTo({ left: thumb.offsetLeft - (el.clientWidth - thumb.offsetWidth) / 2, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [index]);

  const swipeEnd = (event: PointerEvent) => {
    if (swipeStart.current === null) return;
    const dx = event.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(dx) > 40 && !(event.target as HTMLElement).closest('.slide-control')) step(dx < 0 ? 1 : -1);
  };

  const openPhoto = (i: number) => {
    setView('gallery');
    show(i, 'instant');
  };

  const photo = photos[index];
  const views = (
    <div className="views" role="group" aria-label="view">
      {viewButtons.map(({ id, label, Icon }) => (
        <button key={id} type="button" aria-pressed={view === id} aria-label={label} onClick={() => setView(id)}>
          <Icon />
        </button>
      ))}
    </div>
  );

  return (
    <section className="project-stage">
      <h1 className="visually-hidden">{name}</h1>
      <div className="window" data-view={view}>
        <TitleBar title={name} back views={views} />
        <div className="gallery">
          <Sidebar active={slug} />
          <div className="viewer">
            <motion.div
              ref={stage}
              className="stage"
              aria-roledescription="carousel"
              onPointerDown={(e) => { swipeStart.current = e.clientX; }}
              onPointerUp={swipeEnd}
              onPointerCancel={() => { swipeStart.current = null; }}
            >
              <motion.div className="rail" style={{ x }}>
                {photos.map((p, i) => (
                  <div className="slide" key={p.file}>
                    {seen.has(i) && <Shot photo={p} label sizes="(max-width: 1023px) 100vw, 862px" />}
                  </div>
                ))}
              </motion.div>
              <div className="slide-control">
                <button type="button" aria-label="previous photo" onClick={() => step(-1)}><Back /></button>
                <span aria-live="polite">{index + 1} of {total}</span>
                <button type="button" aria-label="next photo" onClick={() => step(1)}><Forward /></button>
              </div>
            </motion.div>
            <div className="strip" ref={strip}>
              {photos.map((p, i) => (
                <button
                  key={p.file}
                  className="thumb"
                  type="button"
                  aria-label={`show photo ${i + 1}`}
                  aria-current={i === index ? 'true' : undefined}
                  onClick={() => show(i)}
                >
                  <Shot photo={p} sizes="110px" />
                </button>
              ))}
            </div>
          </div>
          <div className="info">
            <b>{photo.file}</b>
            <dl>
              <div className="kind"><dt>kind</dt><dd>jpeg image</dd></div>
              <div className="kind"><dt>dimensions</dt><dd>{site.photoDimensions}</dd></div>
              <div><dt>shot</dt><dd>{photo.date}</dd></div>
              <div><dt>location</dt><dd>{photo.location}</dd></div>
            </dl>
            <p>{description}</p>
          </div>
          <div className="grid-view">
            {photos.map((p, i) => (
              <button key={p.file} type="button" onClick={() => openPhoto(i)}>
                <span className="grid-shot"><Shot photo={p} sizes="(max-width: 767px) 50vw, 25vw" /></span>
                {p.file}
              </button>
            ))}
          </div>
          <div className="list-view">
            {photos.map((p, i) => (
              <button key={p.file} type="button" onClick={() => openPhoto(i)}>
                <span>{p.file}</span><span>{p.date}</span><span>{p.location}</span>
              </button>
            ))}
          </div>
        </div>
        <PathBar status={`${index + 1} of ${total}`}>
          <SiteLink href="/">{site.name}</SiteLink><b>›</b><BackLink>work</BackLink><b>›</b>{name}
        </PathBar>
      </div>
      <BackLink className="back-pill" aria-label="close folder, back to work"><Back />work</BackLink>
    </section>
  );
}
