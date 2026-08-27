import { supabase } from './supabase';

export interface Organization {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  logo_text: string;
  accent_color: string;
  website_url: string | null;
  coach_type: string | null;
  coach_role_label: string | null;
  coach_application_title: string | null;
  coach_application_intro: string | null;
  coach_application_enabled: boolean;
  created_at: string;
}

export interface OrgInput {
  name: string;
  slug: string;
  tagline: string;
  logo_text: string;
  accent_color: string;
  website_url: string;
  coach_type: string;
  coach_role_label: string;
  coach_application_title: string;
  coach_application_intro: string;
  coach_application_enabled: boolean;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function fetchOrganizations(): Promise<Organization[]> {
  const { data } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: true });
  return (data ?? []) as Organization[];
}

export async function createOrganization(input: OrgInput): Promise<{ error: string | null }> {
  const { error } = await supabase.from('organizations').insert({
    name: input.name.trim(),
    slug: input.slug.trim().toLowerCase(),
    tagline: input.tagline.trim() || null,
    logo_text: input.logo_text.trim() || 'logo',
    accent_color: input.accent_color || '#171717',
    website_url: input.website_url.trim() || null,
    coach_type: input.coach_type || null,
    coach_role_label: input.coach_role_label.trim() || null,
    coach_application_title: input.coach_application_title.trim() || null,
    coach_application_intro: input.coach_application_intro.trim() || null,
    coach_application_enabled: input.coach_application_enabled !== false,
  });
  return { error: error ? error.message : null };
}

export async function updateOrganization(
  id: string,
  input: OrgInput
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('organizations')
    .update({
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase(),
      tagline: input.tagline.trim() || null,
      logo_text: input.logo_text.trim() || 'logo',
      accent_color: input.accent_color || '#171717',
      website_url: input.website_url.trim() || null,
      coach_type: input.coach_type || null,
      coach_role_label: input.coach_role_label.trim() || null,
      coach_application_title: input.coach_application_title.trim() || null,
      coach_application_intro: input.coach_application_intro.trim() || null,
      coach_application_enabled: input.coach_application_enabled !== false,
    })
    .eq('id', id);
  return { error: error ? error.message : null };
}