import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import { Providers } from '@/components/Providers';
import { Nav } from '@/components/Nav';
import { site } from '@/content/site';
import './globals.css';

const inter = localFont({
  src: [
    { path: '../fonts/inter-latin-400-normal.woff2', weight: '400' },
    { path: '../fonts/inter-latin-500-normal.woff2', weight: '500' },
  ],
  variable: '--font-inter',
  display: 'swap',
});

const leagueGothic = localFont({
  src: '../fonts/league-gothic-latin-400-normal.woff2',
  weight: '400',
  variable: '--font-league-gothic',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: site.name, template: `%s, ${site.name}` },
  description: 'knnysfiles, photography by Kenny Graham.',
};

export const viewport: Viewport = { themeColor: '#141211', viewportFit: 'cover' };

/* Runs before first paint so the intro never flashes. Only plays on a fresh load of the home page. */
const introScript = `(function(){try{
var r=document.documentElement;
if(location.pathname!=='/'||location.hash||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var seen=false;try{seen=sessionStorage.getItem('knnys-intro')==='1';sessionStorage.setItem('knnys-intro','1')}catch(e){}
r.dataset.intro=seen?'repeat':'first';
}catch(e){}})()`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${leagueGothic.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <noscript>
          <style>{'.reveal{opacity:1!important;transform:none!important}'}</style>
        </noscript>
      </head>
      <body>
        <Providers>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
