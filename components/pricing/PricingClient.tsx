'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { creditPacks, formatPrice, BASE_PRICE_PER_SESSION } from '@/lib/credits';
import { detectLang, pricingT } from '@/lib/i18n';
import { getSitePricing, DEFAULT_PRICING } from '@/lib/siteContent';

export default function PricingClient() {
  const [region, setRegion] = useState<'KR' | 'US'>('US');
  const [loading, setLoading] = useState(true);
  const [pricingCopy, setPricingCopy] = useState(DEFAULT_PRICING);

  useEffect(() => {
    setRegion('US');
    setLoading(false);
    getSitePricing().then(setPricingCopy);
  }, []);

  const lang = detectLang();
  const copy = pricingT[lang];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-16">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">{pricingCopy.title}</h1>
        <p className="mt-4 text-neutral-600 max-w-xl mx-auto">{pricingCopy.subtitle}</p>
        <p className="mt-2 text-sm text-neutral-500">{copy.oneCredit}</p>
        <p className="mt-1 text-sm text-neutral-500">{copy.basePrice}</p>
        <p className="mt-1 text-xs text-neutral-400">{copy.kstNotice}</p>
      </div>

      <div className="mt-6 flex justify-center">
        <div className="inline-flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-full px-5 py-2.5">
          <span className="w-5 h-5 flex items-center justify-center">
            <i className="ri-sparkling-line text-amber-600"></i>
          </span>
          <span className="text-sm font-semibold text-amber-800">{copy.eventTitle}</span>
          <span className="text-sm text-amber-700">{copy.eventDate}</span>
          <span className="text-xs text-amber-600 hidden sm:inline">{copy.eventDesc}</span>
        </div>
      </div>

      <div className="mt-12 grid md:grid-cols-3 gap-6">
        {creditPacks.map((pack) => {
          const currency = region === 'KR' ? 'KRW' : 'USD';
          const price = formatPrice(pack.prices[currency], currency);
          const basePrice = formatPrice(pack.basePrices[currency], currency);
          const perSession = formatPrice(Math.round(pack.prices[currency] / pack.credits), currency);
          const isIntensive = pack.id === 'pack-40';
          const discountPct = Math.round((1 - pack.prices[currency] / pack.basePrices[currency]) * 100);

          return (
            <div
              key={pack.id}
              className={`relative rounded-2xl border bg-white p-6 md:p-8 flex flex-col ${
                pack.popular ? 'border-neutral-900 shadow-xl' : 'border-neutral-200'
              }`}
            >
              {pack.popular && (
                <div className="absolute -top-3 left-6 bg-neutral-900 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                  {copy.popular}
                </div>
              )}
              {isIntensive && (
                <div className="absolute -top-3 right-6 bg-rose-600 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                  {copy.intensive}
                </div>
              )}
              <div className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
                {pack.credits} {copy.creditLabel}
              </div>
              <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                <span className="text-lg text-neutral-400 line-through">{basePrice}</span>
                <span className="text-3xl font-bold text-neutral-900">{price}</span>
              </div>
              <div className="mt-1 text-sm text-neutral-500">
                {perSession} {copy.perSession}
              </div>

              <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                <span className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-price-tag-3-line"></i>
                </span>
                {copy.save} {discountPct}%
              </div>

              <p className="mt-4 text-sm text-neutral-600 leading-relaxed">
                {pack.description[lang]}
              </p>

              <ul className="mt-6 space-y-3 flex-1">
                {copy.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-neutral-700">
                    <span className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                      <i className="ri-check-line text-emerald-500"></i>
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={`/checkout?pack=${pack.id}`}
                className="mt-8 w-full text-center py-3 rounded-full font-medium transition bg-neutral-900 text-white hover:bg-neutral-800 whitespace-nowrap cursor-pointer"
              >
                {copy.buy}
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-16">
        <h2 className="text-xl font-bold text-neutral-900 text-center">{copy.policyTitle}</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-600 mb-3">
              <i className="ri-user-unfollow-line text-xl"></i>
            </div>
            <h3 className="font-semibold text-neutral-900">{copy.noShowTitle}</h3>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{copy.noShowDesc}</p>
          </div>
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-50 text-amber-600 mb-3">
              <i className="ri-refund-2-line text-xl"></i>
            </div>
            <h3 className="font-semibold text-neutral-900">{copy.refundTitle}</h3>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{copy.refundDesc}</p>
          </div>
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-3">
              <i className="ri-gift-line text-xl"></i>
            </div>
            <h3 className="font-semibold text-neutral-900">{copy.transferTitle}</h3>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{copy.transferDesc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}