'use client';

import Link from 'next/link';
import { useRef, type PointerEvent } from 'react';
import { projectPath, type Project } from '@/content/site';
import { useGrowClick } from './GrowProvider';
import { FolderBack } from './Icons';
import { SiteImage } from './SiteImage';

export function Folder({ project }: { project: Project }) {
  const art = useRef<HTMLSpanElement>(null);
  const open = useGrowClick(project.slug, 'folder', art);

  const track = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || !art.current) return;
    const r = art.current.getBoundingClientRect();
    art.current.style.setProperty('--mx', (((event.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    art.current.style.setProperty('--my', (((event.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };

  const reset = () => {
    art.current?.style.setProperty('--mx', '0');
    art.current?.style.setProperty('--my', '0');
  };

  return (
    <Link
      className="folder"
      href={projectPath(project.slug)}
      aria-label={`open ${project.name}`}
      onClick={open}
      onPointerMove={track}
      onPointerLeave={reset}
    >
      <span className="folder-art" ref={art} data-grow={project.slug}>
        <span className="folder-back"><FolderBack /></span>
        <span className="print print-back" />
        <span className="print print-front"><SiteImage src={project.cover} alt="" sizes="240px" /></span>
        <span className="folder-front" />
      </span>
      <span className="caption">
        <b>{project.name}</b>
        <small>{project.photos.length} items</small>
      </span>
    </Link>
  );
}
