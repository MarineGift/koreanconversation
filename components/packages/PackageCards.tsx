'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getPackagesOverride } from '@/lib/siteContent';

const cards = [
  {
    href: '/tour',
    title: 'Korea Tour Package',
    desc: 'A licensed guide and business interpreter for sightseeing, culture, food and light business.',
    image:
      'https://readdy.ai/api/search-image?query=Breathtaking%20panoramic%20view%20of%20Seoul%20South%20Korea%20at%20golden%20hour%20featuring%20the%20traditional%20Gyeongbokgung%20Palace%20with%20elegant%20curved%20tile%20rooftops%20in%20the%20foreground%20and%20the%20modern%20city%20skyline%20with%20N%20Seoul%20Tower%20and%20Lotte%20World%20Tower%20rising%20in%20the%20background%2C%20warm%20inviting%20atmosphere%20with%20soft%20clouds%20and%20gentle%20sunlight%2C%20high%20end%20professional%20travel%20photography%20style%20with%20vibrant%20natural%20colors%20and%20crisp%20sharp%20detail&width=1200&height=800&seq=7001&orientation=landscape',
    points: ['Private guide & interpreter', 'Fully custom itinerary', 'Airport pickup & transport'],
  },
  {
    href: '/business',
    title: 'Korea Business Package',
    desc: 'End-to-end support from airport pickup to accommodation, meetings and company setup.',
    image:
      'https://readdy.ai/api/search-image?query=Professional%20Korean%20business%20assistant%20in%20a%20tailored%20suit%20welcoming%20an%20international%20business%20executive%20at%20a%20modern%20Korean%20airport%20arrival%20hall%20with%20warm%20natural%20light%20and%20elegant%20premium%20atmosphere%2C%20both%20smiling%20and%20walking%20together%20through%20a%20sleek%20glass%20terminal%2C%20Seoul%20city%20skyline%20visible%20through%20large%20windows%20in%20the%20background%2C%20high%20end%20corporate%20travel%20photography%20style%20with%20crisp%20colors%20clean%20simple%20composition%20and%20soft%20depth%20of%20field&width=1200&height=800&seq=7101&orientation=landscape',
    points: ['Airport to departure', 'Accommodation & transport', 'Business & legal support'],
  },
  {
    href: '/medical',
    title: 'Korea Medical Package',
    desc: 'World-class Korean healthcare with a medical coordinator and interpreter for treatment.',
    image:
      'https://readdy.ai/api/search-image?query=Modern%20bright%20premium%20medical%20tourism%20welcome%20scene%20in%20Seoul%20South%20Korea%20showing%20a%20clean%20futuristic%20hospital%20lobby%20with%20warm%20natural%20light%20streaming%20through%20floor%20to%20ceiling%20glass%20windows%2C%20a%20friendly%20Korean%20medical%20coordinator%20in%20professional%20attire%20warmly%20greeting%20an%20international%20patient%2C%20calm%20reassuring%20professional%20atmosphere%2C%20high%20end%20healthcare%20photography%20style%20with%20crisp%20colors%20and%20clean%20simple%20composition&width=1200&height=800&seq=8001&orientation=landscape',
    points: ['Top hospital matching', 'Medical interpretation', 'Health checkup & treatments'],
  },
];

export default function PackageCards() {
  const [override, setOverride] = useState<Record<string, unknown>>();
  useEffect(() => {
    getPackagesOverride().then(o => setOverride(o)).catch(() => {});
  }, []);

  const o = (override?.cards as Record<string, string> | undefined) || {};
  const eyebrow = o.eyebrow || 'Packages at a glance';
  const title = o.title || 'Three ways to experience Korea.';
  const subtitle = o.subtitle || 'Every package is fully customizable. Tell us what you need and we\'ll prepare a tailored quote for your trip.';

  return (
    <section className="py-16 md:py-24 bg-[#FBF7F2]">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-xs uppercase tracking-widest text-neutral-500">{eyebrow}</div>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-neutral-900">
            {title}
          </h2>
          <p className="mt-4 text-neutral-600 leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {cards.map((c) => (
            <div key={c.href} className="rounded-3xl overflow-hidden bg-white border border-neutral-200 flex flex-col">
              <div className="relative h-52 overflow-hidden">
                <img src={c.image} alt={c.title} className="w-full h-full object-cover object-top" />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-lg font-semibold text-neutral-900">{c.title}</h3>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{c.desc}</p>

                <ul className="mt-5 space-y-2 flex-1">
                  {c.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5 text-sm text-neutral-700">
                      <span className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                        <i className="ri-check-line text-emerald-500"></i>
                      </span>
                      {pt}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 rounded-xl bg-[#FBF7F2] border border-neutral-200 px-4 py-3 text-center">
                  <div className="text-xs uppercase tracking-wider text-neutral-500">Customized quote</div>
                  <div className="mt-0.5 text-sm font-semibold text-neutral-900">Priced to your needs</div>
                </div>

                <Link
                  href={c.href}
                  className="mt-4 w-full text-center py-3 rounded-full border border-neutral-300 text-neutral-700 font-medium hover:border-neutral-900 transition whitespace-nowrap cursor-pointer"
                >
                  View Package
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}