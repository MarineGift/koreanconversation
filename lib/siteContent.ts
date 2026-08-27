import { supabase } from './supabase';
import { getOrgId } from './org';

export interface SiteHero {
  badge: string;
  title: string;
  accent: string;
  subtitle: string;
}

export interface SitePricing {
  title: string;
  subtitle: string;
}

export interface SiteFaq {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export const DEFAULT_HERO: SiteHero = {
  badge: 'Premium 1:1 Korean · For Professionals',
  title: 'Speak Korean',
  accent: 'the way natives feel it.',
  subtitle:
    'An immersive 1:1 coaching program for fluent-but-not-yet-refined Korean speakers. Conducted in Korean, explained in English — by an expert with an SNU English Education background and years running a private language academy.',
};

export const DEFAULT_PRICING: SitePricing = {
  title: 'Pricing',
  subtitle: 'Flexible credit packs for 1:1 Korean coaching. Pay once, book anytime.',
};

export const DEFAULT_FAQS: SiteFaq[] = [
  { id: 'd1', question: 'Is this for absolute beginners?', answer: 'No. This program is designed for learners who already speak conversational Korean and want to elevate to refined, professional-level fluency.', sort_order: 1 },
  { id: 'd2', question: 'Do I need to be able to read Hangul first?', answer: 'It helps, but it is not required. Your coach can guide you through the alphabet and correct your pronunciation from the very first session.', sort_order: 2 },
  { id: 'd3', question: 'How are sessions conducted?', answer: 'Live 1:1 video calls. Conversation happens in Korean; when a nuance, cultural context, or grammar rule needs precision, your coach explains in English.', sort_order: 3 },
  { id: 'd4', question: 'How long is the free trial?', answer: 'A complimentary 10-minute diagnostic session, given to every new member on signup.', sort_order: 4 },
  { id: 'd5', question: 'Where is the coach based?', answer: 'Seoul, South Korea. Sessions are scheduled to match your timezone.', sort_order: 5 },
  { id: 'd6', question: 'What levels and topics do you cover?', answer: 'Business meetings, negotiations, formal register and honorifics, TOPIK preparation, presentations, and everyday professional conversation.', sort_order: 6 },
  { id: 'd7', question: 'How do I book a session?', answer: 'Pick a coach, choose an available time, and confirm your booking. You can use a purchased credit or pay per session.', sort_order: 7 },
  { id: 'd8', question: 'How does pricing work?', answer: 'We sell credit packs in USD. 1 credit equals one 30-minute 1:1 session. Larger packs come with a discount, and unused credits are transferable.', sort_order: 8 },
  { id: 'd9', question: 'What is your cancellation policy?', answer: 'Sessions can be rescheduled up to 24 hours in advance at no cost. Missed sessions without notice are deducted as a no-show.', sort_order: 9 },
  { id: 'd10', question: 'Can I get a refund?', answer: 'All purchases are final and non-refundable. However, unused credits can be transferred to another registered member.', sort_order: 10 },
];

export async function fetchContent(orgId: string, section: string): Promise<Record<string, string>> {
  const { data } = await supabase
    .from('site_content')
    .select('key, value')
    .eq('organization_id', orgId)
    .eq('section', section);
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.value) map[row.key] = row.value;
  }
  return map;
}

export async function getSiteHero(): Promise<SiteHero> {
  const orgId = await getOrgId();
  if (!orgId) return DEFAULT_HERO;
  const map = await fetchContent(orgId, 'hero');
  return {
    badge: map.badge || DEFAULT_HERO.badge,
    title: map.title || DEFAULT_HERO.title,
    accent: map.accent || DEFAULT_HERO.accent,
    subtitle: map.subtitle || DEFAULT_HERO.subtitle,
  };
}

export async function getSitePricing(): Promise<SitePricing> {
  const orgId = await getOrgId();
  if (!orgId) return DEFAULT_PRICING;
  const map = await fetchContent(orgId, 'pricing');
  return {
    title: map.title || DEFAULT_PRICING.title,
    subtitle: map.subtitle || DEFAULT_PRICING.subtitle,
  };
}

export interface SitePaddleConfig {
  singleProduct: string;
  packageProduct: string;
  specialProduct: string;
}

