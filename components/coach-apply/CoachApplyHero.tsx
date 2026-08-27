'use client';

import { useEffect, useState } from 'react';
import { getCoachApplicationConfig, type CoachApplicationConfig } from '@/lib/coachApplication';

export default function CoachApplyHero() {
  const [config, setConfig] = useState<CoachApplicationConfig | null>(null);

  useEffect(() => {
    (async () => {
      const cfg = await getCoachApplicationConfig();
      setConfig(cfg);
    })();
  }, []);

  const accent = config?.accentColor ?? '#171717';
  const title = config?.title ?? '코치로 함께해요';
  const intro = config?.intro ?? '코치 지원서를 작성해 주세요.';
  const roleLabel = config?.roleLabel ?? '코치';

  return (
    <section className="relative overflow-hidden px-4 md:px-8">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
        }}
      />
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-black blur-3xl"></div>
      </div>

      <div className="relative mx-auto w-full max-w-4xl py-16 md:py-24 text-white">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-medium tracking-wide">
          <i className="ri-user-star-line"></i>
          {roleLabel} 모집
        </span>
        <h1 className="mt-5 text-3xl md:text-5xl font-bold leading-tight">{title}</h1>
        <p className="mt-4 text-base md:text-lg text-white/85 leading-relaxed max-w-2xl">{intro}</p>
      </div>
    </section>
  );
}