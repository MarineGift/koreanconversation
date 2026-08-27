'use client';

import { useEffect, useState } from 'react';
import { getSiteFaqs, DEFAULT_FAQS, type SiteFaq } from '@/lib/siteContent';

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const [faqs, setFaqs] = useState<SiteFaq[]>(DEFAULT_FAQS);

  useEffect(() => {
    getSiteFaqs().then(setFaqs);
  }, []);

  return (
    <section id="faq" className="py-16 md:py-24 bg-[#FBF7F2]">
      <div className="mx-auto w-full px-4 md:px-8">
        <div className="text-xs uppercase tracking-widest text-neutral-500 text-center">FAQ</div>
        <h2 className="mt-3 text-3xl md:text-4xl font-bold text-neutral-900 text-center">Questions, answered.</h2>
        <div className="mt-8 md:mt-12 space-y-3">
          {faqs.map((f, i) => (
            <div key={f.id} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-4 md:px-6 py-4 md:py-5 text-left cursor-pointer"
              >
                <span className="font-semibold text-neutral-900 text-sm md:text-base">{f.question}</span>
                <span className="w-6 h-6 flex items-center justify-center text-neutral-500 shrink-0 ml-4">
                  <i className={`ri-${open === i ? 'subtract' : 'add'}-line text-xl`}></i>
                </span>
              </button>
              {open === i && <div className="px-4 md:px-6 pb-4 md:pb-6 text-neutral-600 leading-relaxed text-sm md:text-base">{f.answer}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}