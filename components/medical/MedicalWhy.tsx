'use client';

import { useEffect, useState } from 'react';
import { getMedicalOverride } from '@/lib/siteContent';

const stats = [
  { icon: 'ri-award-line', value: 'JCI', label: 'Internationally accredited hospitals' },
  { icon: 'ri-wallet-3-line', value: '60-70%', label: 'Cost savings vs. the U.S. & Europe' },
  { icon: 'ri-group-line', value: '1M+', label: 'International patients every year' },
  { icon: 'ri-medal-line', value: 'Top 5', label: 'Global healthcare quality ranking' },
];

export default function MedicalWhy() {
  const [override, setOverride] = useState<Record<string, unknown>>();
  useEffect(() => {
    getMedicalOverride().then(o => setOverride(o)).catch(() => {});
  }, []);

  const o = (override?.why as Record<string, string> | undefined) || {};
  const eyebrow = o.eyebrow || 'Why Korea';
  const title = o.title || 'Advanced medicine, reasonable prices.';
  const subtitle = o.subtitle || 'Korea is a global leader in healthcare, combining cutting-edge technology with internationally accredited hospitals — all at a cost that is far more affordable than treatment in the U.S. or Europe.';

  return (
    <section className="py-16 md:py-24 bg-[#FBF7F2]">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs uppercase tracking-widest text-neutral-500">{eyebrow}</div>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold text-neutral-900">
              {title}
            </h2>
            <p className="mt-4 text-neutral-600 leading-relaxed">
              {subtitle}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-5">
              {stats.map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-neutral-200 p-5">
                  <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-900 text-white text-lg">
                    <i className={s.icon}></i>
                  </span>
                  <div className="mt-3 text-2xl font-bold text-neutral-900">{s.value}</div>
                  <p className="mt-1 text-sm text-neutral-600 leading-snug">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-[460px] rounded-3xl overflow-hidden">
            <img
              src="https://readdy.ai/api/search-image?query=Premium%20Korean%20hospital%20and%20healthcare%20complex%20exterior%20in%20Seoul%20with%20a%20modern%20glass%20facade%20and%20a%20friendly%20bilingual%20Korean%20medical%20coordinator%20walking%20beside%20an%20international%20patient%20through%20a%20landscaped%20garden%20pathway%2C%20warm%20natural%20sunlight%20and%20clear%20blue%20sky%2C%20calm%20reassuring%20professional%20atmosphere%2C%20high%20end%20healthcare%20photography%20style%20with%20crisp%20natural%20colors%20and%20a%20clean%20simple%20composition&width=1200&height=1000&seq=8002&orientation=landscape"
              alt="Korean healthcare"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>
      </div>
    </section>
  );
}