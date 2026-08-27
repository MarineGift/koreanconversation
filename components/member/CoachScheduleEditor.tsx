'use client';

import { useEffect, useState } from 'react';
import { getCoachSites } from '@/lib/coachManagement';
import {
  getCoachSchedules,
  addCoachSchedule,
  deleteCoachSchedule,
  dayLabel,
  type CoachSchedule,
} from '@/lib/coachSchedule';

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function CoachScheduleEditor({ coachId }: { coachId: string }) {
  const [schedules, setSchedules] = useState<CoachSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState(1);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('12:00');
  const [type, setType] = useState<'regular' | 'free'>('regular');
  const [adding, setAdding] = useState(false);
  const [sites, setSites] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [scheduleOrgId, setScheduleOrgId] = useState<string>('');

  useEffect(() => {
    (async () => {
      const [sch, mySites] = await Promise.all([getCoachSchedules(coachId), getCoachSites(coachId)]);
      setSchedules(sch);
      setSites(mySites);
      setScheduleOrgId((prev) => prev || mySites[0]?.id || '');
      setLoading(false);
    })();
  }, [coachId]);

  async function addSchedule() {
    if (!start || !end) return;
    setAdding(true);
    const created = await addCoachSchedule(coachId, {
      day_of_week: day,
      start_time: start,
      end_time: end,
      interval_minutes: type === 'free' ? 15 : 40,
      session_minutes: type === 'free' ? 10 : 30,
      schedule_type: type,
      is_active: true,
      organization_id: scheduleOrgId || null,
    });
    setAdding(false);
    if (created) {
      setSchedules((prev) =>
        [...prev, created].sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))
      );
      setStart('09:00');
      setEnd('12:00');
    }
  }

  async function removeSchedule(id: string) {
    const ok = await deleteCoachSchedule(id);
    if (ok) setSchedules((prev) => prev.filter((s) => s.id !== id));
  }

  if (loading) {
    return <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-sm text-neutral-500">불러오는 중...</div>;
  }

  const grouped = DAYS.map((d) => ({
    day: d,
    items: schedules.filter((s) => s.day_of_week === d),
  }));

  const siteMap = new Map(sites.map((s) => [s.id, s.name]));

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <h2 className="text-lg font-bold text-neutral-900">코칭 일정 관리</h2>
      <p className="text-sm text-neutral-500 mt-1">
        강의하고 싶은 요일과 시간만 입력하세요. 일정을 비워두면 기본으로 전체 요일이 가능합니다.
      </p>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-neutral-200 p-4">
          <h3 className="text-sm font-semibold text-neutral-900">일정 추가</h3>
          <div className="mt-3">
            <label className="text-xs text-neutral-500">요일</label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDay(d)}
                  className={`px-3 py-2 rounded-full text-sm border cursor-pointer whitespace-nowrap transition ${
                    day === d
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-900'
                  }`}
                >
                  {dayLabel(d)}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-500">시작</label>
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="mt-1 w-full text-sm px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500">종료</label>
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="mt-1 w-full text-sm px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="text-xs text-neutral-500">수업 유형</label>
            <div className="mt-1.5 flex gap-1.5">
              <button
                type="button"
                onClick={() => setType('regular')}
                className={`px-3 py-2 rounded-full text-sm border cursor-pointer whitespace-nowrap transition ${
                  type === 'regular'
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-900'
                }`}
              >
                정규 수업
              </button>
              <button
                type="button"
                onClick={() => setType('free')}
                className={`px-3 py-2 rounded-full text-sm border cursor-pointer whitespace-nowrap transition ${
                  type === 'free'
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-900'
                }`}
              >
                무료 체험
              </button>
            </div>
          </div>
          <div className="mt-3">
            <label className="text-xs text-neutral-500">사이트</label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setScheduleOrgId('')}
                className={`px-3 py-2 rounded-full text-sm border cursor-pointer whitespace-nowrap transition ${
                  scheduleOrgId === ''
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-900'
                }`}
              >
                전체 사이트
              </button>
              {sites.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScheduleOrgId(s.id)}
                  className={`px-3 py-2 rounded-full text-sm border cursor-pointer whitespace-nowrap transition ${
                    scheduleOrgId === s.id
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-900'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={addSchedule}
            disabled={adding}
            className="mt-4 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            {adding ? '추가 중...' : '+ 일정 추가'}
          </button>
        </div>

        <div className="rounded-xl border border-neutral-200 p-4">
          <h3 className="text-sm font-semibold text-neutral-900">현재 일정</h3>
          {schedules.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">등록된 일정이 없어 기본으로 전체 요일이 가능합니다.</p>
          ) : (
            <div className="mt-3 space-y-3 max-h-80 overflow-y-auto pr-1">
              {grouped.map((g) =>
                g.items.length === 0 ? null : (
                  <div key={g.day}>
                    <div className="text-xs font-semibold text-neutral-500">{dayLabel(g.day)}요일</div>
                    <div className="mt-1 space-y-1.5">
                      {g.items.map((s) => (
                        <div key={s.id} className="flex items-center justify-between gap-2 bg-neutral-50 rounded-lg px-3 py-2">
                          <div className="text-sm text-neutral-700 whitespace-nowrap">
                            {s.start_time} ~ {s.end_time}
                            <span className="ml-2 text-xs text-neutral-400">
                              {s.schedule_type === 'free' ? '무료 체험' : '정규 수업'}
                            </span>
                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                              {s.organization_id ? siteMap.get(s.organization_id) ?? '기타' : '전체 사이트'}
                            </span>
                          </div>
                          <button
                            onClick={() => removeSchedule(s.id)}
                            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            title="삭제"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}