import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Gallery } from '@/components/Gallery';
import { Folder } from '@/components/Folder';
import { SiteLink } from '@/components/SiteLink';
import { getContent } from '@/server/content';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { projects } = await getContent();
  return { title: projects.find((p) => p.slug === slug)?.name };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const { about, projects, site } = await getContent();
  const index = projects.findIndex((p) => p.slug === slug);
  if (index < 0) notFound();
  const project = projects[index];
  const next = projects[(index + 1) % projects.length];

  return (
    <main>
      <Gallery project={project} />
      <section className="next">
        <div className="next-cta">
          <h2>want a set like this?</h2>
          <SiteLink className="button" href="/#contact">book a shoot</SiteLink>
        </div>
        <div className="next-folder">
          next folder
          <Folder project={next} />
        </div>
      </section>
      <footer className="mini-foot">
        <span>© 2026 {site.name}</span>
        <a href={about.instagramUrl} target="_blank" rel="noopener">{about.instagramHandle}</a>
      </footer>
    </main>
  );
}
