'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getOrgId } from '@/lib/org';
import {
  listMembers,
  upsertMember,
  deleteMember,
  getMemberStudyHistory,
  type MemberRecord,
  type MemberBooking,
} from '@/lib/member';
import {
  getMemberPurchases,
  getMemberUsage,
  type PurchaseRecord,
  type UsageRecord,
} from '@/lib/creditHistory';
import { formatPrice, getPackById } from '@/lib/credits';

interface OrgOption {
  id: string;
  name: string;
}

function formatDate(d: string) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

const statusLabel: Record<string, string> = {
  confirmed: '확정',
  completed: '완료',
  cancelled: '취소',
  no_show: '노쇼',
  pending: '대기',
};

const PAGE_SIZE = 10;

export default function MemberSection() {
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterOrg, setFilterOrg] = useState('all');
  const [filterNationality, setFilterNationality] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    nationality: '',
    study_purpose: '',
    organization_id: '',
    inputter: '',
  });
  const [saving, setSaving] = useState(false);
  const [formMsg, setFormMsg] = useState('');

  const [history, setHistory] = useState<MemberBooking[]>([]);
  const [historyEmail, setHistoryEmail] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [historyCredits, setHistoryCredits] = useState(0);

  async function load() {
    const oid = await getOrgId();
    setOrgId(oid);
    const [m, orgRes] = await Promise.all([
      listMembers(oid),
      supabase.from('organizations').select('id, name').order('created_at', { ascending: true }),
    ]);
    setMembers(m);
    setOrgs((orgRes.data ?? []) as OrgOption[]);
    setLoading(false);
    setCurrentPage(1);
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    setEditingEmail(null);
    setForm({ email: '', password: '', full_name: '', nationality: '', study_purpose: '', organization_id: orgId ?? '', inputter: '' });
    setFormMsg('');
    setShowForm(true);
  }

  function openEdit(m: MemberRecord) {
    setEditingEmail(m.email);
    setForm({
      email: m.email,
      password: '',
      full_name: m.full_name ?? '',
      nationality: m.nationality ?? '',
      study_purpose: m.study_purpose ?? '',
      organization_id: m.organization_id ?? orgId ?? '',
      inputter: m.inputter ?? '',
    });
    setFormMsg('');
    setShowForm(true);
  }

  async function save() {
    setSaving(true);
    setFormMsg('');
    const { error } = await upsertMember({
      email: form.email,
      full_name: form.full_name || null,
      nationality: form.nationality || null,
      study_purpose: form.study_purpose || null,
      organization_id: form.organization_id || null,
      inputter: form.inputter || null,
      password: form.password || null,
    });
    setSaving(false);
    if (error) {
      setFormMsg(error);
      return;
    }
    setShowForm(false);
    await load();
  }

  async function remove(email: string) {
    if (!confirm('이 회원을 삭제할까요?')) return;
    await deleteMember(email);
    await load();
  }

  async function openHistory(email: string) {
    setHistoryEmail(email);
    setHistoryLoading(true);
    setHistory([]);
    setPurchases([]);
    setUsage([]);
    const [rows, p, u] = await Promise.all([
      getMemberStudyHistory(email),
      getMemberPurchases(email),
      getMemberUsage(email),
    ]);
    setHistory(rows);
    setPurchases(p);
    setUsage(u);
    setHistoryCredits(members.find((m) => m.email === email)?.session_credits ?? 0);
    setHistoryLoading(false);
  }

  const siteName = useMemo(() => {
    const map = new Map(orgs.map((o) => [o.id, o.name]));
    return (id: string | null) => (id ? map.get(id) ?? '—' : '—');
  }, [orgs]);

  const nationalityOptions = useMemo(() => {
    const set = new Set<string>();
    for (const m of members) {
      if (m.nationality) set.add(m.nationality);
    }
    return Array.from(set).sort();
  }, [members]);

  const filteredMembers = useMemo(() => {
    let result = members;
    const kw = search.trim().toLowerCase();
    if (kw) {
      result = result.filter((m) =>
        (m.full_name ?? '').toLowerCase().includes(kw) ||
        m.email.toLowerCase().includes(kw)
      );
    }
    if (filterOrg !== 'all') {
      result = result.filter((m) => m.organization_id === filterOrg);
    }
    if (filterNationality !== 'all') {
      result = result.filter((m) => m.nationality === filterNationality);
    }
    return result;
  }, [members, search, filterOrg, filterNationality]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
  const pagedMembers = filteredMembers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (loading) {
    return <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">불러오는 중...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">회원 관리</h2>
          <p className="text-sm text-neutral-500 mt-1">총 {filteredMembers.length}명 · 이메일 기준으로 회원을 관리합니다.</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2.5 rounded-full bg-neutral-900 text-white text-sm font-medium hover:opacity-90 whitespace-nowrap cursor-pointer flex items-center gap-1.5"
        >
          <span className="w-4 h-4 flex items-center justify-center"><i className="ri-add-line"></i></span>
          회원 추가
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="w-4 h-4 flex items-center justify-center text-neutral-400"><i className="ri-search-line"></i></span>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="이름 또는 이메일 검색"
            className="flex-1 text-sm px-2 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-neutral-900"
          />
        </div>
        <select
          value={filterOrg}
          onChange={(e) => { setFilterOrg(e.target.value); setCurrentPage(1); }}
          className="text-sm px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-neutral-900 bg-white pr-8"
        >
          <option value="all">모든 사이트</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
        <select
          value={filterNationality}
          onChange={(e) => { setFilterNationality(e.target.value); setCurrentPage(1); }}
          className="text-sm px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-neutral-900 bg-white pr-8"
        >
          <option value="all">모든 국적</option>
          {nationalityOptions.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
          {members.length === 0 ? '등록된 회원이 없습니다.' : '검색 결과가 없습니다.'}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200 bg-neutral-50">
                  <th className="px-5 py-3 font-medium">회원</th>
                  <th className="px-5 py-3 font-medium">국적</th>
                  <th className="px-5 py-3 font-medium">수강 목적</th>
                  <th className="px-5 py-3 font-medium">사이트</th>
                  <th className="px-5 py-3 font-medium">입력자</th>
                  <th className="px-5 py-3 font-medium">수정일</th>
                  <th className="px-5 py-3 font-medium text-right">관리</th>
                </tr>
              </thead>
              <tbody>
                {pagedMembers.map((m) => (
                  <tr key={m.email} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-neutral-900">{m.full_name ?? '—'}</div>
                      <div className="text-xs text-neutral-500">{m.email}</div>
                    </td>
                    <td className="px-5 py-3 text-neutral-600">{m.nationality ?? '—'}</td>
                    <td className="px-5 py-3 text-neutral-600 max-w-[220px] truncate">{m.study_purpose ?? '—'}</td>
                    <td className="px-5 py-3 text-neutral-600">{siteName(m.organization_id)}</td>
                    <td className="px-5 py-3 text-neutral-600">{m.inputter ?? '—'}</td>
                    <td className="px-5 py-3 text-neutral-600 whitespace-nowrap">{formatDate(m.updated_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openHistory(m.email)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer"
                          title="수강 내역"
                        >
                          <i className="ri-history-line"></i>
                        </button>
                        <button
                          onClick={() => openEdit(m)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer"
                          title="수정"
                        >
                          <i className="ri-edit-line"></i>
                        </button>
                        <button
                          onClick={() => remove(m.email)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                          title="삭제"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-200">
              <div className="text-xs text-neutral-500">
                {filteredMembers.length}명 중 {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredMembers.length)} 표시
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"
                >
                  <i className="ri-arrow-left-s-line"></i>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium cursor-pointer ${
                      p === currentPage ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer"
                >
                  <i className="ri-arrow-right-s-line"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900">{editingEmail ? '회원 수정' : '회원 추가'}</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 cursor-pointer">
                <i className="ri-close-line"></i>
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700">이메일 (ID)</label>
                <input
                  type="email"
                  value={form.email}
                  disabled={!!editingEmail}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-400"
                  placeholder="member@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Full Name</label>
                  <input
                    value={form.full_name}
                    onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                    className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">비밀번호</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    placeholder={editingEmail ? '변경 시에만 입력' : '비밀번호'}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">국적</label>
                <input
                  value={form.nationality}
                  onChange={(e) => setForm((p) => ({ ...p, nationality: e.target.value }))}
                  className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="예: 대한민국, United States"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">수강 목적</label>
                <input
                  value={form.study_purpose}
                  onChange={(e) => setForm((p) => ({ ...p, study_purpose: e.target.value }))}
                  className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="예: 비즈니스 회화, TOPIK 준비"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700">사이트</label>
                  <div className="mt-1 flex gap-1.5 flex-wrap">
                    {orgs.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, organization_id: o.id }))}
                        className={`px-3 py-2 rounded-lg text-xs border cursor-pointer whitespace-nowrap transition ${
                          form.organization_id === o.id
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-900'
                        }`}
                      >
                        {o.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">입력자</label>
                  <input
                    value={form.inputter}
                    onChange={(e) => setForm((p) => ({ ...p, inputter: e.target.value }))}
                    className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    placeholder="관리자"
                  />
                </div>
              </div>

              {formMsg && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{formMsg}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-full text-sm font-medium text-neutral-600 hover:bg-neutral-100 whitespace-nowrap cursor-pointer"
                >
                  취소
                </button>
                <button
                  onClick={save}
                  disabled={saving || !form.email.trim()}
                  className="px-5 py-2.5 rounded-full bg-neutral-900 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap cursor-pointer"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {historyEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setHistoryEmail(null)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900">수강생 상세 내역</h3>
              <button onClick={() => setHistoryEmail(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 cursor-pointer">
                <i className="ri-close-line"></i>
              </button>
            </div>
            <p className="text-sm text-neutral-500 mt-1">{historyEmail}</p>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="bg-neutral-50 rounded-xl p-4">
                <div className="text-xs text-neutral-500">잔여 크레딧</div>
                <div className="text-2xl font-bold text-neutral-900 mt-1">{historyCredits}</div>
              </div>
              <div className="bg-neutral-50 rounded-xl p-4">
                <div className="text-xs text-neutral-500">총 구매</div>
                <div className="text-2xl font-bold text-neutral-900 mt-1">{purchases.reduce((s, p) => s + p.credits, 0)}</div>
              </div>
              <div className="bg-neutral-50 rounded-xl p-4">
                <div className="text-xs text-neutral-500">사용</div>
                <div className="text-2xl font-bold text-neutral-900 mt-1">{usage.length}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-semibold text-neutral-900 mb-2">구매 내역</div>
              {purchases.length === 0 ? (
                <p className="text-sm text-neutral-500 py-4 text-center border border-neutral-200 rounded-xl">구매 내역이 없습니다.</p>
              ) : (
                <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200 bg-neutral-50">
                        <th className="px-4 py-2.5 font-medium">날짜</th>
                        <th className="px-4 py-2.5 font-medium">상품</th>
                        <th className="px-4 py-2.5 font-medium">크레딧</th>
                        <th className="px-4 py-2.5 font-medium">금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map((p) => (
                        <tr key={p.order_id} className="border-b border-neutral-100 last:border-0">
                          <td className="px-4 py-2.5 text-neutral-600 whitespace-nowrap">{formatDate(p.created_at)}</td>
                          <td className="px-4 py-2.5 text-neutral-900">{getPackById(p.pack_id)?.name.ko ?? p.pack_id}</td>
                          <td className="px-4 py-2.5 text-neutral-600">+{p.credits}</td>
                          <td className="px-4 py-2.5 font-medium text-neutral-900 whitespace-nowrap">{formatPrice(p.amount, p.currency as 'KRW' | 'USD')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-4">
              <div className="text-sm font-semibold text-neutral-900 mb-2">크레딧 사용 내역</div>
              {usage.length === 0 ? (
                <p className="text-sm text-neutral-500 py-4 text-center border border-neutral-200 rounded-xl">사용 내역이 없습니다.</p>
              ) : (
                <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200 bg-neutral-50">
                        <th className="px-4 py-2.5 font-medium">날짜</th>
                        <th className="px-4 py-2.5 font-medium">시간</th>
                        <th className="px-4 py-2.5 font-medium">강사</th>
                        <th className="px-4 py-2.5 font-medium">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usage.map((u) => (
                        <tr key={u.id} className="border-b border-neutral-100 last:border-0">
                          <td className="px-4 py-2.5 text-neutral-600 whitespace-nowrap">{formatDate(u.booking_date)}</td>
                          <td className="px-4 py-2.5 text-neutral-600 whitespace-nowrap">{u.slot}</td>
                          <td className="px-4 py-2.5 text-neutral-600">{u.coach_name}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${u.status === 'no_show' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                              {statusLabel[u.status ?? 'completed'] ?? '수강 완료'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-4">
              <div className="text-sm font-semibold text-neutral-900 mb-2">코칭 예약 내역</div>
              {historyLoading ? (
                <p className="text-sm text-neutral-500 py-4 text-center">불러오는 중...</p>
              ) : history.length === 0 ? (
                <p className="text-sm text-neutral-500 py-4 text-center border border-neutral-200 rounded-xl">예약 내역이 없습니다.</p>
              ) : (
                <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200 bg-neutral-50">
                        <th className="px-4 py-2.5 font-medium">날짜</th>
                        <th className="px-4 py-2.5 font-medium">시간</th>
                        <th className="px-4 py-2.5 font-medium">강사</th>
                        <th className="px-4 py-2.5 font-medium">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((b) => (
                        <tr key={b.id} className="border-b border-neutral-100 last:border-0">
                          <td className="px-4 py-2.5 text-neutral-600 whitespace-nowrap">{formatDate(b.booking_date)}</td>
                          <td className="px-4 py-2.5 text-neutral-600 whitespace-nowrap">{b.slot}</td>
                          <td className="px-4 py-2.5 text-neutral-600">{b.coach_name}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              b.status === 'cancelled' || b.status === 'no_show'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {statusLabel[b.status ?? 'confirmed'] ?? '확정'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}