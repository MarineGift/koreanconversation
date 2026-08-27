import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getOrgId } from '@/lib/org';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

interface Props {
  packId: string;
  agreed: boolean;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function PayPalCheckout({ packId, agreed, onSuccess, onError }: Props) {
  const [loading, setLoading] = useState(false);

  const handlePay = useCallback(async () => {
    if (!agreed) {
      onError('결제 전 이용약관에 동의해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        onError('로그인 세션이 만료되었습니다. 다시 로그인 후 결제를 시도해 주세요.');
        setLoading(false);
        return;
      }

      const returnUrl = `${window.location.origin}/payments/success?source=paypal`;
      const cancelUrl = `${window.location.origin}/payments/fail?source=paypal&reason=cancelled`;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/paypal-create-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packId, organizationId: await getOrgId(), returnUrl, cancelUrl }),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error('서버 응답을 처리할 수 없습니다.'); }
      if (!res.ok) {
        const detail = data?.detail ? ` (${data.detail})` : '';
        throw new Error(data.error || `주문 생성 실패${detail}`);
      }
      if (data.approveUrl) {
        window.location.href = data.approveUrl;
      } else {
        throw new Error('PayPal 결제 URL을 생성할 수 없습니다.');
      }
    } catch (err: any) {
      onError(err.message || '결제 시작 중 오류가 발생했습니다.');
      setLoading(false);
    }
  }, [packId, agreed, onError]);

  return (
    <div>
      {loading && (
        <div className="text-center py-3 text-sm text-neutral-500 mb-2">
          PayPal 결제 페이지로 이동 중...
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={!agreed || loading}
        className="w-full py-3 bg-[#0070BA] text-white rounded-lg font-medium hover:bg-[#005ea6] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
      >
        <span className="w-5 h-5 flex items-center justify-center">
          <i className="ri-paypal-fill text-lg"></i>
        </span>
        {loading ? '처리 중...' : 'PayPal로 결제하기'}
      </button>

      {!agreed && !loading && (
        <p className="text-xs text-neutral-400 text-center mt-2">
          결제하려면 위 이용약관에 동의해 주세요.
        </p>
      )}
    </div>
  );
}