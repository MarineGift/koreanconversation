'use client';

import { useMemo, useState } from 'react';
import type { DashboardBooking } from '@/lib/dashboard';
import { classifyBooking, formatDate } from '@/lib/bookingStatus';
import AdminTabs from '../AdminTabs';

interface StudentRow {
  name: string;
  email: string;
  nationality: string | null;
  total: number;
  today: number;
  noShow: number;
  lastDate: string;
}

export default function StudentSection({ bookings }: { bookings: DashboardBooking[] }) {
  const [tab, setTab] = useState('all');

  const students = useMemo(() => {
    const map = new Map<string, StudentRow>();
    for (const b of bookings) {
      const row = map.get(b.email) ?? {
        name: b.name,
        email: b.email,
        nationality: b.nationality,
        total: 0,
        today: 0,
        noShow: 0,
        lastDate: b.booking_date,
      };
      row.total++;
      const phase = classifyBooking(b.booking_date, b.status);
      if (phase === 'no_show') row.noShow++;
      else if (phase === 'today') row.today++;
      if (b.booking_date > row.lastDate) row.lastDate = b.booking_date;
      map.set(b.email, row);
    }
    return Array.from(map.values()).sort((a, b) => (a.lastDate < b.lastDate ? 1 : -1));
  }, [bookings]);

  const tabs = [
    { key: 'all', label: '전체', count: students.length },
    { key: 'today', label: '현재 진행중', count: students.filter((s) => s.today > 0).length },
    { key: 'no_show', label: '노쇼', count: students.filter((s) => s.noShow > 0).length },
  ];

  const filtered = students.filter((s) => {
    if (tab === 'today') return s.today > 0;
    if (tab === 'no_show') return s.noShow > 0;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold text-neutral-900">수강생 현황</h2>
        <AdminTabs tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
          조건에 맞는 수강생이 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="px-5 py-3 text-xs text-neutral-500 border-b border-neutral-200">
            총 {filtered.length}명
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200 bg-neutral-50">
                  <th className="px-5 py-3 font-medium">수강생</th>
                  <th className="px-5 py-3 font-medium">국적</th>
                  <th className="px-5 py-3 font-medium">총 예약</th>
                  <th className="px-5 py-3 font-medium">진행중</th>
                  <th className="px-5 py-3 font-medium">노쇼</th>
                  <th className="px-5 py-3 font-medium">최근 예약</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.email} className="border-b border-neutral-100 last:border-0">
                    <td className="px-5 py-3">
                      <div className="font-medium text-neutral-900">{s.name}</div>
                      <div className="text-xs text-neutral-500">{s.email}</div>
                    </td>
                    <td className="px-5 py-3 text-neutral-600">{s.nationality ?? '—'}</td>
                    <td className="px-5 py-3 text-neutral-600">{s.total}</td>
                    <td className="px-5 py-3">
                      {s.today > 0 ? (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">{s.today}건</span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {s.noShow > 0 ? (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">{s.noShow}건</span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-neutral-600 whitespace-nowrap">{formatDate(s.lastDate)}</td>
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