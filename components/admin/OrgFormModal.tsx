'use client';

import { useEffect, useState } from 'react';
import type { Organization } from '@/lib/organizationManagement';
import { createOrganization, updateOrganization, slugify } from '@/lib/organizationManagement';

const PRESET_COLORS = [
  '#171717',
  '#E11D48',
  '#2563EB',
  '#16A34A',
  '#F59E0B',
  '#7C3AED',
  '#0891B2',
  '#EA580C',
];

export default function OrgFormModal({
  org,
  onClose,
  onSaved,
}: {
  org: Organization | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!org;
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [tagline, setTagline] = useState('');
  const [logoText, setLogoText] = useState('logo');
  const [accentColor, setAccentColor] = useState('#171717');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [coachType, setCoachType] = useState('');
  const [coachRoleLabel, setCoachRoleLabel] = useState('');
  const [coachAppTitle, setCoachAppTitle] = useState('');
  const [coachAppIntro, setCoachAppIntro] = useState('');
  const [coachAppEnabled, setCoachAppEnabled] = useState(true);

  useEffect(() => {
    if (org) {
      setName(org.name);
      setSlug(org.slug);
      setSlugTouched(true);
      setTagline(org.tagline ?? '');
      setLogoText(org.logo_text || 'logo');
      setAccentColor(org.accent_color || '#171717');
      setWebsiteUrl(org.website_url || '');
      setCoachType(org.coach_type ?? '');
      setCoachRoleLabel(org.coach_role_label ?? '');
      setCoachAppTitle(org.coach_application_title ?? '');
      setCoachAppIntro(org.coach_application_intro ?? '');
      setCoachAppEnabled(org.coach_application_enabled !== false);
    } else {
      setName('');
      setSlug('');
      setSlugTouched(false);
      setTagline('');
      setLogoText('logo');
      setAccentColor('#171717');
      setWebsiteUrl('');
      setCoachType('');
      setCoachRoleLabel('');
      setCoachAppTitle('');
      setCoachAppIntro('');
      setCoachAppEnabled(true);
    }
    setError('');
  }, [org]);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('사이트 이름을 입력해 주세요.');
      return;
    }
    if (!slug.trim()) {
      setError('식별자(slug)를 입력해 주세요.');
      return;
    }
    const finalSlug = slugify(slug);
    if (!finalSlug) {
      setError('식별자는 영문, 숫자, 하이픈(-)만 사용할 수 있습니다.');
      return;
    }

    setSaving(true);
    setError('');
    const input = {
      name: name.trim(),
      slug: finalSlug,
      tagline: tagline.trim(),
      logo_text: logoText.trim(),
      accent_color: accentColor,
      website_url: websiteUrl.trim(),
      coach_type: coachType,
      coach_role_label: coachRoleLabel.trim(),
      coach_application_title: coachAppTitle.trim(),
      coach_application_intro: coachAppIntro.trim(),
      coach_application_enabled: coachAppEnabled,
    };
    const result = isEdit ? await updateOrganization(org!.id, input) : await createOrganization(input);
    setSaving(false);
    if (result.error) {
      setError('저장에 실패했습니다. 식별자가 중복되지 않았는지 확인해 주세요.');
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
            <h3 className="font-bold text-neutral-900">{isEdit ? '사이트 수정' : '새 사이트 추가'}</h3>
            <p className="text-sm text-neutral-500 mt-0.5">사이트 정보를 입력하세요.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 cursor-pointer">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">사이트 이름 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="예: Korean Speaking Coach"
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">식별자 (slug) *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              placeholder="예: korean-speaking-coach"
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 font-mono"
            />
            <p className="text-xs text-neutral-400 mt-1">영문, 숫자, 하이픈(-)만 사용 가능합니다. 도메인 배포 시 이 값이 사용됩니다.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">한줄 소개 (tagline)</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="예: Speak Korean with confidence"
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">웹사이트 주소</label>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="예: koreancoaching.com"
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">로고 텍스트</label>
            <input
              type="text"
              value={logoText}
              onChange={(e) => setLogoText(e.target.value)}
              placeholder="logo"
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">브랜드 색상</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setAccentColor(color)}
                  className="w-8 h-8 rounded-full border-2 cursor-pointer flex items-center justify-center"
                  style={{
                    backgroundColor: color,
                    borderColor: accentColor === color ? '#171717' : 'transparent',
                  }}
                >
                  {accentColor === color && <i className="ri-check-line text-white text-sm"></i>}
                </button>
              ))}
              <div className="flex items-center gap-2 ml-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-neutral-200 cursor-pointer p-0.5"
                />
                <span className="text-sm font-mono text-neutral-600">{accentColor}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200">
            <h4 className="text-sm font-semibold text-neutral-800">코치 모집 설정</h4>
            <p className="text-xs text-neutral-500 mt-1">코치 지원서 페이지의 문구와 유형을 설정합니다.</p>

            <div className="mt-3">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">코치 유형</label>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { value: 'education', label: '교육 강사' },
                  { value: 'community', label: '커뮤니티 호스트' },
                  { value: 'business', label: '비즈니스 코치' },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setCoachType(t.value)}
                    className={`px-3.5 py-1.5 rounded-full text-sm border whitespace-nowrap cursor-pointer transition ${
                      coachType === t.value
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">코치 호칭</label>
              <input
                type="text"
                value={coachRoleLabel}
                onChange={(e) => setCoachRoleLabel(e.target.value)}
                placeholder="예: 한국어 강사"
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
              />
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">지원서 제목</label>
              <input
                type="text"
                value={coachAppTitle}
                onChange={(e) => setCoachAppTitle(e.target.value)}
                placeholder="예: 한국어 강사로 함께해요"
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
              />
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">지원서 소개 문구</label>
              <textarea
                value={coachAppIntro}
                onChange={(e) => setCoachAppIntro(e.target.value)}
                maxLength={300}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 resize-none"
                placeholder="어떤 코치를 모집하는지 설명해 주세요."
              />
            </div>

            <label className="mt-3 flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={coachAppEnabled}
                onChange={(e) => setCoachAppEnabled(e.target.checked)}
                className="w-4 h-4 accent-neutral-900 cursor-pointer"
              />
              <span className="text-sm text-neutral-700">코치 모집 활성화</span>
            </label>
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
              {saving ? '저장 중...' : isEdit ? '저장' : '추가'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}