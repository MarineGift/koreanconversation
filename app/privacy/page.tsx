import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FBF7F2]">
      <Header />
      <main className="pt-28 pb-20 px-4 md:px-8 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: August 17, 2026</p>

        <div className="mt-10 space-y-8 text-neutral-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-neutral-900">1. Information We Collect</h2>
            <p className="mt-3">
              We collect personal information you provide when booking a session, including your name, email address, and nationality. Payment information is collected and processed securely by Paddle; we do not store your full payment details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900">2. How We Use Your Information</h2>
            <p className="mt-3">
              We use your information to schedule and deliver coaching sessions, send booking confirmations and reminders, and improve our services. We do not sell or rent your personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900">3. Data Storage and Security</h2>
            <p className="mt-3">
              Your data is stored securely using Supabase infrastructure. We implement industry-standard security measures to protect your information. Session recordings are stored securely and accessible only to you and your coach.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900">4. Cookies and Tracking</h2>
            <p className="mt-3">
              We use minimal cookies for essential functionality. We do not use third-party tracking cookies for advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900">5. Your Rights</h2>
            <p className="mt-3">
              You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at hello@koreancoaching.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900">6. Data Retention</h2>
            <p className="mt-3">
              We retain your personal information for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900">7. Third-Party Services</h2>
            <p className="mt-3">
              We use Paddle for payment processing and Daily.co for video sessions. These services have their own privacy policies and data handling practices.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-900">8. Contact</h2>
            <p className="mt-3">
              If you have questions about this Privacy Policy, contact us at hello@koreancoaching.com.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}