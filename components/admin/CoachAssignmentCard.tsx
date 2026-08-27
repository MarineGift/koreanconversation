import type { CoachWithSites, CoachOrg } from '@/lib/coachManagement';

export default function CoachAssignmentCard({
  coach,
  organizations,
  busy,
  onToggle,
  onEdit,
}: {
  coach: CoachWithSites;
  organizations: CoachOrg[];
  busy: boolean;
  onToggle: (orgId: string, assigned: boolean) => void;
  onEdit: (org: CoachOrg) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5">
      <div className="flex items-center gap-4">
        {coach.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coach.photo} alt={coach.name} className="w-14 h-14 rounded-full object-cover object-top" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
            <i className="ri-user-line text-2xl"></i>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-neutral-900">{coach.name}</div>
          <div className="text-sm text-neutral-500 truncate">{coach.title ?? '—'}</div>
          {coach.email && <div className="text-xs text-neutral-400 truncate">{coach.email}</div>}
        </div>
        <span className="text-xs text-neutral-400 whitespace-nowrap">
          {coach.site_ids.length}개 사이트
        </span>
      </div>

      <div className="mt-4 border-t border-neutral-100 pt-3 space-y-2">
        {organizations.map((org) => {
          const assigned = coach.site_ids.includes(org.id);
          return (
            <div key={org.id} className="flex items-center justify-between gap-3 py-1">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => onToggle(org.id, assigned)}
                  disabled={busy}
                  className={`w-5 h-5 flex items-center justify-center rounded-md border cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    assigned ? 'bg-neutral-900 border-neutral-900 text-white' : 'border-neutral-300 text-transparent hover:border-neutral-500'
                  }`}
                >
                  <i className="ri-check-line text-sm"></i>
                </button>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-neutral-800 truncate">{org.name}</div>
                  <div className="text-xs text-neutral-400 truncate font-mono">{org.slug}</div>
                </div>
              </div>
              {assigned && (
                <button
                  onClick={() => onEdit(org)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 border border-neutral-200 rounded-lg hover:border-neutral-900 hover:text-neutral-900 whitespace-nowrap cursor-pointer"
                >
                  <span className="w-3.5 h-3.5 flex items-center justify-center"><i className="ri-edit-line"></i></span>
                  이력 편집
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}