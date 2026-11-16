'use client';

import { useState, type FormEvent } from 'react';

export function LoginForm({ configured }: { configured: boolean }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const password = String(new FormData(event.currentTarget).get('password') ?? '');
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    if (response?.ok) {
      window.location.href = '/admin';
      return;
    }
    setError(((await response?.json().catch(() => null)) as { error?: string } | null)?.error ?? 'could not reach the server');
    setBusy(false);
  };

  return (
    <main className="login">
      <form onSubmit={submit}>
        <h1>knnysfiles admin</h1>
        {configured ? (
          <>
            <label className="lab">
              password
              <input name="password" type="password" autoComplete="current-password" autoFocus required />
            </label>
            <p className="err" role="alert">{error}</p>
            <button className="btn" type="submit" disabled={busy}>{busy ? 'checking…' : 'log in'}</button>
          </>
        ) : (
          <p className="note">admin isn&apos;t set up yet. add the ADMIN_PASSWORD secret to the Worker, then reload.</p>
        )}
      </form>
    </main>
  );
}
