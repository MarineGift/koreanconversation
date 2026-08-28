import { useEffect, useState } from 'react';
import {
  getOrgContent,
  saveSiteContent,
  DEFAULT_FORWHO,
  DEFAULT_PROGRAM,
  DEFAULT_METHOD,
  DEFAULT_TESTIMONIALS,
  DEFAULT_SIGNUP,
  DEFAULT_FOOTER,
} from '@/lib/siteContent';
import SubpageContentEditor from './SubpageContentEditor';

type FieldType = 'text' | 'textarea';

interface FieldDef {
  key: string;
  label: string;
  type?: FieldType;
}

interface ItemFieldDef {
  key: string;
  label: string;
  type?: FieldType;
  array?: boolean;
}

interface ListDef {
  key: string;
  label: string;
  stringList?: boolean;
  fields?: ItemFieldDef[];
}

interface SectionDef {
  key: string;
  label: string;
  fields: FieldDef[];
  lists: ListDef[];
}

const SECTIONS: SectionDef[] = [
  {
    key: 'forWho',
    label: '대상 소개 (For Who)',
    fields: [
      { key: 'eyebrow', label: '상단 라벨' },
      { key: 'title', label: '제목 (줄바꿈은 엔터)', type: 'textarea' },
      { key: 'subtitle', label: '설명', type: 'textarea' },
    ],
    lists: [
      {
        key: 'items',
        label: '카드 항목',
        fields: [
          { key: 'icon', label: '아이콘 (예: ri-mic-line)' },
          { key: 'title', label: '제목' },
          { key: 'desc', label: '설명', type: 'textarea' },
        ],
      },
    ],
  },
  {
    key: 'program',
    label: '프로그램 (Program)',
    fields: [
      { key: 'eyebrow', label: '상단 라벨' },
      { key: 'title', label: '제목' },
      { key: 'subtitle', label: '설명', type: 'textarea' },
      { key: 'cta', label: '링크 문구' },
    ],
    lists: [
      {
        key: 'items',
        label: '프로그램 카드',
        fields: [
          { key: 'icon', label: '아이콘 (예: ri-chat-3-line)' },
          { key: 'title', label: '제목' },
          { key: 'desc', label: '설명', type: 'textarea' },
          { key: 'points', label: '특징 (한 줄씩)', type: 'textarea', array: true },
        ],
      },
    ],
  },
  {
    key: 'method',
    label: '방식 (Method)',
    fields: [
      { key: 'eyebrow', label: '상단 라벨' },
      { key: 'title', label: '제목 (줄바꿈은 엔터)', type: 'textarea' },
      { key: 'subtitle', label: '설명', type: 'textarea' },
      { key: 'boxTitle', label: '세부 박스 제목' },
      { key: 'image', label: '이미지 URL', type: 'textarea' },
    ],
    lists: [
      {
        key: 'rows',
        label: '방식 3줄 (한국어 / 영어)',
        fields: [
          { key: 'k', label: '한국어' },
          { key: 'v', label: '영어 설명' },
        ],
      },
      { key: 'boxItems', label: '세부 박스 항목', stringList: true },
    ],
  },
  {
    key: 'testimonials',
    label: '수강 후기 (Testimonials)',
    fields: [
      { key: 'eyebrow', label: '상단 라벨' },
      { key: 'title', label: '제목' },
    ],
    lists: [
      {
        key: 'items',
        label: '후기 항목',
        fields: [
          { key: 'name', label: '이름' },
          { key: 'role', label: '직책' },
          { key: 'text', label: '후기 내용', type: 'textarea' },
          { key: 'avatar', label: '프로필 이미지 URL', type: 'textarea' },
        ],
      },
    ],
  },
  {
    key: 'signup',
    label: '가입 유도 (Signup)',
    fields: [
      { key: 'eyebrow', label: '상단 라벨' },
      { key: 'title', label: '제목 (줄바꿈은 엔터)', type: 'textarea' },
      { key: 'subtitle', label: '설명', type: 'textarea' },
    ],
    lists: [{ key: 'bullets', label: '혜택 항목', stringList: true }],
  },
  {
    key: 'footer',
    label: '푸터 소개',
    fields: [{ key: 'description', label: '소개 문구', type: 'textarea' }],
    lists: [],
  },
];

