'use client';

import { useEffect, useState } from 'react';
import { getMedicalOverride } from '@/lib/siteContent';

const stats = [
  { icon: 'ri-emotion-happy-line', value: '98%', label: 'Patient satisfaction' },
  { icon: 'ri-hospital-line', value: '120+', label: 'Partner hospitals & clinics' },
  { icon: 'ri-global-line', value: '15+', label: 'Countries served' },
  { icon: 'ri-time-line', value: '24h', label: 'Response time' },
];

const stories = [
  {
    name: 'Sarah M.',
    country: 'United States',
    treatment: 'Dental implants & veneers',
    quote:
      'I saved over 60% compared to what I was quoted at home, and the care was flawless. My coordinator handled every appointment and even interpreted during the whole process.',
    initial: 'S',
  },
  {
    name: 'James T.',
    country: 'United Kingdom',
    treatment: 'Executive health checkup',
    quote:
      'A complete full-body screening with same-day results and an English-speaking doctor. It was more thorough than any checkup I have ever had, for a fraction of the price.',
    initial: 'J',
  },
  {
    name: 'Yuki S.',
    country: 'Japan',
    treatment: 'Dermatology & laser treatment',
    quote:
      'Everything was discreet and professional. The clinic was beautiful, and my interpreter made sure I understood every step. I am already planning my next visit.',
    initial: 'Y',
  },
  {
    name: 'Michael R.',
    country: 'Australia',
    treatment: 'Knee replacement surgery',
    quote:
      'World-class orthopedic surgery with an unbelievably smooth recovery. From the airport pickup to follow-up visits, the medical package took care of absolutely everything.',
    initial: 'M',
  },
];

export default function MedicalSuccess() {
  const [override, setOverride] = useState<Record<string, unknown>>();
  useEffect(() => {
    getMedicalOverride().then(o => setOverride(o)).catch(() => {});
  }, []);

  const o = (override?.success as Record<string, string> | undefined) || {};
  const eyebrow = o.eyebrow || 'Success stories';
  const title = o.title || 'Real patients, real results.';
  const subtitle = o.subtitle || 'Thousands of international patients trust Korean healthcare every year. Here is what a few of them experienced with our medical package.';

  return (
    <section id="success" className="py-16 md:py-24 bg-[#FBF7F2]">
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

          <div className="relative h-[560px] rounded-3xl overflow-hidden">
            <img
              src="https://readdy.ai/api/search-image?query=Warm%20reassuring%20photograph%20of%20a%20happy%20international%20patient%20shaking%20hands%20with%20a%20friendly%20Korean%20doctor%20in%20a%20bright%20modern%20hospital%20examination%20room%20in%20Seoul%20South%20Korea%2C%20soft%20natural%20light%20through%20large%20windows%2C%20both%20smiling%20with%20genuine%20relief%20and%20trust%2C%20clean%20professional%20medical%20environment%2C%20high%20end%20healthcare%20photography%20style%20with%20crisp%20natural%20colors%20and%20a%20clean%20simple%20composition&width=1200&height=1100&seq=8003&orientation=landscape"
              alt="Patient care"
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {stories.map((s) => (
            <div key={s.name} className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-7 flex flex-col">
              <div className="flex items-center gap-1 text-amber-400">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-star-fill"></i>
                  </span>
                ))}
              </div>
              <p className="mt-4 text-neutral-700 leading-relaxed flex-1">&ldquo;{s.quote}&rdquo;</p>
              <div className="mt-6 flex items-center gap-3">
                <span className="w-11 h-11 flex items-center justify-center rounded-full bg-neutral-900 text-white font-semibold text-lg shrink-0">
                  {s.initial}
                </span>
                <div>
                  <div className="font-semibold text-neutral-900">{s.name}</div>
                  <div className="text-sm text-neutral-500">{s.country} · {s.treatment}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}