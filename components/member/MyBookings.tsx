'use client';

import { useMemo, useState } from 'react';
import type { Role, MemberBooking } from '@/lib/member';
import RoomJoinButton from '@/components/member/RoomJoinButton';

function formatDate(d: string) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const statusLabel: Record<string, string> = {
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  pending: 'Pending',
};

const statusFilterOptions: { key: string; label: string; color: string }[] = [
  { key: 'all', label: '전체', color: 'bg-neutral-900 text-white border-neutral-900' },
  { key: 'pending', label: '대기', color: 'bg-amber-900 text-white border-amber-900' },
  { key: 'confirmed', label: '확정', color: 'bg-blue-900 text-white border-blue-900' },
  { key: 'completed', label: '완료', color: 'bg-emerald-900 text-white border-emerald-900' },
  { key: 'cancelled', label: '취소', color: 'bg-rose-900 text-white border-rose-900' },
];

const periodFilterOptions: { key: string; label: string }[] = [
  { key: 'all', label: '전체 기간' },
  { key: 'today', label: '오늘' },
  { key: 'week', label: '이번 주' },
  { key: 'month', label: '이번 달' },
  { key: '3months', label: '지난 3개월' },
];

function isInPeriod(d: string, period: string): boolean {
  const date = new Date(d + 'T00:00:00');
  if (isNaN(date.getTime())) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = today.getTime() - date.getTime();
  const diffDays = diff / (1000 * 60 * 60 * 24);

  switch (period) {
    case 'today': return diffDays >= 0 && diffDays < 1;
    case 'week': {
      const dayOfWeek = today.getDay();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - dayOfWeek);
      return date >= weekStart;
    }
    case 'month': return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    case '3months': {
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      return date >= threeMonthsAgo;
    }
    default: return true;
  }
}

