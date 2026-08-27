'use client';

import { useEffect, useState } from 'react';
import { getOrgFaqs, saveSiteFaq, deleteSiteFaq, type SiteFaq } from '@/lib/siteContent';

export default function FaqEditor({ orgId }: { orgId: string }) {
  const [faqs, setFaqs] = useState<SiteFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    getOrgFaqs(orgId).then((data) => {
      if (!mounted) return;
      setFaqs(data);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [orgId]);

  function updateFaq(index: number, field: 'question' | 'answer', value: string) {
    setFaqs((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  }

  function addFaq() {
    const nextOrder = faqs.length > 0 ? Math.max(...faqs.map((f) => f.sort_order)) + 1 : 1;
    setFaqs((prev) => [...prev, { id: '', question: '', answer: '', sort_order: nextOrder }]);
  }

  async function removeFaq(index: number) {
    const faq = faqs[index];
    if (faq.id) {
      await deleteSiteFaq(faq.id);
    }
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveAll() {
    setSaving(true);
    setMessage('');
    for (let i = 0; i < faqs.length; i++) {
      const f = faqs[i];
      if (!f.question.trim() && !f.answer.trim()) continue;
      const { error } = await saveSiteFaq(orgId, {
        id: f.id || undefined,
        question: f.question,
        answer: f.answer,
        sort_order: i + 1,
      });
      if (error) {
        setMessage('저장 중 오류가 발생했습니다.');
        setSaving(false);
        return;
      }
    }
    const refreshed = await getOrgFaqs(orgId);
    setFaqs(refreshed);
    setMessage('FAQ가 저장되었습니다.');
    setSaving(false);
  }

  if (loading) {
    return <div className="text-sm text-neutral-500 py-6 text-center">불러오는 중...</div>;
  }

  return (
    <div className="space-y-3">
      {faqs.length === 0 && (
        <div className="text-sm text-neutral-500 text-center py-4">등록된 FAQ가 없습니다. 추가해 주세요.</div>
      )}
      {faqs.map((f, i) => (
        <div key={i} className="bg-neutral-50 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={f.question}
              onChange={(e) => updateFaq(i, 'question', e.target.value)}
              placeholder="질문"
              className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-neutral-300"
            />
            <button
              onClick={() => removeFaq(i)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 shrink-0 cursor-pointer"
            >
              <i className="ri-delete-bin-6-line"></i>
            </button>
          </div>
          <textarea
            value={f.answer}
            onChange={(e) => updateFaq(i, 'answer', e.target.value)}
            placeholder="답변"
            rows={2}
            maxLength={500}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-neutral-300 resize-none"
          />
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={addFaq}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50 whitespace-nowrap cursor-pointer"
        >
          <span className="w-4 h-4 flex items-center justify-center"><i className="ri-add-line"></i></span>
          질문 추가
        </button>
        <div className="flex items-center gap-3">
          {message && <span className="text-sm text-emerald-600">{message}</span>}
          <button
            onClick={saveAll}
            disabled={saving}
            className="px-4 py-2 text-sm bg-neutral-900 text-white rounded-lg hover:opacity-90 whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            {saving ? '저장 중...' : 'FAQ 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}