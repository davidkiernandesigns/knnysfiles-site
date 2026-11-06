'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps, MouseEvent } from 'react';
import { useScrollTo } from './Providers';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };

/* Same-page links glide with Lenis. Links from another page dissolve in and land on the section. */
export function SiteLink({ href, onClick, ...props }: Props) {
  const pathname = usePathname();
  const scrollTo = useScrollTo();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const [path, id] = href.split('#');
    if (path !== pathname) return;
    const target = id ? document.getElementById(id) : null;
    if (id && !target) return;
    event.preventDefault();
    window.history.replaceState(null, '', href);
    scrollTo(target ?? 0);
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}
