import Image, { getImageProps, type ImageLoader } from 'next/image';

/* Every image on the site goes through this file. Built-in photos go through next/image's optimizer.
   Photos uploaded in /admin are resized by the /media route instead (?w=), and Unsplash examples by Unsplash. */

const mediaLoader: ImageLoader = ({ src, width }) => `${src}?w=${width}`;
/* example photos from Unsplash are resized by Unsplash's own image CDN */
const unsplashLoader: ImageLoader = ({ src, width, quality }) => `${src}?w=${width}&q=${quality ?? 75}&auto=format&fit=max`;
const loaderFor = (src: string) =>
  src.startsWith('/media/') ? mediaLoader : src.startsWith('https://images.unsplash.com/') ? unsplashLoader : undefined;

type Props = { src: string; alt: string; sizes: string; className?: string };

export function SiteImage({ src, alt, sizes, className }: Props) {
  return <Image className={className} src={src} alt={alt} sizes={sizes} loader={loaderFor(src)} fill />;
}

type Source = { src: string; width: number; height: number };

export function Wallpaper({ large, small }: { large: Source; small: Source }) {
  const common = { alt: '', sizes: '100vw', priority: true };
  const { props: desktop } = getImageProps({ ...common, ...large, loader: loaderFor(large.src) });
  const { props: mobile } = getImageProps({ ...common, ...small, loader: loaderFor(small.src) });
  return (
    <picture>
      <source media="(max-width: 767px)" srcSet={mobile.srcSet} sizes="100vw" />
      <img {...desktop} alt="" />
    </picture>
  );
}
