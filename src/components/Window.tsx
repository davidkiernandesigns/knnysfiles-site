import type { ReactNode } from 'react';
import { about, projectPath, projects, site } from '@/content/site';
import { BackLink } from './GrowProvider';
import { Back, Forward, SideFolder } from './Icons';
import { CloseDot } from './CloseDot';
import { SiteLink } from './SiteLink';

export function TitleBar({ title, back, views, onClose }: { title: string; back?: boolean; views?: ReactNode; onClose?: () => void }) {
  return (
    <div className="title-bar">
      <div className="title-left">
        <span className="dots"><CloseDot onClose={onClose} back={back} /><i aria-hidden="true" /><i aria-hidden="true" /></span>
        <span className="arrows">
          {back ? <BackLink aria-label="back to work"><Back /></BackLink> : <span><Back /></span>}
          <span><Forward /></span>
        </span>
        <span className="title">{title}</span>
      </div>
      {views}
    </div>
  );
}

export function PathBar({ children, status }: { children: ReactNode; status: string }) {
  return (
    <div className="path-bar">
      <span>{children}</span>
      <span className="status">{status}</span>
    </div>
  );
}

export function Sidebar({ active }: { active?: string }) {
  return (
    <aside className="sidebar">
      <span className="side-label">work</span>
      {active
        ? <BackLink className="side-item"><SideFolder />all files</BackLink>
        : <SiteLink className="side-item selected" href="/#work"><SideFolder />all files</SiteLink>}
      {projects.map((p) => (
        <SiteLink key={p.slug} className={`side-item${active === p.slug ? ' selected' : ''}`} href={projectPath(p.slug)}>
          <SideFolder />{p.name}
        </SiteLink>
      ))}
      <span className="side-label">{site.name}</span>
      <SiteLink className="side-item" href="/#about"><SideFolder />about.txt</SiteLink>
      <SiteLink className="side-item" href="/#contact"><SideFolder />new inquiry</SiteLink>
      <a className="side-item" href={about.instagramUrl} target="_blank" rel="noopener"><SideFolder />instagram</a>
    </aside>
  );
}
