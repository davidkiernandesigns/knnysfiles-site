import Link from 'next/link';
import { getStats } from '@/server/analytics';
import { listInquiries } from '@/server/inquiries';

type Props = { searchParams: Promise<{ range?: string }> };

const ranges = [7, 30, 90];
const fmt = (n: number) => n.toLocaleString('en-US');
const short = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

function List({ title, rows, empty = 'nothing yet' }: { title: string; rows: { name: string; n: number; extra?: string }[]; empty?: string }) {
  return (
    <section className="card">
      <h3>{title}</h3>
      {rows.length ? (
        <ul className="rows">
          {rows.map((r) => (
            <li key={r.name + (r.extra ?? '')}>
              <span>{r.name}{r.extra ? <small>{r.extra}</small> : null}</span>
              <b>{fmt(r.n)}</b>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">{empty}</p>
      )}
    </section>
  );
}

export default async function Overview({ searchParams }: Props) {
  const asked = Number((await searchParams).range);
  const days = ranges.includes(asked) ? asked : 30;
  const [stats, inquiries] = await Promise.all([getStats(days).catch(() => null), listInquiries().catch(() => [])]);

  if (!stats) {
    return (
      <>
        <div className="adm-head"><h1>overview</h1></div>
        <p className="note">the database isn&apos;t connected, so there is nothing to show yet. on Cloudflare it connects through the DB binding in wrangler.jsonc.</p>
      </>
    );
  }

  const max = Math.max(1, ...stats.series.map((d) => d.visitors));
  const recent = inquiries.slice(0, 5);

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>overview</h1>
          <p>visits to the public site, without cookies. your own visits while signed in to admin are left out.</p>
        </div>
        <div className="seg" role="group" aria-label="range">
          {ranges.map((r) => (
            <Link key={r} href={`/admin?range=${r}`} aria-current={r === days ? 'true' : undefined}>{r} days</Link>
          ))}
        </div>
      </div>

      <div className="tiles">
        <div className="tile"><span>visitors</span><b>{fmt(stats.visitors)}</b></div>
        <div className="tile"><span>page views</span><b>{fmt(stats.views)}</b></div>
        <div className="tile"><span>inquiries</span><b>{fmt(stats.inquiries)}</b></div>
        <div className="tile"><span>visitors who inquired</span><b>{stats.rate.toFixed(1)}%</b></div>
      </div>

      <section className="card">
        <h3>visitors per day</h3>
        <div className="bars" role="img" aria-label={`visitors per day over the last ${days} days`}>
          {stats.series.map((d) => (
            <i
              key={d.day}
              className={d.visitors ? undefined : 'zero'}
              style={{ height: `${Math.max(2, (d.visitors / max) * 100)}%` }}
              title={`${short(d.day)}: ${d.visitors} visitors, ${d.views} views${d.inquiries ? `, ${d.inquiries} inquiries` : ''}`}
            />
          ))}
        </div>
        <div className="axis"><span>{short(stats.series[0].day)}</span><span>{short(stats.series[stats.series.length - 1].day)}</span></div>
      </section>

      <div className="grid2">
        <List title="where visitors come from" rows={stats.sources.map((s) => ({ name: String(s.name), n: Number(s.visitors) }))} />
        <List
          title="campaigns (utm tags)"
          empty="tag a link with ?utm_source=…&utm_campaign=… and it shows up here"
          rows={stats.campaigns.map((c) => ({ name: String(c.name), n: Number(c.visitors), extra: [c.source, c.medium].filter(Boolean).join(' / ') }))}
        />
        <List title="folders opened" rows={stats.folders.map((f) => ({ name: f.name, n: f.views }))} empty="no folder opens yet" />
        <List title="top pages" rows={stats.pages.map((p) => ({ name: String(p.path), n: Number(p.views) }))} />
        <List title="devices" rows={stats.devices.map((d) => ({ name: String(d.name), n: Number(d.visitors) }))} />
        <List title="countries" rows={stats.countries.map((d) => ({ name: String(d.name), n: Number(d.visitors) }))} />
        <List title="link clicks" rows={stats.clicks.map((c) => ({ name: String(c.name), n: Number(c.n) }))} empty="instagram and email clicks show up here" />
      </div>

      <section className="card">
        <div className="adm-head"><h2>latest inquiries</h2><Link className="btn ghost small" href="/admin/inquiries">see all</Link></div>
        {recent.length ? (
          <ul className="rows">
            {recent.map((i) => (
              <li key={i.id}>
                <span>{i.name}<small>{i.type} · {new Date(i.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small></span>
                <span className={`pill ${i.status}`}>{i.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">no inquiries yet.</p>
        )}
      </section>
    </>
  );
}
