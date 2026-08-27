export type PaymentStatus = 'paid' | 'free' | 'manual';

export function getPaymentStatus(sessionType: string | null | undefined, paddleTransactionId: string | null | undefined): PaymentStatus {
  if (paddleTransactionId) return 'paid';
  if (sessionType === 'free') return 'free';
  return 'manual';
}

const CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
  paid: { label: '결제 완료', className: 'bg-emerald-100 text-emerald-700' },
  free: { label: '무료', className: 'bg-sky-100 text-sky-700' },
  manual: { label: '수동 예약', className: 'bg-amber-100 text-amber-700' },
};

export default function PaymentBadge({
  status,
}: {
  status: PaymentStatus;
}) {
  const c = CONFIG[status];
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${c.className}`}>
      {c.label}
    </span>
  );
}