export async function getSitePaddleConfig(): Promise<SitePaddleConfig> {
  const fallback = {
    singleProduct: process.env.NEXT_PUBLIC_PADDLE_SINGLE_SESSION || '',
    packageProduct: process.env.NEXT_PUBLIC_PADDLE_TEN_SESSION_PACK || '',
    specialProduct: process.env.NEXT_PUBLIC_PADDLE_TEN_SESSION_SPECIAL || '',
  };
  const orgId = await getOrgId();
  if (!orgId) return fallback;
  const map = await fetchContent(orgId, 'paddle');
  return {
    singleProduct: map.single_session || fallback.singleProduct,
    packageProduct: map.package || fallback.packageProduct,
    specialProduct: map.special || fallback.specialProduct,
  };
}

export async function getSiteFaqs(): Promise<SiteFaq[]> {
  const orgId = await getOrgId();
  if (!orgId) return DEFAULT_FAQS;
  const { data } = await supabase
    .from('site_faqs')
    .select('id, question, answer, sort_order')
    .eq('organization_id', orgId)
    .order('sort_order', { ascending: true });
  if (!data || data.length === 0) return DEFAULT_FAQS;
  return (data as SiteFaq[]).map((f) => ({ id: f.id, question: f.question, answer: f.answer, sort_order: f.sort_order }));
}

export async function getOrgContent(orgId: string): Promise<Record<string, string>> {
  const { data } = await supabase
    .from('site_content')
    .select('section, key, value')
    .eq('organization_id', orgId);
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.value) map[`${row.section}:${row.key}`] = row.value;
  }
  return map;
}

export async function getOrgFaqs(orgId: string): Promise<SiteFaq[]> {
  const { data } = await supabase
    .from('site_faqs')
    .select('id, question, answer, sort_order')
    .eq('organization_id', orgId)
    .order('sort_order', { ascending: true });
  return (data ?? []) as SiteFaq[];
}

export async function saveSiteContent(
  orgId: string,
  section: string,
  key: string,
  value: string
): Promise<{ error: string | null }> {
  const trimmed = value.trim();
  const { data: existing } = await supabase
    .from('site_content')
    .select('id')
    .eq('organization_id', orgId)
    .eq('section', section)
    .eq('key', key)
    .maybeSingle();

  let result;
  if (existing) {
    if (!trimmed) {
      result = await supabase.from('site_content').delete().eq('id', existing.id);
    } else {
      result = await supabase.from('site_content').update({ value: trimmed }).eq('id', existing.id);
    }
  } else if (trimmed) {
    result = await supabase.from('site_content').insert({ organization_id: orgId, section, key, value: trimmed });
  } else {
    return { error: null };
  }
  return { error: result.error ? result.error.message : null };
}

export async function saveSiteFaq(
  orgId: string,
  faq: { id?: string; question: string; answer: string; sort_order: number }
): Promise<{ error: string | null }> {
  let result;
  if (faq.id) {
    result = await supabase
      .from('site_faqs')
      .update({ question: faq.question.trim(), answer: faq.answer.trim(), sort_order: faq.sort_order })
      .eq('id', faq.id);
  } else {
    result = await supabase.from('site_faqs').insert({
      organization_id: orgId,
      question: faq.question.trim(),
      answer: faq.answer.trim(),
      sort_order: faq.sort_order,
    });
  }
  return { error: result.error ? result.error.message : null };
}

export async function deleteSiteFaq(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('site_faqs').delete().eq('id', id);
  return { error: error ? error.message : null };
}

function parseJson<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

async function getSectionMap(section: string): Promise<Record<string, string>> {
  const orgId = await getOrgId();
  if (!orgId) return {};
  return fetchContent(orgId, section);
}

async function getSubpageOverride(section: string): Promise<Record<string, unknown>> {
  const orgId = await getOrgId();
  if (!orgId) return {};
  const map = await fetchContent(orgId, section);
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(map)) {
    try { result[k] = JSON.parse(v); } catch { result[k] = v; }
  }
  return result;
}

export async function getBusinessOverride(): Promise<Record<string, unknown>> {
  return getSubpageOverride('business');
}

export async function getTourOverride(): Promise<Record<string, unknown>> {
  return getSubpageOverride('tour');
}

export async function getMedicalOverride(): Promise<Record<string, unknown>> {
  return getSubpageOverride('medical');
}

export async function getPackagesOverride(): Promise<Record<string, unknown>> {
  return getSubpageOverride('packages');
}

export interface HeaderLinkItem {
  href: string;
  icon: string;
  title: string;
  desc: string;
}

export interface HeaderConfig {
  coachingLabel?: string;
  packagesLabel?: string;
  coachingLinks?: HeaderLinkItem[];
  packageLinks?: HeaderLinkItem[];
  showFreeButton?: boolean;
  showBookButton?: boolean;
  showSignIn?: boolean;
}

