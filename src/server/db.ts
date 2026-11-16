import { getEnv } from './env';
import type { D1 } from './types';

const schema = [
  'CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS projects (slug TEXT PRIMARY KEY, name TEXT NOT NULL, sort INTEGER NOT NULL, cover TEXT NOT NULL, description TEXT NOT NULL, photos TEXT NOT NULL)',
  `CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
    name TEXT NOT NULL, email TEXT NOT NULL, type TEXT NOT NULL, shoot_date TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '', message TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'new',
    notes TEXT NOT NULL DEFAULT '', source TEXT NOT NULL DEFAULT '')`,
  'CREATE INDEX IF NOT EXISTS inquiries_created ON inquiries(created_at)',
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, kind TEXT NOT NULL, path TEXT NOT NULL,
    visitor TEXT NOT NULL, source TEXT NOT NULL DEFAULT '', medium TEXT NOT NULL DEFAULT '',
    campaign TEXT NOT NULL DEFAULT '', referrer TEXT NOT NULL DEFAULT '', device TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT '', detail TEXT NOT NULL DEFAULT '')`,
  'CREATE INDEX IF NOT EXISTS events_ts ON events(ts)',
  'CREATE TABLE IF NOT EXISTS media (key TEXT PRIMARY KEY, type TEXT NOT NULL, data TEXT NOT NULL, created_at INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS login_attempts (ip TEXT NOT NULL, ts INTEGER NOT NULL)',
];

/* The tables create themselves the first time a cold Worker touches the database, so there is no migration step to forget. */
const ready = new WeakMap<object, Promise<void>>();

export async function getDb(): Promise<D1 | null> {
  const { DB } = getEnv();
  if (!DB) return null;
  let promise = ready.get(DB);
  if (!promise) {
    promise = DB.batch(schema.map((sql) => DB.prepare(sql))).then(() => undefined);
    ready.set(DB, promise);
    promise.catch(() => ready.delete(DB));
  }
  await promise;
  return DB;
}
