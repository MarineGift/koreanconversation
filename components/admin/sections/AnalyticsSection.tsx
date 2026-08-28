'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  getVisitorLogs,
  computeStats,
  computeOptions,
  type VisitorLog,
  type VisitorFilters,
  type VisitorOptions,
} from '@/lib/visitorAnalytics';
import AnalyticsFilterBar from '../analytics/AnalyticsFilterBar';
import TrendLineChart from '../analytics/TrendLineChart';

const COLORS = ['#E11D48', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2'];

const EMPTY_OPTIONS: VisitorOptions = { sites: [], countries: [], regions: [] };

export default function AnalyticsSection({ tab }: { tab: string }) {
  const [logs, setLogs] = useState<VisitorLog[] | null>(null);
  const [filters, setFilters] = useState<VisitorFilters>({
    site: null,
    country: null,
    region: null,
    dateRange: 'all',
    timeOfDay: 'all',
  });

  useEffect(() => {
    getVisitorLogs()
      .then(setLogs)
      .catch(() => setLogs([]));
  }, []);

  const options = useMemo(() => (logs ? computeOptions(logs) : EMPTY_OPTIONS), [logs]);
  const stats = useMemo(() => (logs ? computeStats(logs, filters) : null), [logs, filters]);

  if (!logs) {
    return <div className="text-center py-20 text-sm text-neutral-500">불러오는 중...</div>;
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="space-y-6">
        <AnalyticsFilterBar filters={filters} options={options} onChange={setFilters} />
        <div className="text-center py-20 text-sm text-neutral-500">
          접속 데이터가 없습니다. 사이트에 방문이 발생하면 자동으로 기록됩니다.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnalyticsFilterBar filters={filters} options={options} onChange={setFilters} />

      {tab === 'analytics-overview' && <Overview stats={stats} hasSiteFilter={!!filters.site} />}
      {tab === 'analytics-trends' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-900">사이트별 접속자 추이</h3>
            <span className="text-xs text-neutral-500">단위: 방문 수</span>
          </div>
          <TrendLineChart trends={stats.trends} />
        </div>
      )}
      {tab === 'analytics-pages' && <PageAnalysis pages={stats.pages} logs={logs} />}
      {tab === 'analytics-records' && <RecentRecords logs={stats.recent} />}
    </div>
  );
}