export const DEFAULT_HEADER: HeaderConfig = {
  coachingLabel: 'Coaching',
  packagesLabel: 'Korea Packages',
  coachingLinks: [
    { href: '/level-test', icon: 'ri-speed-up-line', title: 'Level Test', desc: 'Find your Korean level in 2 min' },
    { href: '/free', icon: 'ri-gift-line', title: 'Free 10-min Coaching', desc: 'Complimentary diagnostic session' },
    { href: '/book', icon: 'ri-calendar-check-line', title: 'Book a Session', desc: 'Pick a coach and a time' },
    { href: '/pricing', icon: 'ri-price-tag-3-line', title: 'Pricing', desc: 'Plans & packages' },
    { href: '/#program', icon: 'ri-road-map-line', title: 'Program', desc: 'Our structured learning path' },
    { href: '/#coach', icon: 'ri-user-star-line', title: 'Meet the Coaches', desc: 'Expert 1:1 Korean coaches' },
    { href: '/#method', icon: 'ri-lightbulb-line', title: 'Our Method', desc: 'How we get you speaking' },
    { href: '/#testimonials', icon: 'ri-chat-smile-3-line', title: 'Reviews', desc: 'Stories from our students' },
    { href: '/#faq', icon: 'ri-question-line', title: 'FAQ', desc: 'Common questions answered' },
  ],
  packageLinks: [
    { href: '/tour', icon: 'ri-earth-line', title: 'Korea Tour', desc: 'Guide & interpreter for travel' },
    { href: '/business', icon: 'ri-briefcase-4-line', title: 'Business Package', desc: 'End-to-end business support' },
    { href: '/medical', icon: 'ri-heart-pulse-line', title: 'Medical Package', desc: 'Premium medical tourism' },
    { href: '/packages', icon: 'ri-compasses-line', title: 'Compare Packages', desc: 'Compare all three side by side' },
  ],
  showFreeButton: true,
  showBookButton: true,
  showSignIn: true,
};

export async function getHeaderConfig(): Promise<HeaderConfig> {
  const orgId = await getOrgId();
  if (!orgId) return DEFAULT_HEADER;
  const map = await fetchContent(orgId, 'header');
  const config: HeaderConfig = { ...DEFAULT_HEADER };
  if (map.coachingLabel) config.coachingLabel = map.coachingLabel;
  if (map.packagesLabel) config.packagesLabel = map.packagesLabel;
  if (map.showFreeButton != null) config.showFreeButton = map.showFreeButton === 'true';
  if (map.showBookButton != null) config.showBookButton = map.showBookButton === 'true';
  if (map.showSignIn != null) config.showSignIn = map.showSignIn === 'true';
  if (map.coachingLinks) config.coachingLinks = parseJson<HeaderLinkItem[]>(map.coachingLinks, DEFAULT_HEADER.coachingLinks ?? []);
  if (map.packageLinks) config.packageLinks = parseJson<HeaderLinkItem[]>(map.packageLinks, DEFAULT_HEADER.packageLinks ?? []);
  return config;
}

export interface ForWhoItem {
  icon: string;
  title: string;
  desc: string;
}

export interface SiteForWho {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: ForWhoItem[];
}

export const DEFAULT_FORWHO: SiteForWho = {
  eyebrow: 'Who this is for',
  title: 'You can already speak Korean.\nNow sound like you belong.',
  subtitle:
    "This is not a beginner course. It's a premium coaching track for professionals who use Korean daily but want their pronunciation, tone, and expression to match their expertise.",
  items: [
    { icon: 'ri-mic-line', title: 'Pronunciation Precision', desc: 'Nail the subtle 된소리, 격음, and final consonants that break intelligibility at the executive level.' },
    { icon: 'ri-chat-quote-line', title: 'Register & Nuance', desc: 'Switch fluidly between 존댓말, business Korean, and casual speech — sound appropriate every time.' },
    { icon: 'ri-mind-map', title: 'Native Expression', desc: "Replace textbook phrasing with the idioms and rhythm real Koreans actually use in the room." },
    { icon: 'ri-briefcase-4-line', title: 'Professional Settings', desc: 'Meetings, client dinners, media interviews — rehearse the exact scenarios you face at work.' },
  ],
};

