import { supabase } from './supabase';
import { getOrgId } from './org';
import { autoCompletePastBookings } from './dashboard';

export type Role = 'admin' | 'coach' | 'member';

export interface MemberRecord {
  email: string;
  password: string | null;
  full_name: string | null;
  nationality: string | null;
  study_purpose: string | null;
  organization_id: string | null;
  inputter: string | null;
  created_at: string;
  updated_at: string;
  role: string | null;
  session_credits: number | null;
  billing_region: string | null;
}

export interface MemberInput {
  email: string;
  full_name?: string | null;
  nationality?: string | null;
  study_purpose?: string | null;
  organization_id?: string | null;
  inputter?: string | null;
  password?: string | null;
  role?: string | null;
  session_credits?: number | null;
  billing_region?: string | null;
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export async function getMemberByEmail(email: string): Promise<MemberRecord | null> {
  const { data } = await supabase
    .from('members')
    .select('*')
    .eq('email', normalizeEmail(email))
    .maybeSingle();
  return (data as MemberRecord) ?? null;
}

export async function getMemberCredits(email: string): Promise<number> {
  const { data } = await supabase
    .from('members')
    .select('session_credits')
    .eq('email', normalizeEmail(email))
    .maybeSingle();
  return data?.session_credits ?? 0;
}

export async function addMemberCredits(email: string, amount: number): Promise<boolean> {
  const member = await getMemberByEmail(email);
  const current = member?.session_credits ?? 0;
  const { error } = await supabase
    .from('members')
    .update({ session_credits: current + amount })
    .eq('email', normalizeEmail(email));
  return !error;
}

export async function decrementMemberCredits(email: string): Promise<boolean> {
  const member = await getMemberByEmail(email);
  if (!member || (member.session_credits ?? 0) <= 0) return false;
  const { error } = await supabase
    .from('members')
    .update({ session_credits: (member.session_credits ?? 0) - 1 })
    .eq('email', normalizeEmail(email));
  return !error;
}

export async function upsertMember(input: MemberInput): Promise<{ error: string | null }> {
  const email = normalizeEmail(input.email);
  if (!email) return { error: '이메일이 필요합니다.' };

  const existing = await getMemberByEmail(email);
  if (existing) {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.full_name != null) patch.full_name = input.full_name;
    if (input.nationality != null) patch.nationality = input.nationality;
    if (input.study_purpose != null) patch.study_purpose = input.study_purpose;
    if (input.organization_id != null) patch.organization_id = input.organization_id;
    if (input.password != null && input.password !== '') patch.password = input.password;
    if (input.inputter != null) patch.inputter = input.inputter;
    if (input.role != null) patch.role = input.role;
    if (input.session_credits != null) patch.session_credits = input.session_credits;
    if (input.billing_region != null) patch.billing_region = input.billing_region;
    const { error } = await supabase.from('members').update(patch).eq('email', email);
    return { error: error ? error.message : null };
  }

  const billingRegion = input.billing_region ?? null;
  const { error } = await supabase.from('members').insert([{
    email,
    full_name: input.full_name ?? null,
    nationality: input.nationality ?? null,
    study_purpose: input.study_purpose ?? null,
    organization_id: input.organization_id ?? null,
    inputter: input.inputter ?? null,
    password: input.password ?? null,
    role: input.role ?? 'member',
    session_credits: input.session_credits ?? 0,
    billing_region: billingRegion,
  }]);
  return { error: error ? error.message : null };
}

export async function deleteMember(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('members').delete().eq('email', normalizeEmail(email));
  return { error: error ? error.message : null };
}

export async function listMembers(orgId?: string | null): Promise<MemberRecord[]> {
  let query = supabase.from('members').select('*').order('created_at', { ascending: false });
  if (orgId) query = query.eq('organization_id', orgId);
  const { data, error } = await query;
  if (error) {
    console.error('listMembers error:', error);
    return [];
  }
  return (data ?? []) as MemberRecord[];
}

