'use client';

import { useEffect, useState } from 'react';
import { getTourOverride } from '@/lib/siteContent';

export default function TourHero() {
  const [override, setOverride] = useState<Record<string, unknown>>();
  useEffect(() => {
    getTourOverride().then(o => setOverride(o)).catch(() => {});
  }, []);

  const hero = override?.hero as Record<string, string> | undefined;
  const badge = hero?.badge ?? 'Korea Tour Package';
  const title = hero?.title ?? 'Travel & do business in Korea with a local guide by your side.';
  const subtitle = hero?.subtitle ?? 'A professional Korean tour guide and business interpreter who supports you from airport pickup to meetings, sightseeing, dining and everything in between.';
  const ctaPrimary = (override?.ctaPrimary as string | undefined) ?? 'Request a Quote';
  const ctaSecondary = (override?.ctaSecondary as string | undefined) ?? 'Explore Services';

  const tags = (override?.tags as Array<{ icon: string; label: string }> | undefined) ?? [
    { icon: 'ri-guide-line', label: 'Licensed local guide' },
    { icon: 'ri-translate-2', label: 'Business interpretation' },
    { icon: 'ri-car-line', label: 'Airport pickup & transport' },
    { icon: 'ri-map-pin-line', label: 'Custom itinerary' },
  ];

  return (
    <section className="relative min-h-[640px] flex items-center overflow-hidden">
      <img
        src="https://readdy.ai/api/search-image?query=Breathtaking%20panoramic%20view%20of%20Seoul%20South%20Korea%20at%20golden%20hour%20featuring%20the%20traditional%20Gyeongbokgung%20Palace%20with%20elegant%20curved%20tile%20rooftops%20in%20the%20foreground%20and%20the%20modern%20city%20skyline%20with%20N%20Seoul%20Tower%20and%20Lotte%20World%20Tower%20rising%20in%20the%20background%2C%20warm%20inviting%20atmosphere%20with%20soft%20clouds%20and%20gentle%20sunlight%2C%20the%20left%20third%20of%20the%20image%20has%20calm%20softer%20muted%20tones%20suitable%20for%20white%20text%20overlay%2C%20high%20end%20professional%20travel%20photography%20style%20with%20vibrant%20natural%20colors%20and%20crisp%20sharp%20detail&width=1920&height=1080&seq=7001&orientation=landscape"
        alt="Seoul Korea tourism"
        className="absolute inset-0 w-full h-full object-cover object-top"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/20" />

      <div className="relative z-10 w-full mx-auto max-w-7xl px-4 md:px-8 py-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/30 px-4 py-1.5 text-sm font-medium text-white whitespace-nowrap">
            <span className="w-4 h-4 flex items-center justify-center">
              <i className="ri-earth-line"></i>
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
              href="#services"
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