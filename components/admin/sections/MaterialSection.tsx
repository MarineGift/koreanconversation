'use client';

import { useEffect, useState } from 'react';
import { getMaterials, addMaterial, deleteMaterial, type DashboardMaterial } from '@/lib/dashboard';

const CATEGORIES = ['문법', '회화', '발음', '비즈니스', '시험'];

export default function MaterialSection({ accent }: { accent: string }) {
  const [materials, setMaterials] = useState<DashboardMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('문법');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setMaterials(await getMaterials());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    await addMaterial({ title: title.trim(), category, description: description.trim() });
    setBusy(false);
    setTitle('');
    setDescription('');
    setShowForm(false);
    await load();
  }

  async function remove(id: string) {
    await deleteMaterial(id);
    await load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold text-neutral-900">교육교재</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white whitespace-nowrap cursor-pointer hover:opacity-90"
          style={{ backgroundColor: accent }}
        >
          <span className="w-4 h-4 flex items-center justify-center"><i className="ri-add-line"></i></span>
          교재 추가
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
              placeholder="교재 제목"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700">카테고리</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-full text-sm border cursor-pointer whitespace-nowrap ${
                      category === c ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-900'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              className="mt-1 w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
              rows={2}
              placeholder="교재 설명"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-full text-sm font-medium text-white whitespace-nowrap cursor-pointer hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: accent }}
          >
            {busy ? '저장 중...' : '저장'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
          불러오는 중...
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
          등록된 교재가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {materials.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0" style={{ backgroundColor: `${accent}1a`, color: accent }}>
                  <i className="ri-file-text-line text-xl"></i>
                </div>
                <button
                  onClick={() => remove(m.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 cursor-pointer shrink-0"
                  title="삭제"
                >
                  <i className="ri-delete-bin-line text-sm"></i>
                </button>
              </div>
              <div className="mt-3 font-semibold text-neutral-900">{m.title}</div>
              <div className="mt-1.5">
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                  {m.category ?? '기타'}
                </span>
              </div>
              <p className="mt-2 text-sm text-neutral-500 leading-relaxed">{m.description ?? '—'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}