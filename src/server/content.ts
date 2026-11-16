import { cache } from 'react';
import { connection } from 'next/server';
import { seed, type AboutDoc, type Content, type Photo, type Project, type SiteDoc, type Tone } from '@/content/site';
import { getDb } from './db';
import type { D1 } from './types';

const tones: Tone[] = ['mocha', 'taupe', 'umber', 'stone'];
const str = (v: unknown, max = 4000) => (typeof v === 'string' ? v.slice(0, max) : '');
const src = (v: unknown) => {
  const s = str(v, 500).trim();
  return /^(\/|https:\/\/)/.test(s) ? s : '';
};
const wall = (v: unknown, fallback: SiteDoc['heroWallpaper']): SiteDoc['heroWallpaper'] => {
  const o = (v ?? {}) as Record<string, unknown>;
  const s = src(o.src);
  const width = Number(o.width);
  const height = Number(o.height);
  return s && width > 0 && height > 0 ? { src: s, width: Math.round(width), height: Math.round(height) } : fallback;
};

/* Everything that arrives from the editor is cleaned here, so the public site can trust what it reads. */
export function cleanContent(input: unknown): Content | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, any>;
  const s = raw.site ?? {};
  const a = raw.about ?? {};
  const site: SiteDoc = {
    name: str(s.name, 80).trim() || seed.site.name,
    tagline: str(s.tagline, 200),
    city: str(s.city, 80),
    email: str(s.email, 200).trim(),
    emailShort: str(s.emailShort, 80).trim(),
    heroWallpaper: wall(s.heroWallpaper, seed.site.heroWallpaper),
    heroWallpaperSmall: wall(s.heroWallpaperSmall, seed.site.heroWallpaperSmall),
    inquiryIntro: str(s.inquiryIntro, 400),
    photoDimensions: str(s.photoDimensions, 60),
  };
  const about: AboutDoc = {
    portrait: src(a.portrait) || seed.about.portrait,
    portraitAlt: str(a.portraitAlt, 300),
    portraitFile: str(a.portraitFile, 80),
    bioLead: str(a.bioLead, 600),
    bioBody: str(a.bioBody, 3000),
    instagramHandle: str(a.instagramHandle, 80).trim(),
    instagramUrl: /^https:\/\//.test(str(a.instagramUrl, 300).trim()) ? str(a.instagramUrl, 300).trim() : seed.about.instagramUrl,
  };
  if (!Array.isArray(raw.projects)) return null;
  const used = new Set<string>();
  const projects: Project[] = [];
  for (const p of raw.projects.slice(0, 40)) {
    const name = str(p?.name, 80).trim();
    let slug = str(p?.slug, 80).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
    if (!name) continue;
    if (!slug) slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'folder';
    const base = slug;
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
    used.add(slug);
    const photos: Photo[] = (Array.isArray(p.photos) ? p.photos : []).slice(0, 400).map((x: Record<string, unknown>, i: number) => ({
      file: str(x?.file, 120) || `photo_${String(i + 1).padStart(4, '0')}.jpg`,
      image: src(x?.image) || null,
      alt: str(x?.alt, 300),
      date: str(x?.date, 80),
      location: str(x?.location, 160),
      tone: tones.includes(x?.tone as Tone) ? (x.tone as Tone) : tones[i % tones.length],
    }));
    projects.push({ slug, name, order: projects.length + 1, cover: src(p.cover) || seed.projects[0].cover, description: str(p.description, 1500), photos });
  }
  if (!projects.length) return null;
  return { site, about, projects };
}

function toWrites(db: D1, content: Content) {
  const upsert = (key: string, value: unknown) =>
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(key, JSON.stringify(value));
  return [
    upsert('site', content.site),
    upsert('about', content.about),
    db.prepare('DELETE FROM projects'),
    ...content.projects.map((p, i) =>
      db.prepare('INSERT INTO projects (slug, name, sort, cover, description, photos) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(p.slug, p.name, i + 1, p.cover, p.description, JSON.stringify(p.photos)),
    ),
  ];
}

export async function writeContent(db: D1, content: Content) {
  await db.batch(toWrites(db, content));
}

async function readContent(db: D1): Promise<Content> {
  const [settings, rows] = await Promise.all([
    db.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>(),
    db.prepare('SELECT slug, name, sort, cover, description, photos FROM projects ORDER BY sort').all<{
      slug: string; name: string; sort: number; cover: string; description: string; photos: string;
    }>(),
  ]);
  if (!settings.results.length && !rows.results.length) {
    await writeContent(db, seed);
    return seed;
  }
  const doc = (key: string) => {
    const row = settings.results.find((r) => r.key === key);
    try { return row ? JSON.parse(row.value) : {}; } catch { return {}; }
  };
  return {
    site: { ...seed.site, ...doc('site') },
    about: { ...seed.about, ...doc('about') },
    projects: rows.results.map((r) => ({
      slug: r.slug, name: r.name, order: r.sort, cover: r.cover, description: r.description,
      photos: (() => { try { return JSON.parse(r.photos) as Photo[]; } catch { return []; } })(),
    })),
  };
}

/* Server components call this. It is per request, and it opts the page out of static rendering so edits show up. */
export const getContent = cache(async (): Promise<Content> => {
  await connection();
  try {
    const db = await getDb();
    return db ? await readContent(db) : seed;
  } catch (error) {
    console.error('content: falling back to the starting content', error);
    return seed;
  }
});

/* The admin reads the same thing without opting into anything. */
export async function getContentForAdmin(): Promise<{ content: Content; connected: boolean }> {
  const db = await getDb();
  return { content: db ? await readContent(db) : seed, connected: Boolean(db) };
}
