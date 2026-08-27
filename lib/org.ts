import { supabase } from './supabase';
import { ORG_SLUG } from './config';

export interface OrgBranding {
  id: string;
  name: string;
  tagline: string | null;
  logoText: string;
  accentColor: string;
  websiteUrl: string | null;
}

let cachedOrg: OrgBranding | null | undefined;

export async function getOrg(): Promise<OrgBranding | null> {
  if (cachedOrg !== undefined) return cachedOrg;
  const { data } = await supabase
    .from('organizations')
    .select('id, name, tagline, logo_text, accent_color, website_url')
    .eq('slug', ORG_SLUG)
    .maybeSingle();
  if (!data) {
    cachedOrg = null;
    return null;
  }
  cachedOrg = {
    id: data.id,
    name: data.name,
    tagline: data.tagline,
    logoText: data.logo_text || 'logo',
    accentColor: data.accent_color || '#171717',
    websiteUrl: data.website_url ?? null,
  };
  return cachedOrg;
}

export async function getOrgId(): Promise<string | null> {
  const org = await getOrg();
  return org?.id ?? null;
}

export async function getOrgByHostname(): Promise<OrgBranding | null> {
  const host =
    typeof window !== 'undefined'
      ? window.location.hostname.replace(/^www\./, '').toLowerCase()
      : '';
  const { data } = await supabase
    .from('organizations')
    .select('id, name, tagline, logo_text, accent_color, website_url');
  const orgs = data ?? [];
  const match = orgs.find((o) => {
    const url = (o.website_url || '')
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .toLowerCase();
    return url === host;
  });
  if (!match) {
    return getOrg();
  }
  return {
    id: match.id,
    name: match.name,
    tagline: match.tagline,
    logoText: match.logo_text || 'logo',
    accentColor: match.accent_color || '#171717',
    websiteUrl: match.website_url ?? null,
  };
}

export async function getOrgWebsiteUrlById(orgId: string): Promise<string | null> {
  const { data } = await supabase
    .from('organizations')
    .select('website_url')
    .eq('id', orgId)
    .maybeSingle();
  return data?.website_url ?? null;
}

export interface ResolvedSite {
  organizationId: string | null;
  domain: string;
  name: string;
}

export async function resolveSiteByHostname(): Promise<ResolvedSite> {
  const host =
    typeof window !== 'undefined'
      ? window.location.hostname.replace(/^www\./, '').toLowerCase()
      : '';
  const { data } = await supabase
    .from('organizations')
    .select('id, website_url, name');
  const orgs = data ?? [];
  const match = orgs.find((o) => {
    const url = (o.website_url || '')
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .toLowerCase();
    return url === host;
  });
  return {
    organizationId: match?.id ?? null,
    domain: match?.website_url || host,
    name: match?.name || 'Unknown',
  };
}