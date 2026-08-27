'use client';

import { useEffect, useState, Suspense, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { checkoutT, detectLang } from '@/lib/i18n';
import { creditPacks, testCreditPacks } from '@/lib/packagePricing';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PayPalCheckout from '@/components/PayPalCheckout';
import TossCheckout from '@/components/TossCheckout';

const PAYPAL_ENV = (process.env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT || 'sandbox').toLowerCase();
const isPayPalLive = PAYPAL_ENV === 'live';

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FBF7F2] flex items-center justify-center text-sm text-neutral-500">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const packId = searchParams.get('pack') || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [agreed, setAgreed] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'toss' | 'paypal'>('toss');
  const lang = detectLang();
  const copy = checkoutT[lang];

  const handlePayPalSuccess = useCallback(() => {
    setPaying(true);
    setError('');
    router.push('/mypage?payment=success');
  }, [router]);

  const handlePayPalError = useCallback((msg: string) => {
    setPaying(false);
    setError(msg);
  }, []);

  const handleTossSuccess = useCallback(() => {
    setPaying(true);
    setError('');
    router.push('/mypage?payment=success');
  }, [router]);

  const handleTossError = useCallback((msg: string) => {
    setPaying(false);
    setError(msg);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function setup() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
          router.replace(`/login?next=${encodeURIComponent(`/checkout?pack=${packId}`)}`);
          return;
        }

        const pack = creditPacks.find((p) => p.id === packId) || testCreditPacks.find((p) => p.id === packId);
        if (!pack) {
          if (!cancelled) setError('Invalid pack selected');
          return;
        }

        if (!cancelled) {
          setOrder({
            orderName: pack.name,
            amount: pack.prices.USD,
            krwAmount: pack.prices.KRW,
            credits: pack.credits,
          });
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load checkout');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (packId) setup();
    else {
      setError('No pack selected');
      setLoading(false);
    }
    return () => { cancelled = true; };
  }, [packId, router]);

  return (
    <div className="min-h-screen bg-[#FBF7F2]">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          {loading && (
            <div className="text-center py-20 text-sm text-neutral-500">{copy.loading}</div>
          )}

          {!loading && order && (
            <>
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 mb-4">
                <h1 className="text-xl font-bold text-neutral-900">{copy.orderSummary}</h1>
                <div className="mt-4 flex justify-between text-sm">
                  <span className="text-neutral-600">{order.orderName}</span>
                  <span className="font-semibold text-neutral-900">${order.amount.toLocaleString('en-US')}</span>
                </div>
                <div className="mt-1 flex justify-between text-xs text-neutral-500">
                  <span className="text-neutral-400">한화 기준</span>
                  <span>₩{order.krwAmount.toLocaleString('ko-KR')}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200 p-4 mb-4">
                <div className="flex items-center gap-3 text-sm text-neutral-600">
                  <span className="w-8 h-8 flex items-center justify-center">
                    <i className="ri-shield-check-line text-xl text-emerald-600"></i>
                  </span>
                  <span>SSL 암호화로 안전하게 결제합니다.</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200 p-4 mb-4">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setPaymentMethod('toss')}
                    className={`flex-1 py-2.5 rounded-full text-sm font-medium cursor-pointer whitespace-nowrap transition border ${
                      paymentMethod === 'toss'
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <span className="w-4 h-4 inline-flex items-center justify-center mr-1">
                      <i className="ri-bank-card-line"></i>
                    </span>
                    토스페이먼츠
                  </button>
                  <button
                    onClick={() => setPaymentMethod('paypal')}
                    className={`flex-1 py-2.5 rounded-full text-sm font-medium cursor-pointer whitespace-nowrap transition border ${
                      paymentMethod === 'paypal'
                        ? 'bg-[#0070BA] text-white border-[#0070BA]'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <span className="w-4 h-4 inline-flex items-center justify-center mr-1">
                      <i className="ri-paypal-fill"></i>
                    </span>
                    PayPal (해외)
                  </button>
                </div>

                {paymentMethod === 'toss' && (
                  <div>
                    <div className="text-sm font-semibold text-neutral-900 mb-3">토스페이먼츠</div>
                    <TossCheckout
                      packId={packId}
                      agreed={agreed}
                      onSuccess={handleTossSuccess}
                      onError={handleTossError}
                    />
                    <p className="text-xs text-neutral-400 mt-2 text-center">
                      국내 카드 및 간편결제를 지원합니다.
                    </p>
                  </div>
                )}

                {paymentMethod === 'paypal' && (
                  <div>
                    <div className="text-sm font-semibold text-neutral-900 mb-3">PayPal</div>
                    <div className={`rounded-xl px-3 py-2 text-xs mb-3 ${isPayPalLive ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
                      <span className="w-4 h-4 inline-flex items-center justify-center mr-1">
                        <i className={isPayPalLive ? 'ri-check-line' : 'ri-alert-line'}></i>
                      </span>
                      {isPayPalLive
                        ? 'PayPal Live 모드 — 실제 결제가 진행됩니다.'
                        : 'PayPal Sandbox 모드 — 실제 PayPal 계정으로 로그인할 수 없습니다. Sandbox 테스트 계정이 필요합니다.'}
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800 mb-3">
                      <span className="w-4 h-4 inline-flex items-center justify-center mr-1">
                        <i className="ri-alert-line"></i>
                      </span>
                      한국에 등록된 PayPal 계정은 한국 판매자에게 결제가 제한될 수 있습니다. 해외 PayPal 계정을 사용하거나 샌드박스 테스트 계정으로 진행해 주세요.
                    </div>
                    <PayPalCheckout
                      packId={packId}
                      agreed={agreed}
                      onSuccess={handlePayPalSuccess}
                      onError={handlePayPalError}
                    />
                  </div>
                )}
              </div>

              <label className="flex items-start gap-3 bg-white rounded-2xl border border-neutral-200 p-4 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    if (e.target.checked) setTermsError('');
                  }}
                  className="mt-0.5 w-4 h-4 accent-neutral-900 shrink-0 cursor-pointer"
                />
                <span className="text-sm text-neutral-600 leading-relaxed">
                  <span className="font-semibold text-neutral-900">{copy.termsTitle}</span>
                  <span className="ml-1">{copy.termsText}</span>
                </span>
              </label>

              {termsError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm mb-4">
                  {termsError}
                </div>
              )}

              {paying && (
                <div className="text-center py-3 text-sm text-neutral-500">Processing payment...</div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}