'use client';

import { useState } from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

export default function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-neutral-300 bg-white hover:border-neutral-900 cursor-pointer whitespace-nowrap"
      >
        <span className="w-4 h-4 flex items-center justify-center">
          <i className={selected?.value === 'all' || selected?.value === '' ? 'ri-filter-3-line' : 'ri-filter-fill'}></i>
        </span>
        <span className="text-neutral-500">{label}:</span>
        <span className="font-medium text-neutral-900">{selected?.label ?? '전체'}</span>
        <span className="w-4 h-4 flex items-center justify-center">
          <i className="ri-arrow-down-s-line"></i>
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-30 w-56 max-h-80 overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-xl py-1">
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer hover:bg-neutral-50 ${
                  value === o.value ? 'text-neutral-900 font-medium' : 'text-neutral-600'
                }`}
              >
                <span className="truncate">{o.label}</span>
                {value === o.value && (
                  <span className="w-4 h-4 flex items-center justify-center shrink-0">
                    <i className="ri-check-line"></i>
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}