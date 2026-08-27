import type { DashboardSubscriber } from '@/lib/dashboard';

function formatDate(d: string) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function SubscribersList({ subscribers }: { subscribers: DashboardSubscriber[] }) {
  if (subscribers.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
        아직 가입자가 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200 bg-neutral-50">
              <th className="px-5 py-3 font-medium">이름</th>
              <th className="px-5 py-3 font-medium">이메일</th>
              <th className="px-5 py-3 font-medium">레벨</th>
              <th className="px-5 py-3 font-medium">국적</th>
              <th className="px-5 py-3 font-medium">메일 수신 동의</th>
              <th className="px-5 py-3 font-medium">가입일</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-5 py-3 font-medium text-neutral-900">{s.name ?? '—'}</td>
                <td className="px-5 py-3 text-neutral-600">{s.email}</td>
                <td className="px-5 py-3 text-neutral-600">{s.level ?? '—'}</td>
                <td className="px-5 py-3 text-neutral-600">{s.nationality ?? '—'}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${s.consent ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
                    {s.consent ? '동의' : '미동의'}
                  </span>
                </td>
                <td className="px-5 py-3 text-neutral-600">{formatDate(s.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}