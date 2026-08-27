'use client';

import { useMemo, useState } from 'react';
import type { DashboardBooking } from '@/lib/dashboard';
import LessonDetailModal from './LessonDetailModal';
import PaymentBadge, { getPaymentStatus } from './PaymentBadge';
import RoomJoinButton from '@/components/member/RoomJoinButton';

function formatDate(d: string) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

function toDateKey(d: string) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function BookingsTable({ bookings }: { bookings: DashboardBooking[] }) {
  const [query, setQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [site, setSite] = useState('전체');
  const [detail, setDetail] = useState<DashboardBooking | null>(null);

  const sites = useMemo(() => {
    const set = new Set(bookings.map((b) => b.site_name));
    return ['전체', ...Array.from(set)];
  }, [bookings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((b) => {
      if (site !== '전체' && b.site_name !== site) return false;
      if (q) {
        const hay = `${b.name} ${b.email} ${b.coach_name} ${b.site_name} ${b.lesson_name ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (startDate && toDateKey(b.booking_date) < startDate) return false;
      if (endDate && toDateKey(b.booking_date) > endDate) return false;
      return true;
    });
  }, [bookings, query, startDate, endDate, site]);

  function reset() {
    setQuery('');
    setStartDate('');
    setEndDate('');
    setSite('전체');
  }

  const hasFilter = query !== '' || startDate !== '' || endDate !== '' || site !== '전체';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {sites.map((s) => (
          <button
            key={s}
            onClick={() => setSite(s)}
            className={`px-4 py-2 rounded-full text-sm border cursor-pointer whitespace-nowrap transition ${
              site === s
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-900'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs text-neutral-500 mb-1.5">검색</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-neutral-400">
              <i className="ri-search-line text-sm"></i>
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="수강생, 이메일, 강사, 강의명 검색"
              className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
            />
          </div>
        </div>

        <div className="w-[180px]">
          <label className="block text-xs text-neutral-500 mb-1.5">시작 날짜</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
          />
        </div>

        <div className="w-[180px]">
          <label className="block text-xs text-neutral-500 mb-1.5">종료 날짜</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
          />
        </div>

        {hasFilter && (
          <button
            onClick={reset}
            className="px-3 py-2 text-sm text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 whitespace-nowrap cursor-pointer flex items-center gap-1.5"
          >
            <span className="w-4 h-4 flex items-center justify-center"><i className="ri-close-line text-sm"></i></span>
            초기화
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
          {bookings.length === 0 ? '아직 예약이 없습니다.' : '조건에 맞는 강의가 없습니다.'}
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
                  <th className="px-5 py-3 font-medium">사이트</th>
                  <th className="px-5 py-3 font-medium">수강생</th>
                  <th className="px-5 py-3 font-medium">강의명</th>
                  <th className="px-5 py-3 font-medium">날짜</th>
                  <th className="px-5 py-3 font-medium">시간</th>
                  <th className="px-5 py-3 font-medium">강사</th>
                  <th className="px-5 py-3 font-medium">결제</th>
                  <th className="px-5 py-3 font-medium">강의실</th>
                  <th className="px-5 py-3 font-medium">상세</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-5 py-3">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 whitespace-nowrap">
                        {b.site_name}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-neutral-900">{b.name}</td>
                    <td className="px-5 py-3 text-neutral-600">{b.lesson_name ?? '—'}</td>
                    <td className="px-5 py-3 text-neutral-600 whitespace-nowrap">{formatDate(b.booking_date)}</td>
                    <td className="px-5 py-3 text-neutral-600 whitespace-nowrap">{b.slot}</td>
                    <td className="px-5 py-3 text-neutral-600">{b.coach_name}</td>
                    <td className="px-5 py-3">
                      <PaymentBadge status={getPaymentStatus(b.session_type, b.paddle_transaction_id)} />
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
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setDetail(b)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 cursor-pointer"
                      >
                        <i className="ri-eye-line text-sm"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <LessonDetailModal booking={detail} onClose={() => setDetail(null)} />
    </div>
  );
}