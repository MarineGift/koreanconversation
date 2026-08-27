'use client';

import { useEffect, useState } from 'react';
import { getMedicalOverride } from '@/lib/siteContent';
import { quoteSteps } from '@/lib/packagePricing';

const points = [
  { icon: 'ri-user-heart-line', title: 'Medical coordinator', desc: 'A bilingual coordinator & interpreter by your side for every appointment.' },
  { icon: 'ri-hospital-line', title: 'Hospital fees', desc: 'Quoted directly by your hospital after a consultation, so you always see the breakdown.' },
  { icon: 'ri-file-list-3-line', title: 'Custom care plan', desc: 'Tailored to your treatment, recovery and any sightseeing you want to add.' },
];

export default function MedicalPricing() {
  const [override, setOverride] = useState<Record<string, unknown>>();
  useEffect(() => {
    getMedicalOverride().then(o => setOverride(o)).catch(() => {});
  }, []);

  const o = (override?.pricing as Record<string, string> | undefined) || {};
  const eyebrow = o.eyebrow || 'Pricing';
  const title = o.title || 'A transparent quote for your treatment plan.';
  const subtitle = o.subtitle || 'Medical care is highly personal, so we don\'t use fixed prices. Share the treatment you need and we\'ll prepare a clear, itemized quote for every part of your stay.';

  const cta = (override?.pricingCta as Record<string, string> | undefined) || {};
  const ctaTitle = cta.title || 'Get a clear estimate for your treatment and stay.';
  const ctaSubtitle = cta.subtitle || 'Tell us your treatment goals and preferred dates below. We\'ll respond within 24 hours with hospital recommendations and a transparent cost estimate.';
  const ctaButton = cta.button || 'Request a Medical Quote';

  return (
    <section id="pricing" className="py-16 md:py-24 bg-[#FBF7F2]">
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
          {points.map((p) => (
            <div key={p.title} className="rounded-2xl border border-neutral-200 bg-white p-6 md:p-8">
              <span className="w-11 h-11 flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 text-xl">
                <i className={p.icon}></i>
              </span>
              <h3 className="mt-4 font-semibold text-neutral-900">{p.title}</h3>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl bg-neutral-900 p-8 md:p-12 text-center">
          <div className="text-xs uppercase tracking-widest text-neutral-400">Customized quote</div>
          <h3 className="mt-3 text-2xl md:text-3xl font-bold text-white">
            {ctaTitle}
          </h3>
          <p className="mt-4 max-w-xl mx-auto text-neutral-300 leading-relaxed">
            {ctaSubtitle}
          </p>
          <a
            href="#inquiry"
            className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-neutral-900 font-semibold hover:bg-neutral-100 whitespace-nowrap cursor-pointer"
          >
            {ctaButton}
            <span className="w-4 h-4 flex items-center justify-center">
              <i className="ri-arrow-right-line"></i>
            </span>
          </a>
        </div>

        <div className="mt-16">
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest text-neutral-500">How it works</div>
            <h3 className="mt-3 text-2xl font-bold text-neutral-900">Three simple steps.</h3>
          </div>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {quoteSteps.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border border-neutral-200 bg-white p-6">
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