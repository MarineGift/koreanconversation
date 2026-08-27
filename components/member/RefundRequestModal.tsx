'use client';

import { useState } from 'react';
import type { UsageRecord } from '@/lib/creditHistory';
import { REFUND_WINDOW_DAYS } from '@/lib/creditHistory';

function formatDateOnly(d: string) {
  const date = new Date(d + 'T00:00:00');
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function RefundRequestModal({
  usage,
  busy,
  onClose,
  onConfirm,
}: {
  usage: UsageRecord;
  busy: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="font-bold text-neutral-900">환불 요청</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 cursor-pointer">
            <i className="ri-close-line text-xl text-neutral-600"></i>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-neutral-50 rounded-xl p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">수업일</span>
              <span className="text-neutral-900">{formatDateOnly(usage.booking_date)}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-neutral-500">코치</span>
              <span className="text-neutral-900">{usage.coach_name}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-neutral-500">시간</span>
              <span className="text-neutral-900">{usage.slot}</span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 leading-relaxed">
            환불은 수업 완료 후 {REFUND_WINDOW_DAYS}일 이내에만 요청할 수 있습니다. 요청 후 관리자 검토를 거쳐 처리되며, 승인 시 크레딧이 환급됩니다.
          </div>

          <div>
            <label className="block text-xs text-neutral-500 mb-1.5">환불 사유</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 500))}
              rows={3}
              placeholder="환불 사유를 입력해 주세요"
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 resize-none"
            />
            <div className="text-right text-xs text-neutral-400 mt-1">{reason.length}/500</div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-full text-sm border border-neutral-200 text-neutral-700 hover:bg-neutral-50 whitespace-nowrap cursor-pointer disabled:opacity-40"
          >
            취소
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={busy || reason.trim().length === 0}
            className="px-4 py-2 rounded-full text-sm bg-rose-600 text-white hover:bg-rose-700 whitespace-nowrap cursor-pointer disabled:opacity-40"
          >
            요청하기
          </button>
        </div>
      </div>
    </div>
  );
}