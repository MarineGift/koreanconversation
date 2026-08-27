import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import ForWho from '@/components/ForWho';
import Coach from '@/components/Coach';
import Program from '@/components/Program';
import TourPromo from '@/components/tour/TourPromo';
import Method from '@/components/Method';
import Testimonials from '@/components/Testimonials';
import Faq from '@/components/Faq';
import Signup from '@/components/Signup';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroCarousel />
        <ForWho />
        <Coach />
        <Program />
        <TourPromo />
        <Method />
        <Testimonials />
        <Faq />
        <Signup />
      </main>
      <Footer />
    </div>
  );
}