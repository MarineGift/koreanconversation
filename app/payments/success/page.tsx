'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { detectLang } from '@/lib/i18n';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FBF7F2] flex items-center justify-center text-sm text-neutral-500">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [credits, setCredits] = useState<number>(0);

  const intentId = searchParams.get('intent_id') || '';
  const paypalToken = searchParams.get('token') || '';
  const source = searchParams.get('source') || '';
  const paymentKey = searchParams.get('paymentKey') || '';
  const orderId = searchParams.get('orderId') || '';
  const amount = searchParams.get('amount') || '';
  const lang = detectLang();

  useEffect(() => {
    if (source === 'toss' && paymentKey && orderId && amount) {
      confirmToss();
    } else if (intentId) {
      confirmIntent();
    } else if (paypalToken || source === 'paypal') {
      confirmPayPal();
    } else {
      setStatus('error');
      setMessage(lang === 'ko' ? '결제 정보가 누락되었습니다.' : 'Payment information is missing.');
    }

    async function confirmToss() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        if (!accessToken) throw new Error('Login required');

        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/confirm-toss-payment`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        });

        const text = await res.text();
        let result;
        try { result = JSON.parse(text); } catch { throw new Error('Invalid response from server'); }

        if (!res.ok) {
          throw new Error(result.error || 'Toss payment confirmation failed');
        }

        setCredits(result.credits || 0);
        setStatus('success');
        setMessage(`${result.credits || 0}${lang === 'ko' ? '크레딧이 충전되었습니다!' : ' credits have been added!'}`);
      } catch (err: any) {
        setStatus('error');
        setMessage(err?.message || (lang === 'ko' ? '결제 확인 중 오류가 발생했습니다.' : 'An error occurred during payment confirmation.'));
      }
    }

    async function confirmIntent() {
      try {
        const { data: order, error: orderErr } = await supabase
          .from('orders')
          .select('*')
          .eq('payment_key', intentId)
          .maybeSingle();

        if (orderErr || !order) {
          throw new Error(lang === 'ko' ? '주문을 찾을 수 없습니다.' : 'Order not found.');
        }

        if (order.status === 'completed') {
          setCredits(order.credits);
          setStatus('success');
          setMessage(`${order.credits}${lang === 'ko' ? '크레딧이 충전되었습니다!' : ' credits have been added!'}`);
          return;
        }

        await supabase.from('orders').update({ status: 'completed' }).eq('id', order.id);

        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          await supabase.rpc('increment_credits', { user_id: user.id, amount: order.credits });
        }

        setCredits(order.credits);
        setStatus('success');
        setMessage(`${order.credits}${lang === 'ko' ? '크레딧이 충전되었습니다!' : ' credits have been added!'}`);
      } catch (err: any) {
        setStatus('error');
        setMessage(err?.message || (lang === 'ko' ? '결제 확인 중 오류가 발생했습니다.' : 'An error occurred during payment confirmation.'));
      }
    }

    async function confirmPayPal() {
      try {
        const token = paypalToken;
        if (!token) {
          throw new Error(lang === 'ko' ? 'PayPal 결제 정보가 누락되었습니다.' : 'PayPal payment information is missing.');
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/paypal-capture-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paypalOrderId: token }),
        });

        const text = await res.text();
        let result;
        try {
          result = JSON.parse(text);
        } catch {
          throw new Error('Invalid response from server');
        }

        if (!res.ok) {
          const detailMsg = result?.details?.[0]?.description || result?.error || result?.message || 'PayPal capture failed';
          throw new Error(detailMsg);
        }

        setCredits(result.credits || 0);
        setStatus('success');
        setMessage(`${result.credits || 0}${lang === 'ko' ? '크레딧이 충전되었습니다!' : ' credits have been added!'}`);
      } catch (err: any) {
        const errorMsg = err?.message || (lang === 'ko' ? '결제 확인 중 오류가 발생했습니다.' : 'An error occurred during payment confirmation.');
        setStatus('error');
        setMessage(errorMsg);
      }
    }
  }, [intentId, paypalToken, source, paymentKey, orderId, amount, lang, router]);

  return (
    <div className="min-h-screen bg-[#FBF7F2]">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          {status === 'loading' && (
            <div className="py-20 text-sm text-neutral-500">
              {lang === 'ko' ? '결제 확인 중...' : 'Confirming payment...'}
            </div>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mx-auto mb-6">
                <i className="ri-check-line text-3xl"></i>
              </div>
              <h1 className="text-2xl font-bold text-neutral-900">
                {lang === 'ko' ? '결제 완료' : 'Payment Complete'}
              </h1>
              <p className="mt-4 text-neutral-600">{message}</p>
              <p className="mt-2 text-sm text-neutral-500">
                {lang === 'ko'
                  ? '마이페이지에서 크레딧을 확인하고 예약을 진행하세요.'
                  : 'Go to My Page to check your credits and make bookings.'}
              </p>
              <Link
                href="/mypage"
                className="mt-8 inline-block px-8 py-3 bg-neutral-900 text-white rounded-full font-medium hover:bg-neutral-800 whitespace-nowrap cursor-pointer"
              >
                {lang === 'ko' ? '마이페이지로 이동' : 'Go to My Page'}
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-rose-100 text-rose-600 mx-auto mb-6">
                <i className="ri-close-line text-3xl"></i>
              </div>
              <h1 className="text-2xl font-bold text-neutral-900">
                {lang === 'ko' ? '결제 확인 실패' : 'Payment Confirmation Failed'}
              </h1>
              <p className="mt-4 text-neutral-600">{message}</p>
              <div className="mt-6 flex gap-3 justify-center">
                <Link
                  href="/pricing"
                  className="inline-block px-8 py-3 bg-neutral-900 text-white rounded-full font-medium hover:bg-neutral-800 whitespace-nowrap cursor-pointer"
                >
                  {lang === 'ko' ? '다시 시도하기' : 'Try Again'}
                </Link>
                <a href="mailto:support@koreancoaching.com" className="inline-block border border-neutral-300 px-6 py-3 rounded-full hover:border-neutral-900 cursor-pointer whitespace-nowrap text-neutral-700">
                  {lang === 'ko' ? '고객지원 문의' : 'Contact Support'}
                </a>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}