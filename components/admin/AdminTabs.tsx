export interface AdminTab {
  key: string;
  label: string;
  count?: number;
}

export default function AdminTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: AdminTab[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="w-full overflow-x-auto pb-1 -mb-1">
      <div className="flex items-center gap-1 p-1 bg-white border border-neutral-200 rounded-full w-fit max-w-full">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition flex items-center gap-2 ${
              active === t.key
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {t.label}
            {t.count != null && (
              <span
                className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs ${
                  active === t.key ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}