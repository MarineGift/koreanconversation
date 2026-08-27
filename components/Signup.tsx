'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getOrgId } from '@/lib/org';
import { getSiteSignup, DEFAULT_SIGNUP, type SiteSignup } from '@/lib/siteContent';

export default function Signup() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [data, setData] = useState<SiteSignup>(DEFAULT_SIGNUP);

  useEffect(() => {
    getSiteSignup().then(setData);
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setMsg('');

    const form = e.currentTarget;
    const fd = new FormData(form);
    const nationality = String(fd.get('nationality') || '').trim();
    const email = String(fd.get('email') || '').trim();
    const consent = fd.get('consent') === 'on';

    if (!consent) {
      setStatus('error');
      setMsg('Please agree to receive emails to continue.');
      return;
    }

    const { error } = await supabase
      .from('mailing_list')
      .insert([{ nationality, email, consent: true, organization_id: await getOrgId() }]);

    if (error) {
      setStatus('error');
      if (error.code === '23505') {
        setMsg('This email is already registered. Welcome back — check your inbox for next steps.');
      } else {
        setMsg('Something went wrong. Please try again.');
      }
      return;
    }

    setStatus('ok');
    setMsg("You're on the list! Your free 10-minute coaching has been reserved — check your inbox for next steps.");
    form.reset();
  };

  return (
    <section id="signup" className="py-16 md:py-24 bg-neutral-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-rose-500 blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-500 blur-3xl"></div>
      </div>
      <div className="relative mx-auto max-w-5xl px-4 md:px-8 grid lg:grid-cols-2 gap-10 md:gap-12 items-center">
        <div>
          <div className="text-xs uppercase tracking-widest text-neutral-400">{data.eyebrow}</div>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold leading-tight whitespace-pre-line">{data.title}</h2>
          <p className="mt-5 text-neutral-300 leading-relaxed">{data.subtitle}</p>
          <ul className="mt-8 space-y-3 text-sm text-neutral-300">
            {data.bullets.map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white/10 shrink-0"><i className="ri-check-line"></i></span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={onSubmit} className="bg-white text-neutral-900 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-neutral-500">Nationality</label>
              <input name="nationality" required className="mt-2 w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-neutral-900 focus:outline-none text-sm" placeholder="e.g., USA, Japan, Germany" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-neutral-500">Email</label>
              <input name="email" type="email" required className="mt-2 w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-neutral-900 focus:outline-none text-sm" placeholder="you@company.com" />
            </div>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input name="consent" type="checkbox" className="mt-0.5 w-4 h-4 shrink-0 accent-neutral-900" />
              <span className="text-xs text-neutral-500 leading-relaxed">
                I agree to receive emails with coaching tips, updates, and offers. I can unsubscribe anytime.
              </span>
            </label>
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="mt-6 w-full bg-neutral-900 text-white py-3.5 rounded-full hover:bg-neutral-800 whitespace-nowrap cursor-pointer disabled:opacity-60"
          >
            {status === 'loading' ? 'Reserving…' : 'Reserve my free 10-minute coaching'}
          </button>
          {status === 'ok' && (
            <div className="mt-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">{msg}</div>
          )}
          {status === 'error' && (
            <div className="mt-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">{msg}</div>
          )}
          <Link href="/free" className="mt-4 block text-center text-sm text-neutral-900 font-medium underline underline-offset-4 hover:text-neutral-600 cursor-pointer whitespace-nowrap">
            Book your free 10-minute session
          </Link>
          <p className="mt-4 text-[11px] text-neutral-500 text-center">By joining, you agree to receive occasional emails. Unsubscribe anytime.</p>
        </form>
      </div>
    </section>
  );
}