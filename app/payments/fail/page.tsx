'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { detectLang } from '@/lib/i18n';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function FailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FBF7F2] flex items-center justify-center text-sm text-neutral-500">Loading...</div>}>
      <FailContent />
    </Suspense>
  );
}

function FailContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || '';
  const source = searchParams.get('source') || '';
  const lang = detectLang();

  const isPayPal = source === 'paypal';
  const isToss = source === 'toss';

  const defaultMsg = lang === 'ko' ? '결제 처리 중 오류가 발생했습니다.' : 'An error occurred during payment.';
  const displayMsg = message || defaultMsg;

  return (
    <div className="min-h-screen bg-[#FBF7F2]">
      <Header />
      <main className="pt-32 pb-16 text-center px-4">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto bg-rose-100 rounded-full flex items-center justify-center mb-6">
            <span className="w-8 h-8 flex items-center justify-center">
              <i className="ri-close-line text-2xl text-rose-600"></i>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {lang === 'ko' ? '결제에 실패했습니다' : 'Payment Failed'}
          </h1>
          <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
            <p className="font-medium">{displayMsg}</p>
          </div>

          {isPayPal && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 text-left space-y-2">
              <p className="font-semibold">
                {lang === 'ko' ? 'PayPal 결제 실패 시 확인 사항:' : 'If PayPal failed, check the following:'}
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>{lang === 'ko' ? '한국에 등록된 PayPal 계정은 한국 판매자 결제가 불가능합니다. 해외(미국/영국 등) PayPal 계정으로 시도해 주세요.' : 'Korean PayPal accounts cannot pay Korean sellers. Please use an overseas PayPal account (US/UK/etc).'}</li>
                <li>{lang === 'ko' ? 'PayPal Sandbox 환경에서는 실제 PayPal 계정으로 로그인할 수 없습니다. Sandbox 테스트 계정이 필요합니다.' : 'In PayPal Sandbox, you cannot log in with a real PayPal account. A Sandbox test account is required.'}</li>
                <li>{lang === 'ko' ? 'PayPal 팝업에서 로그아웃 후 다른 계정으로 다시 로그인해 보세요.' : 'Try logging out of PayPal and logging in with a different account.'}</li>
              </ul>
            </div>
          )}

          {isToss && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 text-left">
              <p>
                {lang === 'ko'
                  ? '토스페이먼츠 결제가 실패한 경우, 다른 카드로 시도하거나 고객지원에 문의해 주세요.'
                  : 'If Toss payment failed, try a different card or contact support.'}
              </p>
            </div>
          )}

          <div className="mt-8 flex gap-3 justify-center">
            <Link href="/pricing" className="inline-block bg-neutral-900 text-white px-6 py-3 rounded-full hover:bg-neutral-800 cursor-pointer whitespace-nowrap">
              {lang === 'ko' ? '다시 시도하기' : 'Try Again'}
            </Link>
            <a href="mailto:support@koreancoaching.com" className="inline-block border border-neutral-300 px-6 py-3 rounded-full hover:border-neutral-900 cursor-pointer whitespace-nowrap text-neutral-700">
              {lang === 'ko' ? '고객지원 문의' : 'Contact Support'}
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}