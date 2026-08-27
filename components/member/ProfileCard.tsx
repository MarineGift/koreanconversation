import type { MemberProfile } from '@/lib/member';

const roleLabel: Record<MemberProfile['role'], string> = {
  admin: 'Admin',
  coach: 'Coach',
  member: 'Member',
};

const roleColor: Record<MemberProfile['role'], string> = {
  admin: 'bg-purple-50 text-purple-700 border-purple-200',
  coach: 'bg-blue-50 text-blue-700 border-blue-200',
  member: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function ProfileCard({ profile }: { profile: MemberProfile }) {
  const initial = (profile.name || profile.email || '?').charAt(0).toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 flex items-center gap-5">
      <div className="w-16 h-16 shrink-0 rounded-full bg-neutral-900 text-white flex items-center justify-center text-2xl font-bold">
        {initial}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-xl font-bold text-neutral-900">{profile.name || 'Member'}</div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${roleColor[profile.role]}`}>
            {roleLabel[profile.role]}
          </span>
        </div>
        <div className="text-sm text-neutral-500 mt-1">{profile.email}</div>
        {profile.role === 'coach' && profile.coachTitle && (
          <div className="text-sm text-neutral-600 mt-1">{profile.coachTitle}</div>
        )}
      </div>
    </div>
  );
}