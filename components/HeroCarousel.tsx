'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  getActiveCarouselSlides,
  getCarouselSettings,
  type CarouselSlide,
  type AnimationStyle,
  type StatItem,
} from '@/lib/carousel';
import { getOrgId } from '@/lib/org';
import HangulComposer from './HangulComposer';

const FALLBACK_SLIDES: CarouselSlide[] = [
  {
    id: 'fallback-hangul',
    title: 'See how one letter comes together.',
    subtitle: 'Hangul, made simple',
    description: 'Watch each Korean letter assemble in real time — see how consonants and vowels combine into the syllables you speak.',
    badge: 'The Korean Alphabet',
    image_url: null,
    cta_text: 'Claim Free 10-min Coaching',
    cta_link: '/free',
    sort_order: 0,
    is_active: true,
    created_at: '',
    slide_type: 'hangul',
    stats: null,
  },
  {
    id: 'fallback-1',
    title: 'Speak Korean the way natives feel it.',
    subtitle: 'Premium 1:1 Korean coaching for professionals',
    description: 'An immersive one-on-one coaching program for professionals who want polished, natural Korean in meetings, negotiations, and formal settings.',
    badge: 'Premium 1:1 Korean · For Professionals',
    image_url: 'https://readdy.ai/api/search-image?query=Professional%20Korean%20language%20coaching%20concept%20in%20an%20elegant%20minimalist%20executive%20office%20with%20a%20warm%20wooden%20conference%20table%20and%20leather%20chairs%2C%20large%20window%20with%20soft%20golden%20natural%20morning%20light%2C%20cream%20beige%20and%20ivory%20neutral%20tones%2C%20left%20portion%20softly%20blurred%20empty%20space%20for%20headline%20text%2C%20premium%20editorial%20lifestyle%20photography%2C%20sophisticated%20calm%20refined%20atmosphere%2C%20shallow%20depth%20of%20field%2C%20no%20people%20no%20computer%20screens&width=1600&height=800&seq=carousel-1&orientation=landscape',
    cta_text: 'Claim Free 10-min Coaching',
    cta_link: '/free',
    sort_order: 0,
    is_active: true,
    created_at: '',
    slide_type: 'image',
    stats: null,
  },
  {
    id: 'fallback-2',
    title: 'Walk into every meeting with confidence.',
    subtitle: 'Business Script Coaching',
    description: 'Tell us the situation you face with Korean partners — we build a tailored script and rehearse it together, one-on-one, until it sounds native.',
    badge: 'Business Script Coaching',
    image_url: 'https://readdy.ai/api/search-image?query=Business%20presentation%20coaching%20concept%2C%20polished%20executive%20hand%20writing%20notes%20on%20an%20elegant%20notepad%20at%20a%20warm%20wooden%20desk%2C%20subtle%20Korean%20documents%20and%20a%20fountain%20pen%20nearby%2C%20soft%20diffused%20window%20light%2C%20cream%20ivory%20and%20beige%20neutral%20palette%2C%20left%20side%20softly%20faded%20empty%20space%20for%20text%20overlay%2C%20premium%20editorial%20photography%2C%20refined%20professional%20mood%2C%20shallow%20depth%20of%20field%2C%20no%20faces%20no%20screens&width=1600&height=800&seq=carousel-2&orientation=landscape',
    cta_text: 'See the program',
    cta_link: '#program',
    sort_order: 1,
    is_active: true,
    created_at: '',
    slide_type: 'image',
    stats: null,
  },
  {
    id: 'fallback-3',
    title: 'Real-time support in your Korean meetings.',
    subtitle: 'Meeting Interpretation',
    description: 'We attend your video meetings alongside you, explain context, and assist whenever you need it — so you never miss a word.',
    badge: 'Meeting Interpretation',
    image_url: 'https://readdy.ai/api/search-image?query=International%20business%20meeting%20concept%2C%20elegant%20modern%20conference%20room%20with%20warm%20lighting%2C%20notebooks%20and%20coffee%20cups%20on%20a%20wooden%20table%2C%20blurred%20city%20skyline%20through%20a%20large%20window%2C%20soft%20neutral%20cream%20and%20beige%20tones%2C%20left%20side%20softly%20blurred%20for%20text%20overlay%2C%20premium%20corporate%20editorial%20photography%2C%20sophisticated%20atmosphere%2C%20shallow%20depth%20of%20field%2C%20no%20visible%20faces%20no%20screens&width=1600&height=800&seq=carousel-3&orientation=landscape',
    cta_text: 'See the program',
    cta_link: '#program',
    sort_order: 2,
    is_active: true,
    created_at: '',
    slide_type: 'image',
    stats: null,
  },
];

