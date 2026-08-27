'use client';

import { useEffect, useState } from 'react';
import type { CoachWithSites, CoachOrg, CoachProfile } from '@/lib/coachManagement';
import { fetchCoachManagement, assignCoachToSite, unassignCoachFromSite } from '@/lib/coachManagement';
import CoachAssignmentCard from './CoachAssignmentCard';
import CoachProfileModal from './CoachProfileModal';

export default function CoachSiteManager() {
  const [loading, setLoading] = useState(true);
  const [coaches, setCoaches] = useState<CoachWithSites[]>([]);
  const [organizations, setOrganizations] = useState<CoachOrg[]>([]);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<{ coach: CoachWithSites; org: CoachOrg; profile: CoachProfile | null } | null>(null);

  async function load() {
    const data = await fetchCoachManagement();
    setCoaches(data.coaches);
    setOrganizations(data.organizations);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleToggle(coach: CoachWithSites, orgId: string, assigned: boolean) {
    setBusy(true);
    if (assigned) {
      await unassignCoachFromSite(coach.id, orgId);
    } else {
      await assignCoachToSite(coach.id, orgId);
    }
    setBusy(false);
    await load();
  }

  function handleSaved() {
    load();
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-neutral-500">
          강사를 사이트에 배정하고, 사이트별로 다른 이력을 관리하세요. 한 강사가 여러 사이트에서 활동할 수 있습니다.
        </p>
      </div>

      {coaches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
          등록된 강사가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {coaches.map((coach) => (
            <CoachAssignmentCard
              key={coach.id}
              coach={coach}
              organizations={organizations}
              busy={busy}
              onToggle={(orgId, assigned) => handleToggle(coach, orgId, assigned)}
              onEdit={(org) =>
                setEditing({
                  coach,
                  org,
                  profile: coach.profiles.find((p) => p.organization_id === org.id) ?? null,
                })
              }
            />
          ))}
        </div>
      )}

      {editing && (
        <CoachProfileModal
          coachId={editing.coach.id}
          coachName={editing.coach.name}
          org={editing.org}
          profile={editing.profile}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}