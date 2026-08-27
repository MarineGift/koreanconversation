import { supabase } from './supabase';
import type { CoachSchedule } from './coachSchedule';
import { kstNow, kstTimestamp, kstTodayIso } from './kst';

export interface Coach {
  id: string;
  name: string;
  title: string | null;
  headline?: string | null;   // ← 추가
  bio: string | null;
  photo: string | null;
  email: string | null;
  specialties?: string[] | null;
  credentials?: string[] | null;
}

export interface Slot {
  start: string;
  end: string;
  period: 'Morning' | 'Afternoon' | 'Evening';
  orgId?: string | null;
  orgName?: string | null;
  unavailable?: boolean;
}

export interface BookedSlotInfo {
  slot: string;
  orgId: string | null;
  siteName: string | null;
}

const MORNING_START = 8 * 60;
const MORNING_END = 12 * 60;
const EVENING_START = 20 * 60;
const EVENING_END = 24 * 60;
const INTERVAL = 40;
const SESSION = 30;

const FREE_START = 13 * 60;
const FREE_END = 18 * 60;
const FREE_CYCLE = 15;
const FREE_SESSION = 10;

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

export function generateSlots(): Slot[] {
  const slots: Slot[] = [];
  for (let t = MORNING_START; t + SESSION <= MORNING_END; t += INTERVAL) {
    slots.push({ start: fmt(t), end: fmt(t + SESSION), period: 'Morning' });
  }
  for (let t = EVENING_START; t + SESSION <= EVENING_END; t += INTERVAL) {
    slots.push({ start: fmt(t), end: fmt(t + SESSION), period: 'Evening' });
  }
  return slots;
}

export function generateFreeSlots(): Slot[] {
  const slots: Slot[] = [];
  for (let t = FREE_START; t + FREE_SESSION <= FREE_END; t += FREE_CYCLE) {
    slots.push({ start: fmt(t), end: fmt(t + FREE_SESSION), period: 'Afternoon' });
  }
  return slots;
}

export async function getCoachSlots(coachId: string, dateStr: string, type: 'regular' | 'free' = 'regular', orgId?: string | null): Promise<Slot[]> {
  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay();

  const { data: allSchedules } = await supabase
    .from('coach_schedules')
    .select('*')
    .eq('coach_id', coachId)
    .eq('is_active', true);

  const siteScoped = (allSchedules ?? []).filter((s) => s.organization_id === orgId);
  const pool = siteScoped.length > 0
    ? siteScoped
    : (allSchedules ?? []).filter((s) => s.organization_id == null);

  const schedules = pool.filter(
    (s) => s.day_of_week === dayOfWeek && s.schedule_type === type
  );

  if ((allSchedules ?? []).length === 0) {
    return filterPastSlots(type === 'regular' ? generateSlots() : generateFreeSlots(), dateStr);
  }

  const slots: Slot[] = [];
  for (const sch of schedules as CoachSchedule[]) {
    const startMin = timeToMinutes(sch.start_time);
    const endMin = timeToMinutes(sch.end_time);
    const interval = sch.interval_minutes;
    const session = sch.session_minutes;

    for (let t = startMin; t + session <= endMin; t += interval) {
      slots.push({
        start: fmt(t),
        end: fmt(t + session),
        period: getPeriod(t),
      });
    }
  }

  const unavailable = await getCoachUnavailableSlots(coachId, dateStr);
  const unavailableSet = new Set(unavailable);
  const marked = slots.map((s) => (unavailableSet.has(s.start) ? { ...s, unavailable: true } : s));

  return filterPastSlots(marked, dateStr);
}

export async function getCoachSlotsAllSites(coachId: string, dateStr: string, type: 'regular' | 'free' = 'regular'): Promise<Slot[]> {
  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay();

  const { data: allSchedules } = await supabase
    .from('coach_schedules')
    .select('*, organizations!inner(name)')
    .eq('coach_id', coachId)
    .eq('is_active', true);

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name');
  const orgNameMap = new Map((orgs ?? []).map((o) => [o.id, o.name]));

  const schedules = (allSchedules ?? []).filter(
    (s) => s.day_of_week === dayOfWeek && s.schedule_type === type
  );

  if ((allSchedules ?? []).length === 0) {
    const defaultSlots = type === 'regular' ? generateSlots() : generateFreeSlots();
    return filterPastSlots(defaultSlots, dateStr);
  }

  const slots: Slot[] = [];
  for (const sch of schedules as CoachSchedule[]) {
    const startMin = timeToMinutes(sch.start_time);
    const endMin = timeToMinutes(sch.end_time);
    const interval = sch.interval_minutes;
    const session = sch.session_minutes;

    for (let t = startMin; t + session <= endMin; t += interval) {
      slots.push({
        start: fmt(t),
        end: fmt(t + session),
        period: getPeriod(t),
        orgId: sch.organization_id ?? null,
        orgName: sch.organization_id ? (orgNameMap.get(sch.organization_id) ?? null) : null,
      });
    }
  }

  const unavailable = await getCoachUnavailableSlots(coachId, dateStr);
  const unavailableSet = new Set(unavailable);
  const marked = slots.map((s) => (unavailableSet.has(s.start) ? { ...s, unavailable: true } : s));

  return filterPastSlots(marked, dateStr);
}

