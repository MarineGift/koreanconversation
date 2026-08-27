'use client';

import { useEffect, useState } from 'react';
import { getAllQuestions, type CoachQuestion } from '@/lib/questions';

export default function QuestionsSection() {
  const [questions, setQuestions] = useState<CoachQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllQuestions().then((q) => {
      setQuestions(q);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-sm text-neutral-500">불러오는 중...</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-neutral-900">받은 질문</h2>
        <p className="text-sm text-neutral-500 mt-1">
          수강생이 코칭 신청 시 강사에게 남긴 질문을 한눈에 확인할 수 있습니다.
        </p>
      </div>

      {questions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-sm text-neutral-500 text-center">
          아직 받은 질문이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="bg-white rounded-2xl border border-neutral-200 p-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-900 text-white">
                    <i className="ri-question-answer-line"></i>
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">{q.member_name || '이름 없음'}</div>
                    <div className="text-xs text-neutral-500">{q.member_email || '이메일 없음'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600">
                    강사: {q.coach_name}
                  </span>
                  <span className="text-neutral-400 whitespace-nowrap">
                    {new Date(q.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-sm text-neutral-700 leading-relaxed bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-200">
                {q.question || '질문 내용 없음'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}