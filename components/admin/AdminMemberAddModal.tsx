'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { upsertMember } from '@/lib/member';

interface OrgOption {
  id: string;
  name: string;
}

export default function AdminMemberAddModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [nationality, setNationality] = useState('');
  const [studyPurpose, setStudyPurpose] = useState('');
  const [orgId, setOrgId] = useState('');

  useEffect(() => {
    supabase.from('organizations').select('id, name').order('name').then(({ data }) => {
      setOrgs(data ?? []);
      if (data && data.length > 0) setOrgId(data[0].id);
    });
  }, []);

  async function submit() {
    if (!email.trim()) {
      setMsg('이메일을 입력해주세요.');
      return;
    }
    setLoading(true);
    setMsg('');

    const { error } = await upsertMember({
      email: email.trim().toLowerCase(),
      full_name: fullName.trim() || null,
      nationality: nationality.trim() || null,
      study_purpose: studyPurpose.trim() || null,
      organization_id: orgId || null,
      inputter: 'admin',
    });

    setLoading(false);
    if (error) {
      setMsg(error);
      return;
    }

    onDone();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-neutral-900">회원 등록</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 cursor-pointer">
            <i className="ri-close-line"></i>
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">이메일 (ID)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              placeholder="member@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">이름</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              placeholder="홍길동"
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
          <div>
            <label className="block text-sm font-medium text-neutral-700">수강 목적</label>
            <input
              value={studyPurpose}
              onChange={(e) => setStudyPurpose(e.target.value)}
              className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              placeholder="예: 비즈니스 회화, TOPIK 준비"
            />
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
              disabled={loading || !email.trim()}
              className="px-5 py-2.5 rounded-full bg-neutral-900 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              {loading ? '저장 중...' : '회원 등록'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}