const DEFAULT_MAP: Record<string, { fields: Record<string, string>; lists: Record<string, unknown[]> }> = {
  forWho: {
    fields: { eyebrow: DEFAULT_FORWHO.eyebrow, title: DEFAULT_FORWHO.title, subtitle: DEFAULT_FORWHO.subtitle },
    lists: { items: DEFAULT_FORWHO.items },
  },
  program: {
    fields: { eyebrow: DEFAULT_PROGRAM.eyebrow, title: DEFAULT_PROGRAM.title, subtitle: DEFAULT_PROGRAM.subtitle, cta: DEFAULT_PROGRAM.cta },
    lists: { items: DEFAULT_PROGRAM.items },
  },
  method: {
    fields: {
      eyebrow: DEFAULT_METHOD.eyebrow,
      title: DEFAULT_METHOD.title,
      subtitle: DEFAULT_METHOD.subtitle,
      boxTitle: DEFAULT_METHOD.boxTitle,
      image: DEFAULT_METHOD.image,
    },
    lists: { rows: DEFAULT_METHOD.rows, boxItems: DEFAULT_METHOD.boxItems },
  },
  testimonials: {
    fields: { eyebrow: DEFAULT_TESTIMONIALS.eyebrow, title: DEFAULT_TESTIMONIALS.title },
    lists: { items: DEFAULT_TESTIMONIALS.items },
  },
  signup: {
    fields: { eyebrow: DEFAULT_SIGNUP.eyebrow, title: DEFAULT_SIGNUP.title, subtitle: DEFAULT_SIGNUP.subtitle },
    lists: { bullets: DEFAULT_SIGNUP.bullets },
  },
  footer: {
    fields: { description: DEFAULT_FOOTER.description },
    lists: {},
  },
};

const BUSINESS_FIELDS: FieldDef[] = [
  { key: 'hero_badge', label: 'Hero 배지', type: 'text' },
  { key: 'hero_title', label: 'Hero 제목', type: 'textarea' },
  { key: 'hero_subtitle', label: 'Hero 설명', type: 'textarea' },
  { key: 'modules_eyebrow', label: 'Modules 상단 라벨', type: 'text' },
  { key: 'modules_title', label: 'Modules 제목', type: 'text' },
  { key: 'modules_subtitle', label: 'Modules 설명', type: 'textarea' },
  { key: 'journey_eyebrow', label: 'Journey 상단 라벨', type: 'text' },
  { key: 'journey_title', label: 'Journey 제목', type: 'textarea' },
  { key: 'journey_subtitle', label: 'Journey 설명', type: 'textarea' },
  { key: 'pricing_eyebrow', label: 'Pricing 상단 라벨', type: 'text' },
  { key: 'pricing_title', label: 'Pricing 제목', type: 'text' },
  { key: 'pricing_subtitle', label: 'Pricing 설명', type: 'textarea' },
  { key: 'inquiry_eyebrow', label: 'Inquiry 상단 라벨', type: 'text' },
  { key: 'inquiry_title', label: 'Inquiry 제목', type: 'text' },
  { key: 'inquiry_subtitle', label: 'Inquiry 설명', type: 'textarea' },
  { key: 'faq_title', label: 'FAQ 제목', type: 'text' },
];

const TOUR_FIELDS: FieldDef[] = [
  { key: 'hero_badge', label: 'Hero 배지', type: 'text' },
  { key: 'hero_title', label: 'Hero 제목', type: 'textarea' },
  { key: 'hero_subtitle', label: 'Hero 설명', type: 'textarea' },
  { key: 'services_eyebrow', label: 'Services 상단 라벨', type: 'text' },
  { key: 'services_title', label: 'Services 제목', type: 'text' },
  { key: 'services_subtitle', label: 'Services 설명', type: 'textarea' },
  { key: 'packages_eyebrow', label: 'Packages 상단 라벨', type: 'text' },
  { key: 'packages_title', label: 'Packages 제목', type: 'text' },
  { key: 'packages_subtitle', label: 'Packages 설명', type: 'textarea' },
  { key: 'process_eyebrow', label: 'Process 상단 라벨', type: 'text' },
  { key: 'process_title', label: 'Process 제목', type: 'text' },
  { key: 'process_subtitle', label: 'Process 설명', type: 'textarea' },
  { key: 'inquiry_eyebrow', label: 'Inquiry 상단 라벨', type: 'text' },
  { key: 'inquiry_title', label: 'Inquiry 제목', type: 'text' },
  { key: 'inquiry_subtitle', label: 'Inquiry 설명', type: 'textarea' },
  { key: 'faq_title', label: 'FAQ 제목', type: 'text' },
];

