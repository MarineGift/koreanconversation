'use client';

import { useEffect, useState } from 'react';
import type { Organization } from '@/lib/organizationManagement';
import { fetchOrganizations } from '@/lib/organizationManagement';
import OrgFormModal from './OrgFormModal';

export default function OrgManager() {
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    const data = await fetchOrganizations();
    setOrganizations(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function handleSaved() {
    load();
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-10 text-center text-sm text-neutral-500">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-neutral-500">
          전체 사이트를 관리합니다. 각 사이트는 고유한 식별자(slug)를 가지며, 강사 배정과 별도로 운영됩니다.
        </p>
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 text-sm bg-neutral-900 text-white rounded-lg hover:opacity-90 whitespace-nowrap cursor-pointer flex items-center gap-1.5"
        >
          <span className="w-4 h-4 flex items-center justify-center"><i className="ri-add-line"></i></span>
          사이트 추가
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {organizations.map((org) => (
          <div key={org.id} className="bg-white rounded-2xl border border-neutral-200 p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm"
                  style={{ backgroundColor: org.accent_color || '#171717' }}
                >
                  {org.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-neutral-900 truncate">{org.name}</div>
                  <div className="text-xs font-mono text-neutral-500 truncate">{org.slug}</div>
                </div>
              </div>
              <button
                onClick={() => setEditing(org)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 cursor-pointer shrink-0"
              >
                <i className="ri-edit-line"></i>
              </button>
            </div>
            {org.tagline && <p className="text-sm text-neutral-600 line-clamp-2">{org.tagline}</p>}
            {org.website_url && (
              <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                <span className="w-4 h-4 flex items-center justify-center text-neutral-400"><i className="ri-global-line"></i></span>
                <span className="truncate font-mono text-xs">{org.website_url}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="w-3 h-3 rounded-full border border-neutral-200" style={{ backgroundColor: org.accent_color }}></span>
              <span className="font-mono">{org.accent_color}</span>
            </div>
          </div>
        ))}
      </div>

      {(creating || editing) && (
        <OrgFormModal
          org={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}