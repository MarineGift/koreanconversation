'use client';

import { useEffect, useMemo, useState } from 'react';
import { getCoachBookings, updateBookingPayment, type CoachBookingRecord } from '@/lib/coachManagement';
import { getCoachQuestions, saveQuestionAnswer, type CoachQuestion } from '@/lib/questions';
import { confirmBooking } from '@/lib/booking';

const PAYMENT_METHODS = [
  { value: 'card', label: '카드' },
  { value: 'cash', label: '현금' },
  { value: 'package', label: '패키지 구매' },
  { value: 'coupon', label: '쿠폰' },
];

function formatDate(d: string) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

const statusBadge: Record<string, { bg: string; text: string; label: string }> = {
  confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: '확정' },
  cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', label: '취소' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: '대기' },
  completed: { bg: 'bg-blue-50', text: 'text-blue-700', label: '완료' },
};

interface SiteGroup {
  siteName: string;
  bookings: CoachBookingRecord[];
  questions: CoachQuestion[];
}

export default function CoachInbox({ coachId }: { coachId: string }) {
  const [bookings, setBookings] = useState<CoachBookingRecord[]>([]);
  const [questions, setQuestions] = useState<CoachQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSite, setActiveSite] = useState('전체');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payModal, setPayModal] = useState<CoachBookingRecord | null>(null);

  async function load() {
    const [b, q] = await Promise.all([getCoachBookings(coachId), getCoachQuestions(coachId)]);
    setBookings(b);
    setQuestions(q);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [coachId]);

  const sites = useMemo(() => {
    const set = new Set(bookings.map((b) => b.site_name));
    return ['전체', ...Array.from(set)];
  }, [bookings]);

  const groups = useMemo(() => {
    const map = new Map<string, SiteGroup>();
    for (const s of sites) {
      if (s === '전체') continue;
      map.set(s, { siteName: s, bookings: [], questions: [] });
    }
    for (const b of bookings) {
      const g = map.get(b.site_name);
      if (g) g.bookings.push(b);
    }
    for (const q of questions) {
      const b = bookings.find((bk) => bk.id === q.booking_id);
      if (b) {
        const g = map.get(b.site_name);
        if (g) g.questions.push(q);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.siteName.localeCompare(b.siteName));
  }, [bookings, questions, sites]);

  const allBookings = activeSite === '전체' ? bookings : bookings.filter((b) => b.site_name === activeSite);
  const allQuestions = activeSite === '전체' ? questions : questions.filter((q) => {
    const b = bookings.find((bk) => bk.id === q.booking_id);
    return b && b.site_name === activeSite;
  });

  const qByBooking = useMemo(() => {
    const map = new Map<string, CoachQuestion[]>();
    for (const q of allQuestions) {
      const bkId = q.booking_id;
      if (!bkId) continue;
      const arr = map.get(bkId) ?? [];
      arr.push(q);
      map.set(bkId, arr);
    }
    return map;
  }, [allQuestions]);

  if (loading) {
    return <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-sm text-neutral-500">불러오는 중...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-neutral-200 p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">코칭 신청 내역</h2>
            <p className="text-sm text-neutral-500 mt-1">
              사이트별로 수강신청과 질문을 한눈에 확인하고 관리합니다.
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 whitespace-nowrap">
            총 {allBookings.length}건
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {sites.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setActiveSite(s); setExpandedId(null); }}
              className={`px-4 py-2 rounded-full text-sm border cursor-pointer whitespace-nowrap transition ${
                activeSite === s
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {allBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
          {activeSite === '전체' ? '아직 코칭 신청이 없습니다.' : `${activeSite} 사이트의 신청 내역이 없습니다.`}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200 bg-neutral-50">
                  <th className="px-4 py-3 font-medium">신청일</th>
                  <th className="px-4 py-3 font-medium">수강생</th>
                  <th className="px-4 py-3 font-medium">예약일시</th>
                  <th className="px-4 py-3 font-medium">수업</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                  <th className="px-4 py-3 font-medium">결제</th>
                  <th className="px-4 py-3 font-medium">질문</th>
                  <th className="px-4 py-3 font-medium text-right">관리</th>
                </tr>
              </thead>
              <tbody>
                {allBookings.map((b) => {
                  const qList = qByBooking.get(b.id) ?? [];
                  const hasQuestions = qList.length > 0;
                  const isExpanded = expandedId === b.id;
                  const status = statusBadge[b.status ?? 'pending'] ?? statusBadge.pending;
                  const methodLabel = PAYMENT_METHODS.find((m) => m.value === b.payment_method)?.label;

                  return (
                    <>
                      <tr
                        key={b.id}
                        className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50 cursor-pointer transition"
                        onClick={() => setExpandedId(isExpanded ? null : b.id)}
                      >
                        <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">{formatDate(b.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-neutral-900">{b.name}</div>
                          <div className="text-xs text-neutral-500">{b.email}</div>
                        </td>
                        <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                          {formatDate(b.booking_date)} · {b.slot}
                        </td>
                        <td className="px-4 py-3 text-neutral-600">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-neutral-100 text-neutral-700 whitespace-nowrap">
                            {b.session_type === 'free' ? '무료 체험' : '정규 코칭'}
                          </span>
                          {b.lesson_name && <div className="text-xs text-neutral-500 mt-0.5">{b.lesson_name}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${status.bg} ${status.text}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {b.payment_method ? (
                            <div className="text-xs">
                              <span className="font-medium text-neutral-700">{methodLabel ?? b.payment_method}</span>
                              {b.purchase_date && <span className="text-neutral-400 ml-1">{formatDate(b.purchase_date)}</span>}
                            </div>
                          ) : (
                            <span className="text-neutral-400 text-xs">미기록</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {hasQuestions ? (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-medium">
                              <span className="w-4 h-4 flex items-center justify-center"><i className="ri-question-line"></i></span>
                              {qList.length}
                            </span>
                          ) : (
                            <span className="text-neutral-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {b.status === 'pending' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); confirmAndReload(b.id); }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 whitespace-nowrap cursor-pointer"
                              >
                                <span className="w-3.5 h-3.5 flex items-center justify-center"><i className="ri-check-line text-xs"></i></span>
                                확정
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); setPayModal(b); }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 text-xs font-medium hover:border-neutral-900 hover:text-neutral-900 whitespace-nowrap cursor-pointer"
                            >
                              <span className="w-3.5 h-3.5 flex items-center justify-center"><i className="ri-bank-card-line text-xs"></i></span>
                              결제
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${b.id}-detail`}>
                          <td colSpan={8} className="px-4 py-4 bg-neutral-50/60 border-b border-neutral-100">
                            <div className="space-y-4 max-w-3xl">
                              {(b.comment || b.lesson_content) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {b.comment && (
                                    <div className="rounded-xl bg-white border border-neutral-200 p-4">
                                      <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-1">댓글</div>
                                      <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{b.comment}</p>
                                    </div>
                                  )}
                                  {b.lesson_content && (
                                    <div className="rounded-xl bg-white border border-neutral-200 p-4">
                                      <div className="text-[11px] uppercase tracking-wide text-neutral-400 mb-1">요청 내용</div>
                                      <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{b.lesson_content}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {hasQuestions && (
                                <div className="space-y-3">
                                  <div className="text-[11px] uppercase tracking-wide text-neutral-400 font-medium">수강생 질문 · 답변</div>
                                  {qList.map((q) => (
                                    <ThreadBlock key={q.id} question={q} onSaved={load} />
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {payModal && (
        <PaymentModal
          booking={payModal}
          onClose={() => setPayModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );

  async function confirmAndReload(id: string) {
    const res = await confirmBooking(id);
    if (!res.error) load();
  }
}

function PaymentModal({ booking, onClose, onSaved }: { booking: CoachBookingRecord; onClose: () => void; onSaved: () => void }) {
  const [method, setMethod] = useState(booking.payment_method ?? '');
  const [date, setDate] = useState(booking.purchase_date ?? '');
  const [note, setNote] = useState(booking.payment_note ?? '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function save() {
    setSaving(true);
    setMsg('');
    const { error } = await updateBookingPayment(booking.id, {
      payment_method: method || null,
      purchase_date: date || null,
      payment_note: note || null,
    });
    setSaving(false);
    if (error) {
      setMsg('저장에 실패했습니다.');
    } else {
      onClose();
      onSaved();
    }
  }

  const methodLabel = PAYMENT_METHODS.find((m) => m.value === method)?.label;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="font-bold text-neutral-900">결제 기록 입력</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 cursor-pointer">
            <i className="ri-close-line text-xl text-neutral-600"></i>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <div className="text-sm font-medium text-neutral-900 mb-1">{booking.name}</div>
            <div className="text-xs text-neutral-500">{booking.email} · {formatDate(booking.booking_date)} {booking.slot}</div>
          </div>

          <div>
            <label className="block text-xs text-neutral-500 mb-2">결제 수단</label>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={`px-3 py-1.5 rounded-full text-xs border cursor-pointer whitespace-nowrap transition ${
                    method === m.value
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-900'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-neutral-500 mb-1.5">결제 일자</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-500 mb-1.5">비고</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: 패키지 10회 중 3회 사용"
              className="w-full text-sm px-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          {msg && <p className="text-xs text-rose-600">{msg}</p>}
        </div>
        <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-full text-sm border border-neutral-200 text-neutral-700 hover:bg-neutral-50 whitespace-nowrap cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-full text-sm bg-neutral-900 text-white hover:opacity-90 disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ThreadBlock({ question, onSaved }: { question: CoachQuestion; onSaved: () => void }) {
  const [answer, setAnswer] = useState(question.answer ?? '');
  const [editing, setEditing] = useState(!question.answer);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    if (!answer.trim()) {
      setErr('답변 내용을 입력해 주세요.');
      return;
    }
    setSaving(true);
    setErr('');
    const res = await saveQuestionAnswer(question.id, answer.trim());
    setSaving(false);
    if (res.error) {
      setErr('저장에 실패했습니다.');
    } else {
      setEditing(false);
      onSaved();
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
      <div className="flex items-start gap-3">
        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold shrink-0 mt-0.5">Q</span>
        <div className="flex-1">
          <div className="text-xs text-neutral-500 mb-0.5">{question.member_name || '수강생'} · {formatDate(question.created_at)}</div>
          <p className="text-sm text-neutral-800 leading-relaxed">{question.question || '질문 내용 없음'}</p>
        </div>
      </div>

      {editing ? (
        <div className="pl-9">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold shrink-0 mt-0.5">A</span>
            <div className="flex-1 space-y-2">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none bg-white"
                placeholder="수강생에게 보낼 답변을 입력하세요."
              />
              {err && <p className="text-xs text-rose-600">{err}</p>}
              <div className="flex items-center justify-end gap-2">
                {question.answer && (
                  <button
                    onClick={() => { setEditing(false); setAnswer(question.answer ?? ''); }}
                    className="px-3 py-2 rounded-full text-sm text-neutral-600 hover:bg-neutral-100 whitespace-nowrap cursor-pointer"
                  >
                    취소
                  </button>
                )}
                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-900 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap cursor-pointer"
                >
                  {saving ? '전송 중...' : '답변 달기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : question.answer ? (
        <div className="pl-9">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold shrink-0 mt-0.5">A</span>
            <div className="flex-1">
              <div className="text-xs text-neutral-500 mb-0.5">{question.answered_at ? formatDate(question.answered_at) : '답변 완료'}</div>
              <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{question.answer}</p>
              <button
                onClick={() => setEditing(true)}
                className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-700 font-medium hover:underline cursor-pointer"
              >
                <i className="ri-edit-line"></i> 답변 수정
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="pl-9">
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 cursor-pointer whitespace-nowrap"
          >
            <span className="w-3.5 h-3.5 flex items-center justify-center"><i className="ri-reply-line"></i></span>
            답변 작성
          </button>
        </div>
      )}
    </div>
  );
}