import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { AdminNav } from '@/components/admin/AdminNav';
import { isAdmin } from '@/server/auth';
import { listInquiries } from '@/server/inquiries';

export default async function PanelLayout({ children }: { children: ReactNode }) {
  if (!(await isAdmin())) redirect('/admin/login');
  const fresh = (await listInquiries().catch(() => [])).filter((i) => i.status === 'new').length;
  return (
    <>
      <AdminNav fresh={fresh} />
      <main className="adm-main">{children}</main>
    </>
  );
}
