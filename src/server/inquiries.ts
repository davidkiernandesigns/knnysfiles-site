import { getDb } from './db';

export const statuses = ['new', 'replied', 'booked', 'done', 'lost'] as const;
export type Status = (typeof statuses)[number];

export type Inquiry = {
  id: number; created_at: number; updated_at: number; name: string; email: string; type: string;
  shoot_date: string; location: string; message: string; status: Status; notes: string; source: string;
};

export async function addInquiry(i: { name: string; email: string; type: string; date: string; location: string; message: string; source: string }) {
  const db = await getDb();
  if (!db) return false;
  const now = Date.now();
  await db
    .prepare('INSERT INTO inquiries (created_at, updated_at, name, email, type, shoot_date, location, message, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(now, now, i.name, i.email, i.type, i.date, i.location, i.message, i.source)
    .run();
  return true;
}

export async function listInquiries(): Promise<Inquiry[]> {
  const db = await getDb();
  if (!db) return [];
  const { results } = await db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 500').all<Inquiry>();
  return results;
}

export async function updateInquiry(id: number, patch: { status?: string; notes?: string }) {
  const db = await getDb();
  if (!db) return false;
  const status = statuses.includes(patch.status as Status) ? patch.status : null;
  const notes = typeof patch.notes === 'string' ? patch.notes.slice(0, 5000) : null;
  await db
    .prepare('UPDATE inquiries SET status = COALESCE(?, status), notes = COALESCE(?, notes), updated_at = ? WHERE id = ?')
    .bind(status, notes, Date.now(), id)
    .run();
  return true;
}

export async function deleteInquiry(id: number) {
  const db = await getDb();
  await db?.prepare('DELETE FROM inquiries WHERE id = ?').bind(id).run();
}
