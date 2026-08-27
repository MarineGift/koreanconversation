'use client';

import { useState } from 'react';

const faqs = [
  {
    q: 'How is the price determined?',
    a: 'Every trip is different, so we provide a custom quote based on your dates, group size, duration, and which services you need (tour guide, business interpretation, or both). You will always receive a transparent, itemized price before confirming.',
  },
  {
    q: 'Do you provide airport pickup?',
    a: 'Yes. Airport pickup and private transport can be included in the Full Package, and it can also be added to any other package on request.',
  },
  {
    q: 'Can the interpreter attend business meetings?',
    a: 'Yes. Our interpreters accompany you to meetings, negotiations, factory tours, and events, providing real-time Korean↔English interpretation and guidance on business etiquette.',
  },
  {
    q: 'What if my itinerary changes?',
    a: 'We stay flexible. Let your guide know your updated plans and we will adjust the itinerary and, if needed, provide a revised quote for any changes.',
  },
];

export default function TourFaq() {
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