import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-[#FBF7F2]">
      <Header />
      <main className="pt-32 pb-16 text-center px-4">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <span className="w-8 h-8 flex items-center justify-center">
              <i className="ri-check-line text-2xl text-emerald-600"></i>
            </span>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900">Welcome aboard!</h1>
          <p className="mt-4 text-neutral-600">
            Your subscription is being processed. Check your email for next steps.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block bg-neutral-900 text-white px-8 py-3 rounded-full hover:bg-neutral-800 cursor-pointer whitespace-nowrap"
          >
            Back to home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}