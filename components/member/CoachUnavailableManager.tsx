'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getCoachSlotsAllSites,
  getCoachSites,
  getCoachUnavailableSlots,
  addCoachUnavailable,
  removeCoachUnavailable,
  todayIso,
  type Slot,
} from '@/lib/booking';
import CalendarPicker from '@/components/booking/CalendarPicker';

function formatDate(d: string) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
}

const PERIOD_LABELS: Record<string, string> = {
  Morning: '오전',
  Afternoon: '오후',
  Evening: '저녁',
};

interface DisplaySlot {
  start: string;
  end: string;
  period: Slot['period'];
  orgIds: string[];
  orgNames: string[];
}

export default function CoachUnavailableManager({ coachId }: { coachId: string }) {
  const [date, setDate] = useState<string | null>(null);
  const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [siteFilter, setSiteFilter] = useState<string>('all');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setDate(todayIso());
  }, []);

  useEffect(() => {
    if (!coachId) return;
    getCoachSites(coachId).then((s) => {
      setSites(s);
      if (s.length > 0 && siteFilter !== 'all') {
        const stillExists = s.some((x) => x.id === siteFilter);
        if (!stillExists) setSiteFilter('all');
      }
    });
  }, [coachId]);

  useEffect(() => {
    if (!coachId || !date) return;
    setLoading(true);
    (async () => {
      const [regular, free, unavail] = await Promise.all([
        getCoachSlotsAllSites(coachId, date, 'regular'),
        getCoachSlotsAllSites(coachId, date, 'free'),
        getCoachUnavailableSlots(coachId, date),
      ]);
      setSlots([...regular, ...free]);
      setUnavailable(new Set(unavail));
      setLoading(false);
    })();
  }, [coachId, date]);

  const displaySlots = useMemo<DisplaySlot[]>(() => {
    const map = new Map<string, DisplaySlot>();
    for (const s of slots) {
      const key = s.start;
      if (!map.has(key)) {
        map.set(key, { start: s.start, end: s.end, period: s.period, orgIds: [], orgNames: [] });
      }
      const rec = map.get(key)!;
      if (s.orgId && !rec.orgIds.includes(s.orgId)) rec.orgIds.push(s.orgId);
      if (s.orgName && !rec.orgNames.includes(s.orgName)) rec.orgNames.push(s.orgName);
    }
    return [...map.values()];
  }, [slots]);

  const filtered = useMemo(() => {
    if (siteFilter === 'all') return displaySlots;
    return displaySlots.filter((d) => d.orgIds.includes(siteFilter));
  }, [displaySlots, siteFilter]);

  async function toggle(slot: string) {
    if (!date) return;
    setBusy(slot);
    if (unavailable.has(slot)) {
      await removeCoachUnavailable(coachId, date, slot);
      setUnavailable((prev) => {
        const next = new Set(prev);
        next.delete(slot);
        return next;
      });
    } else {
      await addCoachUnavailable(coachId, date, slot);
      setUnavailable((prev) => {
        const next = new Set(prev);
        next.add(slot);
        return next;
      });
    }
    setBusy(null);
  }

  const periods = [...new Set(filtered.map((s) => s.period))];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <h2 className="text-lg font-bold text-neutral-900">코칭 불가 시간 지정</h2>
      <p className="text-sm text-neutral-500 mt-1">
        본인이 코칭할 수 없는 시간을 클릭해 지정하세요. 지정된 시간은 모든 사이트의 예약 화면에서 선택할 수 없게 됩니다.
      </p>

      <div className="mt-5">
        <CalendarPicker selected={date} onSelect={setDate} />
      </div>

      {sites.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-1 p-1 bg-neutral-50 border border-neutral-200 rounded-full w-fit">
          <button
            onClick={() => setSiteFilter('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition ${
              siteFilter === 'all' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-white'
            }`}
          >
            전체
          </button>
          {sites.map((s) => (
            <button
              key={s.id}
              onClick={() => setSiteFilter(s.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition ${
                siteFilter === s.id ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-white'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4">
        {loading ? (
          <div className="text-sm text-neutral-500 py-6 text-center">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-neutral-500 py-6 text-center bg-neutral-50 rounded-xl">
            이 날짜에는 등록된 일정이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs text-neutral-400">
              {date ? formatDate(date) : ''} · 빨간 시간이 코칭 불가로 지정된 슬롯입니다.
              {siteFilter !== 'all' && sites.find((s) => s.id === siteFilter) ? ` · ${sites.find((s) => s.id === siteFilter)!.name}` : ''}
            </div>
            {periods.map((p) => (
              <div key={p}>
                <div className="text-xs uppercase tracking-widest text-neutral-500 mb-2">{PERIOD_LABELS[p] ?? p}</div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {filtered.filter((s) => s.period === p).map((s) => {
                    const isUnavailable = unavailable.has(s.start);
                    return (
                      <button
                        key={s.start}
                        onClick={() => toggle(s.start)}
                        disabled={busy === s.start}
                        className={`px-2 py-2 rounded-xl border text-xs text-center transition w-full cursor-pointer ${
                          isUnavailable
                            ? 'border-rose-300 bg-rose-50 text-rose-600'
                            : 'border-neutral-300 text-neutral-700 hover:border-neutral-900'
                        }`}
                      >
                        <span className="block truncate">{s.start} — {s.end}</span>
                        {siteFilter === 'all' && s.orgNames.length > 0 && (
                          <span className="block truncate text-[10px] mt-0.5 text-neutral-400">
                            {s.orgNames.join(', ')}
                          </span>
                        )}
                        <span className="block text-[10px] mt-0.5">
                          {isUnavailable ? '불가 지정됨' : '가능'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}