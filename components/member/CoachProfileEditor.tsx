'use client';

import { useEffect, useState } from 'react';
import { getCoachOwnInfo, saveCoachOwnInfo } from '@/lib/coachManagement';

export default function CoachProfileEditor({ coachId }: { coachId: string }) {
  const [info, setInfo] = useState({ bio: '', title: '', lesson_content: '', material: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      const own = await getCoachOwnInfo(coachId);
      if (own) {
        setInfo({
          bio: own.bio ?? '',
          title: own.title ?? '',
          lesson_content: own.lesson_content ?? '',
          material: own.material ?? '',
        });
      }
      setLoading(false);
    })();
  }, [coachId]);

  async function save() {
    setSaving(true);
    setMsg('');
    setErr('');
    const { error } = await saveCoachOwnInfo(coachId, {
      bio: info.bio,
      title: info.title,
      lesson_content: info.lesson_content,
      material: info.material,
    });
    setSaving(false);
    if (error) setErr('저장에 실패했습니다.');
    else setMsg('강사 정보가 저장되었습니다.');
  }

  if (loading) {
    return <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-sm text-neutral-500">불러오는 중...</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <h2 className="text-lg font-bold text-neutral-900">강사 소개</h2>
      <p className="text-sm text-neutral-500 mt-1">
        상세 소개, 강의 내용, 교재 정보는 모든 사이트에 동일하게 표시됩니다.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">소개 (상세정보)</label>
          <textarea
            value={info.bio}
            onChange={(e) => setInfo((p) => ({ ...p, bio: e.target.value }))}
            maxLength={500}
            rows={3}
            className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
            placeholder="경력, 전문 분야 등 자기소개를 입력하세요."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">강의 내용</label>
          <textarea
            value={info.lesson_content}
            onChange={(e) => setInfo((p) => ({ ...p, lesson_content: e.target.value }))}
            maxLength={500}
            rows={3}
            className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
            placeholder="수업에서 다루는 내용을 입력하세요."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">교재 (Material)</label>
          <textarea
            value={info.material}
            onChange={(e) => setInfo((p) => ({ ...p, material: e.target.value }))}
            maxLength={500}
            rows={2}
            className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
            placeholder="사용하는 교재 또는 자료를 입력하세요."
          />
        </div>

        {msg && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">{msg}</p>}
        {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{err}</p>}

        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2.5 rounded-full bg-neutral-900 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap cursor-pointer"
        >
          {saving ? '저장 중...' : '강사 정보 저장'}
        </button>
      </div>
    </div>
  );
}