import { guard } from '@/server/auth';
import { getEnv } from '@/server/env';

const types: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export async function POST(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;
  const { MEDIA } = getEnv();
  if (!MEDIA) return Response.json({ error: 'photo storage is not connected' }, { status: 503 });
  const file = (await request.formData().catch(() => null))?.get('file');
  if (!(file instanceof File) || !types[file.type]) return Response.json({ error: 'upload a jpg, png or webp' }, { status: 415 });
  if (file.size > 15 * 1024 * 1024) return Response.json({ error: 'that file is over 15 MB' }, { status: 413 });
  const key = `img/${crypto.randomUUID()}.${types[file.type]}`;
  await MEDIA.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  return Response.json({ src: `/media/${key}` });
}