export default function MyBookings({ bookings, role, onConfirm, onDecline }: { bookings: MemberBooking[]; role: Role; onConfirm?: (id: string) => void; onDecline?: (id: string, reason: string) => void }) {
  const [coachFilter, setCoachFilter] = useState('All');
  const [siteFilter, setSiteFilter] = useState('All');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [declineModalId, setDeclineModalId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [declineBusy, setDeclineBusy] = useState(false);
  const [requestModal, setRequestModal] = useState<MemberBooking | null>(null);

  const coaches = useMemo(() => {
    const set = new Set(bookings.map((b) => b.coach_name));
    return ['All', ...Array.from(set)];
  }, [bookings]);

  const sites = useMemo(() => {
    const set = new Set(bookings.map((b) => b.site_name).filter((s): s is string => Boolean(s));
    return ['All', ...Array.from(set)];
  }, [bookings]);

  const filtered = useMemo(() => {
    let list = bookings;
    if (coachFilter !== 'All') list = list.filter((b) => b.coach_name === coachFilter);
    if (siteFilter !== 'All') list = list.filter((b) => b.site_name === siteFilter);
    if (statusFilter !== 'all') list = list.filter((b) => b.status === statusFilter);
    if (periodFilter !== 'all') list = list.filter((b) => isInPeriod(b.booking_date, periodFilter));
    return list;
  }, [bookings, coachFilter, siteFilter, statusFilter, periodFilter]);

  async function handleDecline(id: string) {
    if (!declineReason.trim()) return;
    setDeclineBusy(true);
    const err = await onDecline?.(id, declineReason.trim());
    setDeclineBusy(false);
    if (!err) {
      setDeclineModalId(null);
      setDeclineReason('');
    }
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
          <i className="ri-calendar-line text-2xl"></i>
        </div>
        <p className="mt-4 text-sm text-neutral-500">
          {role === 'member' ? 'No coaching sessions yet.' : 'No coaching sessions registered yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-400 font-medium mr-1">기간</span>
          {periodFilterOptions.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriodFilter(p.key)}
              className={`px-3 py-1.5 rounded-full text-xs border cursor-pointer whitespace-nowrap transition ${
                periodFilter === p.key
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-400 font-medium mr-1">상태</span>
          {statusFilterOptions.map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`px-3 py-1.5 rounded-full text-xs border cursor-pointer whitespace-nowrap transition ${
                statusFilter === s.key ? s.color : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-900'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        {coaches.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-400 font-medium mr-1">강사</span>
            {coaches.map((c) => (
              <button
                key={c}
                onClick={() => setCoachFilter(c)}
                className={`px-3 py-1.5 rounded-full text-xs border cursor-pointer whitespace-nowrap transition ${
                  coachFilter === c
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-900'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
        {sites.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-400 font-medium mr-1">사이트</span>
            {sites.map((s) => (
              <button
                key={`site-${s}`}
                onClick={() => setSiteFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs border cursor-pointer whitespace-nowrap transition ${
                  siteFilter === s
                    ? 'bg-indigo-900 text-white border-indigo-900'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-indigo-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="px-5 py-3 text-xs text-neutral-500 border-b border-neutral-200 flex items-center justify-between">
          <span>{filtered.length} total</span>
          <span className="text-neutral-400">
            {periodFilter !== 'all' && periodFilterOptions.find(p => p.key === periodFilter)?.label}
            {statusFilter !== 'all' && ' · ' + statusFilterOptions.find(s => s.key === statusFilter)?.label}
            {coachFilter !== 'All' && ' · ' + coachFilter}
            {siteFilter !== 'All' && ' · ' + siteFilter}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200 bg-neutral-50">
                {role !== 'member' && (
                  <>
                    <th className="px-5 py-3 font-medium">Student</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                  </>
                )}
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Time</th>
                {role !== 'coach' && <th className="px-5 py-3 font-medium">Coach</th>}
                <th className="px-5 py-3 font-medium">Site</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Room</th>
                {(role === 'admin' || role === 'coach') && <th className="px-5 py-3 font-medium">Actions</th>}
                <th className="px-5 py-3 font-medium">Requests</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-b border-neutral-100 last:border-0">
                  {role !== 'member' && (
                    <>
                      <td className="px-5 py-3 font-medium text-neutral-900">{b.name}</td>
                      <td className="px-5 py-3 text-neutral-600">{b.email}</td>
                    </>
                  )}
                  <td className="px-5 py-3 text-neutral-600 whitespace-nowrap">{formatDate(b.booking_date)}</td>
                  <td className="px-5 py-3 text-neutral-600 whitespace-nowrap">{b.slot}</td>
                  {role !== 'coach' && <td className="px-5 py-3 text-neutral-600">{b.coach_name}</td>}
                  <td className="px-5 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 whitespace-nowrap">
                      {b.site_name ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      b.status === 'cancelled'
                        ? 'bg-rose-50 text-rose-700'
                        : b.status === 'pending'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {statusLabel[b.status ?? 'confirmed'] ?? 'Confirmed'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <RoomJoinButton
                      bookingId={b.id}
                      bookingDate={b.booking_date}
                      slot={b.slot}
                      sessionType={b.session_type}
                      roomUrl={b.room_url}
                      status={b.status}
                    />
                  </td>
                  {(role === 'admin' || role === 'coach') && (
                    <td className="px-5 py-3">
                      {b.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onConfirm?.(b.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 whitespace-nowrap cursor-pointer"
                          >
                            <span className="w-3.5 h-3.5 flex items-center justify-center"><i className="ri-check-line text-xs"></i></span>
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeclineModalId(b.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-rose-200 text-rose-600 text-xs font-medium hover:bg-rose-50 whitespace-nowrap cursor-pointer"
                          >
                            <span className="w-3.5 h-3.5 flex items-center justify-center"><i className="ri-close-line text-xs"></i></span>
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-neutral-400 text-xs">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-5 py-3">
                    {(b.comment || b.lesson_content || (b.questions && b.questions.length > 0)) ? (
                      <button
                        onClick={() => setRequestModal(b)}
                        className="inline-flex items-center gap-1 text-xs text-amber-700 font-medium hover:underline cursor-pointer"
                      >
                        <span className="w-4 h-4 flex items-center justify-center"><i className="ri-file-list-3-line"></i></span>
                        보기
                      </button>
                    ) : (
                      <span className="text-neutral-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {declineModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-neutral-900">Decline Booking</h3>
            <p className="mt-1 text-sm text-neutral-500">The decline reason will be emailed to the student.</p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g., I'm unavailable at that time..."
              className="mt-4 w-full rounded-xl border border-neutral-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
              rows={3}
              maxLength={200}
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => { setDeclineModalId(null); setDeclineReason(''); }}
                className="px-4 py-2 rounded-full text-sm font-medium text-neutral-600 hover:bg-neutral-100 cursor-pointer whitespace-nowrap"
              >
                Close
              </button>
              <button
                onClick={() => handleDecline(declineModalId)}
                disabled={!declineReason.trim() || declineBusy}
                className="px-4 py-2 rounded-full text-sm font-medium bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {declineBusy ? 'Processing...' : 'Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {requestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="font-bold text-neutral-900">수강생 요청사항</h3>
              <button onClick={() => setRequestModal(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 cursor-pointer">
                <i className="ri-close-line text-xl text-neutral-600"></i>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-neutral-900">{requestModal.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">{requestModal.site_name ?? '—'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">{requestModal.coach_name}</span>
              </div>
              <div className="text-sm text-neutral-500">
                {formatDate(requestModal.booking_date)} · {requestModal.slot}
              </div>

              {requestModal.comment && (
                <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4">
                  <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-1">댓글</div>
                  <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{requestModal.comment}</p>
                </div>
              )}

              {requestModal.lesson_content && (
                <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4">
                  <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-1">요청 내용</div>
                  <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{requestModal.lesson_content}</p>
                </div>
              )}

              {requestModal.questions && requestModal.questions.length > 0 && (
                <div className="space-y-3">
                  <div className="text-[11px] uppercase tracking-wide text-neutral-400">수강생 질문 ({requestModal.questions.length}건)</div>
                  {requestModal.questions.map((q, idx) => (
                    <div key={q.id} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold shrink-0">Q</span>
                        <div className="text-sm text-neutral-800 leading-relaxed">{q.question || 'No content'}</div>
                      </div>
                      {q.answer && (
                        <div className="mt-3 flex items-start gap-2">
                          <span className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold shrink-0">A</span>
                          <div className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{q.answer}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