export async function getSiteForWho(): Promise<SiteForWho> {
  const map = await getSectionMap('forWho');
  return {
    eyebrow: map.eyebrow || DEFAULT_FORWHO.eyebrow,
    title: map.title || DEFAULT_FORWHO.title,
    subtitle: map.subtitle || DEFAULT_FORWHO.subtitle,
    items: parseJson<ForWhoItem[]>(map.items, DEFAULT_FORWHO.items),
  };
}

export interface ProgramTrack {
  icon: string;
  title: string;
  desc: string;
  points: string[];
}

export interface SiteProgram {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  items: ProgramTrack[];
}

export const DEFAULT_PROGRAM: SiteProgram = {
  eyebrow: 'The program',
  title: 'One-to-one coaching, built around your goals.',
  subtitle:
    'Every session is private 1:1 coaching. You speak Korean, we correct your sentences and pronunciation in English, and we practice the exact situations you face.',
  cta: 'Try a 10-minute session',
  items: [
    {
      icon: 'ri-chat-3-line',
      title: 'Professional Korean Coaching',
      desc: 'For those who can hold basic conversations but need polished Korean for meetings, consultations, and formal settings.',
      points: ['Meeting & consultation language', 'Formal register and honorifics', 'Natural sentence correction in real time'],
    },
    {
      icon: 'ri-quill-pen-line',
      title: 'Business Script Coaching',
      desc: 'Tell us the situation you face with Korean partners — we build a tailored script and rehearse it together 1:1.',
      points: ['Situation-specific scripts', 'Live role-play dialogue', 'Pronunciation explained in English'],
    },
    {
      icon: 'ri-video-line',
      title: 'Meeting Interpretation',
      desc: 'Join video meetings with Korean counterparts. We attend alongside you, explain context, and assist whenever you need it.',
      points: ['Video attendance during meetings', 'Real-time context explanation', 'On-demand support (prepared separately)'],
    },
  ],
};

export async function getSiteProgram(): Promise<SiteProgram> {
  const map = await getSectionMap('program');
  return {
    eyebrow: map.eyebrow || DEFAULT_PROGRAM.eyebrow,
    title: map.title || DEFAULT_PROGRAM.title,
    subtitle: map.subtitle || DEFAULT_PROGRAM.subtitle,
    cta: map.cta || DEFAULT_PROGRAM.cta,
    items: parseJson<ProgramTrack[]>(map.items, DEFAULT_PROGRAM.items),
  };
}

export interface MethodRow {
  k: string;
  v: string;
}

export interface SiteMethod {
  eyebrow: string;
  title: string;
  subtitle: string;
  rows: MethodRow[];
  boxTitle: string;
  boxItems: string[];
  image: string;
}

export const DEFAULT_METHOD: SiteMethod = {
  eyebrow: 'The method',
  title: 'Korean in the room.\nEnglish on the whiteboard.',
  subtitle:
    "Every session is conducted primarily in Korean — that's how your ear and mouth develop. But whenever a subtle rule, cultural context, or grammatical distinction matters, your coach switches to English so nothing is lost in translation.",
  rows: [
    { k: '한국어 대화', v: 'Immersive live conversation' },
    { k: 'English 설명', v: 'Precise rule explanations' },
    { k: 'Feedback loop', v: 'Recorded, reviewed, repeated' },
  ],
  boxTitle: 'What you will work on',
  boxItems: [
    'Pronunciation & vocalization — final consonants, phonological changes, and connected speech',
    'Word order — understanding Korean SOV structure and how it differs from English',
    'Particles & postpositions — mastering the complex particle system',
    'Honorifics — when and how to shift between formal, polite, and casual registers',
    'Situational expression — choosing the right phrase for the right context',
    'Onomatopoeia, mimetic words, and descriptive expressions unique to Korean',
  ],
  image:
    'https://readdy.ai/api/search-image?query=Minimalist%20premium%20one-on-one%20language%20coaching%20session%20setup%2C%20two%20elegant%20coffee%20cups%20on%20a%20warm%20wooden%20table%20with%20an%20open%20notebook%20showing%20handwritten%20Korean%20hangul%20characters%2C%20soft%20natural%20window%20light%2C%20cream%20and%20beige%20tones%2C%20editorial%20lifestyle%20photography%2C%20plain%20warm%20neutral%20background%2C%20sophisticated%20quiet%20study%20atmosphere%2C%20shallow%20depth%20of%20field&width=800&height=640&seq=method-1&orientation=landscape',
};

