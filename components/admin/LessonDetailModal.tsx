import PaymentBadge, { getPaymentStatus } from './PaymentBadge';
import RoomJoinButton from '@/components/member/RoomJoinButton';

export interface BookingDetail {
  id: string;
  name: string;
  email: string;
  nationality: string | null;
  booking_date: string;
  slot: string;
  room_url: string | null;
  site_name: string;
  coach_name: string;
  lesson_name: string | null;
  lesson_content: string | null;
  feedback: string | null;
  notes: string | null;
  session_type?: string;
  status?: string | null;
  paddle_transaction_id?: string | null;
  amount_paid?: number | null;
  currency?: string | null;
  created_at?: string;
  refund_status?: string | null;
  refund_reason?: string | null;
  comment?: string | null;
  payment_method?: string | null;
  purchase_date?: string | null;
  payment_note?: string | null;
  questions?: { id: string; question: string | null; answer: string | null; member_name?: string | null; member_email?: string | null }[];
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  card: '카드',
  cash: '현금',
  package: '패키지 구매',
  coupon: '쿠폰',
};

function formatDate(d: string) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function LessonDetailModal({
  booking,
  onClose,
}: {
  booking: BookingDetail | null;
  onClose: () => void;
}) {
  if (!booking) return null;

  const rows: { label: string; value: string }[] = [
    { label: '사이트명', value: booking.site_name || '—' },
    { label: '코치명', value: booking.coach_name },
    { label: '강의명', value: booking.lesson_name || '—' },
    { label: '수강생', value: booking.name },
    { label: '이메일', value: booking.email },
    { label: '국적', value: booking.nationality || '—' },
    { label: '세션 유형', value: booking.session_type || '—' },
    { label: '상태', value: booking.status || '—' },
    { label: '결제 금액', value: booking.amount_paid != null ? `${booking.currency ?? 'USD'} ${booking.amount_paid}` : '—' },
    { label: '일시', value: booking.booking_date ? `${formatDate(booking.booking_date)} · ${booking.slot}` : booking.slot },
    { label: '댓글', value: booking.comment || '—' },
    { label: '비용지불', value: booking.payment_method ? (PAYMENT_METHOD_LABEL[booking.payment_method] ?? booking.payment_method) : '—' },
    { label: '구매일자', value: booking.purchase_date ? formatDate(booking.purchase_date) : '—' },
    { label: '지불내역', value: booking.payment_note || '—' },
    { label: '수강내용', value: booking.lesson_content || '—' },
    { label: '피드백', value: booking.feedback || '—' },
    { label: '특이사항', value: booking.notes || '—' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-neutral-900">강의 상세</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 cursor-pointer">
            <span className="w-5 h-5 flex items-center justify-center"><i className="ri-close-line text-xl text-neutral-600"></i></span>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <PaymentBadge status={getPaymentStatus(booking.session_type, booking.paddle_transaction_id)} />
          {rows.map((r) => (
            <div key={r.label}>
              <div className="text-xs uppercase tracking-widest text-neutral-400">{r.label}</div>
              <div className="mt-1 text-sm text-neutral-800 whitespace-pre-wrap">{r.value}</div>
            </div>
          ))}

          {booking.questions && booking.questions.length > 0 && (
            <div className="pt-4 border-t border-neutral-100">
              <div className="text-xs uppercase tracking-widest text-neutral-400 mb-3">수강생 질문 / 답변</div>
              <div className="space-y-3">
                {booking.questions.map((q, idx) => (
                  <div key={q.id} className="rounded-xl border border-amber-100 bg-amber-50/30 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] uppercase tracking-wide text-amber-600 font-medium">질문 {idx + 1}</span>
                      {q.answer ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">답변 완료</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">답변 필요</span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-neutral-700">{q.question || '내용 없음'}</p>
                    {q.answer && (
                      <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
                        <div className="text-[11px] uppercase tracking-wide text-emerald-600">답변</div>
                        <p className="mt-0.5 text-sm text-neutral-700 whitespace-pre-wrap">{q.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(booking.room_url || booking.status === 'confirmed') && (
            <div className="pt-4 border-t border-neutral-100">
              <RoomJoinButton
                bookingId={booking.id}
                bookingDate={booking.booking_date}
                slot={booking.slot}
                sessionType={booking.session_type ?? null}
                roomUrl={booking.room_url}
                status={booking.status}
                variant="button"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}