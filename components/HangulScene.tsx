'use client';

import { useEffect, useState } from 'react';

const syllables = [
  { cho: 'ㅎ', jung: 'ㅏ', jong: 'ㄴ', result: '한', roman: 'han', meaning: 'Korea' },
  { cho: 'ㄱ', jung: 'ㅜ', jong: 'ㄱ', result: '국', roman: 'guk', meaning: 'Country' },
  { cho: 'ㅁ', jung: 'ㅏ', jong: 'ㄹ', result: '말', roman: 'mal', meaning: 'Language' },
  { cho: 'ㅅ', jung: 'ㅓ', jong: 'ㄴ', result: '선', roman: 'seon', meaning: 'Line' },
  { cho: 'ㅂ', jung: 'ㅣ', jong: '', result: '비', roman: 'bi', meaning: 'Rain' },
];

export default function HangulScene() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const seq = [0, 1, 2, 3, 4];
    let step = 0;
    const t = setInterval(() => {
      step = (step + 1) % seq.length;
      setPhase(seq[step]);
      if (seq[step] === 0) {
        setIdx((i) => (i + 1) % syllables.length);
      }
    }, 1400);
    return () => clearInterval(t);
  }, []);

  const s = syllables[idx];
  const showCho = phase >= 1;
  const showJung = phase >= 2;
  const showJong = phase >= 3 && s.jong;
  const merged = phase >= 4;

  return (
    <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: '1200px' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-rose-200/40 blur-3xl"></div>
        <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-indigo-200/40 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-amber-100/40 blur-3xl"></div>
      </div>

      <div className="relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] md:w-[480px] md:h-[480px] lg:w-[520px] lg:h-[520px] max-w-full" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(12deg) rotateY(-10deg)' }}>
        <div
          className="absolute top-1/2 left-1/2 flex items-center justify-center rounded-3xl bg-gradient-to-br from-white to-neutral-100 shadow-2xl border border-neutral-200 transition-all duration-700 ease-out"
          style={{
            width: merged ? 260 : 200,
            height: merged ? 260 : 200,
            transform: `translate(-50%, -50%) translateZ(${merged ? 60 : 0}px) rotateY(${merged ? 0 : -6}deg)`,
            opacity: merged ? 1 : 0.6,
          }}
        >
          {merged ? (
            <div className="text-center">
              <div className="text-[100px] sm:text-[140px] md:text-[180px] lg:text-[200px] leading-none font-bold text-neutral-900" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>{s.result}</div>
              <div className="mt-2 text-sm tracking-[0.3em] uppercase text-neutral-500">{s.roman} · {s.meaning}</div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <Piece letter={s.cho} label="초성" color="rose" visible={showCho} x={-70} y={-60} z={80} />
              <Piece letter={s.jung} label="중성" color="indigo" visible={showJung} x={70} y={-60} z={120} />
              {s.jong && <Piece letter={s.jong} label="종성" color="amber" visible={showJong} x={0} y={70} z={160} />}
            </div>
          )}
        </div>

        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3 text-[10px] md:text-xs text-neutral-500 uppercase tracking-widest whitespace-nowrap">
          <span className={phase >= 1 ? 'text-rose-600 font-semibold' : ''}>초성 Cho</span>
          <span>+</span>
          <span className={phase >= 2 ? 'text-indigo-600 font-semibold' : ''}>중성 Jung</span>
          {s.jong && <><span>+</span><span className={phase >= 3 ? 'text-amber-600 font-semibold' : ''}>종성 Jong</span></>}
          <span>=</span>
          <span className={merged ? 'text-neutral-900 font-semibold' : ''}>글자</span>
        </div>
      </div>
    </div>
  );
}

function Piece({ letter, label, color, visible, x, y, z }: { letter: string; label: string; color: string; visible: boolean; x: number; y: number; z: number }) {
  const colorMap: Record<string, string> = {
    rose: 'from-rose-400 to-rose-600 text-white',
    indigo: 'from-indigo-400 to-indigo-600 text-white',
    amber: 'from-amber-400 to-amber-600 text-white',
  };
  return (
    <div
      className={`absolute top-1/2 left-1/2 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br ${colorMap[color]} shadow-xl flex flex-col items-center justify-center transition-all duration-700 ease-out`}
      style={{
        transform: `translate(-50%, -50%) translate3d(${visible ? x : 0}px, ${visible ? y : 0}px, ${visible ? z : 0}px) rotateY(${visible ? 0 : 90}deg) scale(${visible ? 1 : 0.4})`,
        opacity: visible ? 1 : 0,
        transformStyle: 'preserve-3d',
      }}
    >
      <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>{letter}</div>
      <div className="text-[10px] tracking-widest uppercase mt-1 opacity-80">{label}</div>
    </div>
  );
}