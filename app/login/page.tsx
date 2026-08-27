'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import AuthForm from '@/components/member/AuthForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF7F2] px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 text-neutral-900 font-bold text-xl cursor-pointer">
          <span className="w-6 h-6 flex items-center justify-center"><i className="ri-user-heart-line"></i></span>
          Member Login
        </Link>
        <div className="mt-6">
          <Suspense fallback={<div className="text-center text-sm text-neutral-400 py-10">Loading...</div>}>
            <AuthFormWrapper />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function AuthFormWrapper() {
  const searchParams = useSearchParams();
  return <AuthForm initialMode={searchParams.get('mode') as any} />;
}