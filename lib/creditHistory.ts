import { supabase } from './supabase';

export interface PurchaseRecord {
  order_id: string;
  pack_id: string;
  credits: number;
  amount: number;
  currency: string;
  payment_method: string | null;
  created_at: string;
  site_name: string | null;
}

export interface UsageRecord {
  id: string;
  booking_date: string;
  slot: string;
  coach_name: string;
  status: string | null;
  joined_at: string | null;
  session_type: string | null;
  refund_status: string | null;
  refund_reason: string | null;
  refund_requested_at: string | null;
  site_name: string | null;
}

export interface CoachSaleRecord {
  id: string;
  name: string;
  email: string;
  booking_date: string;
  slot: string;
  status: string | null;
  amount_paid: number | null;
  currency: string | null;
  payment_method: string | null;
  purchase_date: string | null;
  payment_note: string | null;
  session_type: string | null;
  lesson_name: string | null;
  site_name: string | null;
}

export const REFUND_WINDOW_DAYS = 7;

export function shortOrderNumber(orderId: string): string {
  if (!orderId) return '—';
  const clean = orderId.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return clean.length > 12 ? clean.slice(0, 12) : clean;
}

export function daysSince(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return Number.MAX_SAFE_INTEGER;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function canRequestRefund(u: UsageRecord): boolean {
  if (u.refund_status === 'requested' || u.refund_status === 'refunded') return false;
  if (u.status !== 'completed') return false;
  if (daysSince(u.booking_date) > REFUND_WINDOW_DAYS && u.refund_status !== 'declined') return false;
  return true;
}

export async function getMemberPurchases(email: string): Promise<PurchaseRecord[]> {
  const { data: orgs } = await supabase.from('organizations').select('id, name');
  const orgNameMap = new Map((orgs ?? []).map((o) => [o.id, o.name as string]));

  const { data } = await supabase
    .from('orders')
    .select('order_id, pack_id, credits, amount, currency, payment_method, created_at, organization_id')
    .eq('member_email', email.toLowerCase())
    .eq('status', 'completed')
    .order('created_at', { ascending: false });
  return (data ?? []).map((o) => ({ ...o, site_name: orgNameMap.get(o.organization_id) ?? null })) as PurchaseRecord[];
}

export async function getMemberUsage(email: string): Promise<UsageRecord[]> {
  const { data: coaches } = await supabase.from('coaches').select('id, name');
  const nameMap = new Map((coaches ?? []).map((c) => [c.id, c.name as string]));

  const { data: orgs } = await supabase.from('organizations').select('id, name');
  const orgNameMap = new Map((orgs ?? []).map((o) => [o.id, o.name as string]));

  const { data } = await supabase
    .from('bookings')
    .select('id, coach_id, booking_date, slot, status, joined_at, session_type, refund_status, refund_reason, refund_requested_at, organization_id')
    .eq('email', email.toLowerCase())
    .eq('credit_deducted', true)
    .order('booking_date', { ascending: false });

  return (data ?? []).map((b) => ({
    ...b,
    coach_name: nameMap.get(b.coach_id) ?? '—',
    site_name: orgNameMap.get(b.organization_id) ?? null,
  }));
}

export async function getCoachSales(coachId: string): Promise<CoachSaleRecord[]> {
  const { data: orgs } = await supabase.from('organizations').select('id, name');
  const orgNameMap = new Map((orgs ?? []).map((o) => [o.id, o.name as string]));

  const { data } = await supabase
    .from('bookings')
    .select('id, name, email, booking_date, slot, status, amount_paid, currency, payment_method, purchase_date, payment_note, session_type, lesson_name, organization_id, credit_deducted')
    .eq('coach_id', coachId)
    .or('amount_paid.not.is.null,credit_deducted.eq.true')
    .order('created_at', { ascending: false });

  return (data ?? []).map((b) => ({
    ...b,
    site_name: orgNameMap.get(b.organization_id) ?? '—',
  })) as CoachSaleRecord[];
}

export async function requestRefund(bookingId: string, reason: string): Promise<{ error: string | null }> {
  const { data: booking } = await supabase
    .from('bookings')
    .select('organization_id')
    .eq('id', bookingId)
    .maybeSingle();

  const { data: orgs } = await supabase.from('organizations').select('id, name');
  const orgNameMap = new Map((orgs ?? []).map((o) => [o.id, o.name as string]));
  const siteName = booking?.organization_id ? (orgNameMap.get(booking.organization_id) ?? null) : null;

  const patch: Record<string, unknown> = {
    refund_status: 'requested',
    refund_reason: reason,
    refund_requested_at: new Date().toISOString(),
  };
  if (siteName) patch.site_name = siteName;

  const { error } = await supabase
    .from('bookings')
    .update(patch)
    .eq('id', bookingId);
  if (error) return { error: error.message };

  await supabase.functions.invoke('notify-refund-request', {
    body: { bookingId, reason, siteName },
  });

  return { error: null };
}

export async function transferCredits(toEmail: string, credits: number): Promise<{ error: string | null; remaining?: number }> {
  const { data, error } = await supabase.functions.invoke('transfer-credits', {
    body: { toEmail, credits },
  });
  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };
  return { error: null, remaining: data?.remaining };
}