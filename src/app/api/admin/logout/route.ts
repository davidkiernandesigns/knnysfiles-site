import { NextResponse } from 'next/server';
import { cookieName } from '@/server/auth';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, '', { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 0 });
  return response;
}
