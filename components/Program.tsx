'use client';

import { useEffect, useState } from 'react';
import { getSiteProgram, DEFAULT_PROGRAM, type SiteProgram } from '@/lib/siteContent';

export default function Program() {
  const [data, setData] = useState<SiteProgram>(DEFAULT_PROGRAM);

  useEffect(() => {
    getSiteProgram().then(setData);
  }, []);

  return (
    <section id="program" className="py-16 md:py-24 bg-white">
      <div className="mx-auto w-full px-4 md:px-8">
        <div className="flex items-end justify-between flex-wrap gap-6">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-widest text-neutral-500">{data.eyebrow}</div>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold text-neutral-900 whitespace-pre-line">{data.title}</h2>
            <p className="mt-4 text-neutral-600 leading-relaxed">{data.subtitle}</p>
          </div>
          <a href="#signup" className="inline-flex items-center gap-2 text-sm text-neutral-900 border-b border-neutral-900 pb-1 cursor-pointer whitespace-nowrap">
            {data.cta}
            <span className="w-4 h-4 flex items-center justify-center"><i className="ri-arrow-right-line"></i></span>
          </a>
        </div>

        <div className="mt-10 md:mt-14 grid md:grid-cols-3 gap-4 md:gap-5">
          {data.items.map((t) => (
            <div key={t.title} className="p-6 md:p-7 rounded-2xl bg-neutral-900 text-white flex flex-col">
              <span className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/10 shrink-0 text-xl"><i className={t.icon}></i></span>
              <h3 className="mt-5 text-lg font-semibold">{t.title}</h3>
              <p className="mt-3 text-sm text-neutral-300 leading-relaxed">{t.desc}</p>
              <ul className="mt-5 space-y-2 text-sm text-neutral-300">
                {t.points.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <span className="w-4 h-4 flex items-center justify-center shrink-0 mt-0.5"><i className="ri-check-line text-emerald-400"></i></span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}