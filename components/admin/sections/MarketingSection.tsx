'use client';

import { useEffect, useState } from 'react';
import {
  getMarketingSequences,
  addMarketingSequence,
  updateMarketingSequence,
  deleteMarketingSequence,
  getMarketingTargets,
  runMarketingSequence,
  type MarketingSequence,
  type MarketingTarget,
  type SequenceInput,
} from '@/lib/marketing';

const EMPTY: SequenceInput = {
  subject: '',
  body: '',
  day_offset: 0,
  sort_order: 0,
  is_active: true,
};

function formatDate(d: string) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function MarketingSection() {
  const [sequences, setSequences] = useState<MarketingSequence[]>([]);
  const [targets, setTargets] = useState<MarketingTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MarketingSequence | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SequenceInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [showTargets, setShowTargets] = useState(false);

  async function load() {
    const [s, t] = await Promise.all([getMarketingSequences(), getMarketingTargets()]);
    setSequences(s);
    setTargets(t);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY, sort_order: sequences.length });
    setShowForm(true);
    setMsg('');
    setErr('');
  }

  function openEdit(s: MarketingSequence) {
    setEditing(s);
    setForm({
      subject: s.subject,
      body: s.body,
      day_offset: s.day_offset,
      sort_order: s.sort_order,
      is_active: s.is_active,
    });
    setShowForm(true);
    setMsg('');
    setErr('');
  }

  async function save() {
    if (!form.subject.trim() || !form.body.trim()) {
      setErr('제목과 본문을 입력해 주세요.');
      return;
    }
    setSaving(true);
    setErr('');
    setMsg('');
    const payload: SequenceInput = {
      subject: form.subject.trim(),
      body: form.body.trim(),
      day_offset: Number(form.day_offset) || 0,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    };
    const res = editing
      ? await updateMarketingSequence(editing.id, payload)
      : await addMarketingSequence(payload);
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
    if (!confirm('이 시퀀스 이메일을 삭제할까요?')) return;
    await deleteMarketingSequence(id);
    await load();
  }

  async function toggle(s: MarketingSequence) {
    await updateMarketingSequence(s.id, {
      subject: s.subject,
      body: s.body,
      day_offset: s.day_offset,
      sort_order: s.sort_order,
      is_active: !s.is_active,
    });
    await load();
  }

  async function send() {
    if (!confirm(`코칭을 받지 않은 회원 ${targets.length}명에게 시퀀스 메일을 발송할까요?`)) return;
    setSending(true);
    setMsg('');
    setErr('');
    const { data, error } = await runMarketingSequence();
    setSending(false);
    if (error) {
      setErr('발송에 실패했습니다.');
    } else {
      setMsg(`${data?.sent ?? 0}건의 메일이 발송되었습니다. (대상 ${data?.total_targets ?? targets.length}명)`);
      await load();
    }
  }

  if (loading) {
    return <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-sm text-neutral-500">불러오는 중...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">시퀀스 메일링</h2>
          <p className="text-sm text-neutral-500 mt-1">
            코칭을 아직 받지 않은 회원에게 가입 후 일수에 따라 순차적으로 발송되는 이메일을 관리합니다.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 bg-neutral-900 text-white px-4 py-2.5 rounded-full text-sm font-medium hover:opacity-90 whitespace-nowrap cursor-pointer"
        >
          <span className="w-4 h-4 flex items-center justify-center"><i className="ri-add-line"></i></span>
          이메일 추가
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-sm font-semibold text-neutral-900">발송 대상</div>
          <div className="text-xs text-neutral-500 mt-0.5">코칭을 아직 받지 않은 회원 (예약 기록 없음)</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-neutral-900">{targets.length}</span>
          <button
            onClick={() => setShowTargets((v) => !v)}
            className="px-4 py-2 rounded-full border border-neutral-300 text-sm text-neutral-700 hover:border-neutral-900 whitespace-nowrap cursor-pointer"
          >
            {showTargets ? '목록 접기' : '대상 보기'}
          </button>
          <button
            onClick={send}
            disabled={sending || targets.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 whitespace-nowrap cursor-pointer"
          >
            <span className="w-4 h-4 flex items-center justify-center"><i className="ri-send-plane-line"></i></span>
            {sending ? '발송 중...' : '시퀀스 발송'}
          </button>
        </div>
      </div>

      {msg && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">{msg}</p>}
      {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{err}</p>}

      {showTargets && (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-200 text-sm font-semibold text-neutral-900">
            대상 회원 목록 ({targets.length}명)
          </div>
          {targets.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-500">대상 회원이 없습니다.</div>
          ) : (
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0">
                  <tr className="text-left text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200 bg-neutral-50">
                    <th className="px-5 py-3 font-medium">이름</th>
                    <th className="px-5 py-3 font-medium">이메일</th>
                    <th className="px-5 py-3 font-medium">국적</th>
                    <th className="px-5 py-3 font-medium">가입일</th>
                  </tr>
                </thead>
                <tbody>
                  {targets.map((t) => (
                    <tr key={t.email} className="border-b border-neutral-100 last:border-0">
                      <td className="px-5 py-3 font-medium text-neutral-900">{t.full_name ?? '—'}</td>
                      <td className="px-5 py-3 text-neutral-600">{t.email}</td>
                      <td className="px-5 py-3 text-neutral-600">{t.nationality ?? '—'}</td>
                      <td className="px-5 py-3 text-neutral-600">{formatDate(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {sequences.length === 0 && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-sm text-neutral-500 text-center">
            등록된 시퀀스 이메일이 없습니다. 오른쪽 위 버튼으로 추가하세요.
          </div>
        )}
        {sequences.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl border border-neutral-200 p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-neutral-100 border border-neutral-200 flex flex-col items-center justify-center shrink-0">
              <span className="text-lg font-bold text-neutral-900">D{s.day_offset}</span>
              <span className="text-[10px] text-neutral-500">일 후</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
                  {s.is_active ? '활성' : '비활성'}
                </span>
                <span className="text-xs text-neutral-400">순서 {s.sort_order}</span>
              </div>
              <div className="mt-1 font-semibold text-neutral-900 truncate">{s.subject}</div>
              <div className="mt-0.5 text-sm text-neutral-500 truncate">{s.body}</div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => toggle(s)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 cursor-pointer"
                title={s.is_active ? '비활성화' : '활성화'}
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
              <h3 className="font-bold text-neutral-900">{editing ? '이메일 수정' : '이메일 추가'}</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 cursor-pointer">
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700">제목 *</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                  className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="예: 한국어 발음 팁을 준비했어요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">본문 *</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                  rows={5}
                  className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
                  placeholder="회원에게 보낼 메일 내용"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700">발송 시점 (가입 후 N일)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.day_offset}
                    onChange={(e) => setForm((p) => ({ ...p, day_offset: Number(e.target.value) }))}
                    className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">순서</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
                    className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span className="text-sm text-neutral-700">활성</span>
              </label>
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