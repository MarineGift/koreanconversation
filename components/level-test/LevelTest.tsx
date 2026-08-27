'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Question {
  prompt: string;
  options: string[];
  points: number[];
}

const questions: Question[] = [
  {
    prompt: 'How much Korean can you understand when spoken slowly and clearly?',
    options: ['Almost nothing', 'Basic greetings only', 'Everyday topics', 'Most conversations', 'Native-like'],
    points: [0, 1, 2, 3, 4],
  },
  {
    prompt: 'Can you introduce yourself and order food in Korean?',
    options: ['Not at all', 'With heavy difficulty', 'Yes, with some effort', 'Comfortably', 'Fluently'],
    points: [0, 1, 2, 3, 4],
  },
  {
    prompt: 'How confident are you reading Korean text (Hangul)?',
    options: ['Cannot read Hangul', 'Read slowly, guessing', 'Read basic text', 'Read news/articles', 'Read fluently'],
    points: [0, 1, 2, 3, 4],
  },
  {
    prompt: 'Can you talk about past experiences and future plans?',
    options: ['No', 'Only simple phrases', 'Simple sentences', 'With detail', 'Naturally'],
    points: [0, 1, 2, 3, 4],
  },
  {
    prompt: 'How well do you understand honorifics (존댓말 / 반말)?',
    options: ['Never heard of them', 'Know they exist', 'Use basic forms', 'Use correctly mostly', 'Master them'],
    points: [0, 1, 2, 3, 4],
  },
  {
    prompt: 'Can you follow a Korean drama or news without subtitles?',
    options: ['Impossible', 'Only a few words', 'The gist', 'Most of it', 'Fully'],
    points: [0, 1, 2, 3, 4],
  },
  {
    prompt: 'How comfortable are you with everyday conversation topics?',
    options: ['Not at all', 'Very limited', 'Basic small talk', 'Most topics', 'Any topic'],
    points: [0, 1, 2, 3, 4],
  },
  {
    prompt: 'Can you express opinions and give reasons in Korean?',
    options: ['No', 'Rarely', 'Simply', 'Clearly', 'Persuasively'],
    points: [0, 1, 2, 3, 4],
  },
];

const levels = [
  { min: 0, name: 'Beginner', desc: 'You are starting from the very basics — learning Hangul and core phrases.', icon: 'ri-seedling-line' },
  { min: 8, name: 'Elementary', desc: 'You can handle simple daily situations but need structured practice.', icon: 'ri-leaf-line' },
  { min: 16, name: 'Intermediate', desc: 'You can hold everyday conversations and are ready to expand vocabulary.', icon: 'ri-plant-line' },
  { min: 24, name: 'Upper-Intermediate', desc: 'You speak comfortably and can focus on fluency and nuance.', icon: 'ri-tree-line' },
  { min: 30, name: 'Advanced', desc: 'You are near-native — polish business Korean and subtle expressions.', icon: 'ri-tree-fill' },
];

export default function LevelTest() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const score = answers.reduce((a, b) => a + b, 0);

  function choose(index: number) {
    const next = [...answers];
    next[step] = questions[step].points[index];
    setAnswers(next);
    if (step + 1 < questions.length) {
      setStep(step + 1);
    } else {
      setDone(true);
    }
  }

  function restart() {
    setAnswers([]);
    setStep(0);
    setDone(false);
  }

  const result = levels
    .slice()
    .reverse()
    .find((l) => score >= l.min) ?? levels[0];

  if (done) {
    return (
      <section className="py-16 md:py-24 bg-white min-h-[70vh] flex items-center">
        <div className="mx-auto max-w-xl px-4 md:px-8 text-center">
          <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 text-3xl">
            <i className={result.icon}></i>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-neutral-900">Your level: {result.name}</h2>
          <p className="mt-4 text-neutral-600 leading-relaxed">{result.desc}</p>
          <div className="mt-4 text-sm text-neutral-500">You scored {score} out of {questions.length * 4}</div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/free" className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 text-white text-sm px-6 py-3 font-semibold hover:bg-neutral-800 transition whitespace-nowrap cursor-pointer">
              <span className="w-4 h-4 flex items-center justify-center"><i className="ri-gift-line"></i></span>
              Book a Free Assessment
            </Link>
            <button onClick={restart} className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 text-sm px-6 py-3 font-medium hover:border-neutral-900 transition whitespace-nowrap cursor-pointer">
              <span className="w-4 h-4 flex items-center justify-center"><i className="ri-refresh-line"></i></span>
              Retake the test
            </button>
          </div>
        </div>
      </section>
    );
  }

  const q = questions[step];

  return (
    <section className="py-16 md:py-24 bg-white min-h-[70vh]">
      <div className="mx-auto max-w-2xl px-4 md:px-8">
        <div className="text-center">
          <div className="text-xs uppercase tracking-widest text-neutral-500">Level test</div>
          <h1 className="mt-3 text-3xl md:text-4xl font-bold text-neutral-900">Find your Korean level.</h1>
          <p className="mt-4 text-neutral-600 leading-relaxed">
            Answer {questions.length} quick questions to get an instant estimate of your Korean level.
          </p>
        </div>

        <div className="mt-8 flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full bg-neutral-900 rounded-full transition-all"
              style={{ width: `${((step + 1) / questions.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-neutral-500 whitespace-nowrap">{step + 1} / {questions.length}</span>
        </div>

        <div className="mt-8 bg-[#FBF7F2] rounded-3xl border border-neutral-200 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-neutral-900">{q.prompt}</h2>
          <div className="mt-6 space-y-3">
            {q.options.map((opt, i) => (
              <button
                key={opt}
                onClick={() => choose(i)}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-5 py-4 text-left text-sm text-neutral-700 hover:border-neutral-900 transition cursor-pointer whitespace-nowrap"
              >
                <span>{opt}</span>
                <span className="w-4 h-4 flex items-center justify-center text-neutral-300">
                  <i className="ri-arrow-right-s-line"></i>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}