'use client';

import { useMemo, useState } from 'react';
import type { DashboardBooking } from '@/lib/dashboard';
import { classifyBooking, formatDate } from '@/lib/bookingStatus';
import AdminTabs from '../AdminTabs';
import PhaseBadge from '../PhaseBadge';
import StatusMenu from '../StatusMenu';
import PaymentBadge, { getPaymentStatus } from '../PaymentBadge';

export default function LessonSection({
  bookings,
  onStatusChanged,
}: {
  bookings: DashboardBooking[];
  onStatusChanged: () => void;
}) {
  const [tab, setTab] = useState('upcoming');

  const tabs = [
    { key: 'upcoming', label: '예정' },
    { key: 'today', label: '진행중' },
    { key: 'past', label: '완료' },
    { key: 'no_show', label: '노쇼' },
    { key: 'all', label: '전체', count: bookings.length },
  ];

  const filtered = useMemo(() => {
    return bookings
      .filter((b) => {
        const phase = classifyBooking(b.booking_date, b.status);
        if (tab === 'all') return true;
        return phase === tab;
      })
      .sort((a, b) => (a.booking_date < b.booking_date ? 1 : -1));
  }, [bookings, tab]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold text-neutral-900">강의 내역</h2>
        <AdminTabs tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
          조건에 맞는 강의가 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="px-5 py-3 text-xs text-neutral-500 border-b border-neutral-200">
            총 {filtered.length}건
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200 bg-neutral-50">
                  <th className="px-5 py-3 font-medium">날짜</th>
                  <th className="px-5 py-3 font-medium">시간</th>
                  <th className="px-5 py-3 font-medium">수강생</th>
                  <th className="px-5 py-3 font-medium">강사</th>
                  <th className="px-5 py-3 font-medium">결제</th>
                  <th className="px-5 py-3 font-medium">상태</th>
                  <th className="px-5 py-3 font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-5 py-3 text-neutral-600 whitespace-nowrap">{formatDate(b.booking_date)}</td>
                    <td className="px-5 py-3 text-neutral-600 whitespace-nowrap">{b.slot}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-neutral-900">{b.name}</div>
                      <div className="text-xs text-neutral-500">{b.nationality ?? ''}</div>
                    </td>
                    <td className="px-5 py-3 text-neutral-600">{b.coach_name}</td>
                    <td className="px-5 py-3">
                      <PaymentBadge status={getPaymentStatus(b.session_type, b.paddle_transaction_id)} />
                    </td>
                    <td className="px-5 py-3">
                      <PhaseBadge phase={classifyBooking(b.booking_date, b.status)} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusMenu bookingId={b.id} currentStatus={b.status} onChanged={onStatusChanged} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}