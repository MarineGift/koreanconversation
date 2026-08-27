export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export function getApprovalStatus(v: string | null | undefined): ApprovalStatus {
  if (v === 'approved' || v === 'rejected' || v === 'pending') return v;
  return 'pending';
}

const CONFIG: Record<ApprovalStatus, { label: string; className: string }> = {
  approved: { label: '승인', className: 'bg-emerald-100 text-emerald-700' },
  pending: { label: '대기', className: 'bg-amber-100 text-amber-700' },
  rejected: { label: '거절', className: 'bg-rose-100 text-rose-700' },
};

export default function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const c = CONFIG[status];
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${c.className}`}>
      {c.label}
    </span>
  );
}