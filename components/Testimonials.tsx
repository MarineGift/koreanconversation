'use client';

import { useEffect, useState } from 'react';
import { getSiteTestimonials, DEFAULT_TESTIMONIALS, type SiteTestimonials } from '@/lib/siteContent';

export default function Testimonials() {
  const [data, setData] = useState<SiteTestimonials>(DEFAULT_TESTIMONIALS);

  useEffect(() => {
    getSiteTestimonials().then(setData);
  }, []);

  return (
    <section id="testimonials" className="py-16 md:py-24 bg-white">
      <div className="mx-auto w-full px-4 md:px-8">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-widest text-neutral-500">{data.eyebrow}</div>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-neutral-900 whitespace-pre-line">{data.title}</h2>
        </div>
        <div className="mt-10 md:mt-14 grid md:grid-cols-3 gap-4 md:gap-6">
          {data.items.map((t) => (
            <div key={t.name} className="p-6 md:p-8 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div className="w-8 h-8 flex items-center justify-center text-neutral-400"><i className="ri-double-quotes-l text-3xl"></i></div>
              <p className="mt-4 text-neutral-800 leading-relaxed">{t.text}</p>
              <div className="mt-6 flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover object-top" />
                <div>
                  <div className="font-semibold text-neutral-900">{t.name}</div>
                  <div className="text-xs text-neutral-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}