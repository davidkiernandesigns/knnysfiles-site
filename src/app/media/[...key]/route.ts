import { getEnv } from '@/server/env';
import { getMedia } from '@/server/media';

/* Photos uploaded in /admin are served from storage (R2 or the database, see server/media.ts). Keys are random and never reused, so they cache forever.
   ?w= asks for a smaller copy: it is cut with the Images binding and kept in Cloudflare's cache, which is how
   phones get a small file instead of the full 2400px one. next/image can't do this for us because its optimizer
   only reads static files. */
const widths = [320, 480, 640, 828, 1080, 1440, 1920, 2400];
const immutable = 'public, max-age=31536000, immutable';

export async function GET(request: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const { key } = await ctx.params;
  const { IMAGES } = getEnv();
  const name = key.map(decodeURIComponent).join('/');

  const asked = Number(new URL(request.url).searchParams.get('w'));
  const width = asked > 0 ? widths.find((w) => w >= asked) ?? widths[widths.length - 1] : 0;
  const cacheKey = new Request(`${new URL(request.url).origin}/media/${key.join('/')}?w=${width}`);
  const edge = (globalThis as { caches?: { default?: Cache } }).caches?.default;

  if (width && IMAGES) {
    const hit = await edge?.match(cacheKey).catch(() => undefined);
    if (hit) return hit;
  }

  const object = await getMedia(name);
  if (!object) return new Response('not found', { status: 404 });
  const stream = () => new Response(object.bytes).body as ReadableStream;

  if (width && IMAGES) {
    try {
      const out = await IMAGES.input(stream()).transform({ width }).output({ format: 'image/jpeg', quality: 82 });
      const response = new Response(out.response().body, { headers: { 'content-type': 'image/jpeg', 'cache-control': immutable } });
      await edge?.put(cacheKey, response.clone()).catch(() => {});
      return response;
    } catch (error) {
      console.error('media: resize failed, sending the original', error);
      return new Response(await new Response(object.bytes).arrayBuffer(), { headers: { 'content-type': object.type, 'cache-control': immutable } });
    }
  }

  return new Response(object.bytes, { headers: { 'content-type': object.type, 'cache-control': immutable } });
}
