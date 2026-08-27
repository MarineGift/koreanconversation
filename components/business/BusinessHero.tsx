'use client';

import { useEffect, useState } from 'react';
import { getBusinessOverride } from '@/lib/siteContent';

export default function BusinessHero() {
  const [override, setOverride] = useState<Record<string, unknown>>();
  useEffect(() => {
    getBusinessOverride().then(o => setOverride(o)).catch(() => {});
  }, []);

  const hero = override?.hero as Record<string, string> | undefined;
  const badge = hero?.badge ?? 'Korea Business Package';
  const title = hero?.title ?? 'A fully customized business trip to Korea, from arrival to departure.';
  const subtitle = hero?.subtitle ?? 'One comprehensive, personal service covering everything — airport pickup, accommodation, business meetings, and sightseeing. Pick only the parts you need.';
  const ctaPrimary = (override?.ctaPrimary as string | undefined) ?? 'Discuss Your Trip';
  const ctaSecondary = (override?.ctaSecondary as string | undefined) ?? 'View Modules';

  const tags = (override?.tags as Array<{ icon: string; label: string }> | undefined) ?? [
    { icon: 'ri-flight-land-line', label: 'Airport arrival' },
    { icon: 'ri-hotel-line', label: 'Accommodation' },
    { icon: 'ri-briefcase-line', label: 'Business support' },
    { icon: 'ri-map-pin-line', label: 'Sightseeing' },
  ];

  return (
    <section className="relative min-h-[640px] flex items-center overflow-hidden">
      <img
        src="https://readdy.ai/api/search-image?query=Professional%20Korean%20business%20assistant%20in%20a%20tailored%20suit%20welcoming%20an%20international%20business%20executive%20at%20a%20modern%20Korean%20airport%20arrival%20hall%20with%20warm%20natural%20light%20and%20elegant%20premium%20atmosphere%2C%20both%20smiling%20and%20walking%20together%20through%20a%20sleek%20glass%20terminal%2C%20Seoul%20city%20skyline%20visible%20through%20large%20windows%20in%20the%20background%2C%20high%20end%20corporate%20travel%20photography%20style%20with%20crisp%20colors%20clean%20simple%20composition%20and%20soft%20depth%20of%20field&width=1920&height=1080&seq=7101&orientation=landscape"
        alt="Korea Business Package"
        className="absolute inset-0 w-full h-full object-cover object-top"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20" />

      <div className="relative z-10 w-full mx-auto max-w-7xl px-4 md:px-8 py-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/30 px-4 py-1.5 text-sm font-medium text-white whitespace-nowrap">
            <span className="w-4 h-4 flex items-center justify-center">
              <i className="ri-briefcase-4-line"></i>
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
              href="#modules"
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