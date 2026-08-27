'use client';

import { useEffect, useState } from 'react';
import { fetchContent, saveSiteContent } from '@/lib/siteContent';

interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea';
}

interface SubpageContentEditorProps {
  orgId: string;
  section: string;
  fields: FieldDef[];
  title: string;
}

export default function SubpageContentEditor({ orgId, section, fields, title }: SubpageContentEditorProps) {
  const [values, setValues] = useState<Record<string, string>>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!orgId) return;
    let mounted = true;
    fetchContent(orgId, section).then((map) => {
      if (!mounted) return;
      setValues(map);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [orgId, section]);

  function setField(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setMsg('');
    let failed = false;
    for (const f of fields) {
      const { error } = await saveSiteContent(orgId, section, f.key, values[f.key] ?? '');
      if (error) failed = true;
    }
    setSaving(false);
    setMsg(failed ? '저장 중 일부 오류가 발생했습니다.' : '저장되었습니다.');
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h5 className="font-bold text-neutral-900">{title}</h5>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 text-sm bg-neutral-900 text-white rounded-lg hover:opacity-90 whitespace-nowrap cursor-pointer disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
      {msg && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          {msg}
        </p>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea
                value={values[f.key] ?? ''}
                onChange={(e) => setField(f.key, e.target.value)}
                rows={3}
                maxLength={1000}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 resize-none"
              />
            ) : (
              <input
                type="text"
                value={values[f.key] ?? ''}
                onChange={(e) => setField(f.key, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}