export default function RefundModal({
  booking,
  busy,
  onClose,
  onConfirm,
  onDecline,
  mode = 'approve',
}: {
  booking: DashboardBooking;
  busy: boolean;
  onClose: () => void;
  onConfirm?: (reason: string) => void;
  onDecline?: (reason: string) => void;
  mode?: 'approve' | 'decline';
}) {
  const [reason, setReason] = useState('');
  const isDecline = mode === 'decline';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="font-bold text-neutral-900">{isDecline ? '환불 거절' : '환불 처리'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 cursor-pointer">
            <i className="ri-close-line text-xl text-neutral-600"></i>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-neutral-50 rounded-xl p-4 text-sm">
            <div className="font-medium text-neutral-900">{booking.name}</div>
            <div className="text-neutral-500 mt-0.5">{booking.coach_name} · {booking.booking_date} {booking.slot}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700">{booking.site_name ?? '—'}</span>
              <span className="text-neutral-900 font-semibold">
                {booking.currency ?? 'USD'} {Number(booking.amount_paid ?? 0).toLocaleString()}
              </span>
            </div>
            {booking.refund_reason && (
              <div className="mt-2 pt-2 border-t border-neutral-200">
                <div className="text-xs text-neutral-400 mb-1">수강생 요청 사유</div>
                <div className="text-neutral-600 whitespace-pre-wrap">{booking.refund_reason}</div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1.5">{isDecline ? '거절 사유' : '환불 사유'}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 500))}
              rows={3}
              placeholder={isDecline ? '거절 사유를 입력하세요' : '환불 사유를 입력하세요'}
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
            onClick={() => {
              if (isDecline) onDecline?.(reason);
              else onConfirm?.(reason);
            }}
            disabled={busy}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap cursor-pointer disabled:opacity-40 ${
              isDecline ? 'bg-neutral-800 text-white hover:bg-neutral-900' : 'bg-rose-600 text-white hover:bg-rose-700'
            }`}
          >
            {isDecline ? '거절 처리' : '환불 처리'}
          </button>
        </div>
      </div>
    </div>
  );
}