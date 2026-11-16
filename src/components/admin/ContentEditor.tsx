'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { Content, Photo, Project, Tone } from '@/content/site';
import { uploadImage } from './upload';

const tones: Tone[] = ['mocha', 'taupe', 'umber', 'stone'];

const move = <T,>(list: T[], from: number, to: number) => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
};

function Field({ label, value, onChange, wide, area }: { label: string; value: string; onChange: (v: string) => void; wide?: boolean; area?: boolean }) {
  return (
    <label className={`lab${wide ? ' wide' : ''}`}>
      {label}
      {area ? <textarea value={value} onChange={(e) => onChange(e.target.value)} /> : <input value={value} onChange={(e) => onChange(e.target.value)} />}
    </label>
  );
}

function Picture({ src, label, onFile, busy }: { src: string; label: string; onFile: (file: File) => void; busy: boolean }) {
  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) onFile(file);
  };
  return (
    <div className="picture">
      {src ? <img src={src} alt="" /> : <span className="ph tone-taupe" />}
      <label className="btn ghost small">
        {busy ? 'uploading…' : label}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} disabled={busy} hidden />
      </label>
    </div>
  );
}

export function ContentEditor({ initial, connected }: { initial: Content; connected: boolean }) {
  const [content, setContent] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState('');
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState('');
  const [open, setOpen] = useState<number | null>(initial.projects[0] ? 0 : null);
  const saving = useRef(false);

  const change = (fn: (c: Content) => Content) => {
    setContent(fn);
    setDirty(true);
    setStatus('');
  };

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => dirty && e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const setSite = <K extends keyof Content['site']>(key: K, value: Content['site'][K]) => change((c) => ({ ...c, site: { ...c.site, [key]: value } }));
  const setAbout = <K extends keyof Content['about']>(key: K, value: Content['about'][K]) => change((c) => ({ ...c, about: { ...c.about, [key]: value } }));
  const setProject = (index: number, patch: Partial<Project>) =>
    change((c) => ({ ...c, projects: c.projects.map((p, i) => (i === index ? { ...p, ...patch } : p)) }));
  const setPhoto = (pi: number, xi: number, patch: Partial<Photo>) =>
    change((c) => ({
      ...c,
      projects: c.projects.map((p, i) => (i === pi ? { ...p, photos: p.photos.map((x, j) => (j === xi ? { ...x, ...patch } : x)) } : p)),
    }));

  const run = async (label: string, job: () => Promise<void>) => {
    setBusy(label);
    setFailed(false);
    setStatus('');
    try {
      await job();
    } catch (error) {
      setFailed(true);
      setStatus(error instanceof Error ? error.message : 'something went wrong');
    }
    setBusy('');
  };

  const addProject = () => {
    const name = `folder ${content.projects.length + 1}`;
    // the link is made from the name when it is first saved, then stays put
    change((c) => ({ ...c, projects: [...c.projects, { slug: '', name, order: c.projects.length + 1, cover: c.projects[0]?.cover ?? '/assets/wedding.jpg', description: '', photos: [] }] }));
    setOpen(content.projects.length);
  };

  const addPhotos = (pi: number, files: FileList) =>
    run(`photos-${pi}`, async () => {
      const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
      for (const file of list) {
        const up = await uploadImage(file, 2400);
        const photo: Photo = {
          file: file.name.replace(/[^\w.-]+/g, '_').slice(0, 100) || 'photo.jpg',
          image: up.src,
          alt: '',
          date: '',
          location: '',
          tone: tones[Math.floor(Math.random() * tones.length)],
        };
        change((c) => ({ ...c, projects: c.projects.map((p, i) => (i === pi ? { ...p, photos: [...p.photos, photo] } : p)) }));
      }
    });

  const save = async () => {
    if (saving.current) return;
    saving.current = true;
    setBusy('save');
    setFailed(false);
    const response = await fetch('/api/admin/content', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(content),
    }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as { content?: Content; error?: string } | null;
    if (response?.ok && data?.content) {
      setContent(data.content);
      setDirty(false);
      setStatus('saved. the site is updated.');
    } else {
      setFailed(true);
      setStatus(data?.error ?? 'could not save, try again');
    }
    setBusy('');
    saving.current = false;
  };

  const { site, about, projects } = content;
  const missingAlt = projects.reduce((n, p) => n + p.photos.filter((x) => x.image && !x.alt.trim()).length, 0);

  return (
    <>
      {!connected && <p className="note">the database isn&apos;t connected here, so saving is turned off. on Cloudflare it connects through the DB and MEDIA bindings.</p>}

      <section className="card">
        <h2>site</h2>
        <div className="fields">
          <Field label="name" value={site.name} onChange={(v) => setSite('name', v)} />
          <Field label="city" value={site.city} onChange={(v) => setSite('city', v)} />
          <Field label="tagline" value={site.tagline} onChange={(v) => setSite('tagline', v)} wide />
          <Field label="email" value={site.email} onChange={(v) => setSite('email', v)} />
          <Field label="short email (shown on phones)" value={site.emailShort} onChange={(v) => setSite('emailShort', v)} />
          <Field label="inquiry form intro" value={site.inquiryIntro} onChange={(v) => setSite('inquiryIntro', v)} wide area />
          <Field label="photo dimensions line (gallery info panel)" value={site.photoDimensions} onChange={(v) => setSite('photoDimensions', v)} wide />
        </div>
        <h3>home page photo</h3>
        <Picture
          src={site.heroWallpaperSmall.src}
          label="replace photo"
          busy={busy === 'hero'}
          onFile={(file) =>
            run('hero', async () => {
              const [large, small] = [await uploadImage(file, 2560), await uploadImage(file, 1000)];
              change((c) => ({ ...c, site: { ...c.site, heroWallpaper: large, heroWallpaperSmall: small } }));
            })
          }
        />
      </section>

      <section className="card">
        <h2>about</h2>
        <div className="fields">
          <Field label="statement" value={about.bioLead} onChange={(v) => setAbout('bioLead', v)} wide area />
          <Field label="bio" value={about.bioBody} onChange={(v) => setAbout('bioBody', v)} wide area />
          <Field label="photo file name (shown in the window title)" value={about.portraitFile} onChange={(v) => setAbout('portraitFile', v)} />
          <Field label="photo description (for screen readers)" value={about.portraitAlt} onChange={(v) => setAbout('portraitAlt', v)} />
          <Field label="instagram handle" value={about.instagramHandle} onChange={(v) => setAbout('instagramHandle', v)} />
          <Field label="instagram link" value={about.instagramUrl} onChange={(v) => setAbout('instagramUrl', v)} />
        </div>
        <Picture
          src={about.portrait}
          label="replace portrait"
          busy={busy === 'portrait'}
          onFile={(file) => run('portrait', async () => setAbout('portrait', (await uploadImage(file, 1600)).src))}
        />
      </section>

      <div className="adm-head">
        <h2 style={{ fontSize: 34 }}>folders</h2>
        <button type="button" className="btn ghost" onClick={addProject}>add a folder</button>
      </div>

      {projects.map((p, pi) => (
        <section className="card folder-card" key={pi}>
          <header>
            <input aria-label="folder name" value={p.name} onChange={(e) => setProject(pi, { name: e.target.value })} />
            <span className="pill">{p.photos.length} photos</span>
            <button type="button" className="btn ghost small" aria-label="move folder up" onClick={() => change((c) => ({ ...c, projects: move(c.projects, pi, pi - 1) }))}>↑</button>
            <button type="button" className="btn ghost small" aria-label="move folder down" onClick={() => change((c) => ({ ...c, projects: move(c.projects, pi, pi + 1) }))}>↓</button>
            <button type="button" className="btn ghost small" onClick={() => setOpen(open === pi ? null : pi)}>{open === pi ? 'collapse' : 'edit'}</button>
          </header>

          {open === pi && (
            <>
              <Field label="description (shown in the gallery info panel)" value={p.description} onChange={(v) => setProject(pi, { description: v })} area />
              <h3>folder cover</h3>
              <Picture src={p.cover} label="replace cover" busy={busy === `cover-${pi}`} onFile={(file) => run(`cover-${pi}`, async () => setProject(pi, { cover: (await uploadImage(file, 1000)).src }))} />

              <h3>photos</h3>
              <label className="drop">
                {busy === `photos-${pi}` ? 'uploading…' : 'add photos (choose one or many)'}
                <input type="file" multiple accept="image/jpeg,image/png,image/webp" hidden disabled={Boolean(busy)} onChange={(e) => { const f = e.target.files; if (f?.length) addPhotos(pi, f); e.target.value = ''; }} />
              </label>
              <div className="photos">
                {p.photos.map((x, xi) => (
                  <div className="photo" key={x.file + xi}>
                    {x.image ? <img className="thumb" src={x.image} alt="" /> : <span className={`thumb tone-${x.tone}`}>placeholder</span>}
                    <div className="meta">
                      <Field label="file name" value={x.file} onChange={(v) => setPhoto(pi, xi, { file: v })} />
                      <Field label="date" value={x.date} onChange={(v) => setPhoto(pi, xi, { date: v })} />
                      <Field label="location" value={x.location} onChange={(v) => setPhoto(pi, xi, { location: v })} />
                      <div className="wide"><Field label={x.image && !x.alt.trim() ? 'description for screen readers (needed)' : 'description for screen readers'} value={x.alt} onChange={(v) => setPhoto(pi, xi, { alt: v })} /></div>
                    </div>
                    <div className="ctl">
                      <button type="button" className="btn ghost small" aria-label="move photo up" onClick={() => change((c) => ({ ...c, projects: c.projects.map((q, i) => (i === pi ? { ...q, photos: move(q.photos, xi, xi - 1) } : q)) }))}>↑</button>
                      <button type="button" className="btn ghost small" aria-label="move photo down" onClick={() => change((c) => ({ ...c, projects: c.projects.map((q, i) => (i === pi ? { ...q, photos: move(q.photos, xi, xi + 1) } : q)) }))}>↓</button>
                      <label className="btn ghost small">
                        {busy === `photo-${pi}-${xi}` ? '…' : x.image ? 'replace' : 'add image'}
                        <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) run(`photo-${pi}-${xi}`, async () => setPhoto(pi, xi, { image: (await uploadImage(f, 2400)).src })); }} />
                      </label>
                      <button type="button" className="btn danger small" onClick={() => change((c) => ({ ...c, projects: c.projects.map((q, i) => (i === pi ? { ...q, photos: q.photos.filter((_, j) => j !== xi) } : q)) }))}>remove</button>
                    </div>
                  </div>
                ))}
                {!p.photos.length && <p className="empty">no photos yet.</p>}
              </div>

              <div className="row-actions">
                <button type="button" className="btn danger small" onClick={() => change((c) => ({ ...c, projects: c.projects.filter((_, i) => i !== pi) }))}>delete this folder</button>
                <span className="empty">{p.slug ? `its page is /work/${p.slug}, and that link stays the same if you rename it.` : 'its page link is made from the name when you save.'}</span>
              </div>
            </>
          )}
        </section>
      ))}

      <div className="savebar">
        <span className={failed ? 'err' : undefined} role="status">
          {status || (busy && busy !== 'save' ? 'uploading…' : dirty ? 'unsaved changes' : missingAlt ? `${missingAlt} photos need a description` : 'all saved')}
        </span>
        <button type="button" className="btn" onClick={save} disabled={!dirty || !connected || Boolean(busy)}>{busy === 'save' ? 'saving…' : 'save changes'}</button>
      </div>
    </>
  );
}