export default function HeroCarousel() {
  const [slides, setSlides] = useState<CarouselSlide[]>(FALLBACK_SLIDES);
  const [animation, setAnimation] = useState<AnimationStyle>('fade');
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const orgId = await getOrgId();
      const s = await getActiveCarouselSlides(orgId);
      if (mounted && s.length > 0) setSlides(s);
      const a = await getCarouselSettings(orgId);
      if (mounted) setAnimation(a);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const count = slides.length;

  const goTo = useCallback(
    (i: number) => setActive(((i % count) + count) % count),
    [count]
  );

  const next = useCallback(() => setActive((a) => (a + 1) % count), [count]);
  const prev = useCallback(() => setActive((a) => (a - 1 + count) % count), [count]);

  useEffect(() => {
    if (paused || count <= 1) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [paused, count, next]);

  if (count === 0) return null;

  return (
    <section
      className="relative overflow-hidden bg-neutral-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div className="relative h-[620px] md:h-[720px] overflow-hidden">
        {animation === 'slide' ? (
          <div
            className="flex h-full transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${active * 100}%)` }}
          >
            {slides.map((s) => (
              <div key={s.id} className="w-full h-full shrink-0">
                <SlidePanel slide={s} active={true} />
              </div>
            ))}
          </div>
        ) : (
          slides.map((s, i) => (
            <div
              key={s.id}
              className={`absolute inset-0 transition-opacity duration-[900ms] ease-out ${
                i === active ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
              aria-hidden={i !== active}
            >
              <SlidePanel slide={s} active={i === active} />
            </div>
          ))
        )}
      </div>

      {count > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-4 md:left-8 bottom-8 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-white backdrop-blur hover:bg-white/25 cursor-pointer transition"
          >
            <i className="ri-arrow-left-line text-xl"></i>
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-4 md:right-8 bottom-8 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-white backdrop-blur hover:bg-white/25 cursor-pointer transition"
          >
            <i className="ri-arrow-right-line text-xl"></i>
          </button>

          <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
                  i === active ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function SlidePanel({ slide, active }: { slide: CarouselSlide; active: boolean }) {
  const type = slide.slide_type || 'image';

  if (type === 'hangul') return <HangulPanel slide={slide} />;
  if (type === 'stats') return <StatsPanel slide={slide} />;
  if (type === 'testimonial') return <TestimonialPanel slide={slide} />;
  return <ImagePanel slide={slide} active={active} />;
}

function ImagePanel({ slide, active }: { slide: CarouselSlide; active: boolean }) {
  return (
    <div className="relative h-full">
      <div className="absolute inset-0 overflow-hidden">
        {slide.image_url && (
          <img
            src={slide.image_url}
            alt={slide.title}
            className={`w-full h-full object-cover object-top transition-transform duration-[6000ms] ease-linear ${
              active ? 'scale-110' : 'scale-100'
            }`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-900/70 to-neutral-900/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent" />
      </div>
      <TextOverlay slide={slide} />
    </div>
  );
}

function HangulPanel({ slide }: { slide: CarouselSlide }) {
  return (
    <div className="relative h-full bg-gradient-to-br from-neutral-900 via-indigo-950/70 to-neutral-900">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_70%_50%,rgba(129,140,248,0.25),transparent_60%)]" />
      <div className="relative z-10 h-full">
        <div className="mx-auto max-w-7xl px-4 md:px-8 h-full flex items-center">
          <div className="w-full grid md:grid-cols-2 gap-10 items-center">
            <div className="max-w-xl">
              <TextContent slide={slide} />
            </div>
            <div className="hidden md:flex justify-center">
              <HangulComposer />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsPanel({ slide }: { slide: CarouselSlide }) {
  const stats: StatItem[] = slide.stats ?? [];
  return (
    <div className="relative h-full bg-gradient-to-br from-neutral-900 via-emerald-950/60 to-neutral-900">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_75%_45%,rgba(52,211,153,0.2),transparent_60%)]" />
      <div className="relative z-10 h-full">
        <div className="mx-auto max-w-7xl px-4 md:px-8 h-full flex items-center">
          <div className="w-full grid md:grid-cols-2 gap-10 items-center">
            <div className="max-w-xl">
              <TextContent slide={slide} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((st, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6 text-center"
                >
                  <div className="text-4xl md:text-5xl font-bold text-emerald-300">{st.value}</div>
                  <div className="mt-2 text-sm text-white/70">{st.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestimonialPanel({ slide }: { slide: CarouselSlide }) {
  return (
    <div className="relative h-full bg-gradient-to-br from-neutral-900 via-amber-950/50 to-neutral-900">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_40%,rgba(251,191,36,0.18),transparent_60%)]" />
      <div className="relative z-10 h-full flex items-center">
        <div className="mx-auto max-w-4xl px-4 md:px-8 text-center">
          <div className="w-12 h-12 mx-auto flex items-center justify-center text-amber-300">
            <i className="ri-double-quotes-l text-5xl"></i>
          </div>
          <p className="mt-6 text-2xl md:text-4xl font-semibold leading-snug text-white">
            {slide.title}
          </p>
          {slide.description && (
            <p className="mt-5 text-base md:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              {slide.description}
            </p>
          )}
          <div className="mt-8 flex flex-col items-center">
            <div className="text-lg font-semibold text-white">{slide.subtitle}</div>
            {slide.badge && <div className="mt-1 text-sm text-white/50">{slide.badge}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function TextOverlay({ slide }: { slide: CarouselSlide }) {
  return (
    <div className="relative z-10 h-full">
      <div className="mx-auto max-w-7xl px-4 md:px-8 h-full flex items-center">
        <div className="w-full max-w-2xl">
          <TextContent slide={slide} />
        </div>
      </div>
    </div>
  );
}

function TextContent({ slide }: { slide: CarouselSlide }) {
  return (
    <>
      {slide.badge && (
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-4 py-1.5 text-xs uppercase tracking-widest text-white">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          {slide.badge}
        </div>
      )}
      <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white">
        {slide.title}
      </h1>
      {slide.subtitle && (
        <p className="mt-4 text-lg md:text-xl text-white/90 font-medium">{slide.subtitle}</p>
      )}
      {slide.description && (
        <p className="mt-5 text-base sm:text-lg text-white/75 max-w-xl leading-relaxed">
          {slide.description}
        </p>
      )}
      {slide.cta_text && (
        <div className="mt-8 flex flex-wrap gap-3">
          <CtaLink slide={slide} />
        </div>
      )}
    </>
  );
}

function CtaLink({ slide }: { slide: CarouselSlide }) {
  if (!slide.cta_text) return null;
  const link = slide.cta_link || '#';

  if (link.startsWith('#')) {
    return (
      <a
        href={link}
        className="inline-flex items-center gap-2 bg-white text-neutral-900 px-6 py-3.5 rounded-full hover:bg-neutral-100 whitespace-nowrap cursor-pointer font-medium"
      >
        {slide.cta_text}
        <span className="w-5 h-5 flex items-center justify-center"><i className="ri-arrow-right-line"></i></span>
      </a>
    );
  }

  return (
    <Link
      href={link}
      className="inline-flex items-center gap-2 bg-white text-neutral-900 px-6 py-3.5 rounded-full hover:bg-neutral-100 whitespace-nowrap cursor-pointer font-medium"
    >
      {slide.cta_text}
      <span className="w-5 h-5 flex items-center justify-center"><i className="ri-arrow-right-line"></i></span>
    </Link>
  );
}