function Overview({ stats, hasSiteFilter }: { stats: NonNullable<ReturnType<typeof computeStats>>; hasSiteFilter: boolean }) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="오늘 방문자" value={stats.today} />
        <StatCard label="이번 주" value={stats.thisWeek} />
        <StatCard label="이번 달" value={stats.thisMonth} />
        <StatCard label="총 방문자" value={stats.total} />
        <StatCard label="고유 방문자" value={stats.uniqueVisitors} />
      </div>

      {!hasSiteFilter && stats.sites.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {stats.sites.map((s) => (
            <div key={s.site} className="bg-white rounded-2xl border border-neutral-200 p-5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-neutral-900 truncate">{s.name}</div>
                  <div className="text-xs text-neutral-500 truncate mt-0.5">{s.site}</div>
                </div>
                <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 shrink-0">
                  <i className="ri-global-line"></i>
                </span>
              </div>
              <div className="flex items-end justify-between mt-4">
                <div className="text-2xl font-bold text-neutral-900">{s.total}</div>
                <div className="text-xs text-neutral-500">총 방문자</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <h3 className="text-sm font-bold text-neutral-900 mb-4">국가별 분포</h3>
          {stats.countries.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stats.countries.slice(0, 6)}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name} ${value}`}
                >
                  {stats.countries.slice(0, 6).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <h3 className="text-sm font-bold text-neutral-900 mb-4">브라우저</h3>
          {stats.browsers.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.browsers.slice(0, 6)} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="count" fill="#E11D48" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <h3 className="text-sm font-bold text-neutral-900 mb-4">OS / 디바이스</h3>
          <div className="space-y-4">
            <ListGroup title="OS" items={stats.os.slice(0, 5)} />
            <div className="border-t border-neutral-100 pt-3">
              <ListGroup title="디바이스" items={stats.devices.slice(0, 5)} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="text-2xl font-bold text-neutral-900 mt-1">{value}</div>
    </div>
  );
}

function ListGroup({ title, items }: { title: string; items: { name: string; count: number }[] }) {
  return (
    <div>
      <div className="text-xs font-medium text-neutral-500 mb-2">{title}</div>
      {items.length === 0 ? (
        <Empty />
      ) : (
        <div className="space-y-1.5">
          {items.map((it) => (
            <div key={it.name} className="flex items-center justify-between text-sm">
              <span className="text-neutral-700">{it.name}</span>
              <span className="font-medium text-neutral-900">{it.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PageAnalysis({ pages, logs }: { pages: CountItem[]; logs: VisitorLog[] }) {
  const max = pages[0]?.count ?? 1;

  const topPages = pages.slice(0, 5);
  const restPages = pages.slice(5);

  const categoryStats = useMemo(() => {
    const cats: Record<string, number> = {
      '홈': 0,
      '무료체험': 0,
      '예약': 0,
      '가격/패키지': 0,
      '프로그램/소개': 0,
      '로그인/회원': 0,
      '기타': 0,
    };
    for (const p of pages) {
      const path = p.name.toLowerCase();
      if (path === '/' || path === '/welcome') cats['홈'] += p.count;
      else if (path.includes('/free')) cats['무료체험'] += p.count;
      else if (path.includes('/book')) cats['예약'] += p.count;
      else if (path.includes('/pricing') || path.includes('/packages') || path.includes('/checkout')) cats['가격/패키지'] += p.count;
      else if (path.includes('/program') || path.includes('/method') || path.includes('/coach') || path.includes('/tour') || path.includes('/business') || path.includes('/medical')) cats['프로그램/소개'] += p.count;
      else if (path.includes('/login') || path.includes('/mypage') || path.includes('/signup')) cats['로그인/회원'] += p.count;
      else cats['기타'] += p.count;
    }
    return Object.entries(cats)
      .map(([name, count]) => ({ name, count }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [pages]);

  const trendData = useMemo(() => {
    const buckets = new Map<string, { label: string; total: number; [path: string]: number | string }>();
    const recent = logs.filter((l) => {
      const t = new Date(l.created_at).getTime();
      return Date.now() - t <= 7 * 86400000;
    });
    for (const l of recent) {
      const d = new Date(l.created_at);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { label: key, total: 0 };
        buckets.set(key, bucket);
      }
      bucket.total += 1;
      const path = l.page_path || '/unknown';
      const topPaths = pages.slice(0, 3).map((p) => p.name);
      const tracked = topPaths.includes(path) ? path : '기타';
      bucket[tracked] = ((bucket[tracked] as number) ?? 0) + 1;
    }
    return Array.from(buckets.values()).sort((a, b) => {
      const parse = (s: string) => {
        const [m, d] = s.split('/').map(Number);
        return m * 100 + d;
      };
      return parse(a.label) - parse(b.label);
    });
  }, [logs, pages]);

  const topPaths = pages.slice(0, 3).map((p) => p.name);

  return (
    <div className="space-y-6">
      {/* Top Pages Cards */}
      {topPages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {topPages.map((p, i) => {
            const pct = Math.round((p.count / max) * 100);
            return (
              <div key={p.name} className="bg-white rounded-2xl border border-neutral-200 p-5">
                <div className="text-xs text-neutral-500 mb-1">{i + 1}위</div>
                <div className="text-2xl font-bold text-neutral-900">{p.count}</div>
                <div className="text-sm font-medium text-neutral-700 mt-1 truncate">{p.name}</div>
                <div className="mt-3 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#E11D48' }} />
                </div>
                <div className="text-xs text-neutral-500 mt-1">{pct}%</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Category Pie */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <h3 className="text-sm font-bold text-neutral-900 mb-4">페이지 유형별 분포</h3>
          {categoryStats.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryStats.slice(0, 6)}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name} ${value}`}
                >
                  {categoryStats.slice(0, 6).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Trend Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-neutral-200 p-5">
          <h3 className="text-sm font-bold text-neutral-900 mb-4">주요 페이지 방문 추이 (최근 7일)</h3>
          {trendData.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e5e5', fontSize: 12 }} />
                {topPaths.map((path, i) => (
                  <Bar key={path} dataKey={path} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} name={path} />
                ))}
                <Bar dataKey="기타" fill="#d4d4d8" radius={[4, 4, 0, 0]} name="기타" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Full Page Ranking */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200">
          <h3 className="text-sm font-bold text-neutral-900">전체 페이지 방문 순위</h3>
          <p className="text-xs text-neutral-500 mt-0.5">방문자가 가장 많이 머문 페이지</p>
        </div>
        {pages.length === 0 ? (
          <div className="text-center py-16 text-sm text-neutral-500">페이지 데이터가 없습니다.</div>
        ) : (
          <div className="p-5 space-y-4">
            {restPages.length === 0 && topPages.length === 0 ? (
              <div className="text-center py-8 text-sm text-neutral-500">데이터가 없습니다.</div>
            ) : (
              <>
                {pages.map((p) => (
                  <div key={p.name}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-neutral-700 font-mono text-xs truncate">{p.name}</span>
                      <span className="font-medium text-neutral-900 whitespace-nowrap ml-3">{p.count}회</span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(3, (p.count / max) * 100)}%`, backgroundColor: '#E11D48' }}
                      />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RecentRecords({ logs }: { logs: VisitorLog[] }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-200">
        <h3 className="text-sm font-bold text-neutral-900">최근 접속 기록</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200 bg-neutral-50">
              <th className="px-5 py-3 font-medium">시간</th>
              <th className="px-5 py-3 font-medium">사이트</th>
              <th className="px-5 py-3 font-medium">IP</th>
              <th className="px-5 py-3 font-medium">지역</th>
              <th className="px-5 py-3 font-medium">브라우저</th>
              <th className="px-5 py-3 font-medium">OS</th>
              <th className="px-5 py-3 font-medium">디바이스</th>
              <th className="px-5 py-3 font-medium">페이지</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((r) => (
              <tr key={r.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-5 py-3 text-neutral-600 whitespace-nowrap">
                  {new Date(r.created_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 whitespace-nowrap">
                    {r.site_name || r.site_domain || 'Unknown'}
                  </span>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-neutral-600">{r.ip_address}</td>
                <td className="px-5 py-3 text-neutral-600">
                  {[r.country, r.region, r.city].filter(Boolean).join(' · ') || 'Unknown'}
                </td>
                <td className="px-5 py-3 text-neutral-600">{r.browser}</td>
                <td className="px-5 py-3 text-neutral-600">{r.os}</td>
                <td className="px-5 py-3 text-neutral-600">{r.device}</td>
                <td className="px-5 py-3 text-neutral-600 text-xs">{r.page_path}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Empty() {
  return <div className="text-center py-8 text-sm text-neutral-400">데이터 없음</div>;
}
