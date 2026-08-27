'use client';

import { useEffect, useState } from 'react';
import {
  getMemberPurchases, getMemberUsage, requestRefund, shortOrderNumber, canRequestRefund,
  getCoachSales, type PurchaseRecord, type UsageRecord, type CoachSaleRecord,
} from '@/lib/creditHistory';
import { getPackById, formatPrice } from '@/lib/credits';
import TransferCreditsModal from './TransferCreditsModal';
import ReceiptModal from './ReceiptModal';
import RefundRequestModal from './RefundRequestModal';

function formatDateTime(d: string) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' +
    date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDateOnly(d: string) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function refundExpectedText(u: UsageRecord) {
  const base = '영업일 기준 3~5일 소요 예정';
  if (!u.refund_requested_at) return base;
  const d = new Date(u.refund_requested_at);
  if (isNaN(d.getTime())) return base;
  return `${d.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })} 요청 · ${base}`;
}

const usageStatusLabel: Record<string, string> = {
  completed: '수업 완료',
  no_show: '불참',
  confirmed: '예약 확정',
  cancelled: '취소됨',
};

const paymentMethodLabel: Record<string, string> = {
  paypal: 'PayPal',
  toss: 'Toss Payments',
  card: '신용카드',
  bank: '계좌이체',
  cash: '현금',
  package: '패키지',
  coupon: '쿠폰',
};

type MemberTab = 'purchases' | 'usage';
type CoachTab = 'my_purchases' | 'student_purchases' | 'usage';

