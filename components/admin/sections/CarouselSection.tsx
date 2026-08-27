'use client';

import { useEffect, useState } from 'react';
import {
  getAllCarouselSlides,
  addCarouselSlide,
  updateCarouselSlide,
  deleteCarouselSlide,
  getCarouselSettings,
  updateCarouselSettings,
  type CarouselSlide,
  type CarouselSlideInput,
  type SlideType,
  type AnimationStyle,
  type StatItem,
} from '@/lib/carousel';
import { fetchOrganizations, type Organization } from '@/lib/organizationManagement';

const TYPE_LABEL: Record<SlideType, string> = {
  image: '이미지',
  hangul: '한글 조합',
  stats: '통계',
  testimonial: '수강 후기',
};

const EMPTY: CarouselSlideInput = {
  title: '',
  subtitle: '',
  description: '',
  badge: '',
  image_url: '',
  cta_text: '',
  cta_link: '',
  sort_order: 0,
  is_active: true,
  slide_type: 'image',
  stats: [],
};

export default function CarouselSection() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [animation, setAnimation] = useState<AnimationStyle>('fade');
  const [editing, setEditing] = useState<CarouselSlide | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CarouselSlideInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function load(orgId: string | null = selectedId) {
    const [s, a] = await Promise.all([getAllCarouselSlides(orgId), getCarouselSettings(orgId)]);
    setSlides(s);
    setAnimation(a);
    setLoading(false);
  }

  useEffect(() => {
    fetchOrganizations().then((orgs) => {
      setOrganizations(orgs);
      load(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function changeAnimation(a: AnimationStyle) {
    setAnimation(a);
    await updateCarouselSettings(selectedId, a);
    setMsg('전환 애니메이션을 저장했습니다.');
  }

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY, sort_order: slides.length });
    setShowForm(true);
    setMsg('');
    setErr('');
  }

  function openEdit(s: CarouselSlide) {
    setEditing(s);
    setForm({
      title: s.title,
      subtitle: s.subtitle ?? '',
      description: s.description ?? '',
      badge: s.badge ?? '',
      image_url: s.image_url ?? '',
      cta_text: s.cta_text ?? '',
      cta_link: s.cta_link ?? '',
      sort_order: s.sort_order,
      is_active: s.is_active,
      slide_type: (s.slide_type || 'image') as SlideType,
      stats: s.stats ?? [],
    });
    setShowForm(true);
    setMsg('');
    setErr('');
  }

  async function save() {
    if (!form.title.trim()) {
      setErr('제목을 입력해 주세요.');
      return;
    }
    setSaving(true);
    setErr('');
    setMsg('');
    const payload: CarouselSlideInput = {
      title: form.title.trim(),
      subtitle: form.subtitle?.trim() || null,
      description: form.description?.trim() || null,
      badge: form.badge?.trim() || null,
      image_url: form.image_url?.trim() || null,
      cta_text: form.cta_text?.trim() || null,
      cta_link: form.cta_link?.trim() || null,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
      slide_type: form.slide_type,
      stats: form.slide_type === 'stats' ? form.stats : null,
      organization_id: selectedId,
    };
    const res = editing
      ? await updateCarouselSlide(editing.id, payload)
      : await addCarouselSlide(payload);
    setSaving(false);
    if (res.error) {
      setErr('저장에 실패했습니다.');
    } else {
      setShowForm(false);
      setMsg('저장되었습니다.');
      await load();
    }
  }

  async function remove(id: string) {
    if (!confirm('이 슬라이드를 삭제할까요?')) return;
    const res = await deleteCarouselSlide(id);
    if (!res.error) await load();
  }

  async function toggle(s: CarouselSlide) {
    await updateCarouselSlide(s.id, { ...s, is_active: !s.is_active });
    await load();
  }

  async function move(s: CarouselSlide, dir: -1 | 1) {
    const idx = slides.findIndex((x) => x.id === s.id);
    const target = slides[idx + dir];
    if (!target) return;
    await updateCarouselSlide(s.id, { ...s, sort_order: target.sort_order });
    await updateCarouselSlide(target.id, { ...target, sort_order: s.sort_order });
    await load();
  }

  if (loading) {
    return <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-sm text-neutral-500">불러오는 중...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-neutral-200 p-4">
        <div className="text-sm font-semibold text-neutral-900">사이트 선택</div>
        <p className="text-xs text-neutral-500 mt-0.5">선택한 사이트에만 노출되는 캐러셀을 관리합니다. 공통(기본)은 아직 개별 설정을 안 한 사이트에 적용됩니다.</p>
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setSelectedId(null); load(null); }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition border ${
              selectedId === null ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
            }`}
          >
            공통 (기본)
          </button>
          {organizations.map((org) => (
            <button
              key={org.id}
              onClick={() => { setSelectedId(org.id); load(org.id); }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition border ${
                selectedId === org.id ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
              }`}
            >
              {org.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">메인 캐러셀 관리</h2>
          <p className="text-sm text-neutral-500 mt-1">
            메인 화면 상단에 순환되는 홍보 슬라이드를 추가·수정·삭제할 수 있습니다.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 bg-neutral-900 text-white px-4 py-2.5 rounded-full text-sm font-medium hover:opacity-90 whitespace-nowrap cursor-pointer"
        >
          <span className="w-4 h-4 flex items-center justify-center"><i className="ri-add-line"></i></span>
          슬라이드 추가
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-sm font-semibold text-neutral-900">전환 애니메이션</div>
          <div className="text-xs text-neutral-500 mt-0.5">슬라이드가 넘어갈 때의 효과를 선택하세요.</div>
        </div>
        <div className="inline-flex items-center rounded-full bg-neutral-100 p-1">
          <button
            onClick={() => changeAnimation('fade')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap cursor-pointer ${
              animation === 'fade' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            페이드
          </button>
          <button
            onClick={() => changeAnimation('slide')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap cursor-pointer ${
              animation === 'slide' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            슬라이드
          </button>
        </div>
      </div>

      {msg && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">{msg}</p>}
      {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{err}</p>}

      <div className="space-y-3">
        {slides.length === 0 && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-sm text-neutral-500 text-center">
            등록된 슬라이드가 없습니다. 오른쪽 위 버튼으로 추가하세요.
          </div>
        )}
        {slides.map((s, i) => (
          <div key={s.id} className="bg-white rounded-2xl border border-neutral-200 p-4 flex items-center gap-4">
            <div className="w-28 h-16 rounded-lg overflow-hidden shrink-0 bg-neutral-100 border border-neutral-200">
              {s.image_url ? (
                <img src={s.image_url} alt={s.title} className="w-full h-full object-cover object-top" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400"><i className="ri-image-line text-2xl"></i></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
                  {s.is_active ? '노출 중' : '숨김'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  {TYPE_LABEL[(s.slide_type || 'image') as SlideType] || '이미지'}
                </span>
                {s.badge && <span className="text-xs text-neutral-400 truncate">{s.badge}</span>}
              </div>
              <div className="mt-1 font-semibold text-neutral-900 truncate">{s.title}</div>
              {s.description && <div className="mt-0.5 text-sm text-neutral-500 truncate">{s.description}</div>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => move(s, -1)}
                disabled={i === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"
                title="위로 이동"
              >
                <i className="ri-arrow-up-line"></i>
              </button>
              <button
                onClick={() => move(s, 1)}
                disabled={i === slides.length - 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"
                title="아래로 이동"
              >
                <i className="ri-arrow-down-line"></i>
              </button>
              <button
                onClick={() => toggle(s)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 cursor-pointer"
                title={s.is_active ? '숨기기' : '노출'}
              >
                <i className={s.is_active ? 'ri-eye-line' : 'ri-eye-off-line'}></i>
              </button>
              <button
                onClick={() => openEdit(s)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 cursor-pointer"
                title="수정"
              >
                <i className="ri-edit-line"></i>
              </button>
              <button
                onClick={() => remove(s.id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                title="삭제"
              >
                <i className="ri-delete-bin-line"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <h3 className="font-bold text-neutral-900">{editing ? '슬라이드 수정' : '슬라이드 추가'}</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 cursor-pointer">
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700">슬라이드 유형</label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {(Object.keys(TYPE_LABEL) as SlideType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm((p) => ({ ...p, slide_type: t }))}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition whitespace-nowrap cursor-pointer ${
                        form.slide_type === t
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-300 text-neutral-600 hover:border-neutral-400'
                      }`}
                    >
                      {TYPE_LABEL[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">제목 *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder={form.slide_type === 'testimonial' ? '예: 미팅에서 자신 있게 말할 수 있었어요.' : '예: Speak Korean the way natives feel it.'}
                />
              </div>

              {form.slide_type === 'testimonial' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700">후기 내용</label>
                  <textarea
                    value={form.description ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    maxLength={500}
                    rows={3}
                    className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
                    placeholder="수강생의 상세 후기"
                  />
                </div>
              )}

              {form.slide_type === 'stats' ? (
                <StatsEditor
                  stats={form.stats ?? []}
                  onChange={(stats) => setForm((p) => ({ ...p, stats }))}
                />
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">부제목</label>
                    <input
                      value={form.subtitle ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
                      className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      placeholder={form.slide_type === 'testimonial' ? '예: Sarah Kim' : '예: Premium 1:1 Korean coaching'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">설명</label>
                    <textarea
                      value={form.description ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      maxLength={500}
                      rows={3}
                      className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
                      placeholder="슬라이드 설명 문구"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700">배지</label>
                <input
                  value={form.badge ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, badge: e.target.value }))}
                  className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder={form.slide_type === 'testimonial' ? '예: 글로벌 마케팅 매니저' : '예: Premium 1:1 Korean · For Professionals'}
                />
              </div>

              {form.slide_type === 'image' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700">이미지 URL</label>
                  <input
                    value={form.image_url ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                    className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    placeholder="https://..."
                  />
                  {form.image_url && (
                    <img src={form.image_url} alt="미리보기" className="mt-2 w-full h-28 rounded-lg object-cover object-top border border-neutral-200" />
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700">버튼 문구</label>
                  <input
                    value={form.cta_text ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, cta_text: e.target.value }))}
                    className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    placeholder="예: Claim Free 10-min Coaching"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">버튼 링크</label>
                  <input
                    value={form.cta_link ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, cta_link: e.target.value }))}
                    className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    placeholder="/free 또는 #program"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700">순서</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
                    className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <label className="flex items-center gap-2 pt-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-neutral-700">노출</span>
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-neutral-200">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-full text-sm font-medium text-neutral-600 hover:bg-neutral-100 whitespace-nowrap cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-5 py-2.5 rounded-full bg-neutral-900 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsEditor({ stats, onChange }: { stats: StatItem[]; onChange: (s: StatItem[]) => void }) {
  function update(i: number, field: keyof StatItem, value: string) {
    const next = stats.map((s, idx) => (idx === i ? { ...s, [field]: value } : s));
    onChange(next);
  }

  function add() {
    onChange([...stats, { label: '', value: '' }]);
  }

  function remove(i: number) {
    onChange(stats.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700">통계 항목</label>
      <div className="mt-1.5 space-y-2">
        {stats.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={s.value}
              onChange={(e) => update(i, 'value', e.target.value)}
              className="w-28 text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              placeholder="1,200+"
            />
            <input
              value={s.label}
              onChange={(e) => update(i, 'label', e.target.value)}
              className="flex-1 text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              placeholder="누적 수강생"
            />
            <button
              onClick={() => remove(i)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 cursor-pointer shrink-0"
            >
              <i className="ri-close-line"></i>
            </button>
          </div>
        ))}
        <button
          onClick={add}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-600 font-medium hover:underline cursor-pointer"
        >
          <i className="ri-add-line"></i> 통계 항목 추가
        </button>
      </div>
    </div>
  );
}