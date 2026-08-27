import { supabase } from './supabase';
import { getOrg } from './org';

export type CoachType = 'education' | 'community' | 'business';

export interface CoachQuestion {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  options?: string[];
  placeholder?: string;
}

export const COACH_TYPE_CONFIG: Record<
  CoachType,
  { roleLabel: string; questions: CoachQuestion[] }
> = {
  education: {
    roleLabel: '한국어 강사',
    questions: [
      {
        key: 'cert',
        label: '한국어 교사 자격증 보유 여부',
        type: 'select',
        options: ['보유', '준비 중', '없음'],
      },
      {
        key: 'years',
        label: '교육 경력 기간',
        type: 'select',
        options: ['1년 미만', '1–3년', '3–5년', '5년 이상'],
      },
      {
        key: 'students',
        label: '주로 가르쳤던 대상',
        type: 'text',
        placeholder: '예: 초급 성인, 기업 임직원 등',
      },
    ],
  },
  community: {
    roleLabel: '커뮤니티 호스트',
    questions: [
      {
        key: 'topics',
        label: '좋아하는 대화 주제',
        type: 'textarea',
        placeholder: '예: 일상, 여행, 음식, 연애 등',
      },
      {
        key: 'dramas',
        label: '즐겨 보는 한국 드라마·예능',
        type: 'text',
        placeholder: '예: 응답하라 1988, 런닝맨 등',
      },
      {
        key: 'hosting',
        label: '그룹 대화 진행 경험',
        type: 'select',
        options: ['있음', '없음'],
      },
    ],
  },
  business: {
    roleLabel: '비즈니스 코치',
    questions: [
      {
        key: 'field',
        label: '비즈니스 업종·경력',
        type: 'textarea',
        placeholder: '예: 무역 5년, 제조업 영업 등',
      },
      {
        key: 'tour',
        label: '한국 투어 도우미 가능 여부',
        type: 'select',
        options: ['가능', '불가', '조율 가능'],
      },
      {
        key: 'korea',
        label: '한국 거주·방문 경험',
        type: 'text',
        placeholder: '예: 서울 3년 거주 등',
      },
    ],
  },
};

export interface CoachApplicationConfig {
  organizationId: string | null;
  name: string;
  websiteUrl: string;
  accentColor: string;
  coachType: CoachType | null;
  roleLabel: string;
  title: string;
  intro: string;
  enabled: boolean;
}

export async function getCoachApplicationConfig(): Promise<CoachApplicationConfig | null> {
  const host =
    typeof window !== 'undefined'
      ? window.location.hostname.replace(/^www\./, '').toLowerCase()
      : '';
  const { data } = await supabase
    .from('organizations')
    .select(
      'id, name, website_url, accent_color, coach_type, coach_role_label, coach_application_title, coach_application_intro, coach_application_enabled'
    );
  const orgs = data ?? [];
  const match = orgs.find((o) => {
    const url = (o.website_url || '')
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .toLowerCase();
    return url === host;
  });

  if (!match) {
    const fallback = await getOrg();
    if (!fallback) return null;
    return {
      organizationId: fallback.id,
      name: fallback.name,
      websiteUrl: fallback.websiteUrl ?? '',
      accentColor: fallback.accentColor,
      coachType: null,
      roleLabel: '코치',
      title: '코치로 함께해요',
      intro: '코치 지원서를 작성해 주세요.',
      enabled: true,
    };
  }

  const coachType = (match.coach_type as CoachType | null) ?? null;
  const typeCfg = coachType ? COACH_TYPE_CONFIG[coachType] : null;

  return {
    organizationId: match.id,
    name: match.name,
    websiteUrl: match.website_url ?? '',
    accentColor: match.accent_color ?? '#171717',
    coachType,
    roleLabel: match.coach_role_label ?? typeCfg?.roleLabel ?? '코치',
    title: match.coach_application_title ?? '코치로 함께해요',
    intro: match.coach_application_intro ?? '코치 지원서를 작성해 주세요.',
    enabled: match.coach_application_enabled !== false,
  };
}

