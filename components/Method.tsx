'use client';

import { useEffect, useState } from 'react';
import { getSiteMethod, DEFAULT_METHOD, type SiteMethod } from '@/lib/siteContent';

export default function Method() {
  const [data, setData] = useState<SiteMethod>(DEFAULT_METHOD);

  useEffect(() => {
    getSiteMethod().then(setData);
  }, []);

  return (
    <section id="method" className="py-16 md:py-24 bg-[#F4F0EA]">
      <div className="mx-auto w-full px-4 md:px-8 grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
        <div>
          <div className="text-xs uppercase tracking-widest text-neutral-500">{data.eyebrow}</div>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-neutral-900 whitespace-pre-line">{data.title}</h2>
          <p className="mt-6 text-neutral-600 leading-relaxed">{data.subtitle}</p>
          <div className="mt-10 space-y-5">
            {data.rows.map((r) => (
              <div key={r.k} className="flex items-center justify-between border-b border-neutral-300 pb-4">
                <div className="text-base md:text-lg font-semibold text-neutral-900" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>{r.k}</div>
                <div className="text-xs md:text-sm text-neutral-600">{r.v}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 p-5 md:p-6 rounded-2xl bg-white border border-neutral-200">
            <div className="text-xs uppercase tracking-widest text-neutral-500 mb-4">{data.boxTitle}</div>
            <ul className="space-y-3 text-sm text-neutral-700">
              {data.boxItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-neutral-900 text-white text-[10px] shrink-0">1</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative aspect-[5/4] rounded-3xl overflow-hidden shadow-xl">
          <img
            src={data.image}
            alt="Coaching session"
            className="w-full h-full object-cover object-top"
          />
        </div>
      </div>
    </section>
  );
}