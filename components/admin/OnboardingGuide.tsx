const steps = [
  {
    title: '사이트 추가',
    desc: '관리자 대시보드의 "사이트 관리" 섹션에서 새 사이트를 추가하세요.',
    details: ['이름·식별자(slug)·한줄소개·브랜드 색상을 입력', 'slug는 자동 생성되며 수동 수정도 가능'],
  },
  {
    title: '강사 연결',
    desc: '"강사 · 사이트 관리" 섹션에서 강사를 새 사이트에 배정하세요.',
    details: ['강사는 여러 사이트에 동시에 속할 수 있습니다', '사이트별 이력을 다르게 입력할 수 있습니다'],
  },
  {
    title: '배포 설정',
    desc: '새 사이트를 배포할 때 환경변수를 해당 사이트 slug로 변경하세요.',
    details: ['NEXT_PUBLIC_ORG_SLUG 를 새 조직의 slug로 설정 후 배포', '도메인별 배포 안내 표에서 확인 가능'],
  },
  {
    title: '확인',
    desc: '새 사이트에서 조직 이름·색상·강사·예약이 해당 사업체 기준으로만 표시됩니다.',
    details: ['헤더 로고, 탭 제목, 대시보드 데이터 모두 자동 반영'],
  },
];

export default function OnboardingGuide() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <h3 className="text-lg font-bold text-neutral-900">새 사업체 추가 절차</h3>
      <p className="text-sm text-neutral-500 mt-1">같은 코드로 다른 사업체를 운영하려면 아래 순서대로 진행하세요.</p>
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((s, i) => (
          <div key={s.title} className="border border-neutral-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-neutral-900 text-white text-xs font-bold">{i + 1}</span>
              <span className="font-semibold text-neutral-900">{s.title}</span>
            </div>
            <p className="text-sm text-neutral-600 mt-2">{s.desc}</p>
            <ul className="mt-2 space-y-1">
              {s.details.map((d) => (
                <li key={d} className="text-xs text-neutral-500 flex gap-1.5">
                  <span className="text-neutral-400">•</span>
                  <span className="font-mono">{d}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}