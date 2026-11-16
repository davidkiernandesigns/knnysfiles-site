import { guard } from '@/server/auth';
import { cleanContent, getContentForAdmin, writeContent } from '@/server/content';
import { getDb } from '@/server/db';
import { getEnv } from '@/server/env';

const mediaKeys = (content: { site: unknown; about: unknown; projects: unknown }) =>
  new Set(JSON.stringify(content).match(/\/media\/[A-Za-z0-9/_.-]+/g)?.map((m) => m.slice(7)) ?? []);

export async function GET(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;
  return Response.json(await getContentForAdmin());
}

export async function PUT(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;
  const db = await getDb();
  if (!db) return Response.json({ error: 'the database is not connected' }, { status: 503 });
  const content = cleanContent(await request.json().catch(() => null));
  if (!content) return Response.json({ error: 'nothing to save: keep at least one folder' }, { status: 422 });

  const before = (await getContentForAdmin()).content;
  await writeContent(db, content);

  // photos that are no longer used anywhere come out of storage
  const { MEDIA } = getEnv();
  const kept = mediaKeys(content);
  const gone = [...mediaKeys(before)].filter((key) => !kept.has(key));
  if (MEDIA && gone.length) await MEDIA.delete(gone).catch(() => {});
  return Response.json({ ok: true, content });
}
