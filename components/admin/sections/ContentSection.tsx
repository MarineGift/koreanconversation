'use client';

import { useEffect, useState } from 'react';
import type { Organization } from '@/lib/organizationManagement';
import { fetchOrganizations } from '@/lib/organizationManagement';
import { getOrgContent, saveSiteContent } from '@/lib/siteContent';
import FaqEditor from './FaqEditor';
import SiteContentExtended from './SiteContentExtended';

const HERO_FIELDS = [
  { key: 'badge', label: '배지 문구', placeholder: 'Premium 1:1 Korean · For Professionals' },
  { key: 'title', label: '제목 (앞부분)', placeholder: 'Speak Korean' },
  { key: 'accent', label: '제목 (강조 부분)', placeholder: 'the way natives feel it.' },
  { key: 'subtitle', label: '설명 문구', placeholder: '한 줄 소개 문구', textarea: true },
];

const PRICING_FIELDS = [
  { key: 'title', label: '가격 페이지 제목', placeholder: 'Pricing' },
  { key: 'subtitle', label: '가격 페이지 설명', placeholder: '설명 문구', textarea: true },
];

const PADDLE_FIELDS = [
  { key: 'single_session', label: '싱글 세션 Paddle 상품 ID', placeholder: 'prd_xxxx (1회 세션) — 비우면 공통 상품 사용' },
  { key: 'package', label: '패키지 Paddle 상품 ID', placeholder: 'prd_xxxx (10회 패키지) — 비우면 공통 상품 사용' },
  { key: 'special', label: '스페셜 Paddle 상품 ID', placeholder: 'prd_xxxx (이벤트) — 비우면 공통 상품 사용' },
];

export default function ContentSection() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [hero, setHero] = useState<Record<string, string>>({});
  const [pricing, setPricing] = useState<Record<string, string>>({});
  const [paddle, setPaddle] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchOrganizations().then((orgs) => {
      setOrganizations(orgs);
      if (orgs.length > 0) {
        setSelectedId(orgs[0].id);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let mounted = true;
    getOrgContent(selectedId).then((map) => {
      if (!mounted) return;
      const h: Record<string, string> = {};
      const p: Record<string, string> = {};
      const pd: Record<string, string> = {};
      for (const [k, v] of Object.entries(map)) {
        if (k.startsWith('hero:')) h[k.slice(5)] = v;
        else if (k.startsWith('pricing:')) p[k.slice(8)] = v;
        else if (k.startsWith('paddle:')) pd[k.slice(7)] = v;
      }
      setHero(h);
      setPricing(p);
      setPaddle(pd);
    });
    return () => {
      mounted = false;
    };
  }, [selectedId]);

  function setField(section: 'hero' | 'pricing' | 'paddle', key: string, value: string) {
    const setter = section === 'hero' ? setHero : section === 'pricing' ? setPricing : setPaddle;
    setter((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setMessage('');
    let failed = false;
    for (const f of HERO_FIELDS) {
      const { error } = await saveSiteContent(selectedId, 'hero', f.key, hero[f.key] ?? '');
      if (error) failed = true;
    }
    for (const f of PRICING_FIELDS) {
      const { error } = await saveSiteContent(selectedId, 'pricing', f.key, pricing[f.key] ?? '');
      if (error) failed = true;
    }
    for (const f of PADDLE_FIELDS) {
      const { error } = await saveSiteContent(selectedId, 'paddle', f.key, paddle[f.key] ?? '');
      if (error) failed = true;
    }
    setSaving(false);
    setMessage(failed ? '저장 중 오류가 발생했습니다.' : '히어로 및 가격 문구가 저장되었습니다.');
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-neutral-200 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-neutral-900">사이트 콘텐츠 관리</h3>
            <p className="text-sm text-neutral-500 mt-0.5">사이트를 선택하고 히어로·가격·FAQ 문구를 각각 다르게 설정하세요.</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {organizations.map((org) => (
            <button
              key={org.id}
              onClick={() => {
                setSelectedId(org.id);
                setMessage('');
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition border ${
                selectedId === org.id
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
              }`}
            >
              {org.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
          <h4 className="font-bold text-neutral-900">히어로 (첫 화면)</h4>
          {HERO_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">{f.label}</label>
              {f.textarea ? (
                <textarea
                  value={hero[f.key] ?? ''}
                  onChange={(e) => setField('hero', f.key, e.target.value)}
                  placeholder={f.placeholder}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={hero[f.key] ?? ''}
                  onChange={(e) => setField('hero', f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
          <h4 className="font-bold text-neutral-900">가격 페이지</h4>
          {PRICING_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">{f.label}</label>
              {f.textarea ? (
                <textarea
                  value={pricing[f.key] ?? ''}
                  onChange={(e) => setField('pricing', f.key, e.target.value)}
                  placeholder={f.placeholder}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={pricing[f.key] ?? ''}
                  onChange={(e) => setField('pricing', f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
              )}
            </div>
          ))}
          <div className="flex items-center justify-end gap-3 pt-1">
            {message && <span className="text-sm text-emerald-600">{message}</span>}
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-2 text-sm bg-neutral-900 text-white rounded-lg hover:opacity-90 whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              {saving ? '저장 중...' : '히어로·가격 저장'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
        <div>
          <h4 className="font-bold text-neutral-900">Paddle 상품 (사이트별 가격 분리)</h4>
          <p className="text-sm text-neutral-500 mt-1">
            각 사이트마다 다른 Paddle 상품 ID를 넣으면, 해당 사이트의 실제 결제 금액($)이 달라집니다.
            Paddle 대시보드에서 가격이 다른 상품을 따로 만든 뒤 그 ID를 여기에 붙여넣으세요.
            비워두면 공통 상품(기본값)으로 결제됩니다.
          </p>
        </div>
        {PADDLE_FIELDS.map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">{f.label}</label>
            <input
              type="text"
              value={paddle[f.key] ?? ''}
              onChange={(e) => setField('paddle', f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 font-mono"
            />
          </div>
        ))}
        <div className="flex items-center justify-end gap-3 pt-1">
          {message && <span className="text-sm text-emerald-600">{message}</span>}
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm bg-neutral-900 text-white rounded-lg hover:opacity-90 whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            {saving ? '저장 중...' : 'Paddle 상품 저장'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h4 className="font-bold text-neutral-900 mb-4">FAQ</h4>
        <FaqEditor orgId={selectedId} />
      </div>

      <SiteContentExtended orgId={selectedId} />
    </div>
  );
}