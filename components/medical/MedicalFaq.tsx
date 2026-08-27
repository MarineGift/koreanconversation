'use client';

import { useState } from 'react';

const faqs = [
  {
    q: 'How is the medical package priced?',
    a: 'Because every treatment plan is unique, we provide a customized quote. Share the treatment you need and we prepare an itemized estimate covering the coordinator, hospital fees, procedure and medication costs with no hidden fees.',
  },
  {
    q: 'Do you help choose the right hospital?',
    a: 'Yes. Based on your treatment needs, we recommend JCI-accredited hospitals and board-certified specialists, and arrange your consultations and appointments.',
  },
  {
    q: 'Is interpretation provided during treatment?',
    a: 'Yes. A bilingual medical interpreter accompanies you to consultations, procedures and follow-up visits, ensuring clear communication with your medical team.',
  },
  {
    q: 'Can I combine medical treatment with sightseeing?',
    a: 'Absolutely. Many patients combine treatment with a Korea tour or business trip. We can arrange sightseeing, accommodation and transport around your medical schedule.',
  },
  {
    q: 'Is my medical information kept confidential?',
    a: 'Yes. All inquiries and medical details are handled with strict confidentiality and discretion, in line with Korean medical privacy standards.',
  },
];

export default function MedicalFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-16 md:py-24 bg-[#FBF7F2]">
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <div className="text-center">
          <div className="text-xs uppercase tracking-widest text-neutral-500">FAQ</div>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-neutral-900">
            Frequently asked questions.
          </h2>
        </div>

        <div className="mt-10 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer"
                >
                  <span className="font-semibold text-neutral-900">{f.q}</span>
                  <span className="w-6 h-6 flex items-center justify-center shrink-0">
                    <i className={`ri-${isOpen ? 'subtract' : 'add'}-line text-lg text-neutral-500`}></i>
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-sm text-neutral-600 leading-relaxed">{f.a}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}