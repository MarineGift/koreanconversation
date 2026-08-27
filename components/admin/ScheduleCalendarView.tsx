'use client';

import { useEffect, useMemo, useState } from 'react';
import { getBookingsForRange, type CalendarBooking } from '@/lib/scheduleViewer';

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function ScheduleCalendarView({
  mode,
  onSelectDate,
}: {
  mode: 'week' | 'month';
  onSelectDate: (dateStr: string) => void;
}) {
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(false);

  const range = useMemo(() => {
    if (mode === 'month') {
      const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
      return { start: toISO(first), end: toISO(last) };
    }
    const start = startOfWeek(anchor);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: toISO(start), end: toISO(end) };
  }, [mode, anchor]);

  useEffect(() => {
    setLoading(true);
    getBookingsForRange(range.start, range.end).then((data) => {
      setBookings(data);
      setLoading(false);
    });
  }, [range]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>();
    for (const b of bookings) {
      const arr = map.get(b.booking_date) ?? [];
      arr.push(b);
      map.set(b.booking_date, arr);
    }
    return map;
  }, [bookings]);

  function move(dir: number) {
    setAnchor((prev) => {
      const next = new Date(prev);
      if (mode === 'month') next.setMonth(next.getMonth() + dir);
      else next.setDate(next.getDate() + dir * 7);
      return next;
    });
  }

  function label() {
    if (mode === 'month') return `${anchor.getFullYear()}년 ${anchor.getMonth() + 1}월`;
    const start = startOfWeek(anchor);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const sm = start.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    const em = end.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    return `${sm} — ${em}`;
  }

  const todayKey = toISO(new Date());

  const monthDays = useMemo(() => {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
    const offset = first.getDay();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(anchor.getFullYear(), anchor.getMonth(), d));
    return cells;
  }, [anchor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [anchor]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => move(-1)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:border-neutral-900 cursor-pointer">
            <i className="ri-arrow-left-s-line text-lg"></i>
          </button>
          <span className="text-base font-semibold text-neutral-900 min-w-[150px] text-center">{label()}</span>
          <button onClick={() => move(1)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:border-neutral-900 cursor-pointer">
            <i className="ri-arrow-right-s-line text-lg"></i>
          </button>
        </div>
        <button
          onClick={() => setAnchor(new Date())}
          className="px-3 py-1.5 rounded-lg text-sm border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-900 cursor-pointer whitespace-nowrap"
        >
          오늘
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
          불러오는 중...
        </div>
      ) : mode === 'month' ? (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50">
            {WEEKDAYS.map((w, i) => (
              <div key={w} className={`py-2.5 text-center text-xs font-medium ${i === 0 ? 'text-rose-500' : i === 6 ? 'text-sky-600' : 'text-neutral-500'}`}>
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((d, idx) => {
              if (!d) {
                return <div key={`empty-${idx}`} className="min-h-[100px] border-b border-r border-neutral-100 bg-neutral-50/60"></div>;
              }
              const iso = toISO(d);
              const list = byDate.get(iso) ?? [];
              const isToday = iso === todayKey;
              return (
                <div
                  key={iso}
                  onClick={() => onSelectDate(iso)}
                  className="min-h-[100px] border-b border-r border-neutral-100 p-1.5 cursor-pointer hover:bg-neutral-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${isToday ? 'w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center' : 'text-neutral-600'}`}>
                      {d.getDate()}
                    </span>
                    {list.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                        {list.length}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {list.slice(0, 3).map((b) => (
                      <div key={b.id} className="text-[10px] leading-tight truncate rounded bg-emerald-50 text-emerald-800 px-1 py-0.5">
                        {b.slot} {b.name}
                      </div>
                    ))}
                    {list.length > 3 && <div className="text-[10px] text-neutral-400">+{list.length - 3}건</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="grid grid-cols-7">
            {weekDays.map((d) => {
              const iso = toISO(d);
              const list = byDate.get(iso) ?? [];
              const isToday = iso === todayKey;
              const dayColor = d.getDay() === 0 ? 'text-rose-500' : d.getDay() === 6 ? 'text-sky-600' : '';
              return (
                <div key={iso} className="border-r border-neutral-100 last:border-0">
                  <div className={`py-2.5 text-center border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 ${dayColor}`} onClick={() => onSelectDate(iso)}>
                    <div className="text-xs text-neutral-500">{WEEKDAYS[d.getDay()]}</div>
                    <div className={`text-sm font-semibold ${isToday ? 'text-neutral-900' : 'text-neutral-700'}`}>{d.getDate()}</div>
                  </div>
                  <div className="min-h-[300px] p-1.5 space-y-1">
                    {list.length === 0 ? (
                      <div className="text-[11px] text-neutral-300 text-center mt-6">예약 없음</div>
                    ) : (
                      list.map((b) => (
                        <div key={b.id} className="text-[11px] rounded-lg bg-emerald-50 border border-emerald-100 px-1.5 py-1">
                          <div className="font-medium text-emerald-800">{b.slot}</div>
                          <div className="text-neutral-700 truncate">{b.name}</div>
                          <div className="text-neutral-400 truncate">{b.coach_name}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}