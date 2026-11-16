'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const links = [
  { href: '/admin', label: 'overview' },
  { href: '/admin/inquiries', label: 'inquiries' },
  { href: '/admin/content', label: 'content' },
];

export function AdminNav({ fresh }: { fresh: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  };
  return (
    <header className="adm-top">
      <span className="dots" aria-hidden="true"><i /><i /><i /></span>
      <b>knnysfiles admin</b>
      <nav aria-label="admin">
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={pathname === l.href ? 'page' : undefined}>
            {l.label}
            {l.href === '/admin/inquiries' && fresh > 0 ? <em>{fresh}</em> : null}
          </Link>
        ))}
      </nav>
      <span className="right">
        <a href="/" target="_blank" rel="noopener">view site</a>
        <button type="button" onClick={logout}>log out</button>
      </span>
    </header>
  );
}
