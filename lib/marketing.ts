import { supabase } from './supabase';

export interface MarketingSequence {
  id: string;
  subject: string;
  body: string;
  day_offset: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MarketingTarget {
  email: string;
  full_name: string | null;
  nationality: string | null;
  created_at: string;
}

export interface SequenceInput {
  subject: string;
  body: string;
  day_offset: number;
  sort_order: number;
  is_active: boolean;
}

export async function getMarketingSequences(): Promise<MarketingSequence[]> {
  const { data } = await supabase
    .from('marketing_sequences')
    .select('*')
    .order('day_offset', { ascending: true })
    .order('sort_order', { ascending: true });
  return (data ?? []) as MarketingSequence[];
}

export async function addMarketingSequence(input: SequenceInput) {
  return supabase.from('marketing_sequences').insert(input);
}

export async function updateMarketingSequence(id: string, input: SequenceInput) {
  return supabase.from('marketing_sequences').update(input).eq('id', id);
}

export async function deleteMarketingSequence(id: string) {
  return supabase.from('marketing_sequences').delete().eq('id', id);
}

export async function getMarketingTargets(): Promise<MarketingTarget[]> {
  const [membersRes, bookingsRes] = await Promise.all([
    supabase
      .from('members')
      .select('email, full_name, nationality, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('bookings').select('email'),
  ]);

  const booked = new Set(
    (bookingsRes.data ?? []).map((b) => (b.email || '').toLowerCase().trim())
  );

  return ((membersRes.data ?? []) as MarketingTarget[]).filter(
    (m) => m.email && !booked.has(m.email.toLowerCase().trim())
  );
}

export async function runMarketingSequence() {
  const { data, error } = await supabase.functions.invoke('run-marketing-sequence', {
    body: {},
  });
  return { data, error };
}