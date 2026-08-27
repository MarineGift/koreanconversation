'use client';

import Link from 'next/link';

type Cell = boolean | string;

interface Row {
  feature: string;
  tour: Cell;
  business: Cell;
  medical: Cell;
  highlight?: boolean;
}

const rows: Row[] = [
  { feature: 'Primary purpose', tour: 'Tourism & light business', business: 'Business & everything else', medical: 'Medical treatment', highlight: true },
  { feature: 'Airport pickup', tour: true, business: true, medical: true },
  { feature: 'Tour guide / sightseeing', tour: true, business: true, medical: 'Optional' },
  { feature: 'Business interpretation', tour: 'Optional', business: true, medical: false },
  { feature: 'Medical coordinator & interpretation', tour: false, business: false, medical: true },
  { feature: 'Hospital matching & appointments', tour: false, business: false, medical: true },
  { feature: 'Accommodation booking', tour: false, business: true, medical: 'Optional' },
  { feature: 'Company setup & legal support', tour: false, business: true, medical: false },
  { feature: 'Personal concierge (24/7)', tour: false, business: true, medical: 'Optional' },
  { feature: 'Custom itinerary', tour: true, business: true, medical: true },
  { feature: 'Pricing model', tour: 'Customized quote', business: 'Customized quote', medical: 'Customized quote', highlight: true },
  { feature: 'Best for', tour: 'Holiday & short trips', business: 'Business trips & long stays', medical: 'Treatment & recovery', highlight: true },
];

function CellValue({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mx-auto">
        <i className="ri-check-line"></i>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-300 mx-auto">
        <i className="ri-close-line"></i>
      </span>
    );
  }
  return <span className="text-sm text-neutral-600">{value}</span>;
}

export default function ComparisonTable() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="overflow-x-auto rounded-2xl border border-neutral-200">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="bg-neutral-900 text-white">
                <th className="text-left px-6 py-4 font-semibold w-1/4">Feature</th>
                <th className="text-center px-4 py-4 font-semibold">Korea Tour</th>
                <th className="text-center px-4 py-4 font-semibold">Business</th>
                <th className="text-center px-4 py-4 font-semibold">Medical</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.feature}
                  className={`border-t border-neutral-100 ${r.highlight ? 'bg-amber-50/50' : i % 2 === 1 ? 'bg-neutral-50' : 'bg-white'}`}
                >
                  <td className="px-6 py-4 font-medium text-neutral-900">{r.feature}</td>
                  <td className="px-4 py-4 text-center align-middle">
                    <CellValue value={r.tour} />
                  </td>
                  <td className="px-4 py-4 text-center align-middle">
                    <CellValue value={r.business} />
                  </td>
                  <td className="px-4 py-4 text-center align-middle">
                    <CellValue value={r.medical} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Link
            href="/tour"
            className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 p-5 hover:border-neutral-900 transition cursor-pointer"
          >
            <div>
              <div className="font-semibold text-neutral-900">Korea Tour Package</div>
              <div className="text-sm text-neutral-500 mt-0.5">Guide &amp; interpreter for sightseeing.</div>
            </div>
            <span className="w-9 h-9 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-900 shrink-0">
              <i className="ri-arrow-right-line"></i>
            </span>
          </Link>
          <Link
            href="/business"
            className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 p-5 hover:border-neutral-900 transition cursor-pointer"
          >
            <div>
              <div className="font-semibold text-neutral-900">Korea Business Package</div>
              <div className="text-sm text-neutral-500 mt-0.5">End-to-end support from arrival to departure.</div>
            </div>
            <span className="w-9 h-9 flex items-center justify-center rounded-full bg-neutral-100 text-neutral-900 shrink-0">
              <i className="ri-arrow-right-line"></i>
            </span>
          </Link>
          <Link
            href="/medical"
            className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-900 bg-neutral-900 p-5 hover:bg-neutral-800 transition cursor-pointer"
          >
            <div>
              <div className="font-semibold text-white">Korea Medical Package</div>
              <div className="text-sm text-neutral-300 mt-0.5">World-class healthcare with a coordinator.</div>
            </div>
            <span className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white shrink-0">
              <i className="ri-arrow-right-line"></i>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}