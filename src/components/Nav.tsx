'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useLenis } from 'lenis/react';
import { useEffect, useRef, useState } from 'react';
import { about, projectPath, projects, site } from '@/content/site';
import { EASE, isSmall } from '@/lib';
import { useMenu } from './Providers';
import { SiteImage } from './SiteImage';
import { SiteLink } from './SiteLink';
import { PathBar, TitleBar } from './Window';

const previews = [
  ...projects.map((p) => ({ key: p.slug, src: p.cover })),
  { key: 'about', src: about.portrait },
  { key: 'contact', src: site.heroWallpaperSmall.src },
];

function Menu({ button }: { button: React.RefObject<HTMLButtonElement | null> }) {
  const { setOpen } = useMenu();
  const [active, setActive] = useState(projects[0].slug);
  const panel = useRef<HTMLElement>(null);
  const [small] = useState(isSmall);
  const close = () => setOpen(false);

  useEffect(() => {
    panel.current?.querySelector<HTMLElement>('.menu-row')?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        button.current?.focus({ preventScroll: true });
      }
      if (event.key === 'Tab' && panel.current && button.current) {
        const items: HTMLElement[] = [button.current, ...panel.current.querySelectorAll('a')];
        const i = items.indexOf(document.activeElement as HTMLElement);
        event.preventDefault();
        items[(i + (event.shiftKey ? -1 : 1) + items.length) % items.length].focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [button, setOpen]);

  const row = (key: string) => ({
    'data-preview': key,
    className: `menu-row${active === key ? ' active' : ''}`,
    onMouseEnter: () => setActive(key),
    onFocus: () => setActive(key),
    onClick: close,
  });

  /* Figma: the window morphs out of a 64x44 box behind the menu icon. On mobile it slides up. */
  const hidden = small
    ? { y: '100%' }
    : { opacity: 0, x: -16, y: 2, scaleX: 64 / 836, scaleY: 44 / 560 };

  return (
    <>
      <motion.div
        className="scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={close}
      />
      <motion.nav
        ref={panel}
        className="window menu"
        aria-label="site menu"
        initial={hidden}
        animate={{ opacity: 1, x: 0, y: 0, scaleX: 1, scaleY: 1 }}
        exit={hidden}
        transition={{ duration: 0.35, ease: EASE }}
      >
        <TitleBar title="all files" onClose={close} />
        <div className="menu-body">
          <div className="menu-list" data-lenis-prevent>
            {projects.map((p) => (
              <SiteLink key={p.slug} {...row(p.slug)} className={`${row(p.slug).className} big`} href={projectPath(p.slug)}>
                {p.name}<small>{p.photos.length}</small>
              </SiteLink>
            ))}
            <SiteLink {...row('about')} className={`${row('about').className} small`} href="/#about">about.txt</SiteLink>
            <SiteLink {...row('contact')} className={`${row('contact').className} small`} href="/#contact">new inquiry</SiteLink>
            <a className="menu-row small" href={about.instagramUrl} target="_blank" rel="noopener" onClick={close}>instagram</a>
          </div>
          <div className="menu-preview" aria-hidden="true">
            {previews.map((p) => (
              <SiteImage key={p.key} className={active === p.key ? 'on' : undefined} src={p.src} alt="" sizes="(max-width: 767px) 100vw, 536px" />
            ))}
          </div>
        </div>
        <PathBar status={small ? site.emailShort : site.email}>{site.name}<b>›</b>menu</PathBar>
      </motion.nav>
    </>
  );
}

export function Nav() {
  const { open, setOpen } = useMenu();
  const button = useRef<HTMLButtonElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    document.body.classList.toggle('menu-open', open);
    const lock = open && isSmall();
    document.body.classList.toggle('locked', lock);
    if (lock) lenis?.stop();
    else lenis?.start();
  }, [open, lenis]);

  return (
    <>
      <header className="nav">
        <SiteLink className="logo" href="/">{site.name}</SiteLink>
        <div className="nav-actions">
          <SiteLink className="button button-small book" href="/#contact">book a shoot</SiteLink>
          <button
            ref={button}
            className="menu-button"
            type="button"
            aria-label={open ? 'close menu' : 'open menu'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <span className="line line-a" />
            <span className="line line-b" />
          </button>
        </div>
      </header>
      <AnimatePresence>{open && <Menu button={button} />}</AnimatePresence>
    </>
  );
}
