'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login');
      }
    });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF7F2] px-4">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-neutral-200 p-6 md:p-8 shadow-sm text-center">
          <div className="w-10 h-10 flex items-center justify-center mx-auto mb-4">
            <i className="ri-checkbox-circle-line text-3xl text-emerald-500"></i>
          </div>
          <h1 className="text-xl font-bold text-neutral-900">Password Changed</h1>
          <p className="text-sm text-neutral-500 mt-2">Sign in with your new password.</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-6 w-full bg-neutral-900 text-white text-sm py-3 rounded-xl hover:opacity-90 cursor-pointer whitespace-nowrap"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF7F2] px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-bold text-neutral-900 text-center">Set a New Password</h1>
        <form onSubmit={submit} className="mt-6 bg-white rounded-3xl border border-neutral-200 p-6 md:p-8 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">New Password</label>
            <input
              type="password"
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
            <label className="block text-sm font-medium text-neutral-700">Confirm Password</label>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full text-sm px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              placeholder="Re-enter password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 text-white text-sm py-3 rounded-xl hover:opacity-90 disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}