export async function getCoachSites(coachId: string): Promise<{ id: string; name: string }[]> {
  const { data: sites } = await supabase
    .from('coach_sites')
    .select('organization_id')
    .eq('coach_id', coachId);
  const orgIds = [...new Set((sites ?? []).map((s) => s.organization_id))];
  if (orgIds.length === 0) return [];
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .in('id', orgIds)
    .order('created_at', { ascending: true });
  return (orgs ?? []).map((o) => ({ id: o.id, name: o.name }));
}

export async function getCoachUnavailableSlots(coachId: string, dateStr: string): Promise<string[]> {
  const { data } = await supabase
    .from('coach_unavailable')
    .select('slot')
    .eq('coach_id', coachId)
    .eq('unavailable_date', dateStr);
  return (data ?? []).map((r: any) => r.slot);
}

export async function addCoachUnavailable(coachId: string, dateStr: string, slot: string): Promise<{ error: string | null }> {
  const { data: existing } = await supabase
    .from('coach_unavailable')
    .select('id')
    .eq('coach_id', coachId)
    .eq('unavailable_date', dateStr)
    .eq('slot', slot)
    .maybeSingle();
  if (existing) return { error: null };

  const { error } = await supabase
    .from('coach_unavailable')
    .insert({ coach_id: coachId, unavailable_date: dateStr, slot });
  return { error: error ? error.message : null };
}

export async function removeCoachUnavailable(coachId: string, dateStr: string, slot: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('coach_unavailable')
    .delete()
    .eq('coach_id', coachId)
    .eq('unavailable_date', dateStr)
    .eq('slot', slot);
  return { error: error ? error.message : null };
}

export async function getAllBookedSlotsForCoach(coachId: string, dateStr: string): Promise<BookedSlotInfo[]> {
  const { data } = await supabase
    .from('bookings')
    .select('slot, organization_id, organizations(name)')
    .eq('coach_id', coachId)
    .eq('booking_date', dateStr)
    .in('status', ['pending', 'confirmed']);

  return (data ?? []).map((row: any) => ({
    slot: row.slot,
    orgId: row.organization_id ?? null,
    siteName: row.organizations?.name ?? null,
  }));
}

function localDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function todayIso(): string {
  return kstTodayIso();
}

function filterPastSlots(slots: Slot[], dateStr: string): Slot[] {
  const minStart = Date.now() + 5 * 60 * 1000;
  return slots.filter((s) => {
    const dt = kstTimestamp(dateStr, s.start);
    return !isNaN(dt) && dt >= minStart;
  });
}

export function nextDays(n: number): { iso: string; label: string; weekday: string }[] {
  const days: { iso: string; label: string; weekday: string }[] = [];
  const now = kstNow();
  for (let i = 0; i < n; i++) {
    const dt = new Date(now);
    dt.setDate(now.getDate() + i);
    days.push({
      iso: localDate(dt),
      label: `${dt.toLocaleDateString('en-US', { month: 'short' })} ${dt.getDate()}`,
      weekday: dt.toLocaleDateString('en-US', { weekday: 'short' }),
    });
  }
  return days;
}

export async function getCoachesForOrg(orgId: string): Promise<Coach[]> {
  const { data: sites } = await supabase
    .from('coach_sites')
    .select('coach_id')
    .eq('organization_id', orgId);

  const coachIds = (sites ?? []).map((s) => s.coach_id);
  if (coachIds.length === 0) return [];

  const { data: coaches } = await supabase
    .from('coaches')
    .select('id, name, title, bio, photo, email')
    .in('id', coachIds)
    .order('created_at', { ascending: true });

  const { data: profiles } = await supabase
    .from('coach_profiles')
    .select('coach_id, headline, bio, specialties, credentials')
    .eq('organization_id', orgId)
    .in('coach_id', coachIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.coach_id, p]));

  return (coaches ?? []).map((c) => {
  const p = profileMap.get(c.id);
  return {
    id: c.id,
    name: c.name,
    title: p?.headline ?? c.title ?? null,
    headline: p?.headline ?? c.headline ?? null,   // ← 추가
    bio: p?.bio ?? c.bio ?? null,
    photo: c.photo ?? null,
    email: c.email ?? null,
    specialties: p?.specialties ?? null,
    credentials: p?.credentials ?? null,
  };
});
}

export async function confirmBooking(bookingId: string): Promise<{ error: string | null }> {
  const { data, error } = await supabase.functions.invoke('confirm-booking', {
    body: { bookingId },
  });
  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };
  return { error: null };
}