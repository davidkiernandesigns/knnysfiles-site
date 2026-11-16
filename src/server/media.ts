import { getDb } from './db';
import { getEnv } from './env';

/* Where uploaded photos live. R2 when it is bound (best for a lot of photos), otherwise the database, so uploads work
   without any extra service. In the database a photo is one base64 text row, which keeps reads and writes cheap:
   Workers have native base64 encode and decode, so there is no byte-by-byte loop. A row tops out near 2 MB. */

export const MAX_D1_BYTES = 1_400_000;
export const MAX_R2_BYTES = 15 * 1024 * 1024;

export const storageKind = () => {
  const { MEDIA, DB } = getEnv();
  return MEDIA ? ('r2' as const) : DB ? ('d1' as const) : null;
};

type Bytes = Uint8Array & { toBase64?: () => string };
type Decoder = { fromBase64?: (s: string) => Uint8Array };

function encode(bytes: Uint8Array) {
  const b = bytes as Bytes;
  if (b.toBase64) return b.toBase64();
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function decode(text: string): Uint8Array {
  const native = (Uint8Array as unknown as Decoder).fromBase64;
  if (native) return native.call(Uint8Array, text);
  const bin = atob(text);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function putMedia(key: string, data: ArrayBuffer, type: string) {
  const { MEDIA } = getEnv();
  if (MEDIA) {
    await MEDIA.put(key, data, { httpMetadata: { contentType: type } });
    return;
  }
  const db = await getDb();
  if (!db) throw new Error('photo storage is not connected');
  await db
    .prepare('INSERT OR REPLACE INTO media (key, type, data, created_at) VALUES (?, ?, ?, ?)')
    .bind(key, type, encode(new Uint8Array(data)), Date.now())
    .run();
}

export async function getMedia(key: string): Promise<{ bytes: ArrayBuffer | ReadableStream; type: string } | null> {
  const { MEDIA } = getEnv();
  if (MEDIA) {
    const object = await MEDIA.get(key);
    return object ? { bytes: object.body, type: object.httpMetadata?.contentType ?? 'image/jpeg' } : null;
  }
  const db = await getDb();
  const row = await db?.prepare('SELECT type, data FROM media WHERE key = ?').bind(key).first<{ type: string; data: string }>();
  if (!row) return null;
  const bytes = decode(row.data);
  return { bytes: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, type: row.type };
}

export async function deleteMedia(keys: string[]) {
  if (!keys.length) return;
  const { MEDIA } = getEnv();
  if (MEDIA) {
    await MEDIA.delete(keys);
    return;
  }
  const db = await getDb();
  if (!db) return;
  await db.batch(keys.map((key) => db.prepare('DELETE FROM media WHERE key = ?').bind(key)));
}
