import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { D1, Env, ImagesBinding, R2 } from './types';

/* One place that reads bindings and secrets. Off Cloudflare (plain `next start`) there is no database or storage,
   so everything degrades: the public site renders the starting content and /admin says what is missing. */
export function getEnv(): Env {
  let bindings: Record<string, unknown> = {};
  try {
    bindings = getCloudflareContext().env as unknown as Record<string, unknown>;
  } catch {
    /* not running on Cloudflare */
  }
  const text = (key: string) => {
    const value = bindings[key] ?? process.env[key];
    return typeof value === 'string' ? value : '';
  };
  return {
    DB: (bindings.DB as D1 | undefined) ?? null,
    MEDIA: (bindings.MEDIA as R2 | undefined) ?? null,
    IMAGES: (bindings.IMAGES as ImagesBinding | undefined) ?? null,
    adminPassword: text('ADMIN_PASSWORD'),
    webhook: text('INQUIRY_WEBHOOK_URL'),
  };
}
