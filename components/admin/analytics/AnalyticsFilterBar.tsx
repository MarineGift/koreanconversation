'use client';

import FilterSelect from './FilterSelect';
import {
  DATE_RANGE_OPTIONS,
  TIME_OF_DAY_OPTIONS,
  type DateRange,
  type TimeOfDay,
  type VisitorFilters,
  type VisitorOptions,
} from '@/lib/visitorAnalytics';

export default function AnalyticsFilterBar({
  filters,
  options,
  onChange,
}: {
  filters: VisitorFilters;
  options: VisitorOptions;
  onChange: (next: VisitorFilters) => void;
}) {
  const set = (patch: Partial<VisitorFilters>) => onChange({ ...filters, ...patch });

  const siteOptions = [
    { value: '', label: '전체 사이트' },
    ...options.sites.map((s) => ({ value: s.domain, label: s.name })),
  ];
  const countryOptions = [
    { value: '', label: '전체 국가' },
    ...options.countries.map((c) => ({ value: c, label: c })),
  ];
  const regionOptions = [
    { value: '', label: '전체 지역' },
    ...options.regions.map((r) => ({ value: r, label: r })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterSelect
        label="사이트"
        value={filters.site ?? ''}
        options={siteOptions}
        onChange={(v) => set({ site: v || null })}
      />
      <FilterSelect
        label="국가"
        value={filters.country ?? ''}
        options={countryOptions}
        onChange={(v) => set({ country: v || null })}
      />
      <FilterSelect
        label="지역"
        value={filters.region ?? ''}
        options={regionOptions}
        onChange={(v) => set({ region: v || null })}
      />
      <FilterSelect
        label="시간대"
        value={filters.timeOfDay}
        options={TIME_OF_DAY_OPTIONS}
        onChange={(v) => set({ timeOfDay: v as TimeOfDay })}
      />

      <div className="flex items-center gap-1 p-1 bg-white border border-neutral-200 rounded-full">
        {DATE_RANGE_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => set({ dateRange: o.value as DateRange })}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition ${
              filters.dateRange === o.value
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}