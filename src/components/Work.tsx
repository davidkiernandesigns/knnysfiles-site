import { projects, site } from '@/content/site';
import { Folder } from './Folder';
import { GalleryIcon, Grid, List } from './Icons';
import { Reveal } from './Reveal';
import { PathBar, Sidebar, TitleBar } from './Window';

export function Work() {
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
        <h2>work</h2>
        <p>open a folder to see the full set.</p>
      </Reveal>
      <Reveal className="window">
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
