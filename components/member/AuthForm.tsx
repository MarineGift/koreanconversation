'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getOrg, getOrgId } from '@/lib/org';
import { upsertMember } from '@/lib/member';
import CountrySelect from '@/components/CountrySelect';

type Mode = 'login' | 'signup' | 'verify' | 'forgot';

export default function AuthForm({ initialMode }: { initialMode?: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode || 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nationality, setNationality] = useState('');
  const [studyPurpose, setStudyPurpose] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState('');

  useEffect(() => {
    getOrg().then((o) => setOrgName(o?.name ?? ''));
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/mypage');
    });
  }, [router]);

  async function getRedirectUrl() {
    const org = await getOrg();
    const websiteUrl = org?.websiteUrl;
    if (websiteUrl) {
      const base = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
      return `${base}/mypage`;
    }
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/mypage`;
    }
    return '/mypage';
  }

  function getKoreanErrorMessage(raw: string): string {
    const msg = raw.toLowerCase();
    if (msg.includes('rate limit')) return '요청 횟수가 너무 많습니다. 1~2분 후 다시 시도해주세요.';
    if (msg.includes('email not confirmed') || msg.includes('email not verified')) return '이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.';
    if (msg.includes('invalid login')) return '이메일 또는 비밀번호가 올바르지 않습니다.';
    if (msg.includes('user not found')) return '등록되지 않은 이메일입니다.';
    if (msg.includes('email address is already registered') || msg.includes('user already registered')) return '이미 가입된 이메일입니다.';
    if (msg.includes('invalid credentials')) return '이메일 또는 비밀번호가 올바르지 않습니다.';
    if (msg.includes('token')) return '인증 코드가 올바르지 않습니다. 다시 확인해주세요.';
    if (msg.includes('network') || msg.includes('timeout')) return '네트워크 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.';
    return raw;
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(getKoreanErrorMessage(error.message));
      return;
    }
    router.replace('/mypage');
  }

  async function signup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    const redirectUrl = await getRedirectUrl();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: 'member', name }, emailRedirectTo: redirectUrl },
    });
    if (error) {
      setLoading(false);
      setError(getKoreanErrorMessage(error.message));
      return;
    }
    await upsertMember({
      email,
      full_name: name || null,
      nationality: nationality || null,
      study_purpose: studyPurpose || null,
      organization_id: await getOrgId(),
      inputter: 'signup',
    });
    setLoading(false);
    if (data.session) {
      router.replace('/mypage');
      return;
    }
    setInfo('입력하신 이메일로 인증 코드가 발송되었습니다. 아래에 코드를 입력해주세요.');
    setMode('verify');
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
    setLoading(false);
    if (error) {
      setError(getKoreanErrorMessage(error.message));
      return;
    }
    router.replace('/mypage');
  }

  async function forgot(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    const redirectUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback?next=/reset-password`
      : 'https://koreancoaching.com/auth/callback?next=/reset-password';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    setLoading(false);
    if (error) {
      setError(getKoreanErrorMessage(error.message));
      return;
    }
    setInfo('비밀번호 재설정 링크가 이메일로 발송되었습니다. 메일함을 확인해주세요.');
  }

  async function resend() {
    setError('');
    setInfo('');
    setLoading(true);
    const redirectUrl = await getRedirectUrl();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: redirectUrl },
    });
    setLoading(false);
    if (error) {
      setError(getKoreanErrorMessage(error.message));
      return;
    }
    setInfo('인증 코드가 다시 발송되었습니다.');
  }

  return (
    <div className="bg-white rounded-3xl border border-neutral-200 p-6 md:p-8 shadow-sm">
      {mode === 'verify' ? (
        <form onSubmit={verify} className="space-y-5">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Email Verification</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Enter the verification code sent to {email}.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Verification Code</label>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code"
              required
              className="mt-1 w-full text-center text-lg tracking-[0.5em] px-3 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">{info}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 text-white text-sm py-3 rounded-xl hover:opacity-90 disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={resend} disabled={loading} className="text-neutral-600 hover:text-neutral-900 cursor-pointer disabled:opacity-50">
              Resend code
            </button>
            <button type="button" onClick={() => { setMode('signup'); setError(''); setInfo(''); }} className="text-neutral-600 hover:text-neutral-900 cursor-pointer">
              Change email
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex p-1 bg-neutral-100 rounded-full">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setInfo(''); }}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition cursor-pointer whitespace-nowrap ${
                mode === 'login' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); setInfo(''); }}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition cursor-pointer whitespace-nowrap ${
                mode === 'signup' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500'
              }`}
            >
              Sign Up
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={login} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700">Email</label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Password</label>
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="••••••••"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-neutral-900 text-white text-sm py-3 rounded-xl hover:opacity-90 disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setError(''); setInfo(''); }}
                  className="text-xs text-neutral-500 hover:text-neutral-900 cursor-pointer"
                >
                  Forgot your password?
                </button>
              </div>
            </form>
          ) : mode === 'forgot' ? (
            <form onSubmit={forgot} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700">Email</label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="you@example.com"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {info && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">{info}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-neutral-900 text-white text-sm py-3 rounded-xl hover:opacity-90 disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setInfo(''); }}
                  className="text-xs text-neutral-500 hover:text-neutral-900 cursor-pointer"
                >
                  Back to sign in
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={signup} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700">Name</label>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Email</label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Password</label>
                <input
                  type="password"
                  name="new-password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="6+ characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Nationality</label>
                <CountrySelect
                  name="nationality"
                  value={nationality}
                  onChange={setNationality}
                  variant="light"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Study Purpose</label>
                <input
                  type="text"
                  name="study_purpose"
                  value={studyPurpose}
                  onChange={(e) => setStudyPurpose(e.target.value)}
                  className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="e.g., business conversation, TOPIK prep"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-neutral-900 text-white text-sm py-3 rounded-xl hover:opacity-90 disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>
          )}
        </>
      )}
      <p className="mt-5 text-center text-xs text-neutral-400">
        {orgName ? `${orgName} member sign in` : 'Member sign in'}
      </p>
    </div>
  );
}