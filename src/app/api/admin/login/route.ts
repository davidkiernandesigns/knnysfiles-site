import { NextResponse } from 'next/server';
import { clearFailures, clientIp, cookieName, makeSession, passwordMatches, recordFailure, tooManyAttempts } from '@/server/auth';
import { getEnv } from '@/server/env';

export async function POST(request: Request) {
  const { adminPassword } = getEnv();
  if (!adminPassword) return NextResponse.json({ error: 'admin is not set up: add the ADMIN_PASSWORD secret' }, { status: 503 });
  const ip = clientIp(request);
  if (await tooManyAttempts(ip)) return NextResponse.json({ error: 'too many tries. wait ten minutes.' }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { password?: unknown };
  if (typeof body.password !== 'string' || !(await passwordMatches(body.password))) {
    await recordFailure(ip);
    return NextResponse.json({ error: 'wrong password' }, { status: 401 });
  }
  await clearFailures(ip);
  const session = await makeSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, session.value, {
    httpOnly: true,
    sameSite: 'strict',
    secure: new URL(request.url).protocol === 'https:',
    path: '/',
    maxAge: session.maxAge,
  });
  return response;
}
