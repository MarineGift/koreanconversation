import type { DashboardCoach } from '@/lib/dashboard';

export default function CoachesList({ coaches }: { coaches: DashboardCoach[] }) {
  if (coaches.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
        등록된 강사가 없습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {coaches.map((c) => (
        <div key={c.id} className="bg-white rounded-2xl border border-neutral-200 p-5 flex items-center gap-4">
          {c.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.photo} alt={c.name} className="w-14 h-14 rounded-full object-cover object-top" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
              <i className="ri-user-line text-2xl"></i>
            </div>
          )}
          <div className="min-w-0">
            <div className="font-semibold text-neutral-900">{c.name}</div>
            <div className="text-sm text-neutral-500 truncate">{c.title ?? '—'}</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {c.site_names.map((s) => (
                <span key={s} className="inline-flex px-2 py-0.5 rounded-full text-xs bg-neutral-100 text-neutral-600">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}