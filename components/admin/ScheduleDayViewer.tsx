'use client';

import { useEffect, useState } from 'react';
import { nextDays } from '@/lib/booking';
import { getDaySchedule, type ScheduleViewerSlot } from '@/lib/scheduleViewer';
import { supabase } from '@/lib/supabase';
import LessonDetailModal, { type BookingDetail } from './LessonDetailModal';
import PaymentBadge, { getPaymentStatus } from './PaymentBadge';
import ScheduleCalendarView from './ScheduleCalendarView';

const PERIOD_LABELS: Record<string, string> = {
  Morning: '오전 · 00:00 — 12:00',
  Afternoon: '오후 · 12:00 — 18:00',
  Evening: '저녁 · 18:00 — 24:00',
};

const VIEW_TABS = [
  { key: 'day', label: '일별' },
  { key: 'week', label: '주별' },
  { key: 'month', label: '월별' },
];

function toBookingDetail(slot: ScheduleViewerSlot, date: string): BookingDetail | null {
  if (!slot.booking) return null;
  return {
    id: slot.booking.id,
    name: slot.booking.name,
    email: slot.booking.email,
    nationality: slot.booking.nationality,
    booking_date: date,
    slot: slot.start,
    created_at: '',
    room_url: slot.booking.roomUrl,
    site_name: '',
    coach_name: slot.coachName,
    lesson_name: '',
    lesson_content: '',
    feedback: '',
    notes: '',
    session_type: slot.booking.sessionType,
    status: slot.booking.status,
    paddle_transaction_id: slot.booking.paddleTransactionId,
    amount_paid: slot.booking.amountPaid,
    currency: slot.booking.currency,
  };
}

