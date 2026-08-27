'use client';

import { useEffect, useState } from 'react';
import {
  getPackageInquiries,
  updateInquiryStatus,
  type PackageInquiry,
} from '@/lib/packageInquiries';

const STATUS_OPTIONS = [
  { value: 'new', label: '신규', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'contacted', label: '연락 완료', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'confirmed', label: '확정', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'closed', label: '종료', color: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
];

const PACKAGE_LABEL: Record<string, string> = {
  tour: '투어 패키지',
  business: '비즈니스 패키지',
  medical: '메디컬 패키지',
};

const PACKAGE_ICON: Record<string, string> = {
  tour: 'ri-earth-line',
  business: 'ri-briefcase-4-line',
  medical: 'ri-heart-pulse-line',
};

export default function PackageInquiriesSection() {
  const [inquiries, setInquiries] = useState<PackageInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'tour' | 'business' | 'medical'>('all');

  async function load() {
    const list = await getPackageInquiries();
    setInquiries(list);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function changeStatus(id: string, status: string) {
    await updateInquiryStatus(id, status);
    setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  }

  const filtered = filter === 'all' ? inquiries : inquiries.filter((i) => i.package_type === filter);

  if (loading) {
    return <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-sm text-neutral-500">불러오는 중...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">패키지 문의</h2>
          <p className="text-sm text-neutral-500 mt-1">
            투어·비즈니스 패키지 견적 문의 내역을 확인하고 진행 상태를 관리하세요.
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-white border border-neutral-200 rounded-full w-fit">
          {[
            { key: 'all', label: '전체' },
            { key: 'tour', label: '투어' },
            { key: 'business', label: '비즈니스' },
            { key: 'medical', label: '메디컬' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition ${
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
          아직 문의 내역이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inq) => {
            const status = STATUS_OPTIONS.find((s) => s.value === inq.status) ?? STATUS_OPTIONS[0];
            return (
              <div key={inq.id} className="bg-white rounded-2xl border border-neutral-200 p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3">
                    <span className="w-9 h-9 flex items-center justify-center rounded-xl bg-neutral-900 text-white shrink-0">
                      <i className={PACKAGE_ICON[inq.package_type] ?? 'ri-earth-line'}></i>
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-neutral-900">{inq.name || '이름 없음'}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-neutral-100 text-neutral-600">
                          {PACKAGE_LABEL[inq.package_type] ?? inq.package_type}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {inq.email || '이메일 없음'}
                        {inq.company ? ` · ${inq.company}` : ''}
                        {inq.country ? ` · ${inq.country}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400 whitespace-nowrap">
                      {new Date(inq.created_at).toLocaleDateString('ko-KR')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {STATUS_OPTIONS.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => changeStatus(inq.id, s.value)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap cursor-pointer transition ${
                            inq.status === s.value ? s.color : 'bg-white text-neutral-400 border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
                  {inq.service_type && (
                    <span className="inline-flex items-center gap-1">
                      <i className="ri-list-check-2"></i> {inq.service_type}
                    </span>
                  )}
                  {inq.arrival_date && (
                    <span className="inline-flex items-center gap-1">
                      <i className="ri-calendar-line"></i> 도착 {inq.arrival_date}
                    </span>
                  )}
                  {inq.departure_date && (
                    <span className="inline-flex items-center gap-1">
                      <i className="ri-calendar-2-line"></i> 출국 {inq.departure_date}
                    </span>
                  )}
                  {inq.duration && (
                    <span className="inline-flex items-center gap-1">
                      <i className="ri-time-line"></i> 체류 {inq.duration}
                    </span>
                  )}
                  {inq.group_size && (
                    <span className="inline-flex items-center gap-1">
                      <i className="ri-group-line"></i> {inq.group_size}명
                    </span>
                  )}
                </div>

                {inq.modules && inq.modules.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {inq.modules.map((m) => (
                      <span key={m} className="px-2 py-0.5 rounded-full text-xs bg-neutral-50 border border-neutral-200 text-neutral-600">
                        {m}
                      </span>
                    ))}
                  </div>
                )}

                {inq.hospitals && inq.hospitals.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-neutral-500 flex items-center gap-1 whitespace-nowrap">
                      <i className="ri-hospital-line"></i> 관심 병원:
                    </span>
                    {inq.hospitals.map((h) => (
                      <span key={h} className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 border border-emerald-200 text-emerald-700">
                        {h}
                      </span>
                    ))}
                  </div>
                )}

                {inq.message && (
                  <p className="mt-3 text-sm text-neutral-700 leading-relaxed bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-200">
                    {inq.message}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}