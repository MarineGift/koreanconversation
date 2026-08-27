'use client';

import { useEffect, useState } from 'react';
import { getBusinessOverride } from '@/lib/siteContent';

const stages = [
  {
    icon: 'ri-flight-land-line',
    title: 'Airport Arrival',
    desc: 'We meet you at the airport, handle your luggage, and take you to your accommodation or first appointment.',
  },
  {
    icon: 'ri-hotel-line',
    title: 'Accommodation',
    desc: 'Hotel or long-stay residence booking matched to your budget, location and length of stay.',
  },
  {
    icon: 'ri-briefcase-4-line',
    title: 'Business',
    desc: 'Meeting interpretation, negotiation support, factory and site visits, plus market research and networking.',
  },
  {
    icon: 'ri-map-pin-2-line',
    title: 'Tourism',
    desc: 'Sightseeing, dining, shopping and cultural experiences whenever your schedule allows.',
  },
];

export default function BusinessJourney() {
  const [override, setOverride] = useState<Record<string, unknown>>();
  useEffect(() => {
    getBusinessOverride().then(o => setOverride(o)).catch(() => {});
  }, []);

  const o = (override?.journey as Record<string, string> | undefined) || {};
  const eyebrow = o.eyebrow || 'End-to-end service';
  const title = o.title || 'From the moment you land to the day you fly out.';
  const subtitle = o.subtitle || 'We take care of the whole journey so you can focus on your business. Use the full service, or select only the stages you need.';

  return (
    <section className="py-16 md:py-24 bg-[#FBF7F2]">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-widest text-neutral-500">{eyebrow}</div>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-neutral-900">
            {title}
          </h2>
          <p className="mt-4 text-neutral-600 leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-4 gap-5">
          {stages.map((s, i) => (
            <div key={s.title} className="relative bg-white rounded-2xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between">
                <span className="w-11 h-11 flex items-center justify-center rounded-xl bg-neutral-900 text-white text-xl">
                  <i className={s.icon}></i>
                </span>
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Stage {i + 1}</span>
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