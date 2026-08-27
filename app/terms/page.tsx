import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FBF7F2]">
      <Header />
      <main className="pt-28 pb-20 px-4 md:px-8 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: August 17, 2026</p>

        <div className="mt-10 space-y-8 text-neutral-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">1. Acceptance of Terms</h2>
            <p className="mt-3">
              By accessing or using the services provided by Korean Coaching, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900">2. Service Description</h2>
            <p className="mt-3">
              Korean Coaching provides live 1:1 Korean language coaching sessions via video call. Sessions are delivered online and scheduled through our booking system.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900">3. Booking and Payment</h2>
            <p className="mt-3">
              All sessions must be booked and paid for in advance through our secure checkout. Prices are displayed in your local currency at checkout. Payments are processed by Paddle.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900">4. Cancellation and Rescheduling</h2>
            <p className="mt-3">
              You may reschedule a session up to 24 hours before the scheduled time at no charge. Cancellations made within 24 hours of the session are non-refundable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900">5. Intellectual Property</h2>
            <p className="mt-3">
              All session recordings, materials, and content provided by Korean Coaching are for your personal use only. You may not redistribute, sell, or share these materials without written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900">6. Limitation of Liability</h2>
            <p className="mt-3">
              Korean Coaching is not liable for any indirect, incidental, or consequential damages arising from your use of our services. Our total liability shall not exceed the amount paid for the specific session in question.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900">7. Governing Law</h2>
            <p className="mt-3">
              These terms shall be governed by the laws of the Republic of Korea. Any disputes shall be resolved in the courts of Seoul, South Korea.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900">8. Contact</h2>
            <p className="mt-3">
              For questions about these terms, contact us at hello@koreancoaching.com.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}