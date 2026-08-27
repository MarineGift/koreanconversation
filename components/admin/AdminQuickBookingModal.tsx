'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getOrgId } from '@/lib/org';
import { upsertMember } from '@/lib/member';

interface CoachOption {
  id: string;
  name: string;
}

interface OrgOption {
  id: string;
  name: string;
  website_url: string | null;
}

const SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
];

export default function AdminQuickBookingModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [coaches, setCoaches] = useState<CoachOption[]>([]);
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const [coachId, setCoachId] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [slot, setSlot] = useState('10:00');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nationality, setNationality] = useState('');
  const [studyPurpose, setStudyPurpose] = useState('');
  const [sessionType, setSessionType] = useState<'free' | 'single' | 'package'>('single');
  const [orgId, setOrgId] = useState('');
  const [status, setStatus] = useState<'pending' | 'confirmed'>('confirmed');

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: o }] = await Promise.all([
        supabase.from('coaches').select('id, name').order('name'),
        supabase.from('organizations').select('id, name, website_url').order('name'),
      ]);
      setCoaches(c ?? []);
      setOrgs(o ?? []);
      if (c && c.length > 0) setCoachId(c[0].id);
      if (o && o.length > 0) setOrgId(o[0].id);
    })();
  }, []);

  async function submit() {
    if (!coachId || !date || !slot || !name.trim() || !email.trim()) {
      setMsg('필수 항목을 모두 입력해주세요.');
      return;
    }
    setLoading(true);
    setMsg('');

    const finalOrgId = orgId || (await getOrgId());

    const bookingId = crypto.randomUUID();
    const { error: bookingError } = await supabase.from('bookings').insert([{
      id: bookingId,
      coach_id: coachId,
      organization_id: finalOrgId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      nationality: nationality || null,
      booking_date: date,
      slot,
      session_type: sessionType,
      status,
      site_url: orgs.find((o) => o.id === finalOrgId)?.website_url ?? null,
    }]);

    if (bookingError) {
      setLoading(false);
      setMsg(bookingError.message || '예약 저장에 실패했습니다.');
      return;
    }

    await upsertMember({
      email: email.trim().toLowerCase(),
      full_name: name.trim(),
      nationality: nationality || null,
      study_purpose: studyPurpose || null,
      organization_id: finalOrgId || null,
      inputter: 'admin',
    });

    setLoading(false);
    onDone();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-neutral-900">예약 추가</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 cursor-pointer">
            <i className="ri-close-line"></i>
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700">강사</label>
              <select
                value={coachId}
                onChange={(e) => setCoachId(e.target.value)}
                className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white pr-8"
              >
                {coaches.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">사이트</label>
              <select
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white pr-8"
              >
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700">날짜</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">시간</label>
              <select
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white pr-8"
              >
                {SLOTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">수업 유형</label>
            <div className="mt-1 flex gap-2 flex-wrap">
              {[
                { key: 'free', label: '무료 체험' },
                { key: 'single', label: '1회 수업' },
                { key: 'package', label: '10회 패키지' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setSessionType(t.key as any)}
                  className={`px-3 py-2 rounded-lg text-xs border cursor-pointer whitespace-nowrap transition ${
                    sessionType === t.key
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700">예약 상태</label>
            <div className="mt-1 flex gap-2 flex-wrap">
              {[
                { key: 'pending', label: '대기 (코치 확정 필요)' },
                { key: 'confirmed', label: '바로 확정' },
              ].map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStatus(s.key as any)}
                  className={`px-3 py-2 rounded-lg text-xs border cursor-pointer whitespace-nowrap transition ${
                    status === s.key
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-900'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700">수강생 이름</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="member@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700">국적</label>
                <input
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="예: 대한민국"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">수강 목적</label>
                <input
                  value={studyPurpose}
                  onChange={(e) => setStudyPurpose(e.target.value)}
                  className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="예: 비즈니스 회화"
                />
              </div>
            </div>
          </div>

          {msg && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{msg}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-sm font-medium text-neutral-600 hover:bg-neutral-100 whitespace-nowrap cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={submit}
              disabled={loading || !coachId || !name.trim() || !email.trim()}
              className="px-5 py-2.5 rounded-full bg-neutral-900 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              {loading ? '저장 중...' : '예약 저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}