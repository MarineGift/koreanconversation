'use client';

import { useMemo, useState } from 'react';
import type { DashboardBooking, DashboardOrder } from '@/lib/dashboard';
import { classifyBooking, todayKey, formatDate } from '@/lib/bookingStatus';
import AdminTabs from '../AdminTabs';
import PhaseBadge from '../PhaseBadge';
import AdminQuickBookingModal from '../AdminQuickBookingModal';
import AdminMemberAddModal from '../AdminMemberAddModal';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function Stat({ label, value, icon, accent, change }: { label: string; value: string; icon: string; accent: string; change?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex items-center gap-4">
      <div className="w-12 h-12 flex items-center justify-center rounded-xl shrink-0" style={{ backgroundColor: `${accent}1a`, color: accent }}>
        <i className={`${icon} text-2xl`}></i>
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-neutral-900 leading-none truncate">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          <div className="text-sm text-neutral-500">{label}</div>
          {change && <div className="text-xs text-emerald-600 font-medium">{change}</div>}
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ type, title, desc, time }: { type: string; title: string; desc: string; time: string }) {
  const icons: Record<string, string> = {
    booking: 'ri-calendar-check-line',
    member: 'ri-user-add-line',
    payment: 'ri-money-dollar-circle-line',
    lesson: 'ri-book-open-line',
    coach: 'ri-user-star-line',
  };
  const colors: Record<string, string> = {
    booking: '#2563eb',
    member: '#16a34a',
    payment: '#d97706',
    lesson: '#7c3aed',
    coach: '#dc2626',
  };
  return (
    <div className="flex items-start gap-3 py-3 border-b border-neutral-100 last:border-0">
      <div className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0 mt-0.5" style={{ backgroundColor: `${colors[type] ?? '#666'}1a`, color: colors[type] ?? '#666' }}>
        <i className={`${icons[type] ?? 'ri-information-line'} text-sm`}></i>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-neutral-900">{title}</div>
        <div className="text-xs text-neutral-500 mt-0.5">{desc}</div>
      </div>
      <div className="text-xs text-neutral-400 whitespace-nowrap shrink-0">{time}</div>
    </div>
  );
}

