'use client';

import { useEffect, useState } from 'react';
import { getMedicalOverride } from '@/lib/siteContent';

const treatments = [
  {
    icon: 'ri-sparkling-2-line',
    title: 'Cosmetic Surgery',
    desc: 'World-renowned plastic surgery and aesthetic procedures performed by board-certified surgeons.',
    items: ['Facial contouring', 'Rhinoplasty & eyelids', 'Liposuction & lifting'],
  },
  {
    icon: 'ri-sun-line',
    title: 'Dermatology',
    desc: 'Advanced skin treatments from laser therapy to anti-aging and acne care.',
    items: ['Laser & skin resurfacing', 'Anti-aging programs', 'Acne & scar treatment'],
  },
  {
    icon: 'ri-tooth-line',
    title: 'Dental Care',
    desc: 'High-quality dental treatment at a fraction of Western prices.',
    items: ['Implants & crowns', 'Veneers & whitening', 'Orthodontics'],
  },
  {
    icon: 'ri-stethoscope-line',
    title: 'Health Checkup',
    desc: 'Comprehensive executive health screenings with same-day results.',
    items: ['Full-body screening', 'Cancer screening', 'Executive health programs'],
  },
  {
    icon: 'ri-hospital-line',
    title: 'Orthopedics',
    desc: 'Minimally invasive joint and spine surgery with rapid recovery.',
    items: ['Joint replacement', 'Spine surgery', 'Sports medicine'],
  },
  {
    icon: 'ri-capsule-line',
    title: 'Korean Medicine',
    desc: 'Traditional Korean medicine including acupuncture and herbal care.',
    items: ['Acupuncture', 'Herbal medicine', 'Rehabilitation therapy'],
  },
];

export default function MedicalTreatments() {
  const [override, setOverride] = useState<Record<string, unknown>>();
  useEffect(() => {
    getMedicalOverride().then(o => setOverride(o)).catch(() => {});
  }, []);

  const o = (override?.treatments as Record<string, string> | undefined) || {};
  const eyebrow = o.eyebrow || 'Treatments';
  const title = o.title || 'What can we help you treat?';
  const subtitle = o.subtitle || 'From cosmetic procedures to comprehensive health screenings, we connect you with Korea\'s leading specialists and coordinate every step.';

  return (
    <section id="treatments" className="py-16 md:py-24 bg-white">
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

        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {treatments.map((t) => (
            <div key={t.title} className="bg-white rounded-2xl border border-neutral-200 p-6 flex flex-col hover:border-neutral-300 transition">
              <span className="w-11 h-11 flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 text-xl">
                <i className={t.icon}></i>
              </span>
              <h3 className="mt-4 font-semibold text-neutral-900">{t.title}</h3>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{t.desc}</p>
              <ul className="mt-5 space-y-2 flex-1">
                {t.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-neutral-700">
                    <span className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                      <i className="ri-check-line text-emerald-500"></i>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <div className="inline-flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-full px-5 py-2.5">
            <span className="w-5 h-5 flex items-center justify-center">
              <i className="ri-information-line text-amber-600"></i>
            </span>
            <span className="text-sm font-medium text-amber-800">
              Treatment costs are quoted directly by the hospital after your consultation.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}