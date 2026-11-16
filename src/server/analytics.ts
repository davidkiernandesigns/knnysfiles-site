import { getDb } from './db';

const TZ = 'America/New_York';
const DAY = 86_400_000;
const bots = /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|curl|wget|python|scrapy|monitor|uptime|facebookexternalhit|embedly/i;

export const isBot = (ua: string) => !ua || bots.test(ua);
const deviceOf = (ua: string) => (/ipad|tablet/i.test(ua) ? 'tablet' : /mobi|iphone|android/i.test(ua) ? 'mobile' : 'desktop');

async function visitorId(ip: string, ua: string) {
  const day = new Date().toISOString().slice(0, 10);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`knnys|${day}|${ip}|${ua}`)));
  return Array.from(digest.slice(0, 8), (b) => b.toString(16).padStart(2, '0')).join('');
}

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '');

export type EventInput = { kind: string; path: string; source?: string; medium?: string; campaign?: string; referrer?: string; detail?: string };

/* Cookie-free. A visitor is a daily hash of address and browser, and the address itself is never stored. */
export async function recordEvent(request: Request, input: EventInput, ip: string) {
  const ua = request.headers.get('user-agent') ?? '';
  if (isBot(ua)) return;
  const db = await getDb();
  if (!db) return;
  const host = new URL(request.url).host;
  let referrer = '';
  try {
    const h = new URL(clip(input.referrer, 500)).host.replace(/^www\./, '');
    referrer = h && h !== host.replace(/^www\./, '') ? h : '';
  } catch {
    /* no referrer */
  }
  await db
    .prepare('INSERT INTO events (ts, kind, path, visitor, source, medium, campaign, referrer, device, country, detail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(
      Date.now(), clip(input.kind, 20), clip(input.path, 200) || '/', await visitorId(ip, ua),
      clip(input.source, 80).toLowerCase(), clip(input.medium, 80).toLowerCase(), clip(input.campaign, 120).toLowerCase(),
      referrer, deviceOf(ua), request.headers.get('cf-ipcountry') ?? '', clip(input.detail, 200),
    )
    .run();
}

function offsetSeconds() {
  const now = new Date();
  const local = new Date(now.toLocaleString('en-US', { timeZone: TZ }));
  const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  return Math.round((local.getTime() - utc.getTime()) / 1000);
}

type Row = Record<string, string | number>;
const SOURCE = "COALESCE(NULLIF(source, ''), NULLIF(referrer, ''), 'direct')";

export async function getStats(days: number) {
  const db = await getDb();
  if (!db) return null;
  const off = offsetSeconds();
  const since = Date.now() - days * DAY;
  const q = async (sql: string, ...args: unknown[]) => (await db.prepare(sql).bind(...args).all<Row>()).results;
  const views = "kind = 'view'";

  const [totals, daily, pages, sources, campaigns, devices, countries, inquiryDays] = await Promise.all([
    q(`SELECT COUNT(*) AS views, COUNT(DISTINCT visitor || date(ts / 1000, 'unixepoch')) AS visitors FROM events WHERE ${views} AND ts >= ?`, since),
    q(`SELECT date(ts / 1000 + ?, 'unixepoch') AS day, COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS views FROM events WHERE ${views} AND ts >= ? GROUP BY day`, off, since),
    q(`SELECT path, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors FROM events WHERE ${views} AND ts >= ? GROUP BY path ORDER BY views DESC LIMIT 12`, since),
    q(`SELECT ${SOURCE} AS name, COUNT(DISTINCT visitor) AS visitors FROM events WHERE ${views} AND ts >= ? GROUP BY name ORDER BY visitors DESC LIMIT 10`, since),
    q(`SELECT campaign AS name, source, medium, COUNT(DISTINCT visitor) AS visitors FROM events WHERE ${views} AND campaign != '' AND ts >= ? GROUP BY campaign, source, medium ORDER BY visitors DESC LIMIT 10`, since),
    q(`SELECT device AS name, COUNT(DISTINCT visitor) AS visitors FROM events WHERE ${views} AND ts >= ? GROUP BY device ORDER BY visitors DESC`, since),
    q(`SELECT country AS name, COUNT(DISTINCT visitor) AS visitors FROM events WHERE ${views} AND country != '' AND ts >= ? GROUP BY country ORDER BY visitors DESC LIMIT 8`, since),
    q(`SELECT date(ts / 1000 + ?, 'unixepoch') AS day, COUNT(*) AS n FROM events WHERE kind = 'inquiry' AND ts >= ? GROUP BY day`, off, since),
  ]);
  const inquiries = await db.prepare("SELECT COUNT(*) AS n FROM events WHERE kind = 'inquiry' AND ts >= ?").bind(since).first<{ n: number }>();
  const clicks = await q(`SELECT detail AS name, COUNT(*) AS n FROM events WHERE kind = 'click' AND ts >= ? GROUP BY detail ORDER BY n DESC`, since);

  const byDay = new Map(daily.map((r) => [String(r.day), r]));
  const inqDay = new Map(inquiryDays.map((r) => [String(r.day), Number(r.n)]));
  const series = Array.from({ length: days }, (_, i) => {
    const day = new Date(Date.now() + off * 1000 - (days - 1 - i) * DAY).toISOString().slice(0, 10);
    const r = byDay.get(day);
    return { day, visitors: Number(r?.visitors ?? 0), views: Number(r?.views ?? 0), inquiries: inqDay.get(day) ?? 0 };
  });
  const visitors = Number(totals[0]?.visitors ?? 0);
  const folders = (
    await q(`SELECT path, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors FROM events WHERE ${views} AND path LIKE '/work/%' AND ts >= ? GROUP BY path ORDER BY views DESC`, since)
  ).map((p) => ({ name: String(p.path).slice(6), views: Number(p.views), visitors: Number(p.visitors) }));
  return {
    views: Number(totals[0]?.views ?? 0), visitors, inquiries: inquiries?.n ?? 0,
    rate: visitors ? ((inquiries?.n ?? 0) / visitors) * 100 : 0,
    series, pages, sources, campaigns, devices, countries, folders, clicks,
  };
}
