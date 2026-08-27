'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { dayLabel, type CoachSchedule, type ScheduleFormData } from '@/lib/coachSchedule';

interface Coach {
  id: string;
  name: string;
  photo: string | null;
  sites: string[];
}

const DAYS = [
  { value: 0, label: '일요일' },
  { value: 1, label: '월요일' },
  { value: 2, label: '화요일' },
  { value: 3, label: '수요일' },
  { value: 4, label: '목요일' },
  { value: 5, label: '금요일' },
  { value: 6, label: '토요일' },
];

const DEFAULT_FORM: ScheduleFormData = {
  day_of_week: 1,
  start_time: '09:00',
  end_time: '12:00',
  interval_minutes: 40,
  session_minutes: 30,
  schedule_type: 'regular',
  is_active: true,
};

export default function CoachScheduleManager() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<CoachSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleFormData>(DEFAULT_FORM);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    (async () => {
      const [coachesRes, orgsRes, sitesRes] = await Promise.all([
        supabase.from('coaches').select('id, name, photo').order('name', { ascending: true }),
        supabase.from('organizations').select('id, name'),
        supabase.from('coach_sites').select('coach_id, organization_id'),
      ]);

      const orgMap = new Map((orgsRes.data ?? []).map((o) => [o.id, o.name as string]));
      const siteMap = new Map<string, string[]>();
      for (const s of sitesRes.data ?? []) {
        const arr = siteMap.get(s.coach_id) ?? [];
        const name = orgMap.get(s.organization_id);
        if (name) arr.push(name);
        siteMap.set(s.coach_id, arr);
      }

      const list = ((coachesRes.data ?? []) as Coach[]).map((c) => ({
        ...c,
        sites: siteMap.get(c.id) ?? [],
      }));
      setCoaches(list);
      if (list.length > 0) setSelectedCoachId(list[0].id);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedCoachId) return;
    loadSchedules(selectedCoachId);
  }, [selectedCoachId]);

  async function loadSchedules(coachId: string) {
    const { data } = await supabase
      .from('coach_schedules')
      .select('*')
      .eq('coach_id', coachId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });
    setSchedules((data ?? []) as CoachSchedule[]);
  }

  function openAdd() {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setErrorMsg('');
    setModalOpen(true);
  }

  function openEdit(sch: CoachSchedule) {
    setEditingId(sch.id);
    setForm({
      day_of_week: sch.day_of_week,
      start_time: sch.start_time,
      end_time: sch.end_time,
      interval_minutes: sch.interval_minutes,
      session_minutes: sch.session_minutes,
      schedule_type: sch.schedule_type,
      is_active: sch.is_active,
    });
    setErrorMsg('');
    setModalOpen(true);
  }

  async function onSave() {
    if (!selectedCoachId) return;
    setSaving(true);
    setErrorMsg('');

    const startMin = timeToMinutes(form.start_time);
    const endMin = timeToMinutes(form.end_time);
    if (endMin <= startMin) {
      setErrorMsg('종료 시간은 시작 시간보다 늦어야 합니다.');
      setSaving(false);
      return;
    }

    if (editingId) {
      const { error } = await supabase.from('coach_schedules').update(form).eq('id', editingId);
      if (error) setErrorMsg(error.message || '수정 실패');
    } else {
      const { error } = await supabase.from('coach_schedules').insert([{ coach_id: selectedCoachId, ...form }]);
      if (error) setErrorMsg(error.message || '추가 실패');
    }

    await loadSchedules(selectedCoachId);
    setSaving(false);
    if (!errorMsg) setModalOpen(false);
  }

  async function onDelete(id: string) {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('coach_schedules').delete().eq('id', id);
    if (error) {
      setErrorMsg(error.message || '삭제 실패');
      return;
    }
    if (selectedCoachId) await loadSchedules(selectedCoachId);
  }

  async function setDefaults() {
    if (!selectedCoachId) return;
    if (!confirm('기본 일정을 생성하시겠습니까? (월-토 08:00-12:00, 20:00-24:00 / 무료체험 13:00-18:00)')) return;
    setSaving(true);
    const defaults = [
      { day_of_week: 1, start_time: '08:00', end_time: '12:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
      { day_of_week: 1, start_time: '20:00', end_time: '24:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
      { day_of_week: 2, start_time: '08:00', end_time: '12:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
      { day_of_week: 2, start_time: '20:00', end_time: '24:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
      { day_of_week: 3, start_time: '08:00', end_time: '12:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
      { day_of_week: 3, start_time: '20:00', end_time: '24:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
      { day_of_week: 4, start_time: '08:00', end_time: '12:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
      { day_of_week: 4, start_time: '20:00', end_time: '24:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
      { day_of_week: 5, start_time: '08:00', end_time: '12:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
      { day_of_week: 5, start_time: '20:00', end_time: '24:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
      { day_of_week: 6, start_time: '08:00', end_time: '12:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
      { day_of_week: 6, start_time: '20:00', end_time: '24:00', interval_minutes: 40, session_minutes: 30, schedule_type: 'regular', is_active: true },
      { day_of_week: 1, start_time: '13:00', end_time: '18:00', interval_minutes: 15, session_minutes: 10, schedule_type: 'free', is_active: true },
      { day_of_week: 2, start_time: '13:00', end_time: '18:00', interval_minutes: 15, session_minutes: 10, schedule_type: 'free', is_active: true },
      { day_of_week: 3, start_time: '13:00', end_time: '18:00', interval_minutes: 15, session_minutes: 10, schedule_type: 'free', is_active: true },
      { day_of_week: 4, start_time: '13:00', end_time: '18:00', interval_minutes: 15, session_minutes: 10, schedule_type: 'free', is_active: true },
      { day_of_week: 5, start_time: '13:00', end_time: '18:00', interval_minutes: 15, session_minutes: 10, schedule_type: 'free', is_active: true },
      { day_of_week: 6, start_time: '13:00', end_time: '18:00', interval_minutes: 15, session_minutes: 10, schedule_type: 'free', is_active: true },
    ];
    await supabase.from('coach_schedules').insert(defaults.map((d) => ({ coach_id: selectedCoachId, ...d })));
    await loadSchedules(selectedCoachId);
    setSaving(false);
  }

  const grouped = schedules.reduce<Record<number, CoachSchedule[]>>((acc, s) => {
    if (!acc[s.day_of_week]) acc[s.day_of_week] = [];
    acc[s.day_of_week].push(s);
    return acc;
  }, {});

  const selectedCoach = coaches.find((c) => c.id === selectedCoachId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-neutral-500">
          강사별 강의 가능 일정을 관리합니다. 예약 화면에는 등록된 일정 기준으로만 슬롯이 노출됩니다.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
          불러오는 중...
        </div>
      ) : coaches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
          등록된 강사가 없습니다. 먼저 강사를 등록하세요.
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
            {coaches.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCoachId(c.id)}
                className={`shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl border text-left cursor-pointer transition ${
                  c.id === selectedCoachId
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 bg-white hover:border-neutral-400'
                }`}
              >
                {c.photo ? (
                  <img src={c.photo} alt={c.name} className="w-9 h-9 rounded-full object-cover object-top" />
                ) : (
                  <span className="w-9 h-9 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-semibold text-neutral-600">
                    {c.name.charAt(0)}
                  </span>
                )}
                <span className="text-sm font-medium whitespace-nowrap">{c.name}</span>
              </button>
            ))}
          </div>

          {selectedCoach && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  {selectedCoach.photo ? (
                    <img src={selectedCoach.photo} alt={selectedCoach.name} className="w-10 h-10 rounded-full object-cover object-top" />
                  ) : (
                    <span className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-semibold text-neutral-600">
                      {selectedCoach.name.charAt(0)}
                    </span>
                  )}
                  <span className="font-semibold text-neutral-900">{selectedCoach.name}</span>
                  {selectedCoach.sites.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCoach.sites.map((site) => (
                        <span key={site} className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 whitespace-nowrap">
                          {site}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={setDefaults}
                    disabled={saving}
                    className="px-3 py-2 rounded-xl border border-neutral-300 text-sm text-neutral-700 hover:border-neutral-900 cursor-pointer transition whitespace-nowrap"
                  >
                    기본 일정 생성
                  </button>
                  <button
                    onClick={openAdd}
                    disabled={saving}
                    className="px-3 py-2 rounded-xl bg-neutral-900 text-white text-sm hover:bg-neutral-800 cursor-pointer transition whitespace-nowrap"
                  >
                    + 일정 추가
                  </button>
                </div>
              </div>

              {schedules.length === 0 ? (
                <div className="text-center text-sm text-neutral-500 py-10">
                  등록된 일정이 없습니다. 기본 일정을 생성하거나 직접 추가하세요.
                </div>
              ) : (
                <div className="space-y-4">
                  {DAYS.map((d) => {
                    const list = grouped[d.value] ?? [];
                    if (list.length === 0) return null;
                    return (
                      <div key={d.value}>
                        <div className="text-xs uppercase tracking-widest text-neutral-500 mb-2">{d.label}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {list.map((sch) => (
                            <div
                              key={sch.id}
                              className={`p-4 rounded-xl border text-sm ${
                                sch.is_active ? 'border-neutral-200 bg-white' : 'border-neutral-200 bg-neutral-50 opacity-60'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-neutral-900">
                                  {sch.start_time} — {sch.end_time}
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => openEdit(sch)}
                                    className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center hover:border-neutral-900 cursor-pointer transition"
                                  >
                                    <span className="w-4 h-4 flex items-center justify-center"><i className="ri-pencil-line text-neutral-600"></i></span>
                                  </button>
                                  <button
                                    onClick={() => onDelete(sch.id)}
                                    className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center hover:border-rose-400 hover:text-rose-500 cursor-pointer transition"
                                  >
                                    <span className="w-4 h-4 flex items-center justify-center"><i className="ri-delete-bin-line text-neutral-600"></i></span>
                                  </button>
                                </div>
                              </div>
                              <div className="mt-1 text-xs text-neutral-500">
                                {sch.session_minutes}분 세션 / {sch.interval_minutes}분 간격 · {sch.schedule_type === 'free' ? '무료체험' : '유료'}
                                {!sch.is_active && ' · 비활성'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {modalOpen && selectedCoachId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">
                {editingId ? '일정 수정' : '일정 추가'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center hover:border-neutral-900 cursor-pointer transition"
              >
                <span className="w-4 h-4 flex items-center justify-center"><i className="ri-close-line text-neutral-600"></i></span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-neutral-500">요일</label>
                <div className="mt-2 flex gap-1 flex-wrap">
                  {DAYS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setForm((f) => ({ ...f, day_of_week: d.value }))}
                      className={`px-3 py-2 rounded-lg border text-sm cursor-pointer transition ${
                        form.day_of_week === d.value
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-300 hover:border-neutral-900'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-neutral-500">시작 시간</label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                    className="mt-2 w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-sm focus:border-neutral-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-neutral-500">종료 시간</label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                    className="mt-2 w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-sm focus:border-neutral-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-neutral-500">세션 길이 (분)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={form.session_minutes}
                    onChange={(e) => setForm((f) => ({ ...f, session_minutes: Number(e.target.value) }))}
                    className="mt-2 w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-sm focus:border-neutral-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-neutral-500">간격 (분)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={form.interval_minutes}
                    onChange={(e) => setForm((f) => ({ ...f, interval_minutes: Number(e.target.value) }))}
                    className="mt-2 w-full px-3 py-2.5 rounded-xl border border-neutral-300 text-sm focus:border-neutral-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-neutral-500">일정 유형</label>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setForm((f) => ({ ...f, schedule_type: 'regular' }))}
                    className={`px-4 py-2 rounded-lg border text-sm cursor-pointer transition ${
                      form.schedule_type === 'regular'
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-300 hover:border-neutral-900'
                    }`}
                  >
                    유료 세션
                  </button>
                  <button
                    onClick={() => setForm((f) => ({ ...f, schedule_type: 'free' }))}
                    className={`px-4 py-2 rounded-lg border text-sm cursor-pointer transition ${
                      form.schedule_type === 'free'
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-300 hover:border-neutral-900'
                    }`}
                  >
                    무료 체험
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                  className={`w-10 h-6 rounded-full transition cursor-pointer ${form.is_active ? 'bg-neutral-900' : 'bg-neutral-300'}`}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm text-neutral-700">{form.is_active ? '활성' : '비활성'}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="mt-4 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                {errorMsg}
              </div>
            )}

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-neutral-300 text-sm text-neutral-700 hover:border-neutral-900 cursor-pointer transition"
              >
                취소
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="flex-1 px-4 py-3 rounded-xl bg-neutral-900 text-white text-sm hover:bg-neutral-800 cursor-pointer transition disabled:opacity-60"
              >
                {saving ? '저장 중...' : (editingId ? '저장' : '추가')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}