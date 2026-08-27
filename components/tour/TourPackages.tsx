'use client';

import { useEffect, useState } from 'react';
import { getTourOverride } from '@/lib/siteContent';
import { tourPackages, quoteSteps } from '@/lib/packagePricing';

export default function TourPackages() {
  const [override, setOverride] = useState<Record<string, unknown>>();
  useEffect(() => {
    getTourOverride().then(o => setOverride(o)).catch(() => {});
  }, []);

  const o = (override?.packages as Record<string, string> | undefined) || {};
  const eyebrow = o.eyebrow || 'Packages & Pricing';
  const title = o.title || 'Custom pricing, tailored to your trip.';
  const subtitle = o.subtitle || "Every trip is different, so we don't use fixed rates. Tell us the services you want, your dates and your group size — and we'll prepare a clear, itemized quote.";

  return (
    <section id="pricing" className="py-16 md:py-24 bg-white">
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

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {tourPackages.map((p) => (
            <div
              key={p.id}
              className={`relative rounded-2xl border bg-white p-6 md:p-8 flex flex-col ${
                p.popular ? 'border-neutral-900 shadow-xl' : 'border-neutral-200'
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-6 bg-neutral-900 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                  Best Value
                </div>
              )}
              <h3 className="text-lg font-semibold text-neutral-900">
                {p.title}
                <span className="ml-1.5 text-sm text-neutral-400">({p.titleKo})</span>
              </h3>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{p.desc}</p>

              <ul className="mt-6 space-y-2.5 flex-1">
                {p.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-neutral-700">
                    <span className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                      <i className="ri-check-line text-emerald-500"></i>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-xl bg-[#FBF7F2] border border-neutral-200 p-4 text-center">
                <div className="text-xs uppercase tracking-wider text-neutral-500">Customized quote</div>
                <div className="mt-1 text-sm font-semibold text-neutral-900">Priced to your needs</div>
              </div>

              <a
                href="#inquiry"
                className={`mt-4 w-full text-center py-3 rounded-full font-medium transition whitespace-nowrap cursor-pointer ${
                  p.popular
                    ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                    : 'border border-neutral-300 text-neutral-700 hover:border-neutral-900'
                }`}
              >
                Request a Quote
              </a>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest text-neutral-500">How it works</div>
            <h3 className="mt-3 text-2xl font-bold text-neutral-900">Three simple steps.</h3>
          </div>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {quoteSteps.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border border-neutral-200 p-6">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-900 text-white text-lg shrink-0">
                    {i + 1}
                  </span>
                  <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 text-xl">
                    <i className={s.icon}></i>
                  </span>
                </div>
                <h4 className="mt-4 font-semibold text-neutral-900">{s.title}</h4>
                <p className="mt-1.5 text-sm text-neutral-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}