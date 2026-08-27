'use client';

import { useEffect, useState } from 'react';
import { getTourOverride } from '@/lib/siteContent';

const steps = [
  {
    icon: 'ri-chat-smile-3-line',
    title: 'Tell us your plan',
    desc: 'Share your travel dates, purpose (tourism / business / both), group size and what you need.',
  },
  {
    icon: 'ri-file-list-3-line',
    title: 'Receive a custom quote',
    desc: 'We send you a detailed itinerary and a transparent, itemized price within 24 hours.',
  },
  {
    icon: 'ri-team-line',
    title: 'Confirm & meet your guide',
    desc: 'Once confirmed, your dedicated Korean guide & interpreter is assigned before you arrive.',
  },
  {
    icon: 'ri-flight-land-line',
    title: 'Arrive & enjoy',
    desc: 'From airport pickup to your final meeting, your companion takes care of everything.',
  },
];

export default function TourProcess() {
  const [override, setOverride] = useState<Record<string, unknown>>();
  useEffect(() => {
    getTourOverride().then(o => setOverride(o)).catch(() => {});
  }, []);

  const o = (override?.process as Record<string, string> | undefined) || {};
  const eyebrow = o.eyebrow || 'How it works';
  const title = o.title || 'Simple from inquiry to arrival.';
  const subtitle = o.subtitle || '';

  return (
    <section className="py-16 md:py-24 bg-[#FBF7F2]">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-xs uppercase tracking-widest text-neutral-500">{eyebrow}</div>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-neutral-900">
            {title}
          </h2>
          {subtitle && <p className="mt-4 text-neutral-600 leading-relaxed">{subtitle}</p>}
        </div>

        <div className="mt-12 grid md:grid-cols-4 gap-5">
          {steps.map((s, i) => (
            <div key={s.title} className="relative bg-white rounded-2xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between">
                <span className="w-11 h-11 flex items-center justify-center rounded-xl bg-neutral-900 text-white text-xl">
                  <i className={s.icon}></i>
                </span>
                <span className="text-4xl font-bold text-neutral-100">{i + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold text-neutral-900">{s.title}</h3>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}