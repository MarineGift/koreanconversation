import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PricingClient from '@/components/pricing/PricingClient';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#FBF7F2]">
      <Header />
      <main className="pt-24">
        <PricingClient />
      </main>
      <Footer />
    </div>
  );
}