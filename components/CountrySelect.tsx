'use client';

import { useState } from 'react';

const countries = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia',
  'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados',
  'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina',
  'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia',
  'Cameroon', 'Canada', 'Chile', 'China', 'Colombia', 'Costa Rica', 'Croatia', 'Cuba',
  'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominican Republic', 'Ecuador',
  'Egypt', 'El Salvador', 'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
  'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala', 'Guinea', 'Haiti',
  'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait',
  'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Liberia', 'Libya', 'Liechtenstein',
  'Lithuania', 'Luxembourg', 'Madagascar', 'Malaysia', 'Maldives', 'Mali', 'Malta',
  'Mauritania', 'Mauritius', 'Mexico', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro',
  'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nepal', 'Netherlands', 'New Zealand',
  'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman',
  'Pakistan', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland',
  'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saudi Arabia', 'Senegal', 'Serbia',
  'Singapore', 'Slovakia', 'Slovenia', 'Somalia', 'South Africa', 'South Korea', 'Spain',
  'Sri Lanka', 'Sudan', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan',
  'Tanzania', 'Thailand', 'Togo', 'Tunisia', 'Turkey', 'Turkmenistan', 'Uganda',
  'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay',
  'Uzbekistan', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
];

interface CountrySelectProps {
  name?: string;
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  variant?: 'dark' | 'light';
  placeholder?: string;
}

export default function CountrySelect({
  name = 'nationality',
  required = false,
  value,
  onChange,
  variant = 'dark',
  placeholder,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search
    ? countries.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
    : countries;

  const handleSelect = (country: string) => {
    onChange?.(country);
    setSearch(country);
    setOpen(false);
  };

  const isLight = variant === 'light';

  return (
    <div className="relative">
      <input type="hidden" name={name} value={value || ''} />
      <div
        className={`mt-2 w-full px-4 py-3 rounded-xl border text-sm cursor-pointer flex items-center justify-between ${
          isLight
            ? 'border-neutral-300 bg-white text-neutral-900 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900'
            : 'border-neutral-700 bg-white/5 text-white placeholder:text-neutral-500 focus:border-white'
        }`}
        onClick={() => setOpen(!open)}
      >
        <span className={value ? (isLight ? 'text-neutral-900' : 'text-white') : 'text-neutral-400'}>
          {value || placeholder || (isLight ? 'Select your country' : 'Select your country')}
        </span>
        <span className="w-4 h-4 flex items-center justify-center">
          <i className={`ri-arrow-down-s-line ${isLight ? 'text-neutral-500' : 'text-neutral-400'} transition-transform ${open ? 'rotate-180' : ''}`}></i>
        </span>
      </div>

      {open && (
        <div className={`absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border shadow-xl ${
          isLight ? 'border-neutral-200 bg-white' : 'border-neutral-600 bg-neutral-800'
        }`}>
          <div className={`sticky top-0 px-3 py-2 border-b ${
            isLight ? 'bg-white border-neutral-200' : 'bg-neutral-800 border-neutral-700'
          }`}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Search country..."
              className={`w-full px-3 py-2 rounded-lg text-sm placeholder:text-neutral-400 focus:outline-none ${
                isLight ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-700 text-white'
              }`}
            />
          </div>
          {filtered.map((c) => (
            <div
              key={c}
              onClick={() => handleSelect(c)}
              className={`px-4 py-2.5 text-sm cursor-pointer transition ${
                isLight
                  ? value === c ? 'text-neutral-900 font-medium bg-neutral-100' : 'text-neutral-700 hover:bg-neutral-100'
                  : value === c ? 'text-emerald-400 hover:bg-neutral-700' : 'text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {c}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className={`px-4 py-3 text-sm ${isLight ? 'text-neutral-500' : 'text-neutral-500'}`}>No countries found</div>
          )}
        </div>
      )}
    </div>
  );
}