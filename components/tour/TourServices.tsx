'use client';

import { useEffect, useState } from 'react';
import { getTourOverride } from '@/lib/siteContent';

const services = [
  {
    icon: 'ri-guide-line',
    title: 'Tour Guide',
    subtitle: 'Sightseeing & cultural trips',
    desc: 'A friendly, licensed Korean guide who shows you the real Korea — palaces, markets, food, shopping, and hidden local spots — while handling all the logistics so you can simply enjoy.',
    points: [
      'Custom day-by-day itinerary',
      'Historical & cultural explanation in English',
      'Restaurant, transport & ticket arrangements',
      'Shopping and personal errands assistance',
    ],
    image:
      'https://readdy.ai/api/search-image?query=Professional%20friendly%20Korean%20female%20tour%20guide%20in%20smart%20casual%20attire%20holding%20a%20small%20flag%20and%20warmly%20explaining%20a%20historical%20site%20to%20a%20small%20group%20of%20three%20diverse%20international%20business%20travelers%20listening%20attentively%2C%20located%20on%20a%20beautiful%20traditional%20Korean%20hanok%20village%20street%20with%20wooden%20architecture%2C%20bright%20natural%20daylight%2C%20welcoming%20mood%2C%20shallow%20depth%20of%20field%2C%20professional%20corporate%20travel%20photography%20style%20with%20crisp%20colors%20and%20a%20clean%20simple%20background&width=1200&height=800&seq=7002&orientation=landscape',
  },
  {
    icon: 'ri-briefcase-line',
    title: 'Business Interpretation',
    subtitle: 'Meetings, negotiations & visits',
    desc: 'A professional interpreter who accompanies you to business meetings, factory tours, negotiations and events — translating Korean↔English in real time and helping you navigate business etiquette.',
    points: [
      'On-site meeting & negotiation interpretation',
      'Factory, supplier & site visit support',
      'Business etiquette & cultural guidance',
      'Document & contract summary assistance',
    ],
    image:
      'https://readdy.ai/api/search-image?query=Professional%20business%20meeting%20in%20a%20modern%20Seoul%20office%20boardroom%20where%20a%20Korean%20business%20interpreter%20sits%20beside%20two%20international%20executives%20translating%20and%20facilitating%20discussion%20with%20Korean%20partners%20across%20the%20conference%20table%2C%20floor%20to%20ceiling%20windows%20revealing%20the%20Seoul%20city%20skyline%2C%20bright%20neutral%20lighting%2C%20professional%20corporate%20atmosphere%2C%20clean%20minimal%20composition%2C%20high%20end%20business%20photography%20style%20with%20natural%20colors%20and%20crisp%20detail&width=1200&height=800&seq=7003&orientation=landscape',
  },
];

export default function TourServices() {
  const [override, setOverride] = useState<Record<string, unknown>>();
  useEffect(() => {
    getTourOverride().then(o => setOverride(o)).catch(() => {});
  }, []);

  const o = (override?.services as Record<string, string> | undefined) || {};
  const eyebrow = o.eyebrow || 'Our services';
  const title = o.title || 'One companion for tourism and business.';
  const subtitle = o.subtitle || 'Whether you are visiting Korea for a holiday, a business trip, or both, we pair you with a dedicated Korean guide and interpreter tailored to your schedule.';

  return (
    <section id="services" className="py-16 md:py-24 bg-[#FBF7F2]">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-widest text-neutral-500">{eyebrow}</div>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-neutral-900">
            {title}
          </h2>
          <p className="mt-4 text-neutral-600 leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {services.map((s) => (
            <div
              key={s.title}
              className="rounded-3xl overflow-hidden bg-white border border-neutral-200 flex flex-col"
            >
              <div className="relative h-60 overflow-hidden">
                <img src={s.image} alt={s.title} className="w-full h-full object-cover object-top" />
              </div>
              <div className="p-6 md:p-8 flex flex-col flex-1">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 flex items-center justify-center rounded-xl bg-neutral-900 text-white text-xl">
                    <i className={s.icon}></i>
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">{s.title}</h3>
                    <p className="text-sm text-neutral-500">{s.subtitle}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-neutral-600 leading-relaxed">{s.desc}</p>
                <ul className="mt-5 space-y-2.5 flex-1">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-neutral-700">
                      <span className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                        <i className="ri-check-line text-emerald-500"></i>
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}