export async function getMemberStudyHistory(email: string): Promise<MemberBooking[]> {
  const { data: allCoaches } = await supabase.from('coaches').select('id, name');
  const nameMap = new Map((allCoaches ?? []).map((c) => [c.id, c.name as string]));

  const { data } = await supabase
    .from('bookings')
    .select('id, coach_id, name, email, booking_date, slot, status, room_url, created_at, session_type')
    .eq('email', normalizeEmail(email))
    .order('created_at', { ascending: false });

  return (data ?? []).map((b) => ({
    ...b,
    coach_name: nameMap.get(b.coach_id) ?? '—',
  }));
}

export interface MemberBooking {
  id: string;
  name: string;
  email: string;
  booking_date: string;
  slot: string;
  status: string | null;
  room_url: string | null;
  coach_name: string;
  created_at: string;
  session_type: string | null;
  site_name?: string;
  comment?: string | null;
  lesson_content?: string | null;
  questions?: { id: string; question: string | null; answer: string | null }[];
}

export interface MemberProfile {
  name: string;
  email: string;
  role: Role;
  coachId: string | null;
  coachTitle: string | null;
}

export interface RoleInfo {
  role: Role;
  coachId: string | null;
  coachTitle: string | null;
}

export async function detectRole(email: string, metadataRole?: string | null): Promise<RoleInfo> {
  if (metadataRole === 'admin') {
    return { role: 'admin', coachId: null, coachTitle: null };
  }

  const { data: member } = await supabase
    .from('members')
    .select('role')
    .eq('email', email)
    .maybeSingle();

  if (member?.role === 'admin') {
    return { role: 'admin', coachId: null, coachTitle: null };
  }

  const { data } = await supabase
    .from('coaches')
    .select('id, title')
    .eq('email', email)
    .maybeSingle();
  const coach = data as { id: string; title: string | null } | null;

  if (coach) {
    return { role: 'coach', coachId: coach.id, coachTitle: coach.title };
  }

  return { role: 'member', coachId: null, coachTitle: null };
}

export async function getMyBookings(role: Role, coachId: string | null, email: string): Promise<MemberBooking[]> {
  const orgId = await getOrgId();
  if (!orgId) return [];

  const { data: allCoaches } = await supabase
    .from('coaches')
    .select('id, name');
  const nameMap = new Map((allCoaches ?? []).map((c) => [c.id, c.name as string]));

  const { data: sites } = await supabase
    .from('coach_sites')
    .select('coach_id')
    .eq('organization_id', orgId);
  const coachIds = (sites ?? []).map((s) => s.coach_id);

  const { data: orgs } = await supabase.from('organizations').select('id, name');
  const orgNameMap = new Map((orgs ?? []).map((o) => [o.id, o.name as string]));

  const select = 'id, coach_id, name, email, booking_date, slot, status, room_url, created_at, session_type, organization_id, comment, lesson_content';
  let rows: any[] = [];

  if (role === 'admin') {
    if (coachIds.length === 0) return [];
    const { data } = await supabase
      .from('bookings')
      .select(select)
      .in('coach_id', coachIds)
      .order('created_at', { ascending: false });
    rows = data ?? [];
  } else if (role === 'coach' && coachId) {
    const { data } = await supabase
      .from('bookings')
      .select(select)
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });
    rows = data ?? [];
  } else {
    const { data } = await supabase
      .from('bookings')
      .select(select)
      .eq('email', email)
      .order('created_at', { ascending: false });
    rows = data ?? [];
  }

  const bookingIds = rows.map((r) => r.id);
  let qMap = new Map<string, { id: string; question: string | null; answer: string | null }[]>();
  if (bookingIds.length > 0) {
    const { data: questions } = await supabase
      .from('coach_questions')
      .select('id, booking_id, question, answer')
      .in('booking_id', bookingIds);
    for (const q of questions ?? []) {
      const arr = qMap.get(q.booking_id) ?? [];
      arr.push({ id: q.id, question: q.question, answer: q.answer });
      qMap.set(q.booking_id, arr);
    }
  }

  const mapped = rows.map((b) => ({
    ...b,
    coach_name: nameMap.get(b.coach_id) ?? '—',
    site_name: orgNameMap.get(b.organization_id) ?? '—',
    questions: qMap.get(b.id) ?? [],
  }));

  const completedIds = await autoCompletePastBookings(mapped);
  return completedIds.size > 0
    ? mapped.map((b) => (completedIds.has(b.id) ? { ...b, status: completedIds.get(b.id)! } : b))
    : mapped;
}