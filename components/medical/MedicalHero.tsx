'use client';

import { useEffect, useState } from 'react';
import { getMedicalOverride } from '@/lib/siteContent';

export default function MedicalHero() {
  const [override, setOverride] = useState<Record<string, unknown>>();
  useEffect(() => {
    getMedicalOverride().then(o => setOverride(o)).catch(() => {});
  }, []);

  const hero = override?.hero as Record<string, string> | undefined;
  const badge = hero?.badge ?? 'Korea Medical Package';
  const title = hero?.title ?? 'World-class Korean healthcare at a fraction of the cost.';
  const subtitle = hero?.subtitle ?? "Receive treatment at Korea's top hospitals and clinics with a dedicated medical coordinator and interpreter by your side — from consultation to recovery.";
  const ctaPrimary = (override?.ctaPrimary as string | undefined) ?? 'Get a Medical Quote';
  const ctaSecondary = (override?.ctaSecondary as string | undefined) ?? 'View Treatments';

  const tags = (override?.tags as Array<{ icon: string; label: string }> | undefined) ?? [
    { icon: 'ri-hospital-line', label: 'Top-tier hospitals' },
    { icon: 'ri-translate-2', label: 'Medical interpretation' },
    { icon: 'ri-wallet-3-line', label: 'Up to 60-70% savings' },
    { icon: 'ri-shield-check-line', label: 'JCI-accredited care' },
  ];

  return (
    <section className="relative min-h-[640px] flex items-center overflow-hidden">
      <img
        src="https://readdy.ai/api/search-image?query=Modern%20bright%20premium%20medical%20tourism%20welcome%20scene%20in%20Seoul%20South%20Korea%20showing%20a%20clean%20futuristic%20hospital%20lobby%20with%20warm%20natural%20light%20streaming%20through%20floor%20to%20ceiling%20glass%20windows%2C%20a%20friendly%20Korean%20medical%20coordinator%20in%20professional%20attire%20warmly%20greeting%20an%20international%20patient%20and%20guiding%20them%20through%20the%20modern%20clinic%2C%20Seoul%20city%20skyline%20softly%20visible%20in%20background%2C%20calm%20reassuring%20professional%20atmosphere%2C%20the%20left%20third%20of%20the%20image%20has%20softer%20muted%20tones%20suitable%20for%20white%20text%20overlay%2C%20high%20end%20healthcare%20photography%20style%20with%20crisp%20colors%20and%20clean%20simple%20composition&width=1920&height=1080&seq=8001&orientation=landscape"
        alt="Korea Medical Package"
        className="absolute inset-0 w-full h-full object-cover object-top"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/20" />

      <div className="relative z-10 w-full mx-auto max-w-7xl px-4 md:px-8 py-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/30 px-4 py-1.5 text-sm font-medium text-white whitespace-nowrap">
            <span className="w-4 h-4 flex items-center justify-center">
              <i className="ri-heart-pulse-line"></i>
            </span>
            {badge}
          </div>

          <h1 className="mt-6 text-4xl md:text-5xl font-bold text-white leading-tight">
            {title}
          </h1>

          <p className="mt-5 text-lg text-white/85 leading-relaxed">
            {subtitle}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#inquiry"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-neutral-900 font-semibold hover:bg-neutral-100 whitespace-nowrap cursor-pointer"
            >
              {ctaPrimary}
              <span className="w-4 h-4 flex items-center justify-center">
                <i className="ri-arrow-right-line"></i>
              </span>
            </a>
            <a
              href="#treatments"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/40 text-white font-medium hover:bg-white/10 whitespace-nowrap cursor-pointer"
            >
              {ctaSecondary}
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-white">
            {tags.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                <span className="w-4 h-4 flex items-center justify-center">
                  <i className={item.icon}></i>
                </span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}