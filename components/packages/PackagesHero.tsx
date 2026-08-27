'use client';

import { useEffect, useState } from 'react';
import { getPackagesOverride } from '@/lib/siteContent';

export default function PackagesHero() {
  const [override, setOverride] = useState<Record<string, unknown>>();
  useEffect(() => {
    getPackagesOverride().then(o => setOverride(o)).catch(() => {});
  }, []);

  const hero = override?.hero as Record<string, string> | undefined;
  const badge = hero?.badge ?? 'Compare Packages';
  const title = hero?.title ?? 'Which Korea package is right for you?';
  const subtitle = hero?.subtitle ?? "The Korea Tour Package is built for sightseeing, the Business Package for end-to-end business support, and the Medical Package for world-class healthcare — all with a dedicated Korean companion by your side.";

  return (
    <section className="py-16 md:py-20 bg-[#FBF7F2]">
      <div className="mx-auto max-w-4xl px-4 md:px-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white border border-neutral-200 px-4 py-1.5 text-sm font-medium text-neutral-700 whitespace-nowrap">
          <span className="w-4 h-4 flex items-center justify-center">
            <i className="ri-compasses-line"></i>
          </span>
          {badge}
        </div>
        <h1 className="mt-6 text-3xl md:text-5xl font-bold text-neutral-900 leading-tight">
          {title}
        </h1>
        <p className="mt-5 text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      </div>
    </section>
  );
}