const MEDICAL_FIELDS: FieldDef[] = [
  { key: 'hero_badge', label: 'Hero 배지', type: 'text' },
  { key: 'hero_title', label: 'Hero 제목', type: 'textarea' },
  { key: 'hero_subtitle', label: 'Hero 설명', type: 'textarea' },
  { key: 'why_eyebrow', label: 'Why Korea 상단 라벨', type: 'text' },
  { key: 'why_title', label: 'Why Korea 제목', type: 'text' },
  { key: 'why_subtitle', label: 'Why Korea 설명', type: 'textarea' },
  { key: 'treatments_eyebrow', label: 'Treatments 상단 라벨', type: 'text' },
  { key: 'treatments_title', label: 'Treatments 제목', type: 'text' },
  { key: 'treatments_subtitle', label: 'Treatments 설명', type: 'textarea' },
  { key: 'hospitals_eyebrow', label: 'Hospitals 상단 라벨', type: 'text' },
  { key: 'hospitals_title', label: 'Hospitals 제목', type: 'text' },
  { key: 'hospitals_subtitle', label: 'Hospitals 설명', type: 'textarea' },
  { key: 'pricing_eyebrow', label: 'Pricing 상단 라벨', type: 'text' },
  { key: 'pricing_title', label: 'Pricing 제목', type: 'text' },
  { key: 'pricing_subtitle', label: 'Pricing 설명', type: 'textarea' },
  { key: 'inquiry_eyebrow', label: 'Inquiry 상단 라벨', type: 'text' },
  { key: 'inquiry_title', label: 'Inquiry 제목', type: 'text' },
  { key: 'inquiry_subtitle', label: 'Inquiry 설명', type: 'textarea' },
  { key: 'faq_title', label: 'FAQ 제목', type: 'text' },
  { key: 'success_eyebrow', label: 'Success Stories 상단 라벨', type: 'text' },
  { key: 'success_title', label: 'Success Stories 제목', type: 'text' },
  { key: 'success_subtitle', label: 'Success Stories 설명', type: 'textarea' },
];

const PACKAGES_FIELDS: FieldDef[] = [
  { key: 'hero_badge', label: 'Hero 배지', type: 'text' },
  { key: 'hero_title', label: 'Hero 제목', type: 'text' },
  { key: 'hero_subtitle', label: 'Hero 설명', type: 'textarea' },
  { key: 'cards_eyebrow', label: 'Cards 상단 라벨', type: 'text' },
  { key: 'cards_title', label: 'Cards 제목', type: 'text' },
  { key: 'cards_subtitle', label: 'Cards 설명', type: 'textarea' },
  { key: 'comparison_title', label: 'Comparison 제목', type: 'text' },
];

const HEADER_FIELDS: FieldDef[] = [
  { key: 'coaching_label', label: 'Coaching 메뉴 라벨', type: 'text' },
  { key: 'packages_label', label: 'Packages 메뉴 라벨', type: 'text' },
  { key: 'coaching_links', label: 'Coaching 드롭다운 항목 (JSON)', type: 'textarea' },
  { key: 'package_links', label: 'Packages 드롭다운 항목 (JSON)', type: 'textarea' },
  { key: 'show_free_button', label: '무료 코칭 버튼 표시 (true/false)', type: 'text' },
  { key: 'show_book_button', label: '예약 버튼 표시 (true/false)', type: 'text' },
  { key: 'show_signin', label: '로그인 버튼 표시 (true/false)', type: 'text' },
];

type Item = Record<string, string | string[]>;
type SectionData = { fields: Record<string, string>; lists: Record<string, Item[]> };

