'use client';

import { useMemo, useState } from 'react';

type Status = 'new' | 'replied' | 'booked' | 'done' | 'lost';
type Inquiry = {
  id: number; created_at: number; name: string; email: string; type: string; shoot_date: string;
  location: string; message: string; status: Status; notes: string; source: string;
};

const statuses: Status[] = ['new', 'replied', 'booked', 'done', 'lost'];
const when = (ms: number) => new Date(ms).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export function InquiryBoard({ initial }: { initial: Inquiry[] }) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<number | null>(initial[0]?.id ?? null);
  const [confirm, setConfirm] = useState(false);
  const [saved, setSaved] = useState('');

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const s of statuses) c[s] = items.filter((i) => i.status === s).length;
    return c;
  }, [items]);

  const shown = items.filter(
    (i) =>
      (filter === 'all' || i.status === filter) &&
      (!query || `${i.name} ${i.email} ${i.type} ${i.location} ${i.message}`.toLowerCase().includes(query.toLowerCase())),
  );
  const current = items.find((i) => i.id === openId) ?? null;

  const patch = async (id: number, change: Partial<Pick<Inquiry, 'status' | 'notes'>>) => {
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ...change } : i)));
    const response = await fetch(`/api/admin/inquiries/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(change),
    }).catch(() => null);
    setSaved(response?.ok ? 'saved' : 'could not save, try again');
  };

  const remove = async (id: number) => {
    await fetch(`/api/admin/inquiries/${id}`, { method: 'DELETE' });
    setItems((list) => list.filter((i) => i.id !== id));
    setOpenId(null);
    setConfirm(false);
  };

  if (!items.length) return <p className="note">no inquiries yet. they land here when someone fills in the form on the site.</p>;

  return (
    <>
      <div className="adm-head">
        <div className="seg" role="group" aria-label="filter">
          {(['all', ...statuses] as const).map((s) => (
            <button key={s} type="button" aria-pressed={filter === s} onClick={() => setFilter(s)}>{s} {counts[s]}</button>
          ))}
        </div>
        <input style={{ maxWidth: 260 }} type="search" placeholder="search" aria-label="search inquiries" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="board">
        <div className="inq-list">
          {shown.length ? (
            shown.map((i) => (
              <button key={i.id} type="button" className="inq" aria-current={i.id === openId} onClick={() => { setOpenId(i.id); setConfirm(false); setSaved(''); }}>
                <span className="l1"><b>{i.name}</b><span className={`pill ${i.status}`}>{i.status}</span></span>
                <small>{i.type}{i.shoot_date ? ` · ${i.shoot_date}` : ''}</small>
                <small>{when(i.created_at)}</small>
              </button>
            ))
          ) : (
            <p className="empty">nothing matches.</p>
          )}
        </div>

        {current ? (
          <section className="card detail" aria-label="inquiry">
            <h2>{current.name}</h2>
            <dl>
              <dt>email</dt><dd><a href={`mailto:${current.email}`}>{current.email}</a></dd>
              <dt>shoot</dt><dd>{current.type}</dd>
              <dt>date</dt><dd>{current.shoot_date || 'not given'}</dd>
              <dt>location</dt><dd>{current.location || 'not given'}</dd>
              <dt>came from</dt><dd>{current.source || 'direct'}</dd>
              <dt>received</dt><dd>{when(current.created_at)}</dd>
            </dl>
            {current.message ? <p className="msg">{current.message}</p> : null}
            <div className="statuses" role="group" aria-label="status">
              {statuses.map((s) => (
                <button key={s} type="button" aria-pressed={current.status === s} onClick={() => patch(current.id, { status: s })}>{s}</button>
              ))}
            </div>
            <label className="lab">
              notes (only you see these)
              <textarea
                key={current.id}
                defaultValue={current.notes}
                onBlur={(e) => e.target.value !== current.notes && patch(current.id, { notes: e.target.value })}
              />
            </label>
            <div className="row-actions">
              <a
                className="btn"
                href={`mailto:${current.email}?subject=${encodeURIComponent(`re: your ${current.type} shoot`)}`}
                onClick={() => current.status === 'new' && patch(current.id, { status: 'replied' })}
              >
                reply by email
              </a>
              {confirm ? (
                <>
                  <button type="button" className="btn danger" onClick={() => remove(current.id)}>delete for good</button>
                  <button type="button" className="btn ghost" onClick={() => setConfirm(false)}>keep it</button>
                </>
              ) : (
                <button type="button" className="btn danger" onClick={() => setConfirm(true)}>delete</button>
              )}
              <span className="empty" role="status">{saved}</span>
            </div>
          </section>
        ) : (
          <p className="empty">pick an inquiry.</p>
        )}
      </div>
    </>
  );
}
