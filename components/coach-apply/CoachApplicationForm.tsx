'use client';

import { useEffect, useState } from 'react';
import {
  getCoachApplicationConfig,
  submitCoachApplication,
  COACH_TYPE_CONFIG,
  type CoachApplicationConfig,
} from '@/lib/coachApplication';

export default function CoachApplicationForm() {
  const [config, setConfig] = useState<CoachApplicationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'ok' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [experience, setExperience] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [websiteAlt, setWebsiteAlt] = useState('');

  useEffect(() => {
    (async () => {
      const cfg = await getCoachApplicationConfig();
      setConfig(cfg);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-sm text-neutral-500 text-center">
        불러오는 중...
      </div>
    );
  }

  if (!config) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-sm text-neutral-500 text-center">
        지원서 정보를 불러올 수 없습니다.
      </div>
    );
  }

  if (!config.enabled) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-sm text-neutral-500 text-center">
        현재 코치 모집이 진행 중이 아닙니다.
      </div>
    );
  }

  const accent = config.accentColor;
  const questions = config.coachType ? COACH_TYPE_CONFIG[config.coachType].questions : [];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!config?.organizationId) {
      setStatus('error');
      setMsg('사이트 정보를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    if (websiteAlt.trim()) {
      setStatus('ok');
      setMsg('지원이 접수되었습니다. 감사합니다.');
      return;
    }
    setStatus('submitting');
    setMsg('');

    const { error } = await submitCoachApplication(config.organizationId, config.coachType, {
      name,
      email,
      phone,
      experience,
      answers,
    });

    if (error) {
      setStatus('error');
      setMsg('지원서 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    setStatus('ok');
    setMsg('지원해 주셔서 감사합니다. 검토 후 연락드리겠습니다.');
    setName('');
    setEmail('');
    setPhone('');
    setExperience('');
    setAnswers({});
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 md:p-10"
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-neutral-800">
            이름 <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-2 w-full text-sm px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2"
            style={{ ['--tw-ring-color' as any]: accent }}
            placeholder="성함을 입력해 주세요."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-800">
            이메일 <span className="text-red-500">*</span>
          </label>
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-2 w-full text-sm px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2"
            style={{ ['--tw-ring-color' as any]: accent }}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-800">연락처</label>
          <input
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-2 w-full text-sm px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2"
            style={{ ['--tw-ring-color' as any]: accent }}
            placeholder="전화번호 또는 메신저 ID"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-800">경력 및 자기소개</label>
          <textarea
            name="experience"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            maxLength={500}
            rows={4}
            className="mt-2 w-full text-sm px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 resize-none"
            style={{ ['--tw-ring-color' as any]: accent }}
            placeholder="관련 경력과 강점을 자유롭게 소개해 주세요."
          />
        </div>

        {questions.length > 0 && (
          <div className="space-y-6">
            <div className="pt-2">
              <p className="text-sm font-semibold text-neutral-800">
                {config.roleLabel} 지원을 위한 추가 정보
              </p>
              <p className="text-xs text-neutral-500 mt-1">아래 질문에 간단히 답해 주세요.</p>
            </div>

            {questions.map((q) => (
              <div key={q.key}>
                <label className="block text-sm font-semibold text-neutral-800">{q.label}</label>
                {q.type === 'select' ? (
                  <select
                    value={answers[q.key] ?? ''}
                    onChange={(e) => setAnswers((p) => ({ ...p, [q.key]: e.target.value }))}
                    className="mt-2 w-full text-sm px-4 py-3 pr-8 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 bg-white"
                    style={{ ['--tw-ring-color' as any]: accent }}
                  >
                    <option value="">선택해 주세요</option>
                    {(q.options ?? []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : q.type === 'textarea' ? (
                  <textarea
                    value={answers[q.key] ?? ''}
                    onChange={(e) => setAnswers((p) => ({ ...p, [q.key]: e.target.value }))}
                    maxLength={500}
                    rows={3}
                    className="mt-2 w-full text-sm px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 resize-none"
                    style={{ ['--tw-ring-color' as any]: accent }}
                    placeholder={q.placeholder}
                  />
                ) : (
                  <input
                    value={answers[q.key] ?? ''}
                    onChange={(e) => setAnswers((p) => ({ ...p, [q.key]: e.target.value }))}
                    className="mt-2 w-full text-sm px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2"
                    style={{ ['--tw-ring-color' as any]: accent }}
                    placeholder={q.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div
          className="absolute left-[-9999px] top-[-9999px]"
          aria-hidden="true"
        >
          <input
            type="text"
            name="website_alt"
            tabIndex={-1}
            autoComplete="off"
            value={websiteAlt}
            onChange={(e) => setWebsiteAlt(e.target.value)}
            readOnly={false}
          />
        </div>

        {status === 'ok' && (
          <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            {msg}
          </div>
        )}
        {status === 'error' && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {msg}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full text-white py-3.5 rounded-full font-semibold text-sm hover:opacity-90 disabled:opacity-60 whitespace-nowrap cursor-pointer"
          style={{ backgroundColor: accent }}
        >
          {status === 'submitting' ? '제출 중...' : `${config.roleLabel} 지원하기`}
        </button>
      </div>
    </form>
  );
}