import { supabase } from './supabase';

export interface PackageInquiry {
  id: string;
  package_type: string;
  name: string | null;
  email: string | null;
  country: string | null;
  company: string | null;
  group_size: string | null;
  service_type: string | null;
  modules: string[] | null;
  hospitals: string[] | null;
  arrival_date: string | null;
  departure_date: string | null;
  duration: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

export async function getPackageInquiries(): Promise<PackageInquiry[]> {
  const { data } = await supabase
    .from('package_inquiries')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []) as PackageInquiry[];
}

export async function updateInquiryStatus(id: string, status: string) {
  return supabase.from('package_inquiries').update({ status }).eq('id', id);
}

export async function submitPackageInquiry(input: {
  package_type: string;
  name: string;
  email: string;
  country?: string;
  company?: string;
  group_size?: string;
  service_type?: string;
  modules?: string[];
  hospitals?: string[];
  arrival_date?: string;
  departure_date?: string;
  duration?: string;
  message?: string;
  organization_id?: string | null;
}) {
  return supabase.from('package_inquiries').insert([input]);
}

export async function notifyPackageInquiry(payload: Record<string, unknown>) {
  try {
    await supabase.functions.invoke('notify-package-inquiry', { body: payload });
  } catch {
    // Notification is non-blocking; inquiry already saved.
  }
}