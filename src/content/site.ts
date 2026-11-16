import { exampleCover, exampleDescriptions, examplePhotos } from './examples';
/* The starting content. The live site reads from the database (see src/server/content.ts) and is seeded from here
   the first time it runs, or whenever the database isn't connected, so the site never renders empty.
   Photo counts and the filmstrip come from each project's photos, so nothing here is counted by hand. */

export type Tone = 'mocha' | 'taupe' | 'umber' | 'stone';

export type Photo = {
  file: string;
  image: string | null; // null shows a tone placeholder until the real photo is added
  alt: string;
  date: string;
  location: string;
  tone: Tone;
};

export type Project = {
  slug: string;
  name: string;
  order: number;
  cover: string;
  description: string;
  photos: Photo[];
};

/* placeholder generator, kept for reference: real photos or the examples in ./examples.ts are used now */
const tones: Tone[] = ['mocha', 'taupe', 'umber', 'stone', 'taupe', 'mocha', 'umber', 'stone'];

export const placeholderPhotos = (count: number): Photo[] =>
  Array.from({ length: count }, (_, i) => ({
    file: `photo_${String(421 + i).padStart(4, '0')}.jpg`,
    image: null,
    alt: `placeholder: photo ${i + 1}`,
    date: '[month year]',
    location: '[venue, city]',
    tone: tones[i % tones.length],
  }));

export const placeholderDescription = '[a few lines on this set: where it was shot, who it was for, what made the day.]';

export type Wallpaper = { src: string; width: number; height: number };

export type SiteDoc = {
  name: string; tagline: string; city: string; email: string; emailShort: string;
  heroWallpaper: Wallpaper; heroWallpaperSmall: Wallpaper; inquiryIntro: string; photoDimensions: string;
};

export type AboutDoc = {
  portrait: string; portraitAlt: string; portraitFile: string; bioLead: string; bioBody: string;
  instagramHandle: string; instagramUrl: string;
};

export type Content = { site: SiteDoc; about: AboutDoc; projects: Project[] };

export const site: SiteDoc = {
  name: 'knnysfiles',
  tagline: 'photographs of the days you want to keep.',
  city: 'CT',
  email: '[email address]',
  emailShort: '[email]',
  heroWallpaper: { src: '/assets/hero.jpg', width: 2560, height: 1440 },
  heroWallpaperSmall: { src: '/assets/hero-sm.jpg', width: 1000, height: 563 },
  inquiryIntro: "tell me about the shoot and i'll reply with availability and pricing.",
  photoDimensions: '[6000 × 4000]',
};

export const about: AboutDoc = {
  portrait: '/assets/portrait.jpg',
  portraitAlt: 'Kenny Graham walking on a sand dune with a camera',
  portraitFile: '[name].jpg',
  bioLead:
    "i'm Kenny Graham, a photographer in CT. i shoot weddings, portraits, graduations and anything else worth keeping.",
  bioBody:
    "[two or three lines from him: how he works, what he cares about, what it's like to be photographed by him.]",
  instagramHandle: '@knnysfiles',
  instagramUrl: 'https://www.instagram.com/knnysfiles/',
};

const example = (slug: string, order: number): Project => ({
  slug, name: slug, order, cover: exampleCover(slug), description: exampleDescriptions[slug], photos: examplePhotos(slug),
});

export const projects: Project[] = [example('weddings', 1), example('portraits', 2), example('graduations', 3), example('misc', 4)];

export const projectPath = (slug: string) => `/work/${slug}`;

export const seed: Content = { site, about, projects };
