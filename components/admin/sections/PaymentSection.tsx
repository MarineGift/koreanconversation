import { useMemo, useState } from 'react';
import type { DashboardBooking } from '@/lib/dashboard';
import { formatDate } from '@/lib/bookingStatus';
import { refundBooking, declineRefund } from '@/lib/dashboard';
import AdminTabs from '../AdminTabs';
import PaymentBadge, { getPaymentStatus, type PaymentStatus } from '../PaymentBadge';
import RefundModal from '../RefundModal';

export default function PaymentSection({
  bookings,
  accent,
  onChanged,
}: {
  bookings: DashboardBooking[];
  accent: string;
  onChanged?: () => void;
}) {
  const [tab, setTab] = useState('all');
  const [refundTarget, setRefundTarget] = useState<{ booking: DashboardBooking; mode: 'approve' | 'decline' } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState(true);

  const stats = useMemo(() => {
    let paid = 0;
    let free = 0;
    let manual = 0;
    let totalPaid = 0;
    let refunded = 0;
    let requested = 0;
    let declined = 0;
    let cancelled = 0;
    for (const b of bookings) {
      const s = getPaymentStatus(b.session_type, b.paddle_transaction_id);
      if (b.refund_status === 'requested') {
        requested++;
        continue;
      }
      if (b.refund_status === 'refunded') {
        refunded++;
        continue;
      }
      if (b.refund_status === 'declined') {
        declined++;
        continue;
      }
      if (b.status === 'cancelled') {
        cancelled++;
        continue;
      }
      if (s === 'paid') {
        paid++;
        const amt = typeof b.amount_paid === 'string' ? parseFloat(b.amount_paid) : (b.amount_paid ?? 0);
        totalPaid += amt;
      } else if (s === 'free') free++;
      else manual++;
    }
    return { paid, free, manual, totalPaid, refunded, requested, declined, cancelled };
  }, [bookings]);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (tab === 'requested') return b.refund_status === 'requested';
      if (tab === 'refunded') return b.refund_status === 'refunded';
      if (tab === 'declined') return b.refund_status === 'declined';
      if (tab === 'cancelled') return b.status === 'cancelled' && b.refund_status !== 'refunded';
      const s = getPaymentStatus(b.session_type, b.paddle_transaction_id);
      if (tab === 'all') return true;
      return s === (tab as PaymentStatus);
    });
  }, [bookings, tab]);

  const tabs = [
    { key: 'all', label: '전체', count: bookings.length },
    { key: 'paid', label: '결제 완료', count: stats.paid },
    { key: 'free', label: '무료', count: stats.free },
    { key: 'manual', label: '수동 예약', count: stats.manual },
    { key: 'requested', label: '환불 요청', count: stats.requested },
    { key: 'refunded', label: '환불 완료', count: stats.refunded },
    { key: 'declined', label: '환불 거절', count: stats.declined },
    { key: 'cancelled', label: '취소', count: stats.cancelled },
  ];

  function amount(b: DashboardBooking) {
    if (b.amount_paid == null) return '—';
    return `${b.currency ?? 'USD'} ${Number(b.amount_paid).toLocaleString()}`;
  }

  async function handleRefund(reason: string) {
    if (!refundTarget) return;
    setBusy(true);
    setMsg('');
    const error = refundTarget.mode === 'approve'
      ? await refundBooking(refundTarget.booking.id, reason)
      : await declineRefund(refundTarget.booking.id, reason);
    if (error) {
      setMsgOk(false);
      setMsg('처리 실패: ' + error.message);
    } else {
      setMsgOk(true);
      setMsg(refundTarget.mode === 'approve' ? '환불 처리가 완료되었습니다.' : '환불 거절이 완료되었습니다.');
      onChanged?.();
    }
    setBusy(false);
    setRefundTarget(null);
    setTimeout(() => setMsg(''), 3000);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="text-sm text-neutral-500">결제 완료 건수</div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">{stats.paid}</div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="text-sm text-neutral-500">무료 체험 건수</div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">{stats.free}</div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="text-sm text-neutral-500">환불 건수</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{stats.refunded}</div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="text-sm text-neutral-500">총 결제 금액</div>
          <div className="text-2xl font-bold mt-1" style={{ color: accent }}>${stats.totalPaid.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-5">
        <div className="text-sm font-semibold text-neutral-900 mb-4">환불 · 취소 요약</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
            <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-amber-100">
              <i className="ri-time-line text-lg text-amber-600"></i>
            </span>
            <div>
              <div className="text-xl font-bold text-amber-700">{stats.requested}</div>
              <div className="text-xs text-amber-600/80">환불 요청 (검토 중)</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-rose-50 border border-rose-100 px-4 py-3">
            <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-rose-100">
              <i className="ri-refund-2-line text-lg text-rose-600"></i>
            </span>
            <div>
              <div className="text-xl font-bold text-rose-700">{stats.refunded}</div>
              <div className="text-xs text-rose-600/80">환불 완료</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-neutral-50 border border-neutral-200 px-4 py-3">
            <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-neutral-100">
              <i className="ri-close-circle-line text-lg text-neutral-600"></i>
            </span>
            <div>
              <div className="text-xl font-bold text-neutral-700">{stats.declined}</div>
              <div className="text-xs text-neutral-500">환불 거절</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100">
              <i className="ri-forbid-line text-lg text-slate-600"></i>
            </span>
            <div>
              <div className="text-xl font-bold text-slate-700">{stats.cancelled}</div>
              <div className="text-xs text-slate-500">취소 건수</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold text-neutral-900">결제 내역</h2>
        <AdminTabs tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {msg && (
        <div className={`text-sm px-4 py-3 rounded-xl border ${msgOk ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {msg}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
          조건에 맞는 결제 내역이 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200 bg-neutral-50">
                  <th className="px-5 py-3 font-medium">수강생</th>
                  <th className="px-5 py-3 font-medium">사이트</th>
                  <th className="px-5 py-3 font-medium">강사</th>
                  <th className="px-5 py-3 font-medium">날짜</th>
                  <th className="px-5 py-3 font-medium">금액</th>
                  <th className="px-5 py-3 font-medium">상태</th>
                  <th className="px-5 py-3 font-medium">사유</th>
                  <th className="px-5 py-3 font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const refunded = b.refund_status === 'refunded';
                  const requested = b.refund_status === 'requested';
                  const declined = b.refund_status === 'declined';
                  const status = getPaymentStatus(b.session_type, b.paddle_transaction_id);
                  return (
                    <tr key={b.id} className="border-b border-neutral-100 last:border-0">
                      <td className="px-5 py-3">
                        <div className="font-medium text-neutral-900">{b.name}</div>
                        <div className="text-xs text-neutral-500">{b.email}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 whitespace-nowrap">
                          {b.site_name ?? '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-neutral-600">{b.coach_name}</td>
                      <td className="px-5 py-3 text-neutral-600 whitespace-nowrap">{formatDate(b.booking_date)}</td>
                      <td className="px-5 py-3 font-medium text-neutral-900 whitespace-nowrap">{amount(b)}</td>
                      <td className="px-5 py-3">
                        {refunded ? (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-rose-100 text-rose-700">
                            환불 완료
                          </span>
                        ) : requested ? (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-amber-100 text-amber-700">
                            환불 요청
                          </span>
                        ) : declined ? (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-neutral-100 text-neutral-600">
                            거절됨
                          </span>
                        ) : (
                          <PaymentBadge status={status} />
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {b.refund_reason ? (
                          <span className="inline-block max-w-[200px] text-xs text-neutral-600 line-clamp-2" title={b.refund_reason}>
                            {b.refund_reason}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {requested ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setRefundTarget({ booking: b, mode: 'approve' })}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 whitespace-nowrap cursor-pointer"
                            >
                              <span className="w-3.5 h-3.5 flex items-center justify-center"><i className="ri-check-line text-xs"></i></span>
                              승인
                            </button>
                            <button
                              onClick={() => setRefundTarget({ booking: b, mode: 'decline' })}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 whitespace-nowrap cursor-pointer"
                            >
                              <span className="w-3.5 h-3.5 flex items-center justify-center"><i className="ri-close-line text-xs"></i></span>
                              거절
                            </button>
                          </div>
                        ) : !refunded && !declined && status === 'paid' ? (
                          <button
                            onClick={() => setRefundTarget({ booking: b, mode: 'approve' })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer transition whitespace-nowrap"
                          >
                            <span className="w-3.5 h-3.5 flex items-center justify-center"><i className="ri-refund-2-line"></i></span>
                            환불
                          </button>
                        ) : (
                          <span className="text-neutral-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {refundTarget && (
        <RefundModal
          booking={refundTarget.booking}
          busy={busy}
          onClose={() => setRefundTarget(null)}
          onConfirm={refundTarget.mode === 'approve' ? handleRefund : undefined}
          onDecline={refundTarget.mode === 'decline' ? handleRefund : undefined}
          mode={refundTarget.mode}
        />
      )}
    </div>
  );
}