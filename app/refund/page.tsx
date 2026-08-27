import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#FBF7F2]">
      <Header />
      <main className="pt-28 pb-20 px-4 md:px-8 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">Refund Policy</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: August 17, 2026</p>

        <div className="mt-10 space-y-8 text-neutral-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">1. Single Sessions</h2>
            <p className="mt-3">
              Single 30-minute coaching sessions are refundable if cancelled at least 24 hours before the scheduled session time. Cancellations within 24 hours are non-refundable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900">2. 10-Session Packs</h2>
            <p className="mt-3">
              10-session packs are refundable within 14 days of purchase if no sessions have been used. If one or more sessions have been completed, a partial refund may be issued at our discretion, less the value of completed sessions at the single-session rate.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900">3. Technical Issues</h2>
            <p className="mt-3">
              If a session is interrupted due to technical issues on our end and cannot be completed, we will reschedule at no additional cost or provide a full refund upon request.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900">4. No-Show Policy</h2>
            <p className="mt-3">
              If you do not join the session within 10 minutes of the scheduled start time and have not notified us in advance, the session will be considered completed and is non-refundable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900">5. How to Request a Refund</h2>
            <p className="mt-3">
              To request a refund, email us at hello@koreancoaching.com with your booking details. Refund requests are processed within 5-7 business days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900">6. Exceptional Circumstances</h2>
            <p className="mt-3">
              We understand that unexpected situations arise. If you have extenuating circumstances, please contact us and we will do our best to accommodate a fair resolution.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}