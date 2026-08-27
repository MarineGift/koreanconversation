import { Suspense } from 'react';
import AuthCallbackPageClient from './AuthCallbackPageClient';

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF7F2] px-4">
      <Suspense fallback={
        <div className="text-center">
          <div className="w-10 h-10 flex items-center justify-center mx-auto mb-4">
            <i className="ri-loader-4-line text-3xl text-neutral-400 animate-spin"></i>
          </div>
          <p className="text-neutral-600 text-sm">처리 중...</p>
        </div>
      }>
        <AuthCallbackPageClient />
      </Suspense>
    </div>
  );
}