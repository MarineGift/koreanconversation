'use client';

import { useState, useEffect } from 'react';
import { submitPackageInquiry, notifyPackageInquiry } from '@/lib/packageInquiries';
import { getOrgId } from '@/lib/org';
import { getTourOverride } from '@/lib/siteContent';
import CountrySelect from '@/components/CountrySelect';

export default function TourInquiry() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');
  const [country, setCountry] = useState('');
  const [override, setOverride] = useState<Record<string, unknown>>();

  useEffect(() => {
    getTourOverride().then(o => setOverride(o)).catch(() => {});
  }, []);

  const o = (override?.inquiry as Record<string, string> | undefined) || {};
  const eyebrow = o.eyebrow || 'Get a quote';
  const title = o.title || 'Plan your Korea trip with us.';
  const subtitle = o.subtitle || 'Send us your travel plan and we will get back to you within 24 hours with a custom itinerary and transparent pricing.';

  const features = (override?.inquiryFeatures as Array<{ icon: string; title: string; desc: string }> | undefined) || [
    { icon: 'ri-time-line', title: '24-hour response', desc: 'Fast, personal replies to every inquiry.' },
    { icon: 'ri-shield-check-line', title: 'Licensed & vetted', desc: 'Professional Korean guides and interpreters.' },
    { icon: 'ri-wallet-3-line', title: 'Transparent pricing', desc: 'Itemized quote with no hidden fees.' },
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const honeypot = (formData.get('website_alt') as string) || '';
    if (honeypot.trim() !== '') {
      setStatus('success');
      setFormError('');
      form.reset();
      return;
    }

    setStatus('loading');
    setFormError('');

    const payload = {
      package_type: 'tour',
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      country: String(formData.get('country') || '').trim(),
      group_size: String(formData.get('group_size') || '').trim(),
      service_type: String(formData.get('service_type') || '').trim(),
      arrival_date: String(formData.get('arrival_date') || '').trim(),
      departure_date: String(formData.get('departure_date') || '').trim(),
      message: String(formData.get('message') || '').trim(),
      organization_id: await getOrgId(),
    };

    try {
      const { error } = await submitPackageInquiry(payload);

      if (error) {
        setStatus('error');
        setFormError(error.message || 'Something went wrong. Please try again.');
      } else {
        setStatus('success');
        setCountry('');
        form.reset();
        notifyPackageInquiry(payload);
      }
    } catch (err) {
      setStatus('error');
      setFormError('Network error. Please try again.');
    }
  }

  const inputCls =
    'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400';

  return (
    <section id="inquiry" className="py-16 md:py-24 bg-white">
      <style>{`.guest-field{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;opacity:0;}`}</style>
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="text-xs uppercase tracking-widest text-neutral-500">{eyebrow}</div>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold text-neutral-900">
              {title}
            </h2>
            <p className="mt-4 text-neutral-600 leading-relaxed">
              {subtitle}
            </p>

            <div className="mt-8 space-y-4">
              {features.map((f) => (
                <div key={f.title} className="flex items-start gap-4">
                  <span className="w-11 h-11 flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 text-xl shrink-0">
                    <i className={f.icon}></i>
                  </span>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{f.title}</h3>
                    <p className="text-sm text-neutral-600">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#FBF7F2] rounded-3xl border border-neutral-200 p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Name</label>
                  <input name="name" type="text" required placeholder="Your name" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
                  <input name="email" type="email" required placeholder="you@email.com" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Country</label>
                  <div className="-mt-2">
                    <CountrySelect name="country" variant="light" value={country} onChange={setCountry} placeholder="Select your country" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Group size</label>
                  <input name="group_size" type="number" min="1" placeholder="Number of people" className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Service needed</label>
                <div className="flex flex-wrap gap-2">
                  {['Tour Guide', 'Business Interpretation', 'Both'].map((opt) => (
                    <label key={opt} className="cursor-pointer">
                      <input type="radio" name="service_type" value={opt} className="peer sr-only" />
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-neutral-200 text-sm text-neutral-700 peer-checked:border-neutral-900 peer-checked:bg-neutral-900 peer-checked:text-white transition whitespace-nowrap">
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Arrival date</label>
                  <input name="arrival_date" type="date" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Departure date</label>
                  <input name="departure_date" type="date" className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Message</label>
                <textarea
                  name="message"
                  rows={4}
                  maxLength={500}
                  placeholder="Tell us about your trip — destinations, meetings, preferences..."
                  className={`${inputCls} resize-none`}
                />
                <div className="mt-1 text-right text-xs text-neutral-400">Max 500 characters</div>
              </div>

              <div className="guest-field" aria-hidden="true">
                <label>Website</label>
                <input
                  name="website_alt"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  readOnly
                />
              </div>

              {formError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                  {formError}
                </div>
              )}
              {status === 'success' && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
                  Thank you! Your inquiry has been received. We will reply within 24 hours.
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 rounded-full font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition whitespace-nowrap cursor-pointer disabled:opacity-60"
              >
                {status === 'loading' ? 'Sending...' : 'Request a Quote'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}