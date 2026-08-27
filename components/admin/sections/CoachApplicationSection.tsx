'use client';

import { useEffect, useState } from 'react';
import {
  fetchCoachApplications,
  updateCoachApplicationStatus,
  convertApplicationToCoach,
  COACH_TYPE_CONFIG,
  type CoachApplicationRecord,
} from '@/lib/coachApplication';

const STATUS_OPTIONS = [
  { value: 'pending', label: '대기', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'contacted', label: '연락 완료', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'approved', label: '승인', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'rejected', label: '거절', color: 'bg-red-50 text-red-600 border-red-200' },
];

const TYPE_LABEL: Record<string, string> = {
  education: '교육 강사',
  community: '커뮤니티 호스트',
  business: '비즈니스 코치',
};

export default function CoachApplicationSection() {
  const [apps, setApps] = useState<CoachApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'contacted' | 'approved' | 'rejected'>('all');
  const [converting, setConverting] = useState<string | null>(null);

  async function load() {
    const list = await fetchCoachApplications();
    setApps(list);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function changeStatus(id: string, status: string) {
    await updateCoachApplicationStatus(id, status);
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  async function convertToCoach(id: string) {
    setConverting(id);
    const { error } = await convertApplicationToCoach(id);
    setConverting(null);
    if (!error) await load();
  }

  const filtered = filter === 'all' ? apps : apps.filter((a) => a.status === filter);

  if (loading) {
    return <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-sm text-neutral-500">불러오는 중...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">코치 지원서</h2>
          <p className="text-sm text-neutral-500 mt-1">
            사이트별로 접수된 코치 지원서를 확인하고 진행 상태를 관리하세요.
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-white border border-neutral-200 rounded-full w-fit">
          {[
            { key: 'all', label: '전체' },
            { key: 'pending', label: '대기' },
            { key: 'contacted', label: '연락 완료' },
            { key: 'approved', label: '승인' },
            { key: 'rejected', label: '거절' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition ${
                filter === f.key ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-sm text-neutral-500 text-center">
          아직 접수된 지원서가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const status = STATUS_OPTIONS.find((s) => s.value === a.status) ?? STATUS_OPTIONS[0];
            const typeQuestions = a.coach_type ? COACH_TYPE_CONFIG[a.coach_type as keyof typeof COACH_TYPE_CONFIG]?.questions ?? [] : [];
            return (
              <div key={a.id} className="bg-white rounded-2xl border border-neutral-200 p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3">
                    <span className="w-9 h-9 flex items-center justify-center rounded-xl bg-neutral-900 text-white shrink-0">
                      <i className="ri-user-star-line"></i>
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-neutral-900">{a.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-neutral-100 text-neutral-600">
                          {a.site_name}
                        </span>
                        {a.coach_type && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-neutral-900 text-white">
                            {TYPE_LABEL[a.coach_type] ?? a.coach_type}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {a.email}
                        {a.phone ? ` · ${a.phone}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400 whitespace-nowrap">
                      {new Date(a.created_at).toLocaleDateString('ko-KR')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {STATUS_OPTIONS.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => changeStatus(a.id, s.value)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap cursor-pointer transition ${
                            a.status === s.value ? s.color : 'bg-white text-neutral-400 border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                      {a.status !== 'approved' && (
                        <button
                          onClick={() => convertToCoach(a.id)}
                          disabled={converting === a.id}
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap cursor-pointer transition"
                        >
                          {converting === a.id ? '등록 중...' : '코치로 등록'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {a.experience && (
                  <p className="mt-3 text-sm text-neutral-700 leading-relaxed bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-200">
                    {a.experience}
                  </p>
                )}

                {a.answers && Object.keys(a.answers).length > 0 && (
                  <div className="mt-3 grid sm:grid-cols-2 gap-2">
                    {typeQuestions
                      .filter((q) => a.answers?.[q.key])
                      .map((q) => (
                        <div key={q.key} className="flex items-start gap-2 text-sm bg-white border border-neutral-200 rounded-xl px-3 py-2.5">
                          <span className="text-neutral-400 shrink-0 mt-0.5">
                            <i className="ri-question-line"></i>
                          </span>
                          <div>
                            <div className="text-xs text-neutral-500">{q.label}</div>
                            <div className="text-neutral-800 font-medium">{a.answers?.[q.key]}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}