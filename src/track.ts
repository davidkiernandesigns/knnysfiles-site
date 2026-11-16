/* Visitor side of the analytics. First touch (referrer and UTM tags) is kept for the session so a campaign gets credit
   for the whole visit, and the same label goes on any inquiry. Nothing is stored in a cookie. */
type Touch = { source: string; medium: string; campaign: string; referrer: string };
const KEY = 'knnys-touch';

function readTouch(): Touch {
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved) return JSON.parse(saved) as Touch;
  } catch {
    /* storage blocked */
  }
  const q = new URLSearchParams(location.search);
  const touch: Touch = {
    source: q.get('utm_source') ?? '',
    medium: q.get('utm_medium') ?? '',
    campaign: q.get('utm_campaign') ?? '',
    referrer: document.referrer,
  };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(touch));
  } catch {
    /* storage blocked */
  }
  return touch;
}

const optedOut = () => navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;

export function track(kind: 'view' | 'click', path: string, detail = '') {
  if (optedOut()) return;
  const body = JSON.stringify({ kind, path, detail, ...readTouch() });
  if (!navigator.sendBeacon?.('/api/e', new Blob([body], { type: 'application/json' }))) {
    fetch('/api/e', { method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' } }).catch(() => {});
  }
}

export function sourceLabel() {
  const t = readTouch();
  const label = t.source || (t.referrer ? (() => { try { return new URL(t.referrer).host.replace(/^www\./, ''); } catch { return ''; } })() : '');
  return [label, t.medium, t.campaign].filter(Boolean).join(' / ') || 'direct';
}
