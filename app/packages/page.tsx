import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PackagesHero from '@/components/packages/PackagesHero';
import PackageCards from '@/components/packages/PackageCards';
import ComparisonTable from '@/components/packages/ComparisonTable';

export default function PackagesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-16">
        <PackagesHero />
        <PackageCards />
        <ComparisonTable />
      </main>
      <Footer />
    </div>
  );
}