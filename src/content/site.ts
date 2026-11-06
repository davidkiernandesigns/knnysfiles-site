/* All site content lives here until Sanity is added after client approval.
   The exports match the planned Sanity documents: settings, about and projects.
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

const tones: Tone[] = ['mocha', 'taupe', 'umber', 'stone', 'taupe', 'mocha', 'umber', 'stone'];

const placeholderPhotos = (count: number): Photo[] =>
  Array.from({ length: count }, (_, i) => ({
    file: `photo_${String(421 + i).padStart(4, '0')}.jpg`,
    image: null,
    alt: `placeholder: photo ${i + 1}`,
    date: '[month year]',
    location: '[venue, city]',
    tone: tones[i % tones.length],
  }));

const description = '[a few lines on this set: where it was shot, who it was for, what made the day.]';

export const site = {
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

export const about = {
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

export const projects: Project[] = [
  { slug: 'weddings', name: 'weddings', order: 1, cover: '/assets/wedding.jpg', description, photos: placeholderPhotos(24) },
  { slug: 'portraits', name: 'portraits', order: 2, cover: '/assets/wedding.jpg', description, photos: placeholderPhotos(18) },
  { slug: 'graduations', name: 'graduations', order: 3, cover: '/assets/wedding.jpg', description, photos: placeholderPhotos(16) },
  { slug: 'misc', name: 'misc', order: 4, cover: '/assets/wedding.jpg', description, photos: placeholderPhotos(20) },
].sort((a, b) => a.order - b.order);

export const projectPath = (slug: string) => `/work/${slug}`;