function parseList(value: string | undefined): unknown[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeList(list: ListDef, raw: unknown[]): Item[] {
  if (list.stringList) {
    return raw.map((r) => ({ value: String(r ?? '') }));
  }
  return raw.map((r) => {
    const obj = r as Record<string, unknown>;
    const item: Item = {};
    for (const f of list.fields ?? []) {
      const v = obj[f.key];
      item[f.key] = Array.isArray(v) ? v.join('\n') : (v == null ? '' : String(v));
    }
    return item;
  });
}

export default function SiteContentExtended({ orgId }: { orgId: string }) {
  const [tab, setTab] = useState<'main' | 'business' | 'tour' | 'medical' | 'packages' | 'header'>('main');
  const [data, setData] = useState<Record<string, SectionData>>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!orgId) return;
    let mounted = true;
    getOrgContent(orgId).then((map) => {
      if (!mounted) return;
      const next: Record<string, SectionData> = {};
      for (const sec of SECTIONS) {
        const dflt = DEFAULT_MAP[sec.key] ?? { fields: {}, lists: {} };
        const fields: Record<string, string> = {};
        for (const f of sec.fields) fields[f.key] = map[`${sec.key}:${f.key}`] ?? dflt.fields[f.key] ?? '';

        const lists: Record<string, Item[]> = {};
        for (const l of sec.lists) {
          const hasSaved = map[`${sec.key}:${l.key}`] !== undefined;
          const source = hasSaved ? parseList(map[`${sec.key}:${l.key}`]) : (dflt.lists[l.key] ?? []);
          lists[l.key] = normalizeList(l, source);
        }
        next[sec.key] = { fields, lists };
      }
      setData(next);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [orgId]);

  function setField(sec: string, key: string, value: string) {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [sec]: { ...prev[sec], fields: { ...prev[sec].fields, [key]: value } },
      };
    });
  }

  function setListItem(sec: string, listKey: string, idx: number, field: string, value: string) {
    setData((prev) => {
      if (!prev) return prev;
      const list = [...prev[sec].lists[listKey]];
      const item = { ...list[idx] } as Item;
      item[field] = value;
      list[idx] = item;
      return { ...prev, [sec]: { ...prev[sec], lists: { ...prev[sec].lists, [listKey]: list } } };
    });
  }

  function addItem(sec: string, listKey: string, def: ListDef) {
    const empty: Item = def.stringList
      ? { value: '' }
      : Object.fromEntries((def.fields ?? []).map((f) => [f.key, f.array ? [] : '']));
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [sec]: { ...prev[sec], lists: { ...prev[sec].lists, [listKey]: [...prev[sec].lists[listKey], empty] } },
      };
    });
  }

  function removeItem(sec: string, listKey: string, idx: number) {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [sec]: { ...prev[sec], lists: { ...prev[sec].lists, [listKey]: prev[sec].lists[listKey].filter((_, i) => i !== idx) } },
      };
    });
  }

  async function saveMain() {
    if (!data) return;
    setSaving(true);
    setMsg('');
    let failed = false;
    for (const sec of SECTIONS) {
      const d = data[sec.key];
      if (!d) continue;
      for (const f of sec.fields) {
        const { error } = await saveSiteContent(orgId, sec.key, f.key, d.fields[f.key] ?? '');
        if (error) failed = true;
      }
      for (const l of sec.lists) {
        const items = d.lists[l.key] ?? [];
        const cleaned = items.map((it) => {
          if (l.stringList) return String(it.value ?? '');
          const obj: Record<string, unknown> = {};
          for (const f of l.fields ?? []) {
            const v = it[f.key];
            obj[f.key] = f.array ? String(v ?? '').split('\n').filter((x) => x.trim()) : v ?? '';
          }
          return obj;
        });
        const { error } = await saveSiteContent(orgId, sec.key, l.key, JSON.stringify(cleaned));
        if (error) failed = true;
      }
    }
    setSaving(false);
    setMsg(failed ? '저장 중 일부 오류가 발생했습니다.' : '모든 섹션 문구가 저장되었습니다.');
  }

  if (loading || !data) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
        불러오는 중...
      </div>
    );
  }

  const content = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h4 className="font-bold text-neutral-900">사이트 콘텐츠 관리</h4>
          <p className="text-sm text-neutral-500 mt-0.5">메인 화면, 서브 페이지, 헤더 메뉴 문구를 사이트별로 설정합니다.</p>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 bg-white border border-neutral-200 rounded-full w-fit">
        {([
          { key: 'main', label: '메인 화면' },
          { key: 'business', label: '비즈니스' },
          { key: 'tour', label: '투어' },
          { key: 'medical', label: '메디컬' },
          { key: 'packages', label: '패키지' },
          { key: 'header', label: '헤더 메뉴' },
        ] as { key: typeof tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition ${
              tab === t.key ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'main' && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h4 className="font-bold text-neutral-900">메인 화면 전체 문구</h4>
              <p className="text-sm text-neutral-500 mt-0.5">대상 소개·프로그램·방식·후기·가입·푸터 문구를 사이트별로 설정합니다. 저장 전까지는 기본 문구가 그대로 보입니다.</p>
            </div>
            <button
              onClick={saveMain}
              disabled={saving}
              className="px-4 py-2 text-sm bg-neutral-900 text-white rounded-lg hover:opacity-90 whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              {saving ? '저장 중...' : '전체 저장'}
            </button>
          </div>

          {msg && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">{msg}</p>}

          {SECTIONS.map((sec) => {
            const d = content[sec.key];
            if (!d) return null;
            return (
              <div key={sec.key} className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-5">
                <h5 className="font-bold text-neutral-900 text-base">{sec.label}</h5>

                {sec.fields.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {sec.fields.map((f) => (
                      <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">{f.label}</label>
                        {f.type === 'textarea' ? (
                          <textarea
                            value={d.fields[f.key] ?? ''}
                            onChange={(e) => setField(sec.key, f.key, e.target.value)}
                            rows={3}
                            maxLength={1000}
                            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 resize-none"
                          />
                        ) : (
                          <input
                            type="text"
                            value={d.fields[f.key] ?? ''}
                            onChange={(e) => setField(sec.key, f.key, e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {sec.lists.map((list) => (
                  <div key={list.key} className="pt-4 border-t border-neutral-100">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-neutral-700">{list.label}</label>
                      <button
                        onClick={() => addItem(sec.key, list.key, list)}
                        className="inline-flex items-center gap-1 text-sm text-neutral-600 font-medium hover:underline cursor-pointer"
                      >
                        <i className="ri-add-line"></i> 추가
                      </button>
                    </div>
                    <div className="space-y-3">
                      {d.lists[list.key].map((item, idx) => (
                        <div key={idx} className="rounded-xl border border-neutral-200 p-3 bg-neutral-50/50">
                          {list.stringList ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={String(item.value ?? '')}
                                onChange={(e) => setListItem(sec.key, list.key, idx, 'value', e.target.value)}
                                className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
                              />
                              <button
                                onClick={() => removeItem(sec.key, list.key, idx)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 cursor-pointer shrink-0"
                              >
                                <i className="ri-close-line"></i>
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {(list.fields ?? []).map((f) => {
                                const val = item[f.key];
                                const display = Array.isArray(val) ? val.join('\n') : (val ?? '');
                                return (
                                  <div key={f.key}>
                                    <label className="block text-xs font-medium text-neutral-500 mb-1">{f.label}</label>
                                    {f.type === 'textarea' ? (
                                      <textarea
                                        value={display}
                                        onChange={(e) => setListItem(sec.key, list.key, idx, f.key, e.target.value)}
                                        rows={f.array ? 3 : 2}
                                        maxLength={1000}
                                        className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 resize-none"
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        value={display}
                                        onChange={(e) => setListItem(sec.key, list.key, idx, f.key, e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
                                      />
                                    )}
                                  </div>
                                );
                              })}
                              <div className="flex justify-end">
                                <button
                                  onClick={() => removeItem(sec.key, list.key, idx)}
                                  className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-red-600 cursor-pointer"
                                >
                                  <i className="ri-delete-bin-line"></i> 삭제
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </>
      )}

      {tab === 'business' && (
        <SubpageContentEditor orgId={orgId} section="business" fields={BUSINESS_FIELDS} title="비즈니스 페이지 문구" />
      )}
      {tab === 'tour' && (
        <SubpageContentEditor orgId={orgId} section="tour" fields={TOUR_FIELDS} title="투어 페이지 문구" />
      )}
      {tab === 'medical' && (
        <SubpageContentEditor orgId={orgId} section="medical" fields={MEDICAL_FIELDS} title="메디컬 페이지 문구" />
      )}
      {tab === 'packages' && (
        <SubpageContentEditor orgId={orgId} section="packages" fields={PACKAGES_FIELDS} title="패키지 비교 페이지 문구" />
      )}
      {tab === 'header' && (
        <SubpageContentEditor orgId={orgId} section="header" fields={HEADER_FIELDS} title="헤더 메뉴 설정" />
      )}
    </div>
  );
}
