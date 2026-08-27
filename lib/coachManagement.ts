import { supabase } from './supabase';

export interface CoachOrg {
  id: string;
  slug: string;
  name: string;
}

export interface CoachProfile {
  id: string;
  coach_id: string;
  organization_id: string;
  headline: string | null;
  bio: string | null;
  specialties: string[];
  credentials: string[];
}

export interface CoachWithSites {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
  photo: string | null;
  site_ids: string[];
  profiles: CoachProfile[];
}

export interface CoachManagementData {
  coaches: CoachWithSites[];
  organizations: CoachOrg[];
}

export async function fetchCoachManagement(): Promise<CoachManagementData> {
  const [coachesRes, orgsRes, sitesRes, profilesRes] = await Promise.all([
    supabase.from('coaches').select('id, name, title, email, photo').order('created_at', { ascending: true }),
    supabase.from('organizations').select('id, slug, name').order('created_at', { ascending: true }),
    supabase.from('coach_sites').select('coach_id, organization_id'),
    supabase.from('coach_profiles').select('id, coach_id, organization_id, headline, bio, specialties, credentials'),
  ]);

  const organizations = (orgsRes.data ?? []) as CoachOrg[];
  const sites = sitesRes.data ?? [];
  const profiles = (profilesRes.data ?? []) as CoachProfile[];

  const siteMap = new Map<string, string[]>();
  for (const s of sites) {
    const arr = siteMap.get(s.coach_id) ?? [];
    arr.push(s.organization_id);
    siteMap.set(s.coach_id, arr);
  }

  const profilesMap = new Map<string, CoachProfile[]>();
  for (const p of profiles) {
    const arr = profilesMap.get(p.coach_id) ?? [];
    arr.push(p);
    profilesMap.set(p.coach_id, arr);
  }

  const coaches = ((coachesRes.data ?? []) as any[]).map((c) => ({
    id: c.id,
    name: c.name,
    title: c.title,
    email: c.email,
    photo: c.photo,
    site_ids: siteMap.get(c.id) ?? [],
    profiles: profilesMap.get(c.id) ?? [],
  }));

  return { coaches, organizations };
}

export async function assignCoachToSite(coachId: string, orgId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('coach_sites')
    .select('id')
    .eq('coach_id', coachId)
    .eq('organization_id', orgId)
    .maybeSingle();

  if (!existing) {
    await supabase.from('coach_sites').insert({ coach_id: coachId, organization_id: orgId });
  }

  const { data: profile } = await supabase
    .from('coach_profiles')
    .select('id')
    .eq('coach_id', coachId)
    .eq('organization_id', orgId)
    .maybeSingle();

  if (!profile) {
    await supabase.from('coach_profiles').insert({
      coach_id: coachId,
      organization_id: orgId,
      headline: '',
      bio: '',
      specialties: [],
      credentials: [],
    });
  }
}

export async function unassignCoachFromSite(coachId: string, orgId: string): Promise<void> {
  await supabase.from('coach_sites').delete().eq('coach_id', coachId).eq('organization_id', orgId);
  await supabase.from('coach_profiles').delete().eq('coach_id', coachId).eq('organization_id', orgId);
}

export interface ProfileInput {
  headline: string;
  bio: string;
  specialties: string[];
  credentials: string[];
}

export interface CoachOwnInfo {
  bio: string | null;
  title: string | null;
  lesson_content: string | null;
  material: string | null;
}

export interface CoachBookingRecord {
  id: string;
  name: string;
  email: string;
  booking_date: string;
  slot: string;
  session_type: string | null;
  lesson_name: string | null;
  lesson_content: string | null;
  status: string | null;
  created_at: string;
  site_name: string;
  site_url: string | null;
  comment: string | null;
  payment_method: string | null;
  purchase_date: string | null;
  payment_note: string | null;
}

export async function getCoachBookings(coachId: string): Promise<CoachBookingRecord[]> {
  const [bookingsRes, orgsRes] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, name, email, booking_date, slot, session_type, lesson_name, lesson_content, organization_id, status, created_at, site_url, comment, payment_method, purchase_date, payment_note')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false }),
    supabase.from('organizations').select('id, name'),
  ]);

  const orgMap = new Map((orgsRes.data ?? []).map((o) => [o.id, o.name as string]));

  return ((bookingsRes.data ?? []) as any[]).map((b) => ({
    id: b.id,
    name: b.name,
    email: b.email,
    booking_date: b.booking_date,
    slot: b.slot,
    session_type: b.session_type,
    lesson_name: b.lesson_name,
    lesson_content: b.lesson_content,
    status: b.status,
    created_at: b.created_at,
    site_name: orgMap.get(b.organization_id) ?? '—',
    site_url: b.site_url ?? null,
    comment: b.comment ?? null,
    payment_method: b.payment_method ?? null,
    purchase_date: b.purchase_date ?? null,
    payment_note: b.payment_note ?? null,
  }));
}

export async function getCoachSites(coachId: string): Promise<{ id: string; name: string; slug: string }[]> {
  const { data: sites } = await supabase
    .from('coach_sites')
    .select('organization_id')
    .eq('coach_id', coachId);
  const orgIds = (sites ?? []).map((s) => s.organization_id);
  if (orgIds.length === 0) return [];

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .in('id', orgIds)
    .order('name', { ascending: true });
  return (orgs ?? []) as { id: string; name: string; slug: string }[];
}

export async function getCoachOwnInfo(coachId: string): Promise<CoachOwnInfo | null> {
  const { data } = await supabase
    .from('coaches')
    .select('bio, title, lesson_content, material')
    .eq('id', coachId)
    .maybeSingle();
  return (data as CoachOwnInfo) ?? null;
}

export async function saveCoachOwnInfo(
  coachId: string,
  input: Partial<CoachOwnInfo>
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('coaches').update(input).eq('id', coachId);
  return { error: error ? error.message : null };
}

export async function updateBookingPayment(
  bookingId: string,
  input: { payment_method: string | null; purchase_date: string | null; payment_note: string | null }
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('bookings').update(input).eq('id', bookingId);
  return { error: error ? error.message : null };
}

export async function saveCoachProfile(
  coachId: string,
  orgId: string,
  input: ProfileInput
): Promise<{ error: string | null }> {
  const { data: existing } = await supabase
    .from('coach_profiles')
    .select('id')
    .eq('coach_id', coachId)
    .eq('organization_id', orgId)
    .maybeSingle();

  let result;
  if (existing) {
    result = await supabase
      .from('coach_profiles')
      .update(input)
      .eq('id', existing.id);
  } else {
    result = await supabase.from('coach_profiles').insert({
      coach_id: coachId,
      organization_id: orgId,
      ...input,
    });
  }

  return { error: result.error ? result.error.message : null };
}