export default function ScheduleDayViewer() {
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [days, setDays] = useState<{ iso: string; label: string; weekday: string }[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<ScheduleViewerSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailSlot, setDetailSlot] = useState<ScheduleViewerSlot | null>(null);
  const [coachFilter, setCoachFilter] = useState('전체');
  const [actionMsg, setActionMsg] = useState('');
  const [actionStatus, setActionStatus] = useState<'idle' | 'loading'>('idle');

  useEffect(() => {
    const d = nextDays(14);
    setDays(d);
    setDate(d[0].iso);
  }, []);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    getDaySchedule(date).then((data) => {
      setSlots(data);
      setLoading(false);
    });
  }, [date]);

  const coaches = [...new Set(slots.map((s) => s.coachName))].sort();

  const filteredSlots = coachFilter === '전체'
    ? slots
    : slots.filter((s) => s.coachName === coachFilter);

  const periods = [...new Set(filteredSlots.map((s) => s.period))];
  const groups = periods.map((p) => ({
    label: PERIOD_LABELS[p] ?? p,
    list: filteredSlots.filter((s) => s.period === p),
  }));

  const totalSlots = filteredSlots.length;
  const bookedSlots = filteredSlots.filter((s) => s.isBooked).length;
  const availableSlots = totalSlots - bookedSlots;

  async function cancelBooking(bookingId: string) {
    if (!confirm('이 예약을 취소하시겠습니까?')) return;
    setActionStatus('loading');
    setActionMsg('');
    await supabase.from('coach_questions').delete().eq('booking_id', bookingId);
    const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
    if (error) {
      setActionMsg(error.message || '취소 실패');
    } else {
      setActionMsg('예약이 취소되었습니다.');
      if (date) {
        const data = await getDaySchedule(date);
        setSlots(data);
      }
    }
    setActionStatus('idle');
    setTimeout(() => setActionMsg(''), 3000);
  }

  async function changeBooking(bookingId: string) {
    const newDate = prompt('변경할 날짜를 입력하세요 (YYYY-MM-DD):', date ?? '');
    if (!newDate) return;
    const newSlot = prompt('변경할 시간을 입력하세요 (예: 10:00):');
    if (!newSlot) return;
    setActionStatus('loading');
    setActionMsg('');
    const { error } = await supabase.from('bookings').update({ booking_date: newDate, slot: newSlot }).eq('id', bookingId);
    if (error) {
      setActionMsg(error.message || '변경 실패');
    } else {
      setActionMsg('예약이 변경되었습니다.');
      if (date) {
        const data = await getDaySchedule(date);
        setSlots(data);
      }
    }
    setActionStatus('idle');
    setTimeout(() => setActionMsg(''), 3000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-neutral-500">
          일별/주별/월별로 예약 현황을 확인할 수 있습니다.
        </p>
        <div className="flex items-center gap-1 p-1 bg-white border border-neutral-200 rounded-full w-fit">
          {VIEW_TABS.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key as 'day' | 'week' | 'month')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition ${
                view === v.key ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {view !== 'day' && (
        <ScheduleCalendarView
          mode={view}
          onSelectDate={(d) => {
            setDate(d);
            setView('day');
          }}
        />
      )}

      {view === 'day' && (
        <>
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" /> 예약 완료</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-neutral-200" /> 예약 가능</span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {days.map((d) => (
              <button
                key={d.iso}
                onClick={() => setDate(d.iso)}
                className={`shrink-0 snap-start px-4 py-3 rounded-xl border text-center cursor-pointer transition min-w-[76px] ${
                  d.iso === date ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 bg-white hover:border-neutral-900'
                }`}
              >
                <div className="text-[10px] uppercase tracking-widest">{d.weekday}</div>
                <div className="text-sm font-semibold">{d.label}</div>
              </button>
            ))}
          </div>

          {coaches.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCoachFilter('전체')}
                className={`px-4 py-2 rounded-full text-sm border cursor-pointer whitespace-nowrap transition ${
                  coachFilter === '전체'
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-900'
                }`}
              >
                전체
              </button>
              {coaches.map((c) => (
                <button
                  key={c}
                  onClick={() => setCoachFilter(c)}
                  className={`px-4 py-2 rounded-full text-sm border cursor-pointer whitespace-nowrap transition ${
                    coachFilter === c
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-900'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {date && (
            <div className="flex gap-4 text-sm">
              <div className="px-4 py-2 rounded-xl bg-white border border-neutral-200">
                <span className="text-neutral-500">전체 슬롯</span>
                <span className="ml-2 font-semibold text-neutral-900">{totalSlots}</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-white border border-neutral-200">
                <span className="text-neutral-500">예약 완료</span>
                <span className="ml-2 font-semibold text-emerald-600">{bookedSlots}</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-white border border-neutral-200">
                <span className="text-neutral-500">예약 가능</span>
                <span className="ml-2 font-semibold text-neutral-900">{availableSlots}</span>
              </div>
            </div>
          )}

          {actionMsg && (
            <div className={`text-sm px-4 py-3 rounded-xl border ${actionMsg.includes('실패') ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
              {actionMsg}
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
              불러오는 중...
            </div>
          ) : filteredSlots.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
              이 날짜에 등록된 일정이 없습니다.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-6">
              {groups.map((g) => (
                <div key={g.label}>
                  <div className="text-xs uppercase tracking-widest text-neutral-500 mb-3">{g.label}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    {g.list.map((s) => (
                      <div
                        key={`${s.coachId}-${s.start}`}
                        className={`relative px-3 py-3 rounded-xl border text-left transition w-full ${
                          s.isBooked
                            ? 'border-emerald-200 bg-emerald-50'
                            : 'border-neutral-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {s.coachPhoto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.coachPhoto} alt={s.coachName} className="w-7 h-7 rounded-full object-cover object-top shrink-0" />
                          ) : (
                            <span className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-semibold text-neutral-600 shrink-0">
                              {s.coachName.charAt(0)}
                            </span>
                          )}
                          <span className="text-sm font-medium text-neutral-900 truncate">{s.coachName}</span>
                          {s.isBooked && (
                            <span className="ml-auto shrink-0 w-2 h-2 rounded-full bg-emerald-500" />
                          )}
                        </div>
                        <div className="mt-1.5 text-xs text-neutral-600">
                          {s.start} — {s.end}
                        </div>
                        {s.isBooked && s.booking && (
                          <div className="mt-1.5 text-xs font-medium text-emerald-700 truncate">
                            {s.booking.name}
                            <span className="text-emerald-500 font-normal ml-1">({s.booking.sessionType === 'free' ? '무료' : s.booking.sessionType})</span>
                          </div>
                        )}
                        {s.isBooked && s.booking && (
                          <div className="mt-1.5">
                            <PaymentBadge status={getPaymentStatus(s.booking.sessionType, s.booking.paddleTransactionId)} />
                          </div>
                        )}
                        {s.isBooked && s.booking && (
                          <div className="mt-2 flex gap-1.5">
                            <button
                              onClick={() => setDetailSlot(s)}
                              className="px-2.5 py-1.5 rounded-lg border border-emerald-300 text-xs text-emerald-700 hover:bg-emerald-100 cursor-pointer transition whitespace-nowrap"
                            >
                              상세
                            </button>
                            <button
                              onClick={() => changeBooking(s.booking!.id)}
                              disabled={actionStatus === 'loading'}
                              className="px-2.5 py-1.5 rounded-lg border border-neutral-300 text-xs text-neutral-700 hover:border-neutral-900 hover:text-neutral-900 cursor-pointer transition disabled:opacity-40 whitespace-nowrap"
                            >
                              변경
                            </button>
                            <button
                              onClick={() => cancelBooking(s.booking!.id)}
                              disabled={actionStatus === 'loading'}
                              className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-xs text-rose-600 hover:bg-rose-50 cursor-pointer transition disabled:opacity-40 whitespace-nowrap"
                            >
                              취소
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <LessonDetailModal booking={detailSlot ? toBookingDetail(detailSlot, date ?? '') : null} onClose={() => setDetailSlot(null)} />
        </>
      )}
    </div>
  );
}