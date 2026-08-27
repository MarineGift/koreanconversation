'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { getOrgId } from '@/lib/org';

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '';

interface Props {
  packId: string;
  agreed: boolean;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function TossCheckout({ packId, agreed, onSuccess, onError }: Props) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!TOSS_CLIENT_KEY) return;
    loadTossPayments(TOSS_CLIENT_KEY)
      .then(() => setReady(true))
      .catch(() => setReady(false));
  }, []);

  const handlePay = useCallback(async () => {
    if (!agreed) {
      onError('결제 전 이용약관에 동의해 주세요.');
      return;
    }
    if (!ready) {
      onError('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('로그인이 필요합니다.');

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const orgId = await getOrgId();

      const res = await fetch(`${supabaseUrl}/functions/v1/create-toss-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packId, organizationId: orgId }),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error('서버 응답을 처리할 수 없습니다.'); }
      if (!res.ok) throw new Error(data.error || '주문 생성에 실패했습니다.');

      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      await tossPayments.requestPayment('CARD', {
        amount: {
          currency: data.currency,
          value: data.amount,
        },
        orderId: data.orderId,
        orderName: data.orderName,
        successUrl: `${window.location.origin}/payments/success?source=toss`,
        failUrl: `${window.location.origin}/payments/fail?source=toss`,
      });
    } catch (err: any) {
      onError(err.message || '결제 진행 중 오류가 발생했습니다.');
      setLoading(false);
    }
  }, [packId, agreed, ready, onError, onSuccess]);

  return (
    <div>
      {loading && (
        <div className="text-center py-3 text-sm text-neutral-500 mb-2">
          결제 페이지로 이동 중...
        </div>
      )}
      <button
        onClick={handlePay}
        disabled={!agreed || loading || !ready}
        className="w-full py-3 bg-[#3182F6] text-white rounded-lg font-medium hover:bg-[#256dd3] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
      >
        <span className="w-5 h-5 flex items-center justify-center">
          <i className="ri-bank-card-line text-lg"></i>
        </span>
        {loading ? '처리 중...' : '카드 결제하기 (토스페이먼츠)'}
      </button>
      {!agreed && !loading && (
        <p className="text-xs text-neutral-400 text-center mt-2">
          결제하려면 위 이용약관에 동의해 주세요.
        </p>
      )}
      {!TOSS_CLIENT_KEY && !loading && (
        <p className="text-xs text-red-500 text-center mt-2">
          토스페이먼츠 설정이 완료되지 않았습니다.
        </p>
      )}
    </div>
  );
}