export default function OverviewSection({
  bookings,
  orders,
  coachesCount,
  accent,
}: {
  bookings: DashboardBooking[];
  orders: DashboardOrder[];
  coachesCount: number;
  accent: string;
}) {
  const [tab, setTab] = useState('today');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  const stats = useMemo(() => {
    const today = todayKey();
    let todayCount = 0;
    let noShow = 0;
    let upcoming = 0;
    let totalPaid = 0;
    let monthPaid = 0;
    const students = new Set<string>();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    for (const b of bookings) {
      students.add(b.email);
      const phase = classifyBooking(b.booking_date, b.status);
      if (phase === 'no_show') noShow++;
      else if (phase === 'today') todayCount++;
      else if (phase === 'upcoming') upcoming++;
      const amt = typeof b.amount_paid === 'string' ? parseFloat(b.amount_paid) : (b.amount_paid ?? 0);
      totalPaid += amt;
      const bDate = new Date(b.booking_date);
      if (bDate >= monthStart) monthPaid += amt;
    }
    return { today: todayCount, noShow, upcoming, totalPaid, monthPaid, students: students.size, todayKey: today };
  }, [bookings]);

  const chartData = useMemo(() => {
    const now = new Date();
    const months: string[] = [];
    const revenue: number[] = [];
    const count: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(label);
      revenue.push(0);
      count.push(0);
    }
    for (const b of bookings) {
      const d = new Date(b.booking_date);
      const label = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
      const idx = months.indexOf(label);
      if (idx >= 0) {
        count[idx]++;
        const amt = typeof b.amount_paid === 'string' ? parseFloat(b.amount_paid) : (b.amount_paid ?? 0);
        revenue[idx] += amt;
      }
    }
    return months.map((m, i) => ({ month: m, revenue: revenue[i], bookings: count[i] }));
  }, [bookings]);

  const refundChartData = useMemo(() => {
    const now = new Date();
    const months: string[] = [];
    const refunded: number[] = [];
    const requested: number[] = [];
    const cancelled: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`);
      refunded.push(0);
      requested.push(0);
      cancelled.push(0);
    }
    for (const b of bookings) {
      const d = new Date(b.booking_date);
      const label = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
      const idx = months.indexOf(label);
      if (idx >= 0) {
        if (b.refund_status === 'refunded') refunded[idx]++;
        else if (b.refund_status === 'requested') requested[idx]++;
        if (b.status === 'cancelled') cancelled[idx]++;
      }
    }
    return months.map((m, i) => ({
      month: m,
      refunded: refunded[i],
      requested: requested[i],
      cancelled: cancelled[i],
    }));
  }, [bookings]);

  const siteNames = useMemo(() => {
    const set = new Set(bookings.map((b) => b.site_name).filter(Boolean));
    for (const o of orders) {
      if (o.site_name) set.add(o.site_name);
    }
    return Array.from(set);
  }, [bookings, orders]);

  const siteChartData = useMemo(() => {
    const now = new Date();
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return siteNames.map((site) => {
      const data = months.map((m) => ({ month: m, revenue: 0, orders: 0, refunded: 0, requested: 0, cancelled: 0, bookings: 0 }));
      for (const b of bookings) {
        if (b.site_name !== site) continue;
        const d = new Date(b.booking_date);
        const label = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
        const idx = months.indexOf(label);
        if (idx >= 0) {
          const amt = typeof b.amount_paid === 'string' ? parseFloat(b.amount_paid) : (b.amount_paid ?? 0);
          data[idx].revenue += amt;
          data[idx].bookings++;
          if (b.refund_status === 'refunded') data[idx].refunded++;
          else if (b.refund_status === 'requested') data[idx].requested++;
          if (b.status === 'cancelled') data[idx].cancelled++;
        }
      }
      for (const o of orders) {
        if (o.site_name !== site) continue;
        const d = new Date(o.created_at);
        const label = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
        const idx = months.indexOf(label);
        if (idx >= 0) {
          const amt = typeof o.amount === 'string' ? parseFloat(o.amount) : (o.amount ?? 0);
          data[idx].orders += amt;
        }
      }
      return { site, data };
    });
  }, [bookings, orders, siteNames]);

  const recentBookings = useMemo(() => {
    return [...bookings].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 5);
  }, [bookings]);

  const activities = useMemo(() => {
    const list: { type: string; title: string; desc: string; time: string; sort: number }[] = [];
    for (const b of recentBookings) {
      const date = new Date(b.created_at);
      list.push({
        type: b.amount_paid && b.amount_paid > 0 ? 'payment' : 'booking',
        title: b.amount_paid && b.amount_paid > 0 ? `${b.name} - 결제 완료` : `${b.name} - 예약 완료`,
        desc: `${b.coach_name} · ${formatDate(b.booking_date)} · ${b.slot}`,
        time: `${date.getMonth() + 1}월 ${date.getDate()}일`,
        sort: date.getTime(),
      });
    }
    return list.sort((a, b) => b.sort - a.sort);
  }, [recentBookings]);

  const filtered = useMemo(() => {
    return bookings
      .filter((b) => {
        const phase = classifyBooking(b.booking_date, b.status);
        if (tab === 'today') return phase === 'today';
        if (tab === 'upcoming') return phase === 'upcoming';
        if (tab === 'past') return phase === 'past';
        if (tab === 'no_show') return phase === 'no_show';
        return true;
      })
      .sort((a, b) => (a.booking_date < b.booking_date ? 1 : -1));
  }, [bookings, tab]);

  const tabs = [
    { key: 'today', label: '오늘', count: stats.today },
    { key: 'upcoming', label: '예정', count: stats.upcoming },
    { key: 'past', label: '완료' },
    { key: 'no_show', label: '노쇼', count: stats.noShow },
    { key: 'all', label: '전체', count: bookings.length },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Stat label="총 예약" value={String(bookings.length)} icon="ri-calendar-check-line" accent={accent} change="+12%" />
        <Stat label="오늘 예약" value={String(stats.today)} icon="ri-time-line" accent={accent} />
        <Stat label="예정 예약" value={String(stats.upcoming)} icon="ri-calendar-2-line" accent={accent} />
        <Stat label="노쇼" value={String(stats.noShow)} icon="ri-user-unfollow-line" accent={accent} />
        <Stat label="수강생" value={String(stats.students)} icon="ri-group-line" accent={accent} change="+3명" />
        <Stat label="이번 달 매출" value={`$${stats.monthPaid.toLocaleString()}`} icon="ri-money-dollar-circle-line" accent={accent} change={`${stats.totalPaid > 0 ? Math.round((stats.monthPaid / stats.totalPaid) * 100) : 0}%`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <h3 className="text-sm font-bold text-neutral-900 mb-4">월별 매출 추이</h3>
          {chartData.length === 0 || chartData.every((d) => d.revenue === 0) ? (
            <div className="h-48 flex items-center justify-center text-sm text-neutral-500">매출 데이터가 없습니다.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accent} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '매출']} contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5', fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke={accent} fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <h3 className="text-sm font-bold text-neutral-900 mb-4">월별 예약 추이</h3>
          {chartData.length === 0 || chartData.every((d) => d.bookings === 0) ? (
            <div className="h-48 flex items-center justify-center text-sm text-neutral-500">예약 데이터가 없습니다.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="bookGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: any) => [`${v}건`, '예약']} contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5', fontSize: 12 }} />
                <Area type="monotone" dataKey="bookings" stroke="#2563eb" fill="url(#bookGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-bold text-neutral-900">코칭 일정</h2>
            <AdminTabs tabs={tabs} active={tab} onChange={setTab} />
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
              해당 예약이 없습니다.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200 bg-neutral-50">
                      <th className="px-5 py-3 font-medium">수강생</th>
                      <th className="px-5 py-3 font-medium">강사</th>
                      <th className="px-5 py-3 font-medium">날짜</th>
                      <th className="px-5 py-3 font-medium">시간</th>
                      <th className="px-5 py-3 font-medium">유형</th>
                      <th className="px-5 py-3 font-medium">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 12).map((b) => (
                      <tr key={b.id} className="border-b border-neutral-100 last:border-0">
                        <td className="px-5 py-3">
                          <div className="font-medium text-neutral-900">{b.name}</div>
                          <div className="text-xs text-neutral-500">{b.email}</div>
                        </td>
                        <td className="px-5 py-3 text-neutral-600">{b.coach_name}</td>
                        <td className="px-5 py-3 text-neutral-600 whitespace-nowrap">{formatDate(b.booking_date)}</td>
                        <td className="px-5 py-3 text-neutral-600 whitespace-nowrap">{b.slot}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 whitespace-nowrap">
                            {b.session_type === 'free' ? '무료 체험' : '유료'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <PhaseBadge phase={classifyBooking(b.booking_date, b.status)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length > 12 && (
                <div className="px-5 py-3 text-xs text-neutral-500 border-t border-neutral-200">
                  외 {filtered.length - 12}건
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-bold text-neutral-900">최근 활동</h2>
          <div className="bg-white rounded-2xl border border-neutral-200 p-5">
            {activities.length === 0 ? (
              <div className="text-sm text-neutral-500 text-center py-6">최근 활동이 없습니다.</div>
            ) : (
              <div>
                {activities.map((a, i) => (
                  <ActivityItem key={i} type={a.type} title={a.title} desc={a.desc} time={a.time} />
                ))}
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold text-neutral-900">빠른 메뉴</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowBookingModal(true)}
              className="bg-white rounded-xl border border-neutral-200 p-4 text-left hover:border-neutral-300 transition cursor-pointer"
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-2">
                <i className="ri-calendar-check-line"></i>
              </div>
              <div className="text-sm font-medium text-neutral-900">예약 추가</div>
              <div className="text-xs text-neutral-500 mt-0.5">새로운 수업 예약</div>
            </button>
            <button
              onClick={() => setShowMemberModal(true)}
              className="bg-white rounded-xl border border-neutral-200 p-4 text-left hover:border-neutral-300 transition cursor-pointer"
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 mb-2">
                <i className="ri-user-add-line"></i>
              </div>
              <div className="text-sm font-medium text-neutral-900">회원 등록</div>
              <div className="text-xs text-neutral-500 mt-0.5">새 회원 추가</div>
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: { category: 'content', tab: 'material' } }))}
              className="bg-white rounded-xl border border-neutral-200 p-4 text-left hover:border-neutral-300 transition cursor-pointer"
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-50 text-purple-600 mb-2">
                <i className="ri-book-open-line"></i>
              </div>
              <div className="text-sm font-medium text-neutral-900">교재 업로드</div>
              <div className="text-xs text-neutral-500 mt-0.5">새 교육 자료</div>
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('admin-navigate', { detail: { category: 'operations', tab: 'payment' } }))}
              className="bg-white rounded-xl border border-neutral-200 p-4 text-left hover:border-neutral-300 transition cursor-pointer"
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 mb-2">
                <i className="ri-file-chart-line"></i>
              </div>
              <div className="text-sm font-medium text-neutral-900">보고서</div>
              <div className="text-xs text-neutral-500 mt-0.5">통계 리포트</div>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-bold text-neutral-900">사이트별 월별 현황</h3>
        </div>
        {siteChartData.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
            사이트별 데이터가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {siteChartData.map(({ site, data }) => (
              <div key={site} className="bg-white rounded-2xl border border-neutral-200 p-5">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <h4 className="text-sm font-bold text-neutral-900">{site}</h4>
                  <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }}></span>매출</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>패키지</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span>환불</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span>검토중</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neutral-300"></span>취소</span>
                  </div>
                </div>
                {data.every((d) => d.revenue === 0 && d.orders === 0 && d.refunded === 0 && d.requested === 0 && d.cancelled === 0) ? (
                  <div className="h-40 flex items-center justify-center text-sm text-neutral-500">해당 사이트 데이터가 없습니다.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5', fontSize: 12 }} />
                      <Bar dataKey="revenue" fill={accent} radius={[4, 4, 0, 0]} name="매출" />
                      <Bar dataKey="orders" fill="#16a34a" radius={[4, 4, 0, 0]} name="패키지" />
                      <Bar dataKey="refunded" fill="#e11d48" radius={[4, 4, 0, 0]} name="환불" />
                      <Bar dataKey="requested" fill="#d97706" radius={[4, 4, 0, 0]} name="검토중" />
                      <Bar dataKey="cancelled" fill="#a3a3a3" radius={[4, 4, 0, 0]} name="취소" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                <div className="grid grid-cols-4 gap-3 mt-4">
                  <div className="text-center">
                    <div className="text-xs text-neutral-500">예약</div>
                    <div className="text-sm font-bold text-neutral-900">{data.reduce((s, d) => s + d.bookings, 0)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-neutral-500">총 매출</div>
                    <div className="text-sm font-bold text-neutral-900">${data.reduce((s, d) => s + d.revenue + d.orders, 0).toLocaleString()}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-neutral-500">환불/검토</div>
                    <div className="text-sm font-bold text-rose-600">{data.reduce((s, d) => s + d.refunded + d.requested, 0)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-neutral-500">취소</div>
                    <div className="text-sm font-bold text-neutral-600">{data.reduce((s, d) => s + d.cancelled, 0)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h3 className="text-sm font-bold text-neutral-900">환불 · 취소 추이</h3>
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>환불 완료</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>검토 중</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-neutral-400"></span>취소</span>
          </div>
        </div>
        {refundChartData.every((d) => d.refunded === 0 && d.requested === 0 && d.cancelled === 0) ? (
          <div className="h-48 flex items-center justify-center text-sm text-neutral-500">환불/취소 데이터가 없습니다.</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={refundChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="refundedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="requestedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cancelledGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a3a3a3" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#a3a3a3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip formatter={(v: any, name: any) => [`${v}건`, name === 'refunded' ? '환불 완료' : name === 'requested' ? '검토 중' : '취소']} contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5', fontSize: 12 }} />
              <Area type="monotone" dataKey="refunded" stroke="#e11d48" fill="url(#refundedGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="requested" stroke="#d97706" fill="url(#requestedGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="cancelled" stroke="#a3a3a3" fill="url(#cancelledGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {showBookingModal && (
        <AdminQuickBookingModal
          onClose={() => setShowBookingModal(false)}
          onDone={() => window.location.reload()}
        />
      )}
      {showMemberModal && (
        <AdminMemberAddModal
          onClose={() => setShowMemberModal(false)}
          onDone={() => window.location.reload()}
        />
      )}
    </div>
  );
}