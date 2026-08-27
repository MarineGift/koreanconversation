import { supabase } from './supabase';
import { getSessionRange } from './session';
import type { CoachQuestion } from './questions';

export interface DashboardBooking {
  id: string;
  name: string;
  email: string;
  nationality: string | null;
  booking_date: string;
  slot: string;
  created_at: string;
  room_url: string | null;
  coach_name: string;
  site_name: string;
  lesson_name: string | null;
  lesson_content: string | null;
  feedback: string | null;
  notes: string | null;
  session_type: string | null;
  status: string | null;
  paddle_transaction_id: string | null;
  amount_paid: number | null;
  currency: string | null;
  refund_status: string | null;
  refund_reason: string | null;
  comment: string | null;
  payment_method: string | null;
  purchase_date: string | null;
  payment_note: string | null;
  questions?: CoachQuestion[];
}

export interface DashboardOrder {
  id: string;
  member_email: string;
  amount: number;
  currency: string | null;
  status: string | null;
  organization_id: string | null;
  created_at: string;
  site_name: string;
}

export interface DashboardCoach {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  photo: string | null;
  email: string | null;
  approval_status: string | null;
  site_names: string[];
}

export interface DashboardSubscriber {
  id: string;
  name: string | null;
  email: string;
  level: string | null;
  nationality: string | null;
  created_at: string;
  site_name: string;
  consent: boolean;
}

export interface DashboardData {
  bookings: DashboardBooking[];
  coaches: DashboardCoach[];
  subscribers: DashboardSubscriber[];
  totalBookings: number;
  totalCoaches: number;
  totalSubscribers: number;
  orders: DashboardOrder[];
}

export interface DashboardMaterial {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  file_url: string | null;
  created_at: string;
}

