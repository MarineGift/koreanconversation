'use client';

import { useEffect, useState } from 'react';
import { getMedicalOverride } from '@/lib/siteContent';
import { hospitals } from '@/lib/hospitals';

export default function MedicalHospitals() {
  const [override, setOverride] = useState<Record<string, unknown>>();
  useEffect(() => {
    getMedicalOverride().then(o => setOverride(o)).catch(() => {});
  }, []);

  const o = (override?.hospitals as Record<string, string> | undefined) || {};
  const eyebrow = o.eyebrow || 'Partner hospitals';
  const title = o.title || 'Korea\'s leading medical institutions.';
  const subtitle = o.subtitle || 'From executive health checkups to specialized treatment and cosmetic surgery, we work with Korea\'s most trusted, internationally accredited hospitals and clinics.';

  return (
    <section id="hospitals" className="py-16 md:py-24 bg-white">
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
          {hospitals.map((h) => (
            <div key={h.name} className="rounded-3xl overflow-hidden bg-white border border-neutral-200 flex flex-col hover:border-neutral-300 transition">
              <div className="relative h-48 overflow-hidden">
                <img src={h.image} alt={h.name} className="w-full h-full object-cover object-top" />
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-neutral-900 shadow-sm whitespace-nowrap">
                  <span className="w-3.5 h-3.5 flex items-center justify-center text-emerald-600">
                    <i className="ri-verified-badge-fill"></i>
                  </span>
                  JCI Accredited
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-neutral-900">{h.name}</h3>
                  <span className="text-xs text-neutral-400 whitespace-nowrap">{h.nameKo}</span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500">
                  <span className="w-4 h-4 flex items-center justify-center text-neutral-400">
                    <i className="ri-stethoscope-line"></i>
                  </span>
                  {h.specialty}
                  <span className="text-neutral-300 mx-0.5">·</span>
                  <span className="w-4 h-4 flex items-center justify-center text-neutral-400">
                    <i className="ri-map-pin-line"></i>
                  </span>
                  {h.location}
                </div>
                <div className="mt-3 flex items-center gap-1">
                  <span className="text-amber-500 flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className="w-4 h-4 flex items-center justify-center text-sm">
                        <i
                          className={
                            h.rating >= i
                              ? 'ri-star-fill'
                              : h.rating >= i - 0.5
                                ? 'ri-star-half-fill'
                                : 'ri-star-line'
                          }
                        ></i>
                      </span>
                    ))}
                  </span>
                  <span className="ml-1 text-sm font-semibold text-neutral-900">{h.rating.toFixed(1)}</span>
                </div>
                <p className="mt-3 text-sm text-neutral-600 leading-relaxed flex-1">{h.desc}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-neutral-50 border border-neutral-100 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <span className="w-3.5 h-3.5 flex items-center justify-center">
                        <i className="ri-chat-3-line"></i>
                      </span>
                      Reviews
                    </div>
                    <div className="mt-1 text-sm font-semibold text-neutral-900">{h.reviews}</div>
                  </div>
                  <div className="rounded-xl bg-neutral-50 border border-neutral-100 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <span className="w-3.5 h-3.5 flex items-center justify-center">
                        <i className="ri-user-heart-line"></i>
                      </span>
                      Patients
                    </div>
                    <div className="mt-1 text-sm font-semibold text-neutral-900">{h.patients}</div>
                  </div>
                </div>
                <a
                  href={h.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-neutral-900 hover:underline whitespace-nowrap cursor-pointer"
                >
                  <span className="w-4 h-4 flex items-center justify-center">
                    <i className="ri-external-link-line"></i>
                  </span>
                  Visit official website
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <div className="inline-flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-full px-5 py-2.5">
            <span className="w-5 h-5 flex items-center justify-center">
              <i className="ri-information-line text-amber-600"></i>
            </span>
            <span className="text-sm font-medium text-amber-800">
              Hospital matching is based on your specific treatment needs and medical history.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}