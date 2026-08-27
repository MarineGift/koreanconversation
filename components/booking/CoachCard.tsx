'use client';

import type { Coach } from '@/lib/booking';

export default function CoachCard({ coach, selected, onClick }: { coach: Coach; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-2xl border transition cursor-pointer ${
        selected ? 'border-neutral-900 bg-neutral-900 text-white shadow-lg' : 'border-neutral-200 bg-white hover:border-neutral-400'
      }`}
    >
      <div className="flex items-center gap-4">
        {coach.photo ? (
          <img src={coach.photo} alt={coach.name} className="w-14 h-14 rounded-full object-cover object-top shrink-0" />
        ) : (
          <span className="w-14 h-14 rounded-full bg-neutral-200 flex items-center justify-center shrink-0 text-xl font-semibold text-neutral-600">
            {coach.name.charAt(0)}
          </span>
        )}
        <div className="min-w-0">
          <div className={`font-semibold ${selected ? 'text-white' : 'text-neutral-900'}`}>{coach.name}</div>
          <div className={`text-xs truncate ${selected ? 'text-neutral-300' : 'text-neutral-500'}`}>{coach.title}</div>
        </div>
        <span className={`ml-auto w-6 h-6 flex items-center justify-center shrink-0 ${selected ? '' : 'opacity-0'}`}>
          <i className="ri-check-line text-lg"></i>
        </span>
      </div>
      {coach.bio && <p className={`mt-3 text-xs leading-relaxed ${selected ? 'text-neutral-300' : 'text-neutral-500'}`}>{coach.bio}</p>}
      {coach.specialties && coach.specialties.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {coach.specialties.map((s) => (
            <span key={s} className={`px-2 py-0.5 rounded-full text-[11px] ${selected ? 'bg-white/10 text-neutral-200' : 'bg-neutral-100 text-neutral-600'}`}>{s}</span>
          ))}
        </div>
      )}
    </button>
  );
}