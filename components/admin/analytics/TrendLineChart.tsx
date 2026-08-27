'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { TrendPoint } from '@/lib/visitorAnalytics';

const COLORS = ['#E11D48', '#2563EB', '#16a34a', '#d97706', '#7c3aed', '#0891b2'];

export default function TrendLineChart({ trends }: { trends: TrendPoint[] }) {
  if (!trends || trends.length === 0) {
    return <div className="text-center py-16 text-sm text-neutral-500">추이 데이터가 없습니다.</div>;
  }

  const siteNames = Object.keys(trends[0]).filter((k) => k !== 'label');
  if (siteNames.length === 0) {
    return <div className="text-center py-16 text-sm text-neutral-500">추이 데이터가 없습니다.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          {siteNames.map((_, i) => (
            <linearGradient key={i} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.25} />
              <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {siteNames.map((s, i) => (
          <Area
            key={s}
            type="monotone"
            dataKey={s}
            stroke={COLORS[i % COLORS.length]}
            fill={`url(#grad-${i})`}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}