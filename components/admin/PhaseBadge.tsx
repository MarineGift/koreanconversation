import type { BookingPhase } from '@/lib/bookingStatus';

const CONFIG: Record<BookingPhase, { label: string; className: string }> = {
  no_show: { label: '노쇼', className: 'bg-red-100 text-red-700' },
  today: { label: '진행중', className: 'bg-emerald-100 text-emerald-700' },
  upcoming: { label: '예정', className: 'bg-sky-100 text-sky-700' },
  past: { label: '완료', className: 'bg-neutral-200 text-neutral-600' },
};

export default function PhaseBadge({ phase }: { phase: BookingPhase }) {
  const c = CONFIG[phase];
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${c.className}`}>
      {c.label}
    </span>
  );
}