'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getOrgByHostname, type OrgBranding } from '@/lib/org';
import { getSiteFooter, DEFAULT_FOOTER, type SiteFooter } from '@/lib/siteContent';

export default function Footer() {
  const [org, setOrg] = useState<OrgBranding | null>(null);
  const [footer, setFooter] = useState<SiteFooter>(DEFAULT_FOOTER);

  useEffect(() => {
    getOrgByHostname().then(setOrg);
    getSiteFooter().then(setFooter);
  }, []);

  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-10 md:py-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
        <div className="sm:col-span-2 md:col-span-2">
          <div className="font-bold text-2xl tracking-tight text-neutral-900">
            {org?.logoText === 'logo' ? (
              <span className="font-['Pacifico'] text-3xl" style={{ color: org?.accentColor ?? '#171717' }}>logo</span>
            ) : (
              <span style={{ color: org?.accentColor ?? '#171717' }}>{org?.name ?? 'Korean Coaching'}</span>
            )}
          </div>
          <p className="mt-4 text-sm text-neutral-600 max-w-sm leading-relaxed">
            {footer.description}
          </p>
          <div className="mt-6 flex gap-3">
            {['instagram','youtube','linkedin','mail'].map((s) => (
              <a key={s} href="#" className="w-9 h-9 flex items-center justify-center rounded-full border border-neutral-300 hover:bg-neutral-900 hover:text-white cursor-pointer">
                <i className={`ri-${s}-${s==='mail'?'line':'fill'}`}></i>
              </a>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-neutral-500">Explore</div>
          <ul className="mt-4 space-y-2 text-sm text-neutral-700">
            <li><a href="#program" className="cursor-pointer hover:text-neutral-900">Program</a></li>
            <li><a href="#coach" className="cursor-pointer hover:text-neutral-900">Coach</a></li>
            <li><a href="#method" className="cursor-pointer hover:text-neutral-900">Method</a></li>
            <li><a href="#faq" className="cursor-pointer hover:text-neutral-900">FAQ</a></li>
            <li><Link href="/coach-apply" className="cursor-pointer hover:text-neutral-900">Become a Coach</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-neutral-500">Contact</div>
          <ul className="mt-4 space-y-2 text-sm text-neutral-700">
            <li>{org?.websiteUrl ? `hello@${org.websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '')}` : 'hello@koreancoaching.com'}</li>
            <li>Seoul, South Korea</li>
            <li>{org?.websiteUrl?.replace(/^https?:\/\//, '') ?? 'koreancoaching.com'}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-200">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} {org?.name ?? 'Korean Coaching'}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <Link href="/terms" className="hover:text-neutral-900 cursor-pointer">Terms</Link>
            <Link href="/privacy" className="hover:text-neutral-900 cursor-pointer">Privacy</Link>
            <Link href="/refund" className="hover:text-neutral-900 cursor-pointer">Refund</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}