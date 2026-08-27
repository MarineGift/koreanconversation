'use client';

import { useEffect, useState } from 'react';
import { getCoachApplicationConfig, type CoachApplicationConfig, type CoachType } from '@/lib/coachApplication';

interface Benefit {
  icon: string;
  title: string;
  desc: string;
}

const TYPE_BENEFITS: Record<CoachType, { heading: string; benefits: Benefit[] }> = {
  education: {
    heading: '한국어 강사 지원 혜택',
    benefits: [
      { icon: 'ri-book-open-line', title: '커리큘럼 제공', desc: '검증된 교육 자료와 수업 커리큘럼을 제공해 수업 준비 부담을 덜어드려요.' },
      { icon: 'ri-calendar-line', title: '유연한 스케줄', desc: '원하는 시간대에 수업을 열 수 있어 본업과 병행하기 좋아요.' },
      { icon: 'ri-group-line', title: '안정적인 수강생', desc: '꾸준히 유입되는 수강생과 매칭되어 안정적으로 활동할 수 있어요.' },
      { icon: 'ri-money-dollar-circle-line', title: '합리적인 보상', desc: '경력과 성과에 따라 합리적인 보상을 제공해요.' },
    ],
  },
  community: {
    heading: '커뮤니티 호스트 지원 혜택',
    benefits: [
      { icon: 'ri-chat-smile-3-line', title: '즐거운 대화 중심', desc: '좋아하는 주제와 드라마를 소재로 자유롭게 대화를 이끌어가요.' },
      { icon: 'ri-team-line', title: '커뮤니티 구축', desc: '다수의 수강생과 함께 성장하는 한국어 커뮤니티를 만들어가요.' },
      { icon: 'ri-global-line', title: '문화 공유', desc: '한국 문화와 일상을 나누며 자연스러운 언어 교류를 이끌어요.' },
      { icon: 'ri-calendar-check-line', title: '자유로운 진행', desc: '원하는 주제와 시간대로 그룹 세션을 자유롭게 운영할 수 있어요.' },
    ],
  },
  business: {
    heading: '비즈니스 코치 지원 혜택',
    benefits: [
      { icon: 'ri-briefcase-4-line', title: '프로 네트워크', desc: '한국 비즈니스와 여행에 관심 있는 전문 고객을 만날 수 있어요.' },
      { icon: 'ri-line-chart-line', title: '실전 비즈니스 사례', desc: '현장 코칭과 투어 도우미 등 실질적인 비즈니스 기회를 제공해요.' },
      { icon: 'ri-map-pin-line', title: '현장 중심', desc: '한국에 있거나 방문하는 고객을 대상으로 현장 중심 코칭을 진행해요.' },
      { icon: 'ri-award-line', title: '전문성 인정', desc: '비즈니스 한국어 전문 코치로서의 커리어를 쌓을 수 있어요.' },
    ],
  },
};

const PROCESS_STEPS = [
  { icon: 'ri-file-list-3-line', title: '지원서 제출', desc: '아래 폼으로 간단히 지원해 주세요.' },
  { icon: 'ri-search-eye-line', title: '서류 검토', desc: '담당자가 경력과 적합성을 검토합니다.' },
  { icon: 'ri-video-chat-line', title: '온라인 미팅', desc: '간단한 소개와 미팅을 진행합니다.' },
  { icon: 'ri-rocket-line', title: '온보딩', desc: '합격 시 바로 활동을 시작할 수 있어요.' },
];

export default function CoachApplyBenefits() {
  const [config, setConfig] = useState<CoachApplicationConfig | null>(null);

  useEffect(() => {
    (async () => {
      const cfg = await getCoachApplicationConfig();
      setConfig(cfg);
    })();
  }, []);

  const accent = config?.accentColor ?? '#171717';
  const type = config?.coachType ?? null;
  const benefits = type ? TYPE_BENEFITS[type].benefits : TYPE_BENEFITS.education.benefits;
  const heading = type ? TYPE_BENEFITS[type].heading : '코치 지원 혜택';
  const roleLabel = config?.roleLabel ?? '코치';

  if (!config?.enabled) return null;

  return (
    <section className="py-12 md:py-16 px-4 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-xs font-medium text-neutral-600">
            <i className="ri-sparkling-line"></i>
            왜 {roleLabel}가 되어야 할까요?
          </span>
          <h2 className="mt-4 text-2xl md:text-3xl font-bold text-neutral-900">{heading}</h2>
          <p className="mt-3 text-sm md:text-base text-neutral-500 max-w-xl mx-auto">
            {config.name}과 함께 성장하며 여러분의 경험과 열정을 나눠보세요.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="bg-white rounded-2xl border border-neutral-200 p-6 hover:shadow-md transition cursor-default"
            >
              <span
                className="w-11 h-11 flex items-center justify-center rounded-xl text-xl text-white"
                style={{ backgroundColor: accent }}
              >
                <i className={b.icon}></i>
              </span>
              <h3 className="mt-4 text-base font-semibold text-neutral-900">{b.title}</h3>
              <p className="mt-1.5 text-sm text-neutral-500 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <div className="text-center">
            <h3 className="text-xl md:text-2xl font-bold text-neutral-900">모집 절차</h3>
            <p className="mt-2 text-sm text-neutral-500">지원부터 활동 시작까지, 이렇게 진행됩니다.</p>
          </div>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PROCESS_STEPS.map((step, i) => (
              <div key={step.title} className="relative bg-white rounded-2xl border border-neutral-200 p-6">
                <div className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: accent }}
                  >
                    {i + 1}
                  </span>
                  <span className="w-9 h-9 flex items-center justify-center text-xl text-neutral-400">
                    <i className={step.icon}></i>
                  </span>
                </div>
                <h4 className="mt-4 text-sm font-semibold text-neutral-900">{step.title}</h4>
                <p className="mt-1 text-xs text-neutral-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}