'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { updateBookingStatus, cancelBooking } from '@/lib/dashboard';

export default function StatusMenu({
  bookingId,
  currentStatus,
  onChanged,
}: {
  bookingId: string;
  currentStatus: string | null;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelBusy, setCancelBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function apply(status: string) {
    setBusy(true);
    await updateBookingStatus(bookingId, status);
    setBusy(false);
    setOpen(false);
    onChanged();
  }

  async function handleCancel() {
    if (!cancelReason.trim()) return;
    setCancelBusy(true);
    const err = await cancelBooking(bookingId, cancelReason.trim());
    setCancelBusy(false);
    if (!err) {
      setCancelModalOpen(false);
      setCancelReason('');
      setOpen(false);
      onChanged();
    }
  }

  const options = useMemo(() => {
    if (currentStatus === 'pending') {
      return [
        { status: 'confirmed', label: '예약 확정', icon: 'ri-check-line', color: 'text-emerald-600', action: 'status' as const },
        { status: 'cancelled', label: '예약 거부', icon: 'ri-close-line', color: 'text-rose-600', action: 'cancel' as const },
        { status: 'no_show', label: '노쇼 표시', icon: 'ri-user-unfollow-line', color: 'text-red-600', action: 'status' as const },
      ];
    }
    if (currentStatus === 'confirmed') {
      return [
        { status: 'completed', label: '완료 처리', icon: 'ri-check-double-line', color: 'text-neutral-700', action: 'status' as const },
        { status: 'cancelled', label: '예약 취소', icon: 'ri-close-line', color: 'text-rose-600', action: 'cancel' as const },
        { status: 'no_show', label: '노쇼 표시', icon: 'ri-user-unfollow-line', color: 'text-red-600', action: 'status' as const },
      ];
    }
    return [
      { status: 'confirmed', label: '예약 복원', icon: 'ri-refresh-line', color: 'text-sky-600', action: 'status' as const },
    ];
  }, [currentStatus]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 cursor-pointer disabled:opacity-50"
        title="상태 변경"
      >
        <i className="ri-more-2-fill text-sm"></i>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl border border-neutral-200 shadow-lg z-20 py-1">
          {options.map((o) => (
            <button
              key={o.status}
              onClick={() => {
                if (o.action === 'cancel') {
                  setCancelModalOpen(true);
                } else {
                  apply(o.status);
                }
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm whitespace-nowrap cursor-pointer hover:bg-neutral-50 ${o.color}`}
            >
              <span className="w-4 h-4 flex items-center justify-center">
                <i className={o.icon}></i>
              </span>
              {o.label}
            </button>
          ))}
        </div>
      )}

      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-neutral-900">
              {currentStatus === 'pending' ? '예약 거부' : '예약 취소'}
            </h3>
            <p className="mt-1 text-sm text-neutral-500">사유를 입력하면 학생에게 메일로 전달됩니다.</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="예: 시간이 불가합니다, 과목이 맞지 않습니다..."
              className="mt-4 w-full rounded-xl border border-neutral-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
              rows={3}
              maxLength={200}
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => { setCancelModalOpen(false); setCancelReason(''); }}
                className="px-4 py-2 rounded-full text-sm font-medium text-neutral-600 hover:bg-neutral-100 cursor-pointer whitespace-nowrap"
              >
                닫기
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim() || cancelBusy}
                className="px-4 py-2 rounded-full text-sm font-medium bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {cancelBusy ? '처리 중...' : currentStatus === 'pending' ? '거부하기' : '취소하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}