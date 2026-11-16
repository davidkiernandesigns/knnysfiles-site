import { cookies } from 'next/headers';
import { clientIp, cookieName, validToken } from '@/server/auth';
import { recordEvent } from '@/server/analytics';

const kinds = new Set(['view', 'click']);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (!kinds.has(String(body.kind))) return new Response(null, { status: 204 });
    // the owner's own visits (signed in to /admin on this browser) are left out
    if (await validToken((await cookies()).get(cookieName)?.value)) return new Response(null, { status: 204 });
    await recordEvent(
      request,
      {
        kind: String(body.kind),
        path: String(body.path ?? '/'),
        source: String(body.source ?? ''),
        medium: String(body.medium ?? ''),
        campaign: String(body.campaign ?? ''),
        referrer: String(body.referrer ?? ''),
        detail: String(body.detail ?? ''),
      },
      clientIp(request),
    );
  } catch {
    /* analytics never gets in the way of the site */
  }
  return new Response(null, { status: 204 });
}
