'use client';

import { useEffect, useState } from 'react';
import { getOrgId } from '@/lib/org';
import { getCoachesForOrg, type Coach as CoachType } from '@/lib/booking';

export default function Coach() {
  const [coaches, setCoaches] = useState<CoachType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const orgId = await getOrgId();
      if (!orgId) {
        if (mounted) setLoading(false);
        return;
      }
      const list = await getCoachesForOrg(orgId);
      if (mounted) {
        setCoaches(list);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || coaches.length === 0) return null;

  return (
    <section id="coach" className="py-16 md:py-24 bg-[#FBF7F2]">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <div className="text-xs uppercase tracking-widest text-neutral-500">
            {coaches.length > 1 ? 'Meet your coaches' : 'Meet your coach'}
          </div>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-neutral-900">
            {coaches.length > 1 ? 'Expert 1:1 Korean coaches.' : 'Your expert Korean coach.'}
          </h2>
        </div>

        <div className="space-y-12">
          {coaches.map((c) => (
            <CoachCard key={c.id} coach={c} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CoachCard({ coach }: { coach: CoachType }) {
  const initials = coach.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-8 md:gap-12 items-start">
      <div className="relative mx-auto lg:mx-0 w-full max-w-[320px]">
        {coach.photo ? (
          <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/5]">
            <img src={coach.photo} alt={coach.name} className="w-full h-full object-cover object-top" />
          </div>
        ) : (
          <div className="rounded-3xl overflow-hidden shadow-xl aspect-[4/5] bg-white border border-neutral-200 flex items-center justify-center">
            <span className="text-6xl font-bold text-neutral-300">{initials}</span>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-2xl md:text-3xl font-bold text-neutral-900">{coach.name}</h3>
        {coach.headline && (
          <div className="mt-1 text-base md:text-lg font-medium text-neutral-500">{coach.headline}</div>
        )}

        {coach.bio && (
          <p className="mt-4 text-neutral-600 leading-relaxed">{coach.bio}</p>
        )}

        {coach.specialties && coach.specialties.length > 0 && (
          <div className="mt-6">
            <div className="text-xs uppercase tracking-widest text-neutral-500 mb-2">Specialties</div>
            <div className="flex flex-wrap gap-2">
              {coach.specialties.map((s) => (
                <span
                  key={s}
                  className="px-3 py-1.5 rounded-full bg-white border border-neutral-200 text-sm text-neutral-700"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {coach.credentials && coach.credentials.length > 0 && (
          <ul className="mt-6 space-y-3">
            {coach.credentials.map((c) => (
              <li key={c} className="flex items-start gap-3">
                <span className="mt-1 w-5 h-5 flex items-center justify-center rounded-full bg-neutral-900 text-white text-xs shrink-0">
                  <i className="ri-check-line"></i>
                </span>
                <span className="text-neutral-800">{c}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}