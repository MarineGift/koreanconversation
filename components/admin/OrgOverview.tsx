import type { OrgBranding } from '@/lib/org';
import { ORG_SLUG } from '@/lib/config';

export default function OrgOverview({ org }: { org: OrgBranding | null }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-neutral-500">현재 조직</div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">{org?.name ?? 'Korean Coaching'}</div>
          <div className="text-sm text-neutral-500 mt-1">{org?.tagline ?? '—'}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <span className="text-neutral-500">브랜드 색상</span>
            <span className="w-6 h-6 rounded-full border border-neutral-200" style={{ backgroundColor: org?.accentColor ?? '#171717' }}></span>
            <span className="font-mono">{org?.accentColor ?? '#171717'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <span className="text-neutral-500">식별자</span>
            <span className="font-mono bg-neutral-100 px-2 py-1 rounded-md">{ORG_SLUG}</span>
          </div>
        </div>
      </div>
    </div>
  );
}