import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BusinessHero from '@/components/business/BusinessHero';
import BusinessJourney from '@/components/business/BusinessJourney';
import BusinessModules from '@/components/business/BusinessModules';
import BusinessPricing from '@/components/business/BusinessPricing';
import BusinessInquiry from '@/components/business/BusinessInquiry';
import BusinessFaq from '@/components/business/BusinessFaq';

export default function BusinessPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-16">
        <BusinessHero />
        <BusinessJourney />
        <BusinessModules />
        <BusinessPricing />
        <BusinessInquiry />
        <BusinessFaq />
      </main>
      <Footer />
    </div>
  );
}