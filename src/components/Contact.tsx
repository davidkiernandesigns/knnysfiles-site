'use client';

import { animate } from 'motion';
import { motion, useTransform } from 'motion/react';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { flushSync } from 'react-dom';
import { about, projects, site } from '@/content/site';
import { EASE, isSmall, prefersReducedMotion } from '@/lib';
import { Chevron } from './Icons';
import { useDrift } from './useDrift';
import { PathBar, TitleBar } from './Window';

type Errors = Partial<Record<'name' | 'email' | 'type', string>>;
const empty = { name: '', email: '', type: '', date: '', location: '', message: '', company: '' };

function validate(values: typeof empty) {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = 'enter your name';
  if (!/^\S+@\S+\.\S+$/.test(values.email)) errors.email = 'enter a valid email';
  if (!values.type) errors.type = 'choose a shoot type';
  return errors;
}

function InquiryForm({ onSent }: { onSent: () => void }) {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'failed'>('idle');
  const form = useRef<HTMLFormElement>(null);

  const change = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    const first = (['name', 'email', 'type'] as const).find((key) => found[key]);
    if (first) {
      form.current?.querySelector<HTMLElement>(`#f-${first}`)?.focus();
      return;
    }
    setStatus('sending');
    const ok = await fetch('/api/inquiry', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(values),
    }).then((r) => r.ok, () => false);
    if (ok) onSent();
    else setStatus('failed');
  };

  const field = (name: keyof Errors) => ({
    className: `field${errors[name] ? ' bad' : ''}`,
    helper: errors[name] ? <span className="helper">{errors[name]}</span> : null,
    invalid: errors[name] ? true : undefined,
  });
  const fName = field('name');
  const fEmail = field('email');
  const fType = field('type');

  return (
    <form className="form" ref={form} onSubmit={submit} noValidate>
      <div className="form-head">
        <h2>book a shoot</h2>
        <p>{site.inquiryIntro}</p>
      </div>
      <div className="row">
        <div className={fName.className}>
          <label htmlFor="f-name">name</label>
          <input id="f-name" name="name" placeholder="your name" autoComplete="name" required aria-invalid={fName.invalid} value={values.name} onChange={change} />
          {fName.helper}
        </div>
        <div className={fEmail.className}>
          <label htmlFor="f-email">email</label>
          <input id="f-email" name="email" type="email" placeholder="you@email.com" autoComplete="email" required aria-invalid={fEmail.invalid} value={values.email} onChange={change} />
          {fEmail.helper}
        </div>
      </div>
      <div className="row">
        <div className={fType.className}>
          <label htmlFor="f-type">shoot type</label>
          <select id="f-type" name="type" required aria-invalid={fType.invalid} value={values.type} onChange={change}>
            <option value="" disabled>choose one</option>
            {projects.map((p) => <option key={p.slug}>{p.name}</option>)}
          </select>
          <Chevron />
          {fType.helper}
        </div>
        <div className="field">
          <label htmlFor="f-date">date</label>
          <input id="f-date" name="date" placeholder="mm / dd / yyyy" value={values.date} onChange={change} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="f-location">location</label>
        <input id="f-location" name="location" placeholder="city or venue" value={values.location} onChange={change} />
      </div>
      <div className="field">
        <label htmlFor="f-message">message</label>
        <textarea id="f-message" name="message" placeholder="what are you planning?" value={values.message} onChange={change} />
      </div>
      <input className="trap" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" value={values.company} onChange={change} />
      <button className="button" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? <><span className="spinner" />sending</> : 'send inquiry'}
      </button>
      {status === 'failed' && (
        <p className="helper" role="alert">that didn&apos;t send. try again, or dm {about.instagramHandle}.</p>
      )}
    </form>
  );
}

export function Contact() {
  const { ref, drift } = useDrift<HTMLElement>();
  const wallY = useTransform(drift, (q) => (q ? q * 60 * (isSmall() ? 0.35 : 1) : 0));
  const windowRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [sent, setSent] = useState(false);

  /* The window keeps its place and resizes between the form and the sent state. */
  const morph = (next: boolean) => {
    const win = windowRef.current;
    const section = ref.current;
    if (!win || !section) return;
    const from = { width: win.offsetWidth, height: win.offsetHeight };
    section.style.minHeight = next ? `${section.offsetHeight}px` : '';
    flushSync(() => setSent(next));
    if (next) closeRef.current?.focus({ preventScroll: true });
    else win.querySelector<HTMLElement>('#f-name')?.focus({ preventScroll: true });
    if (prefersReducedMotion()) return;
    const to = { width: win.offsetWidth, height: win.offsetHeight };
    win.style.maxWidth = 'none';
    animate(
      win,
      { width: [from.width, to.width], height: [from.height, to.height] },
      { duration: 0.42, ease: EASE },
    ).then(() => {
      win.style.width = '';
      win.style.height = '';
      win.style.maxWidth = '';
    });
  };

  return (
    <section className="contact" id="contact" ref={ref}>
      <motion.div className="contact-wall" style={{ y: wallY }} />
      <div className={`window inquiry${sent ? ' sent' : ''}`} ref={windowRef}>
        <TitleBar title={sent ? 'inquiry sent' : 'new inquiry'} />
        {sent ? (
          <motion.div className="sent-body" role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.12 }}>
            <h2>inquiry sent</h2>
            <p>got it. i&apos;ll reply soon.</p>
            <button ref={closeRef} className="button" type="button" onClick={() => morph(false)}>close</button>
          </motion.div>
        ) : (
          <>
            <div className="inquiry-body"><InquiryForm onSent={() => morph(true)} /></div>
            <PathBar status={site.email}>{site.name}<b>›</b>new inquiry</PathBar>
          </>
        )}
      </div>
    </section>
  );
}
