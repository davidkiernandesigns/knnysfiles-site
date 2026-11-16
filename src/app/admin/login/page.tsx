import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/admin/LoginForm';
import { isAdmin } from '@/server/auth';
import { getEnv } from '@/server/env';

export default async function LoginPage() {
  if (await isAdmin()) redirect('/admin');
  return <LoginForm configured={Boolean(getEnv().adminPassword)} />;
}
