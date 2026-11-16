import { NextResponse } from 'next/server';
import { recordEvent } from '@/server/analytics';
import { clientIp } from '@/server/auth';
import { getEnv } from '@/server/env';
import { addInquiry } from '@/server/inquiries';

const clean = (value: unknown, max = 2000) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }

  // honeypot: real visitors never see this field, so report success and drop it
  if (clean(body.company)) return NextResponse.json({ ok: true });

  const inquiry = {
    name: clean(body.name, 200),
    email: clean(body.email, 200),
    type: clean(body.type, 100),
    date: clean(body.date, 100),
    location: clean(body.location, 200),
    message: clean(body.message),
    source: clean(body.source, 200),
  };

  if (!inquiry.name || !/^\S+@\S+\.\S+$/.test(inquiry.email) || !inquiry.type) {
    return NextResponse.json({ error: 'missing fields' }, { status: 422 });
  }

  const { webhook } = getEnv();

  // the database is the record. the webhook, if set, is an extra copy to an inbox or chat.
  const saved = await addInquiry(inquiry).catch((error) => {
    console.error('inquiry: could not save', error);
    return false;
  });

  if (saved) {
    await recordEvent(request, { kind: 'inquiry', path: '/', detail: inquiry.type }, clientIp(request)).catch(() => {});
    if (webhook) {
      await fetch(webhook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(inquiry) }).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  }

  if (!webhook) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('inquiry (dev, not saved or delivered):', inquiry);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'inquiries are not configured' }, { status: 503 });
  }

  const delivered = await fetch(webhook, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(inquiry),
  }).then((r) => r.ok, () => false);

  return delivered
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: 'delivery failed' }, { status: 502 });
}
