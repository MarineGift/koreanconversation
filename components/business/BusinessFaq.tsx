'use client';

import { useState } from 'react';

const faqs = [
  {
    q: 'Can I choose only some modules?',
    a: 'Yes. This package is fully modular. You can select only the services you need — for example, just airport transfer and business interpretation — and skip the rest.',
  },
  {
    q: 'How is the price determined?',
    a: 'Pricing is negotiated individually based on the modules you select, your length of stay, and the number of people. You will always receive a clear, itemized proposal before confirming.',
  },
  {
    q: 'Can you help with company setup and visas?',
    a: 'We provide practical guidance and connect you with trusted legal and banking partners for company registration, visas and documents. We coordinate the process on your behalf.',
  },
  {
    q: 'Do you support long-term business stays?',
    a: 'Yes. For longer stays we can arrange long-term residence, a dedicated bilingual assistant, and ongoing business support throughout your time in Korea.',
  },
  {
    q: 'Is my business information kept confidential?',
    a: 'Absolutely. All inquiries and business details are handled with strict confidentiality and discretion.',
  },
];

export default function BusinessFaq() {
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