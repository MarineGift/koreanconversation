'use client';

import { useEffect, useState } from 'react';
import { getSiteForWho, DEFAULT_FORWHO, type SiteForWho } from '@/lib/siteContent';

export default function ForWho() {
  const [data, setData] = useState<SiteForWho>(DEFAULT_FORWHO);

  useEffect(() => {
    getSiteForWho().then(setData);
  }, []);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="mx-auto w-full px-4 md:px-8">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-widest text-neutral-500">{data.eyebrow}</div>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-neutral-900 whitespace-pre-line">{data.title}</h2>
          <p className="mt-5 text-neutral-600 leading-relaxed">{data.subtitle}</p>
        </div>

        <div className="mt-10 md:mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {data.items.map((it) => (
            <div key={it.title} className="p-5 md:p-6 rounded-2xl border border-neutral-200 bg-neutral-50/50 hover:bg-white hover:shadow-lg transition">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-neutral-900 text-white">
                <i className={`${it.icon} text-xl`}></i>
              </div>
              <h3 className="mt-5 font-semibold text-lg text-neutral-900">{it.title}</h3>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}