'use client';

import { useMemo, useState } from 'react';
import { kstNow } from '@/lib/kst';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export default function CalendarPicker({
  selected,
  onSelect,
  monthsAhead = 3,
}: {
  selected: string | null;
  onSelect: (iso: string) => void;
  monthsAhead?: number;
}) {
  const today = useMemo(() => {
    const k = kstNow();
    return new Date(k.getFullYear(), k.getMonth(), k.getDate());
  }, []);
  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + monthsAhead * 30);
    return d;
  }, [today, monthsAhead]);

  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

  const cells = useMemo(() => {
    const startOffset = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const arr: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    return arr;
  }, [cursor]);

  const canPrev = cursor.getTime() > minMonth.getTime();
  const canNext = cursor.getTime() < maxMonth.getTime();

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-3 max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => canPrev && setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          disabled={!canPrev}
          className="w-7 h-7 rounded-lg border border-neutral-200 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:border-neutral-900 transition"
        >
          <span className="w-4 h-4 flex items-center justify-center"><i className="ri-arrow-left-s-line text-base text-neutral-700"></i></span>
        </button>
        <div className="text-sm font-semibold text-neutral-900 whitespace-nowrap">
          {new Date(cursor.getFullYear(), cursor.getMonth(), 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <button
          onClick={() => canNext && setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          disabled={!canNext}
          className="w-7 h-7 rounded-lg border border-neutral-200 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:border-neutral-900 transition"
        >
          <span className="w-4 h-4 flex items-center justify-center"><i className="ri-arrow-right-s-line text-base text-neutral-700"></i></span>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[10px] font-medium text-neutral-400 py-0.5">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} className="h-7" />;
          const iso = toIso(d);
          const disabled = d.getTime() < today.getTime() || d.getTime() > maxDate.getTime();
          const isSelected = selected === iso;
          const isToday = d.getTime() === today.getTime();
          return (
            <button
              key={iso}
              onClick={() => !disabled && onSelect(iso)}
              disabled={disabled}
              className={`h-7 rounded-lg text-xs flex items-center justify-center transition ${
                disabled
                  ? 'text-neutral-300 cursor-not-allowed'
                  : isSelected
                  ? 'bg-neutral-900 text-white font-semibold cursor-pointer'
                  : 'text-neutral-700 hover:bg-neutral-100 cursor-pointer'
              } ${isToday && !isSelected ? 'ring-1 ring-neutral-900' : ''}`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}