import { guard } from '@/server/auth';
import { MAX_D1_BYTES, MAX_R2_BYTES, putMedia, storageKind } from '@/server/media';

const types: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export async function POST(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;
  const kind = storageKind();
  if (!kind) return Response.json({ error: 'photo storage is not connected' }, { status: 503 });
  const file = (await request.formData().catch(() => null))?.get('file');
  if (!(file instanceof File) || !types[file.type]) return Response.json({ error: 'upload a jpg, png or webp' }, { status: 415 });
  const max = kind === 'r2' ? MAX_R2_BYTES : MAX_D1_BYTES;
  if (file.size > max) return Response.json({ error: `that photo is over ${Math.round(max / 100_000) / 10} MB` }, { status: 413 });
  const key = `img/${crypto.randomUUID()}.${types[file.type]}`;
  await putMedia(key, await file.arrayBuffer(), file.type);
  return Response.json({ src: `/media/${key}` });
}
