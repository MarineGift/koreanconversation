'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getOrg, type OrgBranding } from '@/lib/org';
import { getDashboardData, type DashboardData } from '@/lib/dashboard';
import { detectRole } from '@/lib/member';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTabs from '@/components/admin/AdminTabs';
import OverviewSection from '@/components/admin/sections/OverviewSection';
import CoachSection from '@/components/admin/sections/CoachSection';
import StudentSection from '@/components/admin/sections/StudentSection';
import MemberSection from '@/components/admin/sections/MemberSection';
import LessonSection from '@/components/admin/sections/LessonSection';
import MaterialSection from '@/components/admin/sections/MaterialSection';
import PaymentSection from '@/components/admin/sections/PaymentSection';
import CarouselSection from '@/components/admin/sections/CarouselSection';
import QuestionsSection from '@/components/admin/sections/QuestionsSection';
import PackageInquiriesSection from '@/components/admin/sections/PackageInquiriesSection';
import CoachApplicationSection from '@/components/admin/sections/CoachApplicationSection';
import MarketingSection from '@/components/admin/sections/MarketingSection';
import OrgManager from '@/components/admin/OrgManager';
import CoachSiteManager from '@/components/admin/CoachSiteManager';
import CoachScheduleManager from '@/components/admin/CoachScheduleManager';
import SubscribersList from '@/components/admin/SubscribersList';
import DomainDeployGuide from '@/components/admin/DomainDeployGuide';
import OnboardingGuide from '@/components/admin/OnboardingGuide';
import ScheduleDayViewer from '@/components/admin/ScheduleDayViewer';
import ContentSection from '@/components/admin/sections/ContentSection';
import AnalyticsSection from '@/components/admin/sections/AnalyticsSection';

const TAB_CONFIG: Record<string, { key: string; label: string }[]> = {
  analytics: [
    { key: 'analytics-overview', label: '종합 분석' },
    { key: 'analytics-trends', label: '사이트별 추이' },
    { key: 'analytics-pages', label: '페이지 분석' },
    { key: 'analytics-records', label: '접속 기록' },
  ],
  members: [
    { key: 'member', label: '전체 회원' },
    { key: 'student', label: '수강생' },
    { key: 'subscribers', label: '가입자' },
  ],
  coaches: [
    { key: 'coach', label: '전체 강사' },
    { key: 'coach-applications', label: '지원서' },
    { key: 'coach-schedule', label: '일정 관리' },
    { key: 'coach-sites', label: '사이트 관리' },
  ],
  content: [
    { key: 'site-content', label: '사이트 콘텐츠' },
    { key: 'lesson', label: '강의' },
    { key: 'material', label: '교육교재' },
    { key: 'carousel', label: '캐러셀' },
  ],
  operations: [
    { key: 'schedule', label: '예약 현황' },
    { key: 'payment', label: '결제 현황' },
    { key: 'questions', label: '받은 질문' },
    { key: 'package-inquiries', label: '패키지 문의' },
  ],
  marketing: [
    { key: 'sequence', label: '시퀀스 메일링' },
  ],
  settings: [
    { key: 'sites', label: '사이트 관리' },
  ],
};

