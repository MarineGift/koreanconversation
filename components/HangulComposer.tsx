'use client';

import { useEffect, useState } from 'react';

interface Syllable {
  char: string;
  cho: string;
  jung: string;
  jong: string | null;
  rom: string;
  meaning: string;
}

const SYLLABLES: Syllable[] = [
  { char: '한', cho: 'ㅎ', jung: 'ㅏ', jong: 'ㄴ', rom: 'han', meaning: 'Korea' },
  { char: '글', cho: 'ㄱ', jung: 'ㅡ', jong: 'ㄹ', rom: 'geul', meaning: 'writing' },
  { char: '사', cho: 'ㅅ', jung: 'ㅏ', jong: null, rom: 'sa', meaning: 'four' },
  { char: '랑', cho: 'ㄹ', jung: 'ㅏ', jong: 'ㅇ', rom: 'rang', meaning: 'love' },
  { char: '코', cho: 'ㅋ', jung: 'ㅗ', jong: null, rom: 'ko', meaning: 'coach' },
  { char: '칭', cho: 'ㅊ', jung: 'ㅣ', jong: 'ㅇ', rom: 'ching', meaning: 'coaching' },
];

export default function HangulComposer() {
  const [index, setIndex] = useState(0);
  const [combined, setCombined] = useState(false);

  useEffect(() => {
    setCombined(false);
    const t1 = setTimeout(() => setCombined(true), 1300);
    const t2 = setTimeout(() => setIndex((i) => (i + 1) % SYLLABLES.length), 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [index]);

  const s = SYLLABLES[index];

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/5 backdrop-blur p-6">
      <div className="text-xs uppercase tracking-widest text-white/50 text-center">Hangul Jamo</div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <JamoTile label="Initial" letter={s.cho} color="text-sky-300" ring="border-sky-400/40" merged={combined} />
        <div className="text-white/40 text-xl">+</div>
        <JamoTile label="Medial" letter={s.jung} color="text-emerald-300" ring="border-emerald-400/40" merged={combined} />
        <div className="text-white/40 text-xl">+</div>
        <JamoTile label="Final" letter={s.jong ?? ''} color="text-amber-300" ring="border-amber-400/40" merged={combined} empty={!s.jong} />
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <div className="text-white/40 text-2xl">=</div>
        <div
          key={s.char + combined}
          className={`w-24 h-24 flex items-center justify-center rounded-2xl bg-white text-neutral-900 text-6xl font-bold transition-all duration-700 ${
            combined ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          }`}
        >
          {s.char}
        </div>
      </div>

      <div className="mt-4 text-center">
        <div className="text-white/80 font-semibold text-lg">{s.rom}</div>
        <div className="text-white/50 text-sm">{s.meaning}</div>
      </div>
    </div>
  );
}

function JamoTile({
  label,
  letter,
  color,
  ring,
  merged,
  empty,
}: {
  label: string;
  letter: string;
  color: string;
  ring: string;
  merged: boolean;
  empty?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`w-16 h-16 flex items-center justify-center rounded-xl border bg-white/10 text-4xl font-bold ${color} ${ring} transition-transform duration-700 ${
          merged ? 'scale-105' : 'scale-100'
        }`}
      >
        {empty ? <span className="text-white/25 text-2xl font-normal">—</span> : letter}
      </div>
      <span className="text-[10px] uppercase tracking-wide text-white/45">{label}</span>
    </div>
  );
}