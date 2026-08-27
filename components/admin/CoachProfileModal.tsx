'use client';

import { useEffect, useState } from 'react';
import type { CoachProfile, CoachOrg } from '@/lib/coachManagement';
import { saveCoachProfile } from '@/lib/coachManagement';

function arrToText(arr: string[]): string {
  return (arr ?? []).join('\n');
}

function textToArr(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function CoachProfileModal({
  coachId,
  coachName,
  org,
  profile,
  onClose,
  onSaved,
}: {
  coachId: string;
  coachName: string;
  org: CoachOrg | null;
  profile: CoachProfile | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [credentials, setCredentials] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setHeadline(profile?.headline ?? '');
    setBio(profile?.bio ?? '');
    setSpecialties(arrToText(profile?.specialties ?? []));
    setCredentials(arrToText(profile?.credentials ?? []));
    setError('');
  }, [profile]);

  if (!org) return null;

  async function handleSave() {
    if (bio.trim().length > 2000) {
      setError('이력은 2000자 이내로 입력해 주세요.');
      return;
    }
    setSaving(true);
    setError('');
    const { error: err } = await saveCoachProfile(coachId, org!.id, {
      headline: headline.trim(),
      bio: bio.trim(),
      specialties: textToArr(specialties),
      credentials: textToArr(credentials),
    });
    setSaving(false);
    if (err) {
      setError('저장에 실패했습니다. 다시 시도해 주세요.');
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl w-full max-w-xl max-h-[88vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-neutral-900">{coachName} 이력 편집</h3>
            <p className="text-sm text-neutral-500 mt-0.5">{org.name} 사이트 전용</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 cursor-pointer">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">한줄 소개 (headline)</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="예: Executive & Business Korean Coach"
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">상세 이력</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder="이 사이트에서 보여줄 강사의 전문성과 경험을 작성하세요."
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 resize-y"
            />
            <div className="text-xs text-neutral-400 text-right mt-1">{bio.length}/2000</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">전문 분야 (한 줄에 하나씩)</label>
            <textarea
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              rows={4}
              placeholder={'Business Korean\nPresentation & Meeting Coaching'}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 resize-y font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">자격 및 경력 (한 줄에 하나씩)</label>
            <textarea
              value={credentials}
              onChange={(e) => setCredentials(e.target.value)}
              rows={4}
              placeholder={'B.A. English Education\nM.A. English Literature'}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 resize-y font-mono"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="px-4 py-2 text-sm text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 whitespace-nowrap cursor-pointer">
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-neutral-900 text-white rounded-lg hover:opacity-90 whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}