const TAB_TITLES: Record<string, string> = {
  overview: '대시보드',
  'analytics-overview': '종합 분석',
  'analytics-trends': '사이트별 추이',
  'analytics-pages': '페이지 분석',
  'analytics-records': '접속 기록',
  member: '전체 회원',
  student: '수강생',
  subscribers: '가입자',
  coach: '전체 강사',
  'coach-applications': '코치 지원서',
  'coach-schedule': '일정 관리',
  'coach-sites': '사이트 관리',
  'site-content': '사이트 콘텐츠',
  lesson: '강의',
  material: '교육교재',
  carousel: '캐러셀 관리',
  schedule: '예약 현황',
  payment: '결제 현황',
  questions: '받은 질문',
  'package-inquiries': '패키지 문의',
  sequence: '시퀀스 메일링',
  sites: '사이트 관리',
  analytics: '접속자 분석',
};

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('overview');
  const [activeTab, setActiveTab] = useState('');
  const [org, setOrg] = useState<OrgBranding | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const load = useCallback(async () => {
    const d = await getDashboardData();
    setData(d);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace('/admin/login');
        return;
      }
      const email = sessionData.session.user.email ?? '';
      const metadataRole = sessionData.session.user.user_metadata?.role as string | undefined;
      const roleInfo = await detectRole(email, metadataRole);
      if (roleInfo.role !== 'admin') {
        router.replace('/mypage');
        return;
      }
      const [o, d] = await Promise.all([getOrg(), getDashboardData()]);
      if (!mounted) return;
      setOrg(o);
      setData(d);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/admin/login');
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    const handler = (e: any) => {
      const detail = e.detail;
      if (detail?.category) {
        setActiveCategory(detail.category);
        if (detail.tab) {
          setTimeout(() => setActiveTab(detail.tab), 0);
        }
      }
    };
    window.addEventListener('admin-navigate', handler);
    return () => window.removeEventListener('admin-navigate', handler);
  }, []);

  useEffect(() => {
    if (activeCategory === 'overview') {
      setActiveTab('');
    } else {
      const tabs = TAB_CONFIG[activeCategory];
      if (tabs && tabs.length > 0) {
        setActiveTab(tabs[0].key);
      }
    }
  }, [activeCategory]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-sm text-neutral-500">
        불러오는 중...
      </div>
    );
  }

  const accent = org?.accentColor ?? '#171717';
  const orgName = org?.name ?? 'Korean Coaching';

  function renderSection() {
    if (activeCategory === 'overview') {
      return (
        <OverviewSection
          bookings={data?.bookings ?? []}
          orders={data?.orders ?? []}
          coachesCount={data?.totalCoaches ?? 0}
          accent={accent}
        />
      );
    }

    switch (activeTab) {
      case 'member':
        return <MemberSection />;
      case 'student':
        return <StudentSection bookings={data?.bookings ?? []} />;
      case 'subscribers':
        return <SubscribersList subscribers={data?.subscribers ?? []} />;
      case 'coach':
        return (
          <CoachSection coaches={data?.coaches ?? []} bookings={data?.bookings ?? []} accent={accent} onChanged={load} />
        );
      case 'coach-applications':
        return <CoachApplicationSection />;
      case 'coach-schedule':
        return <CoachScheduleManager />;
      case 'coach-sites':
        return <CoachSiteManager />;
      case 'site-content':
        return <ContentSection />;
      case 'lesson':
        return <LessonSection bookings={data?.bookings ?? []} onStatusChanged={load} />;
      case 'material':
        return <MaterialSection accent={accent} />;
      case 'carousel':
        return <CarouselSection />;
      case 'schedule':
        return <ScheduleDayViewer />;
      case 'payment':
        return <PaymentSection bookings={data?.bookings ?? []} accent={accent} onChanged={load} />;
      case 'questions':
        return <QuestionsSection />;
      case 'package-inquiries':
        return <PackageInquiriesSection />;
      case 'sequence':
        return <MarketingSection />;
      case 'sites':
        return (
          <div className="space-y-6">
            <OrgManager />
            <DomainDeployGuide />
            <OnboardingGuide />
          </div>
        );
      case 'analytics-overview':
      case 'analytics-trends':
      case 'analytics-pages':
      case 'analytics-records':
        return <AnalyticsSection tab={activeTab} />;
      default:
        return null;
    }
  }

  const tabs = TAB_CONFIG[activeCategory] ?? [];

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <AdminSidebar
        active={activeCategory}
        onSelect={setActiveCategory}
        onLogout={logout}
        orgName={orgName}
        accent={accent}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-neutral-200 h-16 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="메뉴 열기"
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-neutral-100 cursor-pointer -ml-1"
            >
              <i className="ri-menu-line text-2xl text-neutral-700"></i>
            </button>
            <h1 className="text-base md:text-lg font-bold text-neutral-900 truncate">
              {TAB_TITLES[activeCategory === 'overview' ? 'overview' : activeTab] ?? ''}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-neutral-500">
            <span className="hidden sm:inline">마지막 업데이트: 방금 전</span>
          </div>
        </header>

        <main className="p-4 md:p-6 w-full">
          {tabs.length > 0 && (
            <div className="mb-6">
              <AdminTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
            </div>
          )}
          {renderSection()}
        </main>
      </div>
    </div>
  );
}