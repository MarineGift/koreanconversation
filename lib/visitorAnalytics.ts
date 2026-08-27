import { supabase } from './supabase';

export interface VisitorLog {
  id: string;
  ip_address: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  referrer: string | null;
  page_path: string | null;
  site_domain: string | null;
  site_name: string | null;
  created_at: string;
}

export type DateRange = 'today' | 'week' | 'month' | 'all';
export type TimeOfDay = 'all' | 'dawn' | 'morning' | 'afternoon' | 'evening';

export interface VisitorFilters {
  site: string | null;
  country: string | null;
  region: string | null;
  dateRange: DateRange;
  timeOfDay: TimeOfDay;
}

export interface CountItem {
  name: string;
  count: number;
}

export interface TrendPoint {
  label: string;
  [site: string]: number | string;
}

export interface VisitorStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  uniqueVisitors: number;
  countries: CountItem[];
  regions: CountItem[];
  browsers: CountItem[];
  os: CountItem[];
  devices: CountItem[];
  pages: CountItem[];
  sites: { site: string; name: string; total: number }[];
  trends: TrendPoint[];
  recent: VisitorLog[];
}

export interface VisitorOptions {
  sites: { domain: string; name: string }[];
  countries: string[];
  regions: string[];
}

const TIME_OF_DAY_LABEL: Record<Exclude<TimeOfDay, 'all'>, string> = {
  dawn: '새벽 (00-06시)',
  morning: '오전 (06-12시)',
  afternoon: '오후 (12-18시)',
  evening: '저녁 (18-24시)',
};

export const TIME_OF_DAY_OPTIONS: { value: TimeOfDay; label: string }[] = [
  { value: 'all', label: '전체 시간대' },
  { value: 'dawn', label: TIME_OF_DAY_LABEL.dawn },
  { value: 'morning', label: TIME_OF_DAY_LABEL.morning },
  { value: 'afternoon', label: TIME_OF_DAY_LABEL.afternoon },
  { value: 'evening', label: TIME_OF_DAY_LABEL.evening },
];

export const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: 'today', label: '오늘' },
  { value: 'week', label: '주간' },
  { value: 'month', label: '월간' },
  { value: 'all', label: '전체' },
];

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour < 6) return 'dawn';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function rangeStart(dateRange: DateRange, now: Date): number {
  const d = new Date(now);
  switch (dateRange) {
    case 'today':
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    case 'week':
      return now.getTime() - 7 * 86400000;
    case 'month':
      return now.getTime() - 30 * 86400000;
    case 'all':
      return 0;
  }
}

export function applyFilters(logs: VisitorLog[], filters: VisitorFilters): VisitorLog[] {
  const now = new Date();
  const start = rangeStart(filters.dateRange, now);
  return logs.filter((l) => {
    const t = new Date(l.created_at).getTime();
    if (t < start) return false;
    if (filters.site && l.site_domain !== filters.site) return false;
    if (filters.country && l.country !== filters.country) return false;
    if (filters.region && l.region !== filters.region) return false;
    if (filters.timeOfDay !== 'all') {
      const hour = new Date(l.created_at).getHours();
      if (getTimeOfDay(hour) !== filters.timeOfDay) return false;
    }
    return true;
  });
}

function countBy(logs: VisitorLog[], key: 'country' | 'region' | 'browser' | 'os' | 'device' | 'page_path'): CountItem[] {
  const map = new Map<string, number>();
  for (const l of logs) {
    const v = (l as any)[key];
    if (v) map.set(v, (map.get(v) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function buildTrends(logs: VisitorLog[], dateRange: DateRange): TrendPoint[] {
  const buckets = new Map<string, { label: string; sortKey: number; sites: Map<string, number> }>();

  for (const l of logs) {
    const d = new Date(l.created_at);
    let key: string;
    let label: string;
    let sortKey: number;
    if (dateRange === 'today') {
      key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
      label = `${d.getHours()}시`;
      sortKey = d.getHours();
    } else {
      key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      label = `${d.getMonth() + 1}/${d.getDate()}`;
      sortKey = d.getTime();
    }
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { label, sortKey, sites: new Map() };
      buckets.set(key, bucket);
    }
    const site = l.site_name || l.site_domain || 'Unknown';
    bucket.sites.set(site, (bucket.sites.get(site) ?? 0) + 1);
  }

  const allSites = new Set<string>();
  for (const b of buckets.values()) {
    for (const s of b.sites.keys()) allSites.add(s);
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.sortKey - b.sortKey)
    .map((b) => {
      const point: TrendPoint = { label: b.label };
      for (const s of allSites) {
        point[s] = b.sites.get(s) ?? 0;
      }
      return point;
    });
}

export async function getVisitorLogs(): Promise<VisitorLog[]> {
  const { data } = await supabase
    .from('visitor_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10000);
  return (data ?? []) as VisitorLog[];
}

export function computeStats(logs: VisitorLog[], filters: VisitorFilters): VisitorStats {
  const filtered = applyFilters(logs, filters);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = now.getTime() - 7 * 86400000;
  const monthStart = now.getTime() - 30 * 86400000;

  let today = 0;
  let thisWeek = 0;
  let thisMonth = 0;
  const uniqueIps = new Set<string>();
  const siteMap = new Map<string, { name: string; total: number }>();

  for (const l of filtered) {
    const t = new Date(l.created_at).getTime();
    if (t >= todayStart) today += 1;
    if (t >= weekStart) thisWeek += 1;
    if (t >= monthStart) thisMonth += 1;
    if (l.ip_address) uniqueIps.add(l.ip_address);
    const key = l.site_domain || 'Unknown';
    const existing = siteMap.get(key) ?? { name: l.site_name || key, total: 0 };
    existing.total += 1;
    siteMap.set(key, existing);
  }

  return {
    total: filtered.length,
    today,
    thisWeek,
    thisMonth,
    uniqueVisitors: uniqueIps.size,
    countries: countBy(filtered, 'country'),
    regions: countBy(filtered, 'region'),
    browsers: countBy(filtered, 'browser'),
    os: countBy(filtered, 'os'),
    devices: countBy(filtered, 'device'),
    pages: countBy(filtered, 'page_path'),
    sites: Array.from(siteMap.entries())
      .map(([site, v]) => ({ site, name: v.name, total: v.total }))
      .sort((a, b) => b.total - a.total),
    trends: buildTrends(filtered, filters.dateRange),
    recent: filtered.slice(0, 100),
  };
}

export function computeOptions(logs: VisitorLog[]): VisitorOptions {
  const siteMap = new Map<string, string>();
  const countrySet = new Set<string>();
  const regionSet = new Set<string>();
  for (const l of logs) {
    if (l.site_domain) {
      siteMap.set(l.site_domain, l.site_name || l.site_domain);
    }
    if (l.country) countrySet.add(l.country);
    if (l.region) regionSet.add(l.region);
  }
  return {
    sites: Array.from(siteMap.entries()).map(([domain, name]) => ({ domain, name })),
    countries: Array.from(countrySet).sort(),
    regions: Array.from(regionSet).sort(),
  };
}

export interface VisitorSite {
  id: string;
  website_url: string | null;
  name: string;
}

export async function getVisitorSites(): Promise<VisitorSite[]> {
  const { data } = await supabase
    .from('organizations')
    .select('id, website_url, name')
    .order('created_at', { ascending: true });
  return (data ?? []) as VisitorSite[];
}