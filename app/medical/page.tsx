import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MedicalHero from '@/components/medical/MedicalHero';
import MedicalWhy from '@/components/medical/MedicalWhy';
import MedicalTreatments from '@/components/medical/MedicalTreatments';
import MedicalHospitals from '@/components/medical/MedicalHospitals';
import MedicalSuccess from '@/components/medical/MedicalSuccess';
import MedicalPricing from '@/components/medical/MedicalPricing';
import MedicalInquiry from '@/components/medical/MedicalInquiry';
import MedicalFaq from '@/components/medical/MedicalFaq';

export default function MedicalPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-16">
        <MedicalHero />
        <MedicalWhy />
        <MedicalTreatments />
        <MedicalHospitals />
        <MedicalSuccess />
        <MedicalPricing />
        <MedicalInquiry />
        <MedicalFaq />
      </main>
      <Footer />
    </div>
  );
}