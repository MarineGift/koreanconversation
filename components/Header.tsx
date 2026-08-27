'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getOrgByHostname, type OrgBranding } from '@/lib/org';
import { isCoachApplicationEnabled } from '@/lib/coachApplication';
import { getHeaderConfig, DEFAULT_HEADER, type HeaderConfig } from '@/lib/siteContent';
import { supabase } from '@/lib/supabase';

function DropdownItem({ href, icon, title, desc, onNavigate }: { href: string; icon: string; title: string; desc: string; onNavigate: () => void }) {
  const inner = (
    <>
      <span className="w-9 h-9 flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 text-lg shrink-0">
        <i className={icon}></i>
      </span>
      <span>
        <span className="block text-sm font-semibold text-neutral-900">{title}</span>
        <span className="block text-xs text-neutral-500 mt-0.5">{desc}</span>
      </span>
    </>
  );

  if (href.startsWith('/#')) {
    return (
      <a href={href} onClick={onNavigate} className="flex items-start gap-3 px-4 py-3 hover:bg-neutral-50 transition cursor-pointer">
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} onClick={onNavigate} className="flex items-start gap-3 px-4 py-3 hover:bg-neutral-50 transition cursor-pointer">
      {inner}
    </Link>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [coachingOpen, setCoachingOpen] = useState(false);
  const [packagesOpen, setPackagesOpen] = useState(false);
  const [mobileCoachingOpen, setMobileCoachingOpen] = useState(false);
  const [mobilePackagesOpen, setMobilePackagesOpen] = useState(false);
  const [org, setOrg] = useState<OrgBranding | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [coachApply, setCoachApply] = useState(false);
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>(DEFAULT_HEADER);

  useEffect(() => {
    getOrgByHostname().then(setOrg);
  }, []);

  useEffect(() => {
    isCoachApplicationEnabled().then(setCoachApply);
  }, []);

  useEffect(() => {
    getHeaderConfig().then(setHeaderConfig).catch(() => {});
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const accent = org?.accentColor ?? '#171717';
  const coachingLinks = headerConfig.coachingLinks ?? DEFAULT_HEADER.coachingLinks!;
  const packageLinks = headerConfig.packageLinks ?? DEFAULT_HEADER.packageLinks!;
  const coachingLabel = headerConfig.coachingLabel ?? DEFAULT_HEADER.coachingLabel;
  const packagesLabel = headerConfig.packagesLabel ?? DEFAULT_HEADER.packagesLabel;
  const showFree = headerConfig.showFreeButton ?? true;
  const showBook = headerConfig.showBookButton ?? true;
  const showSignIn = headerConfig.showSignIn ?? true;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur border-b border-neutral-200">
      <div className="mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          {org?.logoText === 'logo' ? (
            <span className="font-['Pacifico'] text-2xl" style={{ color: accent }}>
              logo
            </span>
          ) : (
            <span className="font-bold text-xl tracking-tight" style={{ color: accent }}>
              {org?.name ?? 'Korean Coaching'}
            </span>
          )}
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-neutral-700">
          <div
            className="relative"
            onMouseEnter={() => setCoachingOpen(true)}
            onMouseLeave={() => setCoachingOpen(false)}
          >
            <button
              className="flex items-center gap-1.5 hover:text-neutral-900 cursor-pointer whitespace-nowrap"
              onClick={() => setCoachingOpen(true)}
              aria-haspopup="true"
              aria-expanded={coachingOpen}
            >
              {coachingLabel}
              <span className="w-4 h-4 flex items-center justify-center">
                <i className={`ri-arrow-down-s-line transition-transform ${coachingOpen ? 'rotate-180' : ''}`}></i>
              </span>
            </button>
            {coachingOpen && (
              <div className="absolute left-0 top-full pt-3 z-50">
                <div className="w-80 rounded-2xl border border-neutral-200 bg-white shadow-xl py-2">
                  {coachingLinks.map((item) => (
                    <DropdownItem key={item.href} {...item} onNavigate={() => setCoachingOpen(false)} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            className="relative"
            onMouseEnter={() => setPackagesOpen(true)}
            onMouseLeave={() => setPackagesOpen(false)}
          >
            <button
              className="flex items-center gap-1.5 hover:text-neutral-900 cursor-pointer whitespace-nowrap"
              onClick={() => setPackagesOpen(true)}
              aria-haspopup="true"
              aria-expanded={packagesOpen}
            >
              {packagesLabel}
              <span className="w-4 h-4 flex items-center justify-center">
                <i className={`ri-arrow-down-s-line transition-transform ${packagesOpen ? 'rotate-180' : ''}`}></i>
              </span>
            </button>
            {packagesOpen && (
              <div className="absolute left-0 top-full pt-3 z-50">
                <div className="w-72 rounded-2xl border border-neutral-200 bg-white shadow-xl py-2">
                  {packageLinks.map((item) => (
                    <DropdownItem key={item.href} {...item} onNavigate={() => setPackagesOpen(false)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>
        <div className="hidden md:flex items-center gap-2">
          {showSignIn && (userEmail ? (
            <Link href="/mypage" className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-full border border-neutral-300 hover:border-neutral-900 whitespace-nowrap cursor-pointer text-neutral-700">
              <span className="w-4 h-4 flex items-center justify-center"><i className="ri-user-line"></i></span>
              My Page
            </Link>
          ) : (
            <Link href="/login" className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-full border border-neutral-300 hover:border-neutral-900 whitespace-nowrap cursor-pointer text-neutral-700">
              <span className="w-4 h-4 flex items-center justify-center"><i className="ri-user-3-line"></i></span>
              Sign In
            </Link>
          ))}
          {showBook && (
            <Link href="/book" className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-full border border-neutral-300 hover:border-neutral-900 whitespace-nowrap cursor-pointer text-neutral-700">
              <span className="w-4 h-4 flex items-center justify-center"><i className="ri-calendar-check-line"></i></span>
              Book
            </Link>
          )}
          {coachApply && (
            <Link href="/coach-apply" className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-full border border-neutral-300 hover:border-neutral-900 whitespace-nowrap cursor-pointer text-neutral-700">
              <span className="w-4 h-4 flex items-center justify-center"><i className="ri-user-star-line"></i></span>
              코치 지원
            </Link>
          )}
          {showFree && (
            <Link href="/free" style={{ backgroundColor: accent }} className="inline-flex items-center gap-2 text-white text-sm px-5 py-2.5 rounded-full hover:opacity-90 whitespace-nowrap cursor-pointer">
              <span className="w-4 h-4 flex items-center justify-center"><i className="ri-gift-line"></i></span>
              Free 10-min Coaching
            </Link>
          )}
        </div>
        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="md:hidden w-10 h-10 flex items-center justify-center cursor-pointer"
        >
          <i className={`ri-${open ? 'close' : 'menu'}-line text-2xl`}></i>
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-4 md:px-8 py-4 space-y-3 text-sm">
          <div>
            <button
              onClick={() => setMobileCoachingOpen((v) => !v)}
              className="w-full flex items-center justify-between cursor-pointer"
            >
              <span>{coachingLabel}</span>
              <span className="w-4 h-4 flex items-center justify-center">
                <i className={`ri-arrow-down-s-line transition-transform ${mobileCoachingOpen ? 'rotate-180' : ''}`}></i>
              </span>
            </button>
            {mobileCoachingOpen && (
              <div className="mt-2 ml-3 space-y-2 border-l border-neutral-200 pl-4">
                {coachingLinks.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="block cursor-pointer">
                    {item.title}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setMobilePackagesOpen((v) => !v)}
              className="w-full flex items-center justify-between cursor-pointer"
            >
              <span>{packagesLabel}</span>
              <span className="w-4 h-4 flex items-center justify-center">
                <i className={`ri-arrow-down-s-line transition-transform ${mobilePackagesOpen ? 'rotate-180' : ''}`}></i>
              </span>
            </button>
            {mobilePackagesOpen && (
              <div className="mt-2 ml-3 space-y-2 border-l border-neutral-200 pl-4">
                {packageLinks.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="block cursor-pointer">
                    {item.title}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {showSignIn && (userEmail ? (
            <Link href="/mypage" onClick={() => setOpen(false)} className="block border border-neutral-300 px-4 py-2 rounded-full text-center cursor-pointer">My Page</Link>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)} className="block border border-neutral-300 px-4 py-2 rounded-full text-center cursor-pointer">Sign In</Link>
          ))}
          {showBook && (
            <Link href="/book" onClick={() => setOpen(false)} className="block border border-neutral-300 px-4 py-2 rounded-full text-center cursor-pointer">Book</Link>
          )}
          {coachApply && (
            <Link href="/coach-apply" onClick={() => setOpen(false)} className="block border border-neutral-300 px-4 py-2 rounded-full text-center cursor-pointer">코치 지원</Link>
          )}
          {showFree && (
            <Link href="/free" style={{ backgroundColor: accent }} onClick={() => setOpen(false)} className="block text-white px-4 py-2 rounded-full text-center cursor-pointer">Free 10-min Coaching</Link>
          )}
        </div>
      )}
    </header>
  );
}