export default function MemberCreditHistory({
  email,
  credits,
  role,
  coachId,
}: {
  email: string;
  credits: number;
  role: string;
  coachId: string | null;
}) {
  const isCoach = role === 'coach';
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [coachSales, setCoachSales] = useState<CoachSaleRecord[]>([]);
  const [balance, setBalance] = useState(credits);
  const [loading, setLoading] = useState(true);
  const [showTransfer, setShowTransfer] = useState(false);
  const [memberTab, setMemberTab] = useState<MemberTab>('purchases');
  const [coachTab, setCoachTab] = useState<CoachTab>('student_purchases');
  const [receipt, setReceipt] = useState<PurchaseRecord | null>(null);
  const [refundTarget, setRefundTarget] = useState<UsageRecord | null>(null);
  const [refundBusy, setRefundBusy] = useState(false);
  const [declineView, setDeclineView] = useState<UsageRecord | null>(null);
  const [notice, setNotice] = useState('');
  const [noticeError, setNoticeError] = useState(false);

  async function load() {
    setLoading(true);
    const [p, u] = await Promise.all([getMemberPurchases(email), getMemberUsage(email)]);
    setPurchases(p);
    setUsage(u);
    if (isCoach && coachId) {
      const s = await getCoachSales(coachId);
      setCoachSales(s);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [email, coachId, isCoach]);

  useEffect(() => {
    setBalance(credits);
  }, [credits]);

  async function handleRefund(reason: string) {
    if (!refundTarget) return;
    setRefundBusy(true);
    const { error } = await requestRefund(refundTarget.id, reason);
    if (error) {
      setNoticeError(true);
      setNotice('환불 요청에 실패했습니다. 다시 시도해 주세요.');
    } else {
      setNoticeError(false);
      setNotice('환불 요청이 접수되었습니다. 관리자 검토 후 처리됩니다.');
      setRefundTarget(null);
      load();
    }
    setRefundBusy(false);
    setTimeout(() => setNotice(''), 4000);
  }

  const totalPurchased = purchases.reduce((s, p) => s + p.credits, 0);
  const totalUsed = usage.length;

  const renderTabs = () => {
    if (!isCoach) {
      return (
        <div className="flex border-b border-neutral-200">
          <button
            onClick={() => setMemberTab('purchases')}
            className={`px-5 py-3 text-sm font-medium whitespace-nowrap cursor-pointer ${
              memberTab === 'purchases' ? 'text-neutral-900 border-b-2 border-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            구매내역
          </button>
          <button
            onClick={() => setMemberTab('usage')}
            className={`px-5 py-3 text-sm font-medium whitespace-nowrap cursor-pointer ${
              memberTab === 'usage' ? 'text-neutral-900 border-b-2 border-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            사용내역
          </button>
        </div>
      );
    }
    return (
      <div className="flex border-b border-neutral-200">
        <button
          onClick={() => setCoachTab('my_purchases')}
          className={`px-5 py-3 text-sm font-medium whitespace-nowrap cursor-pointer ${
            coachTab === 'my_purchases' ? 'text-neutral-900 border-b-2 border-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          내 구매
        </button>
        <button
          onClick={() => setCoachTab('student_purchases')}
          className={`px-5 py-3 text-sm font-medium whitespace-nowrap cursor-pointer ${
            coachTab === 'student_purchases' ? 'text-neutral-900 border-b-2 border-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          수강생 구매
        </button>
        <button
          onClick={() => setCoachTab('usage')}
          className={`px-5 py-3 text-sm font-medium whitespace-nowrap cursor-pointer ${
            coachTab === 'usage' ? 'text-neutral-900 border-b-2 border-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          사용내역
        </button>
      </div>
    );
  };

  const renderContent = () => {
    if (!isCoach) {
      if (memberTab === 'purchases') return renderPurchases();
      return renderUsage();
    }
    if (coachTab === 'my_purchases') return renderPurchases();
    if (coachTab === 'student_purchases') return renderStudentPurchases();
    return renderUsage();
  };

  function renderPurchases() {
    if (purchases.length === 0) return <div className="p-8 text-center text-sm text-neutral-500">구매 내역이 없습니다.</div>;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 font-medium">일시</th>
              <th className="px-4 py-3 font-medium">주문번호</th>
              <th className="px-4 py-3 font-medium">상품</th>
              <th className="px-4 py-3 font-medium">크레딧</th>
              <th className="px-4 py-3 font-medium">결제금액</th>
              <th className="px-4 py-3 font-medium">결제수단</th>
              <th className="px-4 py-3 font-medium text-right">영수증</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => {
              const pack = getPackById(p.pack_id);
              return (
                <tr key={p.order_id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">{formatDateTime(p.created_at)}</td>
                  <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                    <span className="font-mono text-xs text-neutral-500" title={p.order_id}>{shortOrderNumber(p.order_id)}</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-900">{pack?.name.ko ?? pack?.name.en ?? p.pack_id}</td>
                  <td className="px-4 py-3 text-neutral-600">+{p.credits}</td>
                  <td className="px-4 py-3 font-medium text-neutral-900 whitespace-nowrap">
                    {formatPrice(p.amount, p.currency as 'KRW' | 'USD')}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                    {paymentMethodLabel[p.payment_method ?? ''] ?? p.payment_method ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setReceipt(p)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 cursor-pointer whitespace-nowrap"
                    >
                      <span className="w-3.5 h-3.5 flex items-center justify-center"><i className="ri-receipt-line"></i></span>
                      영수증 보기
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  function renderStudentPurchases() {
    if (coachSales.length === 0) return <div className="p-8 text-center text-sm text-neutral-500">수강생 구매 내역이 없습니다.</div>;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 font-medium">수강생</th>
              <th className="px-4 py-3 font-medium">사이트</th>
              <th className="px-4 py-3 font-medium">예약일시</th>
              <th className="px-4 py-3 font-medium">수업</th>
              <th className="px-4 py-3 font-medium">결제금액</th>
              <th className="px-4 py-3 font-medium">결제수단</th>
              <th className="px-4 py-3 font-medium">결제일</th>
              <th className="px-4 py-3 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {coachSales.map((s) => (
              <tr key={s.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium text-neutral-900">{s.name}</div>
                  <div className="text-xs text-neutral-500">{s.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 whitespace-nowrap">
                    {s.site_name ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">{formatDateOnly(s.booking_date)} {s.slot}</td>
                <td className="px-4 py-3 text-neutral-600">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-neutral-100 text-neutral-700 whitespace-nowrap">
                    {s.session_type === 'free' ? '무료 체험' : '정규 코칭'}
                  </span>
                  {s.lesson_name && <div className="text-xs text-neutral-500 mt-0.5">{s.lesson_name}</div>}
                </td>
                <td className="px-4 py-3 font-medium text-neutral-900 whitespace-nowrap">
                  {s.amount_paid != null ? `${s.currency ?? 'USD'} ${Number(s.amount_paid).toLocaleString()}` : '—'}
                </td>
                <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                  {paymentMethodLabel[s.payment_method ?? ''] ?? s.payment_method ?? '—'}
                </td>
                <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                  {s.purchase_date ? formatDateOnly(s.purchase_date) : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    s.status === 'cancelled' ? 'bg-rose-50 text-rose-700' :
                    s.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                    'bg-emerald-50 text-emerald-700'
                  }`}>
                    {s.status === 'cancelled' ? '취소' : s.status === 'pending' ? '대기' : '확정'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderUsage() {
    if (usage.length === 0) return <div className="p-8 text-center text-sm text-neutral-500">사용 내역이 없습니다.</div>;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 font-medium">수업일</th>
              <th className="px-4 py-3 font-medium">시간</th>
              <th className="px-4 py-3 font-medium">코치</th>
              <th className="px-4 py-3 font-medium">사이트</th>
              <th className="px-4 py-3 font-medium">수업유형</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium text-right">환불</th>
            </tr>
          </thead>
          <tbody>
            {usage.map((u) => (
              <tr key={u.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">{formatDateOnly(u.booking_date)}</td>
                <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">{u.slot}</td>
                <td className="px-4 py-3 text-neutral-600">{u.coach_name}</td>
                <td className="px-4 py-3">
                  {u.site_name ? (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 whitespace-nowrap">{u.site_name}</span>
                  ) : (
                    <span className="text-neutral-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-600">{u.session_type ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    u.status === 'no_show' ? 'bg-rose-50 text-rose-700' : u.status === 'cancelled' ? 'bg-neutral-100 text-neutral-600' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {usageStatusLabel[u.status ?? 'completed'] ?? '수업 완료'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {u.refund_status === 'requested' ? (
                    <div className="inline-flex flex-col items-end gap-0.5" title={refundExpectedText(u)}>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-amber-50 text-amber-700 cursor-help">
                        <span className="w-3.5 h-3.5 flex items-center justify-center"><i className="ri-time-line"></i></span>
                        관리자 검토 중
                      </span>
                      <span className="text-[10px] text-amber-600/70 whitespace-nowrap">3~5일 소요 예정</span>
                    </div>
                  ) : u.refund_status === 'refunded' ? (
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-rose-100 text-rose-700">환불됨</span>
                  ) : u.refund_status === 'declined' ? (
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => setDeclineView(u)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-100 text-neutral-600 hover:bg-neutral-200 cursor-pointer whitespace-nowrap"
                        title="거절 사유 확인"
                      >
                        <span className="w-3.5 h-3.5 flex items-center justify-center"><i className="ri-information-line"></i></span>
                        사유 확인
                      </button>
                      <button
                        onClick={() => setRefundTarget(u)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer whitespace-nowrap"
                      >
                        <span className="w-3.5 h-3.5 flex items-center justify-center"><i className="ri-refund-2-line"></i></span>
                        재요청
                      </button>
                    </div>
                  ) : canRequestRefund(u) ? (
                    <button
                      onClick={() => setRefundTarget(u)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer whitespace-nowrap"
                    >
                      <span className="w-3.5 h-3.5 flex items-center justify-center"><i className="ri-refund-2-line"></i></span>
                      환불 요청
                    </button>
                  ) : (
                    <span className="text-neutral-300 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold text-neutral-900">크레딧 내역</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTransfer(true)}
            disabled={balance <= 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-neutral-300 text-neutral-700 hover:border-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
          >
            <span className="w-4 h-4 flex items-center justify-center"><i className="ri-gift-line"></i></span>
            Transfer Credits
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="text-sm text-neutral-500">총 구매 크레딧</div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">{totalPurchased}</div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="text-sm text-neutral-500">사용한 크레딧</div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">{totalUsed}</div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="text-sm text-neutral-500">남은 크레딧</div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">{balance}</div>
        </div>
      </div>

      {notice && (
        <div className={`text-sm px-4 py-3 rounded-xl border ${noticeError ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
          {notice}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        {renderTabs()}
        {loading ? (
          <div className="p-10 text-center text-sm text-neutral-500">Loading...</div>
        ) : (
          renderContent()
        )}
      </div>

      {showTransfer && (
        <TransferCreditsModal
          available={balance}
          onClose={() => setShowTransfer(false)}
          onDone={(remaining) => {
            setBalance(remaining);
            load();
          }}
        />
      )}

      {receipt && (
        <ReceiptModal
          purchase={receipt}
          email={email}
          onClose={() => setReceipt(null)}
        />
      )}

      {refundTarget && (
        <RefundRequestModal
          usage={refundTarget}
          busy={refundBusy}
          onClose={() => setRefundTarget(null)}
          onConfirm={handleRefund}
        />
      )}

      {declineView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeclineView(null)}></div>
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="font-bold text-neutral-900">환불 거절 사유</h3>
              <button onClick={() => setDeclineView(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 cursor-pointer">
                <i className="ri-close-line text-xl text-neutral-600"></i>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-neutral-50 rounded-xl p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">수업일</span>
                  <span className="text-neutral-900">{formatDateOnly(declineView.booking_date)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-neutral-500">코치</span>
                  <span className="text-neutral-900">{declineView.coach_name}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-2">거절 사유</div>
                <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
                  {declineView.refund_reason?.trim() || '거절 사유가 입력되지 않았습니다.'}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 leading-relaxed">
                사유를 확인하신 후, 필요하시면 아래에서 재요청하실 수 있습니다.
              </div>
            </div>
            <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-2">
              <button
                onClick={() => setDeclineView(null)}
                className="px-4 py-2 rounded-full text-sm border border-neutral-200 text-neutral-700 hover:bg-neutral-50 whitespace-nowrap cursor-pointer"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  setRefundTarget(declineView);
                  setDeclineView(null);
                }}
                className="px-4 py-2 rounded-full text-sm bg-rose-600 text-white hover:bg-rose-700 whitespace-nowrap cursor-pointer"
              >
                재요청하기
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}