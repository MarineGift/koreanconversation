'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getOrg, type OrgBranding } from '@/lib/org';
import { detectRole, getMyBookings, type MemberProfile, type MemberBooking, getMemberByEmail } from '@/lib/member';
import ProfileCard from '@/components/member/ProfileCard';
import MyBookings from '@/components/member/MyBookings';
import MemberCreditHistory from '@/components/member/MemberCreditHistory';
import CoachProfileEditor from '@/components/member/CoachProfileEditor';
import CoachScheduleEditor from '@/components/member/CoachScheduleEditor';
import CoachInbox from '@/components/member/CoachInbox';
import CoachUnavailableManager from '@/components/member/CoachUnavailableManager';
import { updateBookingStatus, cancelBooking } from '@/lib/dashboard';

type TabKey = 'sessions' | 'purchases' | 'profile' | 'schedule' | 'inbox' | 'unavailable';

export default function MyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<OrgBranding | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [bookings, setBookings] = useState<MemberBooking[]>([]);
  const [credits, setCredits] = useState(0);
  const [activeTab, setActiveTab] = useState<TabKey>('sessions');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        router.replace('/login');
        return;
      }
      const user = session.user;
      const email = user.email ?? '';
      const metadataRole = user.user_metadata?.role as string | undefined;
      const [o, roleInfo] = await Promise.all([getOrg(), detectRole(email, metadataRole)]);
      if (!mounted) return;
      const name = (user.user_metadata?.name as string) || email.split('@')[0];
      setOrg(o);
      setProfile({
        name,
        email,
        role: roleInfo.role,
        coachId: roleInfo.coachId,
        coachTitle: roleInfo.coachTitle,
      });
      const b = await getMyBookings(roleInfo.role, roleInfo.coachId, email);
      if (!mounted) return;
      setBookings(b);
      const member = await getMemberByEmail(email);
      setCredits(member?.session_credits ?? 0);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/login');
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  async function handleConfirm(bookingId: string) {
    const error = await updateBookingStatus(bookingId, 'confirmed');
    if (error) {
      alert('Failed to confirm the booking. Please try again.');
      return;
    }
    const roleInfo = await detectRole(profile?.email ?? '', undefined);
    const b = await getMyBookings(roleInfo.role, roleInfo.coachId, profile?.email ?? '');
    setBookings(b);
  }

  async function handleDecline(bookingId: string, reason: string) {
    const error = await cancelBooking(bookingId, reason);
    if (error) {
      alert('Failed to decline the booking. Please try again.');
      return;
    }
    const roleInfo = await detectRole(profile?.email ?? '', undefined);
    const b = await getMyBookings(roleInfo.role, roleInfo.coachId, profile?.email ?? '');
    setBookings(b);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-sm text-neutral-500">
        Loading...
      </div>
    );
  }

  const accent = org?.accentColor ?? '#171717';
  const role = profile?.role ?? 'member';
  const isAdmin = role === 'admin';
  const isCoach = role === 'coach';

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'sessions', label: '수강 정보', icon: 'ri-calendar-check-line' },
  ];
  if (role !== 'admin') {
    tabs.push({ key: 'purchases', label: '구매 내역', icon: 'ri-wallet-3-line' });
  }
  if (isCoach && profile?.coachId) {
    tabs.push({ key: 'profile', label: '강사 소개', icon: 'ri-user-settings-line' });
    tabs.push({ key: 'schedule', label: '코칭 일정', icon: 'ri-time-line' });
    tabs.push({ key: 'inbox', label: '신청 내역', icon: 'ri-inbox-line' });
    tabs.push({ key: 'unavailable', label: '코칭 불가', icon: 'ri-close-circle-line' });
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200">
        <div className="mx-auto max-w-7xl px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ backgroundColor: `${accent}1a`, color: accent }}>
              <i className="ri-user-heart-line"></i>
            </span>
            <span className="font-bold text-neutral-900">My Page</span>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link href="/admin" className="text-sm text-neutral-600 hover:text-neutral-900 whitespace-nowrap cursor-pointer flex items-center gap-1.5">
                <span className="w-4 h-4 flex items-center justify-center"><i className="ri-dashboard-line"></i></span>
                Admin Dashboard
              </Link>
            )}
            <Link href="/" className="text-sm text-neutral-600 hover:text-neutral-900 whitespace-nowrap cursor-pointer">View Site</Link>
            <button onClick={logout} className="text-sm text-neutral-600 hover:text-neutral-900 whitespace-nowrap cursor-pointer flex items-center gap-1.5">
              <span className="w-4 h-4 flex items-center justify-center"><i className="ri-logout-box-line"></i></span>
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 md:px-8 py-8 space-y-6">
        {profile && <ProfileCard profile={profile} />}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl" style={{ backgroundColor: `${accent}1a`, color: accent }}>
              <i className="ri-calendar-check-line text-2xl"></i>
            </div>
            <div>
              <div className="text-3xl font-bold text-neutral-900 leading-none">{bookings.length}</div>
              <div className="text-sm text-neutral-500 mt-1">{isAdmin || isCoach ? 'All Coaching Sessions' : 'My Coaching Sessions'}</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl" style={{ backgroundColor: `${accent}1a`, color: accent }}>
              <i className="ri-coin-line text-2xl"></i>
            </div>
            <div>
              <div className="text-3xl font-bold text-neutral-900 leading-none">{credits}</div>
              <div className="text-sm text-neutral-500 mt-1">Session Credits Left</div>
            </div>
          </div>
        </div>

        <div className="sticky top-0 z-20 bg-neutral-50/95 backdrop-blur -mx-4 md:-mx-8 px-4 md:px-8 py-2 border-b border-neutral-200">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition border ${
                  activeTab === t.key
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-900'
                }`}
              >
                <span className="w-4 h-4 flex items-center justify-center"><i className={t.icon}></i></span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {activeTab === 'sessions' && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-neutral-900">
                {isAdmin ? 'All Coaching Sessions' : isCoach ? 'Assigned Coaching Sessions' : 'My Coaching Sessions'}
              </h2>
              <MyBookings bookings={bookings} role={role} onConfirm={handleConfirm} onDecline={handleDecline} />
            </section>
          )}

          {activeTab === 'purchases' && role !== 'admin' && (
            <MemberCreditHistory email={profile?.email ?? ''} credits={credits} role={role} coachId={profile?.coachId ?? null} />
          )}

          {activeTab === 'profile' && isCoach && profile?.coachId && (
            <CoachProfileEditor coachId={profile.coachId} />
          )}

          {activeTab === 'schedule' && isCoach && profile?.coachId && (
            <CoachScheduleEditor coachId={profile.coachId} />
          )}

          {activeTab === 'inbox' && isCoach && profile?.coachId && (
            <CoachInbox coachId={profile.coachId} />
          )}

          {activeTab === 'unavailable' && isCoach && profile?.coachId && (
            <CoachUnavailableManager coachId={profile.coachId} />
          )}
        </div>
      </main>
    </div>
  );
}