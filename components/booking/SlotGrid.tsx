'use client';

import { generateSlots, type Slot, type BookedSlotInfo } from '@/lib/booking';

const PERIOD_LABELS: Record<string, string> = {
  Morning: 'Morning · 8:00 AM — 12:00 PM',
  Afternoon: 'Afternoon · 1:00 PM — 6:00 PM',
  Evening: 'Evening · 8:00 PM — 12:00 AM',
};

export default function SlotGrid({ slots = generateSlots(), booked, selected, onSelect }: { slots?: Slot[]; booked: BookedSlotInfo[]; selected: string | null; onSelect: (slot: Slot) => void }) {
  const periods = [...new Set(slots.map((s) => s.period))];
  const groups = periods.map((p) => ({ label: PERIOD_LABELS[p] ?? p, list: slots.filter((s) => s.period === p) }));

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.label}>
          <div className="text-xs uppercase tracking-widest text-neutral-500 mb-2">{g.label}</div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {g.list.map((s) => {
              const bookedInfo = booked.find((b) => b.slot === s.start);
              const isBooked = !!bookedInfo;
              const isUnavailable = !!s.unavailable;
              const isSelected = selected === s.start;
              return (
                <button
                  key={s.start}
                  disabled={isBooked || isUnavailable}
                  onClick={() => onSelect(s)}
                  className={`px-2 py-2 rounded-xl border text-xs text-center transition w-full ${
                    isBooked
                      ? 'border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed'
                      : isUnavailable
                      ? 'border-rose-200 bg-rose-50 text-rose-400 cursor-not-allowed'
                      : isSelected
                      ? 'border-neutral-900 bg-neutral-900 text-white cursor-pointer'
                      : 'border-neutral-300 text-neutral-700 hover:border-neutral-900 cursor-pointer'
                  }`}
                >
                  <span className={`block truncate ${isBooked ? 'line-through' : ''}`}>{s.start} — {s.end}</span>
                  {isBooked && (
                    <span className="block text-[10px] mt-0.5 text-neutral-400">
                      Booked{bookedInfo.siteName ? ` · ${bookedInfo.siteName}` : ''}
                    </span>
                  )}
                  {isUnavailable && (
                    <span className="block text-[10px] mt-0.5 text-rose-400">
                      Coach unavailable
                    </span>
                  )}
                  {!isBooked && !isUnavailable && s.orgName && (
                    <span className="block text-[10px] mt-0.5 text-neutral-400">{s.orgName}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}