'use client';

import type { PurchaseRecord } from '@/lib/creditHistory';
import { getPackById, formatPrice } from '@/lib/credits';

const paymentMethodLabel: Record<string, string> = {
  paypal: 'PayPal',
  toss: 'Toss Payments',
  card: '신용카드',
  bank: '계좌이체',
};

function formatDateTime(d: string) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' +
    date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function ReceiptModal({ purchase, email, onClose }: { purchase: PurchaseRecord; email: string; onClose: () => void }) {
  const pack = getPackById(purchase.pack_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-900 text-white">
              <i className="ri-receipt-line text-base"></i>
            </span>
            <h3 className="font-bold text-neutral-900">영수증</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 cursor-pointer">
            <i className="ri-close-line text-xl text-neutral-600"></i>
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <span className="font-['Pacifico'] text-xl text-neutral-900">logo</span>
            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">결제 완료</span>
          </div>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">주문번호</span>
              <span className="font-mono text-neutral-900">{purchase.order_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">결제일시</span>
              <span className="text-neutral-900">{formatDateTime(purchase.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">구매자</span>
              <span className="text-neutral-900">{email}</span>
            </div>
          </div>

          <div className="mt-5 border-t border-dashed border-neutral-200 pt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">상품</span>
              <span className="text-neutral-900">{pack?.name.ko ?? pack?.name.en ?? purchase.pack_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">크레딧</span>
              <span className="text-neutral-900">+{purchase.credits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">결제수단</span>
              <span className="text-neutral-900">{paymentMethodLabel[purchase.payment_method ?? ''] ?? purchase.payment_method ?? '—'}</span>
            </div>
          </div>

          <div className="mt-5 bg-neutral-50 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-neutral-600">결제금액</span>
            <span className="text-xl font-bold text-neutral-900">
              {formatPrice(purchase.amount, purchase.currency as 'KRW' | 'USD')}
            </span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-neutral-200 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-full text-sm bg-neutral-900 text-white hover:bg-neutral-700 whitespace-nowrap cursor-pointer">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}