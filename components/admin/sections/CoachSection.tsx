'use client';

import { useMemo, useState } from 'react';
import type { DashboardBooking, DashboardCoach } from '@/lib/dashboard';
import { classifyBooking } from '@/lib/bookingStatus';
import { updateCoachApproval } from '@/lib/dashboard';
import AdminTabs from '../AdminTabs';
import ApprovalBadge, { getApprovalStatus, type ApprovalStatus } from '../ApprovalBadge';

const APPROVAL_FILTERS: { key: 'all' | ApprovalStatus; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'approved', label: '승인' },
  { key: 'pending', label: '대기' },
  { key: 'rejected', label: '거절' },
];

export default function CoachSection({
  coaches,
  bookings,
  accent,
  onChanged,
}: {
  coaches: DashboardCoach[];
  bookings: DashboardBooking[];
  accent: string;
  onChanged?: () => void;
}) {
  const [tab, setTab] = useState('all');
  const [approval, setApproval] = useState<'all' | ApprovalStatus>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState(true);

  const coachStats = useMemo(() => {
    return coaches.map((c) => {
      const mine = bookings.filter((b) => b.coach_name === c.name);
      let today = 0;
      let noShow = 0;
      let upcoming = 0;
      for (const b of mine) {
        const phase = classifyBooking(b.booking_date, b.status);
        if (phase === 'no_show') noShow++;
        else if (phase === 'today') today++;
        else if (phase === 'upcoming') upcoming++;
      }
      return { coach: c, total: mine.length, today, noShow, upcoming };
    });
  }, [coaches, bookings]);

  const tabs = [
    { key: 'all', label: '전체', count: coaches.length },
    { key: 'today', label: '현재 진행중', count: coachStats.filter((s) => s.today > 0).length },
    { key: 'no_show', label: '노쇼', count: coachStats.filter((s) => s.noShow > 0).length },
  ];

  const filtered = coachStats.filter((s) => {
    if (tab === 'today' && s.today === 0) return false;
    if (tab === 'no_show' && s.noShow === 0) return false;
    if (approval !== 'all' && getApprovalStatus(s.coach.approval_status) !== approval) return false;
    return true;
  });

  const allSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.coach.id));
  const selectedCount = selected.size;

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (allSelected) return new Set();
      return new Set(filtered.map((s) => s.coach.id));
    });
  }

  async function applyApproval(status: 'approved' | 'rejected') {
    if (selected.size === 0) return;
    setBusy(true);
    setMsg('');
    const error = await updateCoachApproval([...selected], status);
    if (error) {
      setMsgOk(false);
      setMsg('변경 실패: ' + error.message);
    } else {
      setMsgOk(true);
      setMsg(status === 'approved' ? '선택한 강사가 승인되었습니다.' : '선택한 강사가 거절되었습니다.');
      setSelected(new Set());
      onChanged?.();
    }
    setBusy(false);
    setTimeout(() => setMsg(''), 3000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold text-neutral-900">강사 현황</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700 cursor-pointer">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 accent-neutral-900 cursor-pointer" />
            전체 선택
          </label>
          <button
            onClick={() => applyApproval('approved')}
            disabled={selectedCount === 0 || busy}
            className="px-4 py-2 rounded-full text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer transition"
          >
            {selectedCount > 0 ? `${selectedCount}명 승인` : '승인'}
          </button>
          <button
            onClick={() => applyApproval('rejected')}
            disabled={selectedCount === 0 || busy}
            className="px-4 py-2 rounded-full text-sm font-medium border border-rose-300 text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer transition"
          >
            {selectedCount > 0 ? `${selectedCount}명 거절` : '거절'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {APPROVAL_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setApproval(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-sm border cursor-pointer whitespace-nowrap transition ${
                approval === f.key
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <AdminTabs tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {msg && (
        <div className={`text-sm px-4 py-3 rounded-xl border ${msgOk ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {msg}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
          조건에 맞는 강사가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(({ coach: c, total, today, noShow, upcoming }) => {
            const checked = selected.has(c.id);
            return (
              <div
                key={c.id}
                className={`bg-white rounded-2xl border p-5 transition ${checked ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-neutral-200'}`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOne(c.id)}
                    className="w-5 h-5 accent-neutral-900 cursor-pointer shrink-0"
                  />
                  {c.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.photo} alt={c.name} className="w-12 h-12 rounded-full object-cover object-top shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-neutral-400 shrink-0" style={{ backgroundColor: `${accent}1a`, color: accent }}>
                      <i className="ri-user-line text-xl"></i>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-neutral-900">{c.name}</div>
                    <div className="text-sm text-neutral-500 truncate">{c.title ?? '—'}</div>
                  </div>
                  <ApprovalBadge status={getApprovalStatus(c.approval_status)} />
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  <div className="rounded-xl bg-neutral-50 p-3 text-center">
                    <div className="text-xl font-bold text-neutral-900">{total}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">전체</div>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3 text-center">
                    <div className="text-xl font-bold text-emerald-700">{today}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">진행중</div>
                  </div>
                  <div className="rounded-xl bg-sky-50 p-3 text-center">
                    <div className="text-xl font-bold text-sky-700">{upcoming}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">예정</div>
                  </div>
                  <div className="rounded-xl bg-red-50 p-3 text-center">
                    <div className="text-xl font-bold text-red-700">{noShow}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">노쇼</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}