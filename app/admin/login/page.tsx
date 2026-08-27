'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getOrg } from '@/lib/org';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState('Admin');

  useEffect(() => {
    getOrg().then((o) => {
      if (o) setOrgName(o.name);
    });
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/admin');
    });
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.');
      return;
    }
    router.replace('/admin');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 text-neutral-900 font-bold text-xl cursor-pointer">
          <span className="w-6 h-6 flex items-center justify-center"><i className="ri-shield-check-line"></i></span>
          {orgName}
        </Link>
        <div className="mt-6 bg-white rounded-2xl border border-neutral-200 p-6">
          <h1 className="text-lg font-bold text-neutral-900">관리자 로그인</h1>
          <p className="text-sm text-neutral-500 mt-1">대시보드에 접속하려면 로그인하세요.</p>
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700">이메일</label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full text-sm px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">비밀번호</label>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full text-sm px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neutral-900 text-white text-sm py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}