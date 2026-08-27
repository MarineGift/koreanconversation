'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import HangulScene from './HangulScene';
import { getSiteHero, DEFAULT_HERO, type SiteHero } from '@/lib/siteContent';

export default function Hero() {
  const [hero, setHero] = useState<SiteHero>(DEFAULT_HERO);

  useEffect(() => {
    getSiteHero().then(setHero);
  }, []);

  return (
    <section className="relative pt-24 pb-16 overflow-hidden bg-gradient-to-b from-[#FBF7F2] to-white">
      <div className="mx-auto w-full px-4 md:px-8 grid lg:grid-cols-2 gap-10 items-center min-h-[520px] lg:min-h-[720px]">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white/70 backdrop-blur px-4 py-1.5 text-xs uppercase tracking-widest text-neutral-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {hero.badge}
          </div>
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-neutral-900">
            {hero.title}<br />
            <span className="bg-gradient-to-r from-rose-500 via-indigo-500 to-amber-500 bg-clip-text text-transparent">{hero.accent}</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-neutral-600 max-w-xl leading-relaxed">
            {hero.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/free" className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3.5 rounded-full hover:bg-neutral-800 whitespace-nowrap cursor-pointer">
              <span className="w-5 h-5 flex items-center justify-center"><i className="ri-gift-line"></i></span>
              Claim Free 10-min Coaching
            </Link>
            <a href="#program" className="inline-flex items-center gap-2 bg-white border border-neutral-300 text-neutral-900 px-6 py-3.5 rounded-full hover:bg-neutral-50 whitespace-nowrap cursor-pointer">
              See the program
              <span className="w-5 h-5 flex items-center justify-center"><i className="ri-arrow-right-line"></i></span>
            </a>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 sm:gap-6 max-w-lg">
            <Stat n="1:1" l="Live coaching" />
            <Stat n="SNU" l="Trained coach" />
            <Stat n="10min" l="Free trial" />
          </div>
        </div>

        <div className="relative h-[360px] sm:h-[440px] md:h-[520px] lg:h-[560px]">
          <HangulScene />
        </div>
      </div>
    </section>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="text-xl sm:text-2xl font-bold text-neutral-900">{n}</div>
      <div className="text-[10px] sm:text-xs uppercase tracking-widest text-neutral-500 mt-1">{l}</div>
    </div>
  );
}