export async function getSiteMethod(): Promise<SiteMethod> {
  const map = await getSectionMap('method');
  return {
    eyebrow: map.eyebrow || DEFAULT_METHOD.eyebrow,
    title: map.title || DEFAULT_METHOD.title,
    subtitle: map.subtitle || DEFAULT_METHOD.subtitle,
    rows: parseJson<MethodRow[]>(map.rows, DEFAULT_METHOD.rows),
    boxTitle: map.boxTitle || DEFAULT_METHOD.boxTitle,
    boxItems: parseJson<string[]>(map.boxItems, DEFAULT_METHOD.boxItems),
    image: map.image || DEFAULT_METHOD.image,
  };
}

export interface TestimonialItem {
  name: string;
  role: string;
  text: string;
  avatar: string;
}

export interface SiteTestimonials {
  eyebrow: string;
  title: string;
  items: TestimonialItem[];
}

export const DEFAULT_TESTIMONIALS: SiteTestimonials = {
  eyebrow: 'What clients say',
  title: 'Trusted by professionals who use Korean where it counts.',
  items: [
    {
      name: 'Daniel R.',
      role: 'Managing Director, Frankfurt',
      text: "After eight years in Seoul I still sounded like a foreigner in board meetings. Six weeks in, my Korean clients started forgetting I wasn't Korean.",
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20european%20businessman%20in%20his%20forties%20wearing%20navy%20blazer%2C%20warm%20smile%2C%20clean%20studio%20background%20soft%20beige%20tones%2C%20high-end%20corporate%20portrait%20photography%2C%20natural%20lighting&width=120&height=120&seq=t1&orientation=squarish',
    },
    {
      name: 'Aiko S.',
      role: 'Diplomat, Tokyo',
      text: 'The bilingual coaching style is genius. Korean immersion in the conversation, English clarity when I need to understand a rule.',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20elegant%20japanese%20woman%20in%20her%20thirties%20wearing%20cream%20blouse%2C%20confident%20warm%20smile%2C%20plain%20soft%20beige%20studio%20background%2C%20editorial%20portrait%20quality%2C%20natural%20soft%20lighting&width=120&height=120&seq=t2&orientation=squarish',
    },
    {
      name: 'Marcus L.',
      role: 'Tech Founder, Singapore',
      text: "Every other tutor treated me like a beginner. He treated me like a professional and pushed my pronunciation to a level I didn't know was possible.",
      avatar: 'https://readdy.ai/api/search-image?query=professional%20headshot%20of%20asian%20male%20tech%20entrepreneur%20in%20his%20late%20thirties%20wearing%20charcoal%20turtleneck%2C%20thoughtful%20confident%20expression%2C%20clean%20beige%20studio%20background%2C%20premium%20editorial%20portrait%2C%20soft%20natural%20lighting&width=120&height=120&seq=t3&orientation=squarish',
    },
  ],
};

export async function getSiteTestimonials(): Promise<SiteTestimonials> {
  const map = await getSectionMap('testimonials');
  return {
    eyebrow: map.eyebrow || DEFAULT_TESTIMONIALS.eyebrow,
    title: map.title || DEFAULT_TESTIMONIALS.title,
    items: parseJson<TestimonialItem[]>(map.items, DEFAULT_TESTIMONIALS.items),
  };
}

export interface SiteSignup {
  eyebrow: string;
  title: string;
  subtitle: string;
  bullets: string[];
}

export const DEFAULT_SIGNUP: SiteSignup = {
  eyebrow: 'Become a member',
  title: 'Get a free 10-minute\ncoaching session.',
  subtitle:
    'Join as a member and receive a complimentary 10-minute 1:1 diagnostic coaching — no obligation, no group class.',
  bullets: [
    'One-time 10-min live coaching, gifted',
    'Weekly Korean pronunciation tips',
    'Priority access to new coaching slots',
  ],
};

export async function getSiteSignup(): Promise<SiteSignup> {
  const map = await getSectionMap('signup');
  return {
    eyebrow: map.eyebrow || DEFAULT_SIGNUP.eyebrow,
    title: map.title || DEFAULT_SIGNUP.title,
    subtitle: map.subtitle || DEFAULT_SIGNUP.subtitle,
    bullets: parseJson<string[]>(map.bullets, DEFAULT_SIGNUP.bullets),
  };
}

export interface SiteFooter {
  description: string;
}

export const DEFAULT_FOOTER: SiteFooter = {
  description:
    'Premium 1:1 Korean coaching for professionals. Trained at Seoul National University. Delivered from Seoul to the world.',
};

export async function getSiteFooter(): Promise<SiteFooter> {
  const map = await getSectionMap('footer');
  return {
    description: map.description || DEFAULT_FOOTER.description,
  };
}