export async function getMaterials(): Promise<DashboardMaterial[]> {
  const { data } = await supabase
    .from('materials')
    .select('id, title, category, description, file_url, created_at')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function updateBookingStatus(id: string, status: string) {
  if (status === 'confirmed') {
    const { data, error } = await supabase.functions.invoke('confirm-booking', {
      body: { bookingId: id },
    });
    if (error) return error;
    if (data?.error) return new Error(data.error);
    return null;
  }
  const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
  return error;
}

export async function cancelBooking(id: string, reason: string) {
  const { data, error } = await supabase.functions.invoke('decline-booking', {
    body: { bookingId: id, reason },
  });
  if (error) return error;
  if (data?.error) return new Error(data.error);
  return null;
}

export async function autoCompletePastBookings<T extends {
  id: string;
  status: string | null;
  booking_date: string;
  slot: string;
  session_type: string | null;
}>(bookings: T[]): Promise<Map<string, string>> {
  const now = Date.now();
  const due = bookings.filter(
    (b) => b.status === 'confirmed' && getSessionRange(b.booking_date, b.slot, b.session_type).end <= now
  );
  const statusMap = new Map<string, string>();
  await Promise.all(
    due.map(async (b) => {
      const { data } = await supabase.functions.invoke('settle-booking', {
        body: { bookingId: b.id },
      });
      statusMap.set(b.id, data?.status ?? 'completed');
    })
  );
  return statusMap;
}

export async function updateCoachApproval(coachIds: string[], status: 'approved' | 'rejected') {
  const { error } = await supabase.from('coaches').update({ approval_status: status }).in('id', coachIds);
  return error;
}

export async function refundBooking(bookingId: string, reason: string) {
  const { data: booking } = await supabase
    .from('bookings')
    .select('email, credit_deducted, quantity, coach_name')
    .eq('id', bookingId)
    .maybeSingle();

  const { error } = await supabase
    .from('bookings')
    .update({ refund_status: 'refunded', refund_reason: reason })
    .eq('id', bookingId);
  if (error) return error;

  if (booking?.credit_deducted && booking.email) {
    const qty = booking.quantity && booking.quantity > 0 ? booking.quantity : 1;
    const { data: member } = await supabase
      .from('members')
      .select('session_credits')
      .eq('email', booking.email.toLowerCase())
      .maybeSingle();
    const current = member?.session_credits ?? 0;
    await supabase
      .from('members')
      .update({ session_credits: current + qty })
      .eq('email', booking.email.toLowerCase());
  }

  try {
    await supabase.functions.invoke('notify-refund-result', {
      body: { bookingId, result: 'approved', reason, coachName: booking?.coach_name ?? '' },
    });
  } catch (e) {
    console.error('notify-refund-result failed', e);
  }

  return null;
}

export async function declineRefund(bookingId: string, reason: string) {
  const { data: booking } = await supabase
    .from('bookings')
    .select('email, coach_name')
    .eq('id', bookingId)
    .maybeSingle();

  const { error } = await supabase
    .from('bookings')
    .update({ refund_status: 'declined', refund_reason: reason })
    .eq('id', bookingId);
  if (error) return error;

  try {
    await supabase.functions.invoke('notify-refund-result', {
      body: { bookingId, result: 'declined', reason, coachName: booking?.coach_name ?? '' },
    });
  } catch (e) {
    console.error('notify-refund-result failed', e);
  }

  return null;
}

export async function addMaterial(input: { title: string; category: string; description: string }) {
  return supabase.from('materials').insert(input);
}

export async function updateMaterial(id: string, input: { title: string; category: string; description: string }) {
  return supabase.from('materials').update(input).eq('id', id);
}

export async function deleteMaterial(id: string) {
  return supabase.from('materials').delete().eq('id', id);
}

export async function getDashboardData(): Promise<DashboardData> {
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .order('created_at', { ascending: true });

  const { data: coaches } = await supabase
    .from('coaches')
    .select('id, name, title, bio, photo, email, approval_status')
    .order('created_at', { ascending: true });

  const { data: coachSites } = await supabase
    .from('coach_sites')
    .select('coach_id, organization_id');

  const orgNameMap = new Map((orgs ?? []).map((o) => [o.id, o.name as string]));

  const coachSitesMap = new Map<string, string[]>();
  for (const cs of coachSites ?? []) {
    const arr = coachSitesMap.get(cs.coach_id) ?? [];
    arr.push(cs.organization_id);
    coachSitesMap.set(cs.coach_id, arr);
  }

  const coachMap = new Map(
    (coaches ?? []).map((c) => [c.id, { name: c.name, orgIds: coachSitesMap.get(c.id) ?? [] }])
  );
  const coachIds = (coaches ?? []).map((c) => c.id);

  let bookings: any[] = [];
  let questions: CoachQuestion[] = [];
  if (coachIds.length > 0) {
    const [bookingsRes, questionsRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, coach_id, organization_id, name, email, nationality, booking_date, slot, room_url, created_at, lesson_name, lesson_content, feedback, notes, session_type, status, paddle_transaction_id, amount_paid, currency, refund_status, refund_reason, comment, payment_method, purchase_date, payment_note')
        .in('coach_id', coachIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('coach_questions')
        .select('*')
        .in('coach_id', coachIds)
        .order('created_at', { ascending: false }),
    ]);
    bookings = bookingsRes.data ?? [];
    questions = (questionsRes.data ?? []) as CoachQuestion[];
  }

  const qByBooking = new Map<string, CoachQuestion[]>();
  for (const q of questions) {
    if (q.booking_id) {
      const arr = qByBooking.get(q.booking_id) ?? [];
      arr.push(q);
      qByBooking.set(q.booking_id, arr);
    }
  }

  const { data: subscribers } = await supabase
    .from('mailing_list')
    .select('id, name, email, level, nationality, created_at, organization_id, consent')
    .order('created_at', { ascending: false });

  const { data: orders } = await supabase
    .from('orders')
    .select('id, member_email, amount, currency, status, organization_id, created_at')
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  const mappedBookings = bookings.map((b) => {
    const coach = coachMap.get(b.coach_id);
    const orgId = b.organization_id ?? coach?.orgIds[0] ?? null;
    return {
      ...b,
      coach_name: coach?.name ?? 'Unknown',
      site_name: orgNameMap.get(orgId ?? '') ?? 'Unknown',
      questions: qByBooking.get(b.id) ?? [],
    };
  });

  const completedIds = await autoCompletePastBookings(mappedBookings);
  const finalBookings =
    completedIds.size > 0
      ? mappedBookings.map((b) => (completedIds.has(b.id) ? { ...b, status: completedIds.get(b.id)! } : b))
      : mappedBookings;

  return {
    bookings: finalBookings,
    coaches: (coaches ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      title: c.title,
      bio: c.bio,
      photo: c.photo,
      email: c.email,
      approval_status: c.approval_status,
      site_names: (coachSitesMap.get(c.id) ?? []).map((oid) => orgNameMap.get(oid) ?? 'Unknown'),
    })),
    subscribers: (subscribers ?? []).map((s) => ({
      ...s,
      consent: s.consent !== false,
      site_name: orgNameMap.get(s.organization_id ?? '') ?? 'Unknown',
    })),
    totalBookings: bookings.length,
    totalCoaches: (coaches ?? []).length,
    totalSubscribers: (subscribers ?? []).length,
    orders: (orders ?? []).map((o) => ({
      ...o,
      site_name: orgNameMap.get(o.organization_id ?? '') ?? 'Unknown',
    })),
  };
}