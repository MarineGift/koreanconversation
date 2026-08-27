import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TourHero from '@/components/tour/TourHero';
import TourServices from '@/components/tour/TourServices';
import TourPackages from '@/components/tour/TourPackages';
import TourProcess from '@/components/tour/TourProcess';
import TourInquiry from '@/components/tour/TourInquiry';
import TourFaq from '@/components/tour/TourFaq';

export default function TourPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-16">
        <TourHero />
        <TourServices />
        <TourPackages />
        <TourProcess />
        <TourInquiry />
        <TourFaq />
      </main>
      <Footer />
    </div>
  );
}