import Link from 'next/link';

export default function TourPromo() {
  return (
    <section className="py-12 bg-white">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="relative overflow-hidden rounded-3xl">
          <img
            src="https://readdy.ai/api/search-image?query=Warm%20welcoming%20scene%20of%20international%20business%20travelers%20arriving%20in%20South%20Korea%20being%20greeted%20by%20a%20professional%20Korean%20tour%20guide%20at%20Incheon%20airport%20arrivals%2C%20luggage%20carts%20and%20modern%20airport%20terminal%20in%20soft%20focus%20background%2C%20bright%20natural%20light%2C%20friendly%20professional%20atmosphere%2C%20high%20end%20travel%20photography%20style%20with%20crisp%20colors%20and%20clean%20simple%20composition&width=1920&height=640&seq=7004&orientation=landscape"
            alt="Korea Packages"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-black/40" />

          <div className="relative z-10 px-6 md:px-12 py-12 md:py-16 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-xl">
              <div className="text-xs uppercase tracking-widest text-white/70">Coming to Korea?</div>
              <h2 className="mt-3 text-2xl md:text-3xl font-bold text-white leading-tight">
                Korea Tour, Business &amp; Medical Packages — from arrival to departure.
              </h2>
              <p className="mt-3 text-white/80 leading-relaxed">
                A dedicated Korean guide, business interpreter, or medical coordinator for
                tourism, meetings and treatment. Customized to your needs.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 self-start md:self-auto shrink-0">
              <Link
                href="/tour"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-neutral-900 font-semibold hover:bg-neutral-100 whitespace-nowrap cursor-pointer"
              >
                Tour Package
                <span className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-arrow-right-line"></i>
                </span>
              </Link>
              <Link
                href="/business"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/40 text-white font-semibold hover:bg-white/10 whitespace-nowrap cursor-pointer"
              >
                Business Package
                <span className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-arrow-right-line"></i>
                </span>
              </Link>
              <Link
                href="/medical"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/40 text-white font-semibold hover:bg-white/10 whitespace-nowrap cursor-pointer"
              >
                Medical Package
                <span className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-arrow-right-line"></i>
                </span>
              </Link>
              <Link
                href="/packages"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-medium underline underline-offset-4 hover:text-neutral-200 whitespace-nowrap cursor-pointer"
              >
                Compare all
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}