'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processing...');
  const [error, setError] = useState('');

  useEffect(() => {
    async function handleCallback() {
      try {
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;

          if (type === 'recovery') {
            router.replace('/reset-password');
            return;
          }

          const next = searchParams.get('next') || '/mypage';
          router.replace(next);
          return;
        }

        const code = searchParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          const next = searchParams.get('next') || '/mypage';
          router.replace(next);
          return;
        }

        throw new Error('Authentication info not found.');
      } catch (err: any) {
        setError(err.message || 'An error occurred during authentication.');
        setStatus('');
      }
    }

    handleCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={() => router.push('/login')}
          className="mt-4 px-5 py-2.5 bg-neutral-900 text-white rounded-xl text-sm hover:opacity-90 cursor-pointer whitespace-nowrap"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="w-10 h-10 flex items-center justify-center mx-auto mb-4">
        <i className="ri-loader-4-line text-3xl text-neutral-400 animate-spin"></i>
      </div>
      <p className="text-neutral-600 text-sm">{status}</p>
    </div>
  );
}