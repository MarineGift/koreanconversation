import CoachApplyHero from '@/components/coach-apply/CoachApplyHero';
import CoachApplyBenefits from '@/components/coach-apply/CoachApplyBenefits';
import CoachApplicationForm from '@/components/coach-apply/CoachApplicationForm';

export default function CoachApplyPage() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <CoachApplyHero />
      <CoachApplyBenefits />
      <section className="py-12 md:py-16 px-4 md:px-8">
        <div className="mx-auto max-w-2xl">
          <CoachApplicationForm />
        </div>
      </section>
    </main>
  );
}