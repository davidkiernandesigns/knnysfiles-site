import { getContent } from '@/server/content';
import { Folder } from './Folder';
import { GalleryIcon, Grid, List } from './Icons';
import { SplitTitle } from './Motion';
import { Reveal } from './Reveal';
import { PathBar, Sidebar, TitleBar } from './Window';

export async function Work() {
  const { projects, site } = await getContent();
  const views = (
    <span className="views" aria-hidden="true">
      <span><Grid /></span>
      <span><List /></span>
      <span><GalleryIcon /></span>
    </span>
  );

  return (
    <section className="work" id="work">
      <Reveal small className="section-head">
        <SplitTitle text="work" />
        <p>open a folder to see the full set.</p>
      </Reveal>
      <Reveal window className="window">
        <TitleBar title="work" views={views} />
        <div className="finder">
          <Sidebar />
          <div className="folders">
            {projects.map((p, i) => (
              <Reveal small key={p.slug} delay={120 + i * 80} className="folder-cell">
                <Folder project={p} />
              </Reveal>
            ))}
          </div>
        </div>
        <PathBar status={`${projects.length} folders`}>{site.name}<b>›</b>work</PathBar>
      </Reveal>
    </section>
  );
}
