import { supabase } from './supabase';
import type { CoachSchedule } from './coachSchedule';

export interface ScheduleViewerSlot {
  start: string;
  end: string;
  period: 'Morning' | 'Afternoon' | 'Evening';
  coachId: string;
  coachName: string;
  coachPhoto: string | null;
  isBooked: boolean;
  booking?: {
    id: string;
    name: string;
    email: string;
    nationality: string | null;
    sessionType: string;
    status: string | null;
    roomUrl: string | null;
    paddleTransactionId: string | null;
    amountPaid: number | null;
    currency: string | null;
  };
}

function fmt(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function getPeriod(minutes: number): 'Morning' | 'Afternoon' | 'Evening' {
  if (minutes < 12 * 60) return 'Morning';
  if (minutes < 18 * 60) return 'Afternoon';
  return 'Evening';
}

export interface CalendarBooking {
  id: string;
  name: string;
  email: string;
  booking_date: string;
  slot: string;
  coach_name: string;
  session_type: string;
  status: string | null;
}

export async function getBookingsForRange(start: string, end: string): Promise<CalendarBooking[]> {
  const { data: coachesData } = await supabase.from('coaches').select('id, name');
  const coachMap = new Map((coachesData ?? []).map((c) => [c.id, c.name as string]));
  const coachIds = [...coachMap.keys()];
  if (coachIds.length === 0) return [];

  const { data } = await supabase
    .from('bookings')
    .select('id, coach_id, name, email, booking_date, slot, session_type, status')
    .gte('booking_date', start)
    .lte('booking_date', end)
    .in('coach_id', coachIds)
    .order('booking_date', { ascending: true })
    .order('slot', { ascending: true });

  return ((data ?? []) as any[]).map((b) => ({
    id: b.id,
    name: b.name,
    email: b.email,
    booking_date: b.booking_date,
    slot: b.slot,
    coach_name: coachMap.get(b.coach_id) ?? 'Unknown',
    session_type: b.session_type,
    status: b.status,
  }));
}

export async function getDaySchedule(dateStr: string): Promise<ScheduleViewerSlot[]> {
  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay();

  // coaches
  const { data: coachesData } = await supabase.from('coaches').select('id, name, photo').order('name', { ascending: true });
  const coaches = (coachesData ?? []) as { id: string; name: string; photo: string | null }[];
  if (coaches.length === 0) return [];

  // schedules
  const { data: schedulesData } = await supabase
    .from('coach_schedules')
    .select('*')
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .in('coach_id', coaches.map((c) => c.id))
    .order('start_time', { ascending: true });
  const schedules = (schedulesData ?? []) as CoachSchedule[];

  // bookings
  const { data: bookingsData } = await supabase
    .from('bookings')
    .select('id, coach_id, slot, name, email, nationality, session_type, status, room_url, paddle_transaction_id, amount_paid, currency')
    .eq('booking_date', dateStr)
    .in('coach_id', coaches.map((c) => c.id));
  const bookings = (bookingsData ?? []) as {
    id: string;
    coach_id: string;
    slot: string;
    name: string;
    email: string;
    nationality: string | null;
    session_type: string;
    status: string | null;
    room_url: string | null;
    paddle_transaction_id: string | null;
    amount_paid: number | null;
    currency: string | null;
  }[];

  const coachMap = new Map(coaches.map((c) => [c.id, c]));
  const bookingMap = new Map<string, typeof bookings[0]>();
  for (const b of bookings) {
    const key = `${b.coach_id}|${b.slot}`;
    bookingMap.set(key, b);
  }

  const slots: ScheduleViewerSlot[] = [];
  for (const sch of schedules) {
    const coach = coachMap.get(sch.coach_id);
    if (!coach) continue;
    const startMin = timeToMinutes(sch.start_time);
    const endMin = timeToMinutes(sch.end_time);
    const interval = sch.interval_minutes;
    const session = sch.session_minutes;

    for (let t = startMin; t + session <= endMin; t += interval) {
      const start = fmt(t);
      const end = fmt(t + session);
      const key = `${sch.coach_id}|${start}`;
      const b = bookingMap.get(key);
      slots.push({
        start,
        end,
        period: getPeriod(t),
        coachId: sch.coach_id,
        coachName: coach.name,
        coachPhoto: coach.photo,
        isBooked: !!b,
        booking: b
          ? {
              id: b.id,
              name: b.name,
              email: b.email,
              nationality: b.nationality,
              sessionType: b.session_type,
              status: b.status,
              roomUrl: b.room_url,
              paddleTransactionId: b.paddle_transaction_id,
              amountPaid: b.amount_paid,
              currency: b.currency,
            }
          : undefined,
      });
    }
  }

  return slots.sort((a, b) => {
    if (a.start !== b.start) return a.start.localeCompare(b.start);
    return a.coachName.localeCompare(b.coachName);
  });
}