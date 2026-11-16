import type { ReactNode } from 'react';
import { Providers } from '@/components/Providers';
import { Nav } from '@/components/Nav';
import { Tracker } from '@/components/Tracker';
import { ContentProvider } from '@/content/context';
import { getContent } from '@/server/content';

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const content = await getContent();
  return (
    <ContentProvider content={content}>
      <Providers>
        <Nav />
        {children}
        <Tracker />
      </Providers>
    </ContentProvider>
  );
}
