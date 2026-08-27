'use client';

import { useEffect, useState } from 'react';
import type { Organization } from '@/lib/organizationManagement';
import { fetchOrganizations } from '@/lib/organizationManagement';
import { ORG_SLUG } from '@/lib/config';

export default function DomainDeployGuide() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    fetchOrganizations().then(setOrganizations);
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-neutral-900">도메인별 배포 안내</h3>
          <p className="text-sm text-neutral-500 mt-1">
            같은 코드로 여러 사이트를 운영합니다. 각 사이트를 배포할 때 아래 식별자를 환경변수로 설정하면 해당 사이트가 표시됩니다.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-neutral-500">현재 활성 사이트</span>
          <span className="font-mono bg-neutral-900 text-white px-2.5 py-1 rounded-md">{ORG_SLUG}</span>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">사이트</th>
                <th className="px-4 py-3 font-medium">배포 식별자 (slug)</th>
                <th className="px-4 py-3 font-medium">환경변수 설정</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => {
                const active = org.slug === ORG_SLUG;
                return (
                  <tr key={org.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: org.accent_color || '#171717' }}
                        >
                          {org.name.charAt(0)}
                        </span>
                        <span className="font-medium text-neutral-900">{org.name}</span>
                        {active && (
                          <span className="text-[11px] bg-neutral-900 text-white px-1.5 py-0.5 rounded">현재</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-600">{org.slug}</td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                      NEXT_PUBLIC_ORG_SLUG={org.slug}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-neutral-50 p-4 text-sm">
        <span className="w-5 h-5 flex items-center justify-center shrink-0 text-neutral-500 mt-0.5">
          <i className="ri-lightbulb-line"></i>
        </span>
        <div className="text-neutral-600">
          <p>
            배포(Deploy) 단계에서 환경변수 <span className="font-mono text-neutral-900">NEXT_PUBLIC_ORG_SLUG</span> 를
            해당 사이트의 식별자로 설정하세요. 설정하지 않으면 기본값{' '}
            <span className="font-mono text-neutral-900">korean-coaching</span> 사이트가 표시됩니다.
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            각 도메인을 별도 배포로 연결하면 사이트마다 다른 이름·색상·강사·예약·콘텐츠가 자동으로 표시됩니다.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <h4 className="text-sm font-bold text-neutral-900 mb-3">단계별 배포 가이드</h4>
        <ol className="space-y-3">
          {[
            {
              title: '도메인 준비',
              desc: '도메인 등록기관에서 koreanconversation.com / koreanspeakingcoach.com 소유권을 확인하고 네임서버(DNS)에 접근할 수 있는지 확인하세요.',
            },
            {
              title: '같은 코드를 각각 배포',
              desc: '현재 프로젝트를 도메인 수만큼(3개) 배포합니다. 각 배포에서 환경변수 NEXT_PUBLIC_ORG_SLUG 값을 해당 slug로 다르게 설정합니다.',
            },
            {
              title: '도메인 연결',
              desc: '각 배포 설정에서 커스텀 도메인을 추가하고, 안내되는 DNS 레코드(A/CNAME)를 도메인 등록기관에 입력합니다.',
            },
            {
              title: 'DNS 전파 확인',
              desc: 'DNS 전파는 보통 수 분~최대 48시간이 걸립니다. SSL 인증서가 발급되면 사이트가 정상 표시됩니다.',
            },
            {
              title: '콘텐츠·강사 점검',
              desc: '각 사이트에 접속해 이름·색상·히어로 문구·FAQ·강사·예약이 의도대로 다른지 확인하세요.',
            },
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-neutral-900 text-white text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div>
                <div className="font-medium text-neutral-900">{step.title}</div>
                <div className="text-sm text-neutral-500 mt-0.5">{step.desc}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}