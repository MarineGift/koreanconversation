import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getPaddleInstance } from '@/lib/paddle';
import { getPaddlePriceInfo } from '@/lib/products';
import { getSitePaddleConfig } from '@/lib/siteContent';
import CountrySelect from '@/components/CountrySelect';
import { getOrgId, getOrgWebsiteUrlById } from '@/lib/org';
import { getMemberByEmail, upsertMember, getMemberCredits } from '@/lib/member';

const PADDLE_CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '';

interface ClientInfo {
  ip_address: string;
  user_agent: string;
  country_code: string;
  browser_info: string;
  os_info: string;
  region_city: string;
}

export default function BookingForm({
  coachId,
  coachEmail,
  coachName,
  date,
  slot,
  sessionType: propSessionType,
  onDone,
}: {
  coachId: string;
  coachEmail?: string | null;
  coachName?: string;
  date: string;
  slot: string;
  sessionType?: 'free' | 'single' | 'package';
  onDone: () => void;
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [prices, setPrices] = useState<{ single?: string; package?: string }>();
  const [priceIds, setPriceIds] = useState<{ single?: string; package?: string }>();
  const [paddleProducts, setPaddleProducts] = useState<{ single?: string; package?: string }>({});
  const [paddleReady, setPaddleReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [nationality, setNationality] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studyPurpose, setStudyPurpose] = useState('');
  const [question, setQuestion] = useState('');
  const [comment, setComment] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [sessionCredits, setSessionCredits] = useState(0);
  const [useCredit, setUseCredit] = useState(false);
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    ip_address: '',
    user_agent: '',
    country_code: '',
    browser_info: '',
    os_info: '',
    region_city: '',
  });

  const isFree = propSessionType === 'free';
  const [sessionType, setSessionType] = useState<'single' | 'package'>(
    propSessionType === 'package' ? 'package' : 'single'
  );

  const paddleConfigured = Boolean(PADDLE_CLIENT_TOKEN && paddleProducts.single && paddleProducts.package);
  const manualMode = isFree || !paddleConfigured;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const config = await getSitePaddleConfig();
        const paddle = await getPaddleInstance();
        if (!mounted) return;
        setPaddleReady(true);
        setPaddleProducts({ single: config.singleProduct, package: config.packageProduct });

        const [singleInfo, packageInfo] = await Promise.all([
          config.singleProduct ? getPaddlePriceInfo(config.singleProduct) : Promise.resolve(null),
          config.packageProduct ? getPaddlePriceInfo(config.packageProduct) : Promise.resolve(null),
        ]);

        if (!mounted) return;
        setPrices({
          single: singleInfo?.formattedPrice,
          package: packageInfo?.formattedPrice,
        });
        setPriceIds({
          single: singleInfo?.priceId,
          package: packageInfo?.priceId,
        });
      } catch {
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        setUserEmail(data.user.email);
        setEmail(data.user.email);
        lookupMember(data.user.email);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let os = 'Unknown';
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    setClientInfo((prev) => ({
      ...prev,
      user_agent: ua,
      browser_info: browser,
      os_info: os,
    }));

    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((data) => {
        setClientInfo((prev) => ({
          ...prev,
          ip_address: data.ip || '',
          country_code: data.country_code || '',
          region_city: [data.city, data.region].filter(Boolean).join(', ') || '',
        }));
      })
      .catch(() => {
        fetch('https://api.ipify.org?format=json')
          .then((r) => r.json())
          .then((data) => {
            setClientInfo((prev) => ({ ...prev, ip_address: data.ip || '' }));
          })
          .catch(() => {});
      });
  }, []);

  async function lookupMember(lookupEmail: string) {
    if (!lookupEmail.trim()) return;
    setLookupLoading(true);

    const member = await getMemberByEmail(lookupEmail.trim());
    if (member) {
      if (member.full_name) setName(member.full_name);
      if (member.nationality) setNationality(member.nationality);
      if (member.study_purpose) setStudyPurpose(member.study_purpose);
      setSessionCredits(member.session_credits ?? 0);
      setLookupLoading(false);
      return;
    }

    const { data } = await supabase
      .from('bookings')
      .select('name, nationality, email, ip_address, user_agent, country_code, browser_info, os_info, region_city')
      .eq('email', lookupEmail.trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      if (data.name) setName(data.name);
      if (data.nationality) setNationality(data.nationality);
      if (data.ip_address || data.user_agent || data.country_code) {
        setClientInfo((prev) => ({
          ...prev,
          ip_address: data.ip_address || prev.ip_address,
          user_agent: data.user_agent || prev.user_agent,
          country_code: data.country_code || prev.country_code,
          browser_info: data.browser_info || prev.browser_info,
          os_info: data.os_info || prev.os_info,
          region_city: data.region_city || prev.region_city,
        }));
      }
    }
    const credits = await getMemberCredits(lookupEmail.trim());
    setSessionCredits(credits);
    setLookupLoading(false);
  }

  async function createManualBooking(
    submitName: string,
    submitEmail: string,
    submitNationality: string,
    submitQuestion: string,
    submitComment: string,
    finalSessionType: 'free' | 'single' | 'package',
    orgId: string | null,
    siteUrl: string | null,
    siteName: string | null,
    status: string = 'pending'
  ) {
    const bookingId = crypto.randomUUID();

    if (submitQuestion) {
      await supabase.from('coach_questions').insert({
        coach_id: coachId,
        booking_id: bookingId,
        organization_id: orgId,
        member_name: submitName,
        member_email: submitEmail,
        question: submitQuestion,
      });
    }

    const { error } = await supabase
      .from('bookings')
      .insert([{
        id: bookingId,
        coach_id: coachId,
        coach_name: coachName ?? null,
        organization_id: orgId,
        site_name: siteName ?? null,
        name: submitName,
        email: submitEmail,
        nationality: submitNationality,
        booking_date: date,
        slot,
        session_type: finalSessionType,
        status,
        room_url: null,
        comment: submitComment || null,
        ip_address: clientInfo.ip_address || null,
        user_agent: clientInfo.user_agent || null,
        country_code: clientInfo.country_code || null,
        browser_info: clientInfo.browser_info || null,
        os_info: clientInfo.os_info || null,
        region_city: clientInfo.region_city || null,
        site_url: siteUrl || null,
      }]);

    if (error) {
      if (submitQuestion) {
        await supabase.from('coach_questions').delete().eq('booking_id', bookingId);
      }
      if (error?.code === '23505') {
        setMsg('That slot was just booked by someone else. Please pick another time.');
      } else {
        setMsg(error.message || 'Something went wrong. Please try again.');
      }
      return false;
    }

    return true;
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setMsg('');

    const formData = new FormData(e.currentTarget);
    const submitName = String(formData.get('name') || name || '').trim();
    const submitEmail = String(formData.get('email') || email || '').trim();
    const submitNationality = String(formData.get('nationality') || nationality || '').trim();
    const submitStudyPurpose = String(formData.get('study_purpose') || studyPurpose || '').trim();
    const submitQuestion = String(formData.get('question') || question || '').trim();
    const submitComment = String(formData.get('comment') || comment || '').trim();
    const orgId = await getOrgId();
    const siteUrl = orgId ? await getOrgWebsiteUrlById(orgId) : null;

    let siteName: string | null = null;
    if (orgId) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', orgId)
        .maybeSingle();
      siteName = orgData?.name ?? null;
    }

    await upsertMember({
      email: submitEmail,
      full_name: submitName,
      nationality: submitNationality,
      study_purpose: submitStudyPurpose || null,
      organization_id: orgId || null,
      inputter: 'booking',
    });

    if (useCredit && sessionCredits > 0 && !isFree && sessionType === 'single') {
      const finalSessionType = 'single';
      const success = await createManualBooking(submitName, submitEmail, submitNationality, submitQuestion, submitComment, finalSessionType, orgId, siteUrl, siteName, 'pending');
      if (success) {
        setStatus('ok');
        setMsg('Your booking was submitted using a credit. The credit will be deducted when you enter the session. The coach will confirm shortly.');
        onDone();
      } else {
        setStatus('error');
      }
      return;
    }

    const priceId = sessionType === 'package' ? priceIds?.package : priceIds?.single;

    if (!isFree && paddleConfigured && priceId) {
      try {
        const paddle = await getPaddleInstance();
        if (!paddle) throw new Error('Paddle not initialized');
        paddle.Checkout.open({
          items: [{ priceId, quantity: 1 }],
          customer: userEmail ? { email: userEmail } : undefined,
          customData: {
            coachId,
            coachEmail,
            coachName,
            name: submitName,
            email: submitEmail,
            nationality: submitNationality,
            question: submitQuestion,
            date,
            slot,
            sessionType,
            quantity: 1,
            organizationId: orgId,
            ipAddress: clientInfo.ip_address,
            userAgent: clientInfo.user_agent,
            countryCode: clientInfo.country_code,
            browserInfo: clientInfo.browser_info,
            osInfo: clientInfo.os_info,
            regionCity: clientInfo.region_city,
          },
          settings: {
            displayMode: 'overlay',
            variant: 'one-page',
            theme: 'light',
            locale: 'en',
            successUrl: `${window.location.origin}/welcome`,
          },
        });
        setStatus('ok');
        setMsg('Checkout opened in a secure window. Complete the payment to confirm your booking.');
        onDone();
      } catch (err: any) {
        console.error('Paddle checkout error:', err);
        setStatus('error');
        setMsg(err?.message || 'Failed to open payment window. Please try again.');
      }
      return;
    }

    const finalSessionType = isFree ? 'free' : sessionType;
    const success = await createManualBooking(submitName, submitEmail, submitNationality, submitQuestion, submitComment, finalSessionType, orgId, siteUrl, siteName, 'pending');

    if (success) {
      setStatus('ok');
      setMsg(isFree
        ? 'Your free session request is submitted! The coach will confirm it shortly.'
        : 'Your session request is submitted! The coach will confirm it shortly.');
      onDone();
    } else {
      setStatus('error');
    }
  };

  const singlePrice = prices?.single || '$40';
  const packagePrice = prices?.package || '$250';

  return (
    <form onSubmit={onSubmit} className="mt-8 p-6 rounded-2xl bg-neutral-900 text-white">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Confirm your session</h3>
        <span className="text-sm text-neutral-300">{date} · {slot}</span>
      </div>

      <div className="mt-1 text-[11px] text-neutral-500">
        All times are in KST (Korea Standard Time, UTC+9)
      </div>

      {coachName && (
        <div className="mt-3 text-xs text-neutral-400">
          Coach: <span className="text-neutral-200">{coachName}</span>
        </div>
      )}

      {!isFree && sessionCredits > 0 && sessionType === 'single' && (
        <div className="mt-5">
          <label className="text-xs uppercase tracking-widest text-neutral-400">Payment option</label>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setUseCredit(true)}
              className={`p-4 rounded-xl border text-left cursor-pointer transition ${
                useCredit
                  ? 'border-white bg-white/10'
                  : 'border-neutral-700 hover:border-neutral-500'
              }`}
            >
              <div className="font-semibold text-sm">Use session credit</div>
              <div className="text-xs text-neutral-400 mt-1">{sessionCredits} credits left</div>
            </button>
            <button
              type="button"
              onClick={() => setUseCredit(false)}
              className={`p-4 rounded-xl border text-left cursor-pointer transition ${
                !useCredit
                  ? 'border-white bg-white/10'
                  : 'border-neutral-700 hover:border-neutral-500'
              }`}
            >
              <div className="font-semibold text-sm">Pay now</div>
              <div className="text-xs text-neutral-400 mt-1">Credit card via Paddle</div>
            </button>
          </div>
        </div>
      )}

      {!isFree && (
        <div className="mt-5">
          <label className="text-xs uppercase tracking-widest text-neutral-400">Session type</label>
          <div className="mt-2">
            <div className="p-4 rounded-xl border border-white bg-white/10 text-left">
              <div className="font-semibold text-sm">Single session</div>
              <div className="text-xs text-neutral-400 mt-1">30 min — {singlePrice}</div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-xs uppercase tracking-widest text-neutral-400">Email</label>
            <input
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-xl border border-neutral-700 bg-white/5 text-white placeholder:text-neutral-500 focus:border-white focus:outline-none text-sm"
              placeholder="you@company.com"
            />
          </div>
          <button
            type="button"
            onClick={() => lookupMember(email)}
            disabled={lookupLoading || !email.trim()}
            className="shrink-0 px-4 py-3 rounded-xl border border-neutral-500 text-sm text-neutral-200 hover:border-white hover:text-white cursor-pointer transition disabled:opacity-40 whitespace-nowrap"
          >
            {lookupLoading ? 'Searching...' : 'Look up member'}
          </button>
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-neutral-400">Full name</label>
          <input
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full px-4 py-3 rounded-xl border border-neutral-700 bg-white/5 text-white placeholder:text-neutral-500 focus:border-white focus:outline-none text-sm"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-neutral-400">Nationality</label>
          <CountrySelect name="nationality" required value={nationality} onChange={setNationality} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-neutral-400">Study purpose</label>
          <input
            name="study_purpose"
            value={studyPurpose}
            onChange={(e) => setStudyPurpose(e.target.value)}
            className="mt-2 w-full px-4 py-3 rounded-xl border border-neutral-700 bg-white/5 text-white placeholder:text-neutral-500 focus:border-white focus:outline-none text-sm"
            placeholder="e.g., business conversation, TOPIK prep"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-neutral-400">Question (for the coach)</label>
          <textarea
            name="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={500}
            rows={3}
            className="mt-2 w-full px-4 py-3 rounded-xl border border-neutral-700 bg-white/5 text-white placeholder:text-neutral-500 focus:border-white focus:outline-none text-sm resize-none"
            placeholder="Ask the coach anything before your session."
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-neutral-400">Comment (additional requests)</label>
          <textarea
            name="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={2}
            className="mt-2 w-full px-4 py-3 rounded-xl border border-neutral-700 bg-white/5 text-white placeholder:text-neutral-500 focus:border-white focus:outline-none text-sm resize-none"
            placeholder="Add any other requests or notes."
          />
        </div>
      </div>

      {manualMode && !isFree && (
        <div className="mt-4 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5">
          Payment is not configured, so your booking will proceed without payment.
        </div>
      )}

      {!isFree && (
        <div className="mt-4 text-xs text-neutral-400 bg-white/5 border border-neutral-700 rounded-xl px-4 py-2.5 leading-relaxed">
          No-show policy: if you miss a scheduled session without canceling at least 24 hours in advance, that session credit will still be deducted.
        </div>
      )}

      <button type="submit" disabled={status === 'loading'} className="mt-6 w-full bg-white text-neutral-900 py-3.5 rounded-full hover:bg-neutral-200 whitespace-nowrap cursor-pointer disabled:opacity-60 font-semibold">
        {isFree
          ? (status === 'loading' ? 'Booking…' : 'Book this session')
          : manualMode
            ? (status === 'loading' ? 'Booking…' : 'Book this session')
            : (status === 'loading' ? 'Opening checkout…' : (sessionType === 'package' ? `Pay ${packagePrice} and book` : `Pay ${singlePrice} and book`))}
      </button>

      {status === 'ok' && (
        <div className="mt-4 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
          {msg}
        </div>
      )}
      {status === 'error' && <div className="mt-4 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">{msg}</div>}
    </form>
  );
}
