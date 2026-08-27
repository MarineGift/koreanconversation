'use client';

import { useEffect, useState } from 'react';
import { getBusinessOverride } from '@/lib/siteContent';

const modules = [
  {
    icon: 'ri-flight-takeoff-line',
    title: 'Airport & Transport',
    desc: 'Airport pickup, private transfer, and a dedicated driver for your entire stay.',
    items: ['Airport meet & greet', 'Private chauffeur service', 'Inter-city transport', 'Luggage handling'],
  },
  {
    icon: 'ri-hotel-bed-line',
    title: 'Accommodation',
    desc: 'Short or long-stay booking that fits your budget, location and schedule.',
    items: ['Hotel & residence booking', 'Long-term stay arrangement', 'Location consultation', 'Check-in support'],
  },
  {
    icon: 'ri-briefcase-4-line',
    title: 'Business Support',
    desc: 'Everything you need to meet partners, close deals and grow in Korea.',
    items: ['Meeting & negotiation interpretation', 'Factory & site visits', 'Market research', 'Business networking & matchmaking'],
  },
  {
    icon: 'ri-building-2-line',
    title: 'Setup & Legal',
    desc: 'Practical help for those who want to establish a presence in Korea.',
    items: ['Company registration guidance', 'Visa & document support', 'Banking & legal referrals', 'Office & HR consulting'],
  },
  {
    icon: 'ri-map-pin-2-line',
    title: 'Tourism & Culture',
    desc: 'Make the most of your free time with curated local experiences.',
    items: ['Custom sightseeing tours', 'Dining & food experiences', 'Shopping assistance', 'Cultural activities'],
  },
  {
    icon: 'ri-customer-service-2-line',
    title: 'Personal Concierge',
    desc: 'A bilingual assistant on call to solve anything during your stay.',
    items: ['24/7 on-call support', 'Errand & reservation service', 'Emergency assistance', 'Translation on demand'],
  },
];

export default function BusinessModules() {
  const [override, setOverride] = useState<Record<string, unknown>>();
  useEffect(() => {
    getBusinessOverride().then(o => setOverride(o)).catch(() => {});
  }, []);

  const o = (override?.modules as Record<string, string> | undefined) || {};
  const eyebrow = o.eyebrow || 'Customizable modules';
  const title = o.title || 'Select only what you need.';
  const subtitle = o.subtitle || 'Build your own package by choosing the services that matter to your trip. Mix and match freely — pay only for the parts you use.';

  return (
    <section id="modules" className="py-16 md:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-xs uppercase tracking-widest text-neutral-500">{eyebrow}</div>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-neutral-900">
            {title}
          </h2>
          <p className="mt-4 text-neutral-600 leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {modules.map((m) => (
            <div key={m.title} className="bg-white rounded-2xl border border-neutral-200 p-6 flex flex-col hover:border-neutral-300 transition">
              <span className="w-11 h-11 flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 text-xl">
                <i className={m.icon}></i>
              </span>
              <h3 className="mt-4 font-semibold text-neutral-900">{m.title}</h3>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{m.desc}</p>
              <ul className="mt-5 space-y-2 flex-1">
                {m.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-neutral-700">
                    <span className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                      <i className="ri-check-line text-emerald-500"></i>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <div className="inline-flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-full px-5 py-2.5">
            <span className="w-5 h-5 flex items-center justify-center">
              <i className="ri-information-line text-amber-600"></i>
            </span>
            <span className="text-sm font-medium text-amber-800">
              Pricing is negotiated individually based on the modules and duration you choose.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}