import Image, { getImageProps } from 'next/image';

/* Every image on the site goes through this file, so moving to Sanity's image CDN is one small swap here. */

type Props = { src: string; alt: string; sizes: string; className?: string };

export function SiteImage({ src, alt, sizes, className }: Props) {
  return <Image className={className} src={src} alt={alt} sizes={sizes} fill />;
}

type Source = { src: string; width: number; height: number };

export function Wallpaper({ large, small }: { large: Source; small: Source }) {
  const common = { alt: '', sizes: '100vw', priority: true };
  const { props: desktop } = getImageProps({ ...common, ...large });
  const { props: mobile } = getImageProps({ ...common, ...small });
  return (
    <picture>
      <source media="(max-width: 767px)" srcSet={mobile.srcSet} sizes="100vw" />
      <img {...desktop} alt="" />
    </picture>
  );
}
