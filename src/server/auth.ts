import { cookies } from 'next/headers';
import { getDb } from './db';
import { getEnv } from './env';

const COOKIE = 'knnys_admin';
const WEEK = 7 * 24 * 3600 * 1000;
const enc = new TextEncoder();

async function hmac(key: string, message: string) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(message)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, '0')).join('');
}

function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const cookieName = COOKIE;

export async function passwordMatches(input: string) {
  const { adminPassword } = getEnv();
  if (!adminPassword) return false;
  return same(await hmac('compare', input), await hmac('compare', adminPassword));
}

export async function makeSession() {
  const { adminPassword } = getEnv();
  const exp = Date.now() + WEEK;
  return { value: `${exp}.${await hmac(adminPassword, `session.${exp}`)}`, maxAge: WEEK / 1000 };
}

export async function validToken(token: string | undefined) {
  const { adminPassword } = getEnv();
  if (!token || !adminPassword) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return same(sig, await hmac(adminPassword, `session.${exp}`));
}

export async function isAdmin() {
  return validToken((await cookies()).get(COOKIE)?.value);
}

/* Guard for /api/admin routes: a valid session, and for anything that changes data, a request from this site itself. */
export async function guard(request: Request): Promise<Response | null> {
  if (!(await validToken(parseCookie(request.headers.get('cookie'), COOKIE)))) {
    return Response.json({ error: 'not signed in' }, { status: 401 });
  }
  if (request.method !== 'GET') {
    const origin = request.headers.get('origin');
    if (!origin || new URL(origin).host !== new URL(request.url).host) {
      return Response.json({ error: 'bad origin' }, { status: 403 });
    }
  }
  return null;
}

export function parseCookie(header: string | null, name: string) {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

/* Five wrong passwords from one address locks it out for ten minutes. */
export async function tooManyAttempts(ip: string) {
  const db = await getDb();
  if (!db) return false;
  const since = Date.now() - 10 * 60 * 1000;
  await db.prepare('DELETE FROM login_attempts WHERE ts < ?').bind(since).run();
  const row = await db.prepare('SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND ts >= ?').bind(ip, since).first<{ n: number }>();
  return (row?.n ?? 0) >= 5;
}

export async function recordFailure(ip: string) {
  const db = await getDb();
  await db?.prepare('INSERT INTO login_attempts (ip, ts) VALUES (?, ?)').bind(ip, Date.now()).run();
}

export async function clearFailures(ip: string) {
  const db = await getDb();
  await db?.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip).run();
}

export const clientIp = (request: Request) =>
  request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