export interface CoachApplicationInput {
  name: string;
  email: string;
  phone: string;
  experience: string;
  answers: Record<string, string>;
}

export async function submitCoachApplication(
  organizationId: string,
  coachType: CoachType | null,
  input: CoachApplicationInput
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('coach_applications').insert({
    organization_id: organizationId,
    name: input.name,
    email: input.email,
    phone: input.phone || null,
    coach_type: coachType,
    experience: input.experience || null,
    answers: input.answers,
  });
  if (error) return { error: error.message };

  notifyCoachApplication(organizationId, coachType, input);
  return { error: null };
}

export async function notifyCoachApplication(
  organizationId: string,
  coachType: CoachType | null,
  input: CoachApplicationInput
) {
  try {
    const questions = coachType ? COACH_TYPE_CONFIG[coachType].questions : [];
    const answerDetails = questions
      .map((q) => ({ label: q.label, value: input.answers[q.key] ?? '' }))
      .filter((a) => a.value);
    const roleLabel = coachType ? COACH_TYPE_CONFIG[coachType].roleLabel : '코치';
    await supabase.functions.invoke('notify-coach-application', {
      body: {
        organization_id: organizationId,
        coach_type: coachType,
        role_label: roleLabel,
        name: input.name,
        email: input.email,
        phone: input.phone,
        experience: input.experience,
        answer_details: answerDetails,
      },
    });
  } catch {
    // 알림은 비차단 처리. 지원서는 이미 저장됨.
  }
}

export async function isCoachApplicationEnabled(): Promise<boolean> {
  const cfg = await getCoachApplicationConfig();
  return cfg?.enabled ?? false;
}

export interface CoachApplicationRecord {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  phone: string | null;
  coach_type: string | null;
  experience: string | null;
  answers: Record<string, string> | null;
  status: string;
  created_at: string;
  site_name: string;
}

export async function fetchCoachApplications(): Promise<CoachApplicationRecord[]> {
  const [appsRes, orgsRes] = await Promise.all([
    supabase.from('coach_applications').select('*').order('created_at', { ascending: false }),
    supabase.from('organizations').select('id, name'),
  ]);
  const orgMap = new Map((orgsRes.data ?? []).map((o) => [o.id, o.name as string]));
  return ((appsRes.data ?? []) as any[]).map((a) => ({
    ...a,
    site_name: orgMap.get(a.organization_id) ?? '—',
  }));
}

export async function updateCoachApplicationStatus(
  id: string,
  status: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('coach_applications').update({ status }).eq('id', id);
  return { error: error ? error.message : null };
}

export async function convertApplicationToCoach(
  applicationId: string
): Promise<{ error: string | null }> {
  const { data: app } = await supabase
    .from('coach_applications')
    .select('*')
    .eq('id', applicationId)
    .maybeSingle();

  if (!app) return { error: '지원서를 찾을 수 없습니다.' };

  const roleLabel =
    app.coach_type && COACH_TYPE_CONFIG[app.coach_type as CoachType]
      ? COACH_TYPE_CONFIG[app.coach_type as CoachType].roleLabel
      : '코치';

  const { data: coach, error: coachErr } = await supabase
    .from('coaches')
    .insert({
      name: app.name,
      email: app.email,
      organization_id: app.organization_id,
      title: roleLabel,
      bio: app.experience || null,
      approval_status: 'approved',
    })
    .select('id')
    .maybeSingle();

  if (coachErr) return { error: coachErr.message };
  const coachId = coach?.id;
  if (!coachId) return { error: '코치 생성에 실패했습니다.' };

  await supabase.from('coach_sites').insert({
    coach_id: coachId,
    organization_id: app.organization_id,
  });

  await supabase.from('coach_profiles').insert({
    coach_id: coachId,
    organization_id: app.organization_id,
    headline: roleLabel,
    bio: app.experience || '',
    specialties: [],
    credentials: [],
  });

  const { error: statusErr } = await supabase
    .from('coach_applications')
    .update({ status: 'approved' })
    .eq('id', applicationId);
  if (statusErr) return { error: statusErr.message };

  return { error: null };
}