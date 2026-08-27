'use client';

import Link from 'next/link';

export interface SidebarCategory {
  key: string;
  label: string;
  icon: string;
}

const CATEGORIES: SidebarCategory[] = [
  { key: 'overview', label: '대시보드', icon: 'ri-dashboard-line' },
  { key: 'analytics', label: '접속자 분석', icon: 'ri-line-chart-line' },
  { key: 'members', label: '회원', icon: 'ri-user-line' },
  { key: 'coaches', label: '강사', icon: 'ri-user-star-line' },
  { key: 'content', label: '콘텐츠', icon: 'ri-book-open-line' },
  { key: 'operations', label: '운영', icon: 'ri-settings-3-line' },
  { key: 'marketing', label: '마케팅', icon: 'ri-mail-send-line' },
  { key: 'settings', label: '설정', icon: 'ri-tools-line' },
];

export default function AdminSidebar({
  active,
  onSelect,
  onLogout,
  orgName,
  accent,
  open,
  onClose,
}: {
  active: string;
  onSelect: (key: string) => void;
  onLogout: () => void;
  orgName: string;
  accent: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 bg-white border-r border-neutral-200 flex flex-col transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-neutral-200 flex items-center gap-2.5">
          <span
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white font-['Pacifico'] shrink-0"
            style={{ backgroundColor: accent }}
          >
            logo
          </span>
          <div className="min-w-0">
            <div className="font-bold text-neutral-900 truncate">{orgName}</div>
            <div className="text-xs text-neutral-500">관리자</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {CATEGORIES.map((cat) => {
            const isActive = active === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => {
                  onSelect(cat.key);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap cursor-pointer transition ${
                  isActive
                    ? 'text-white'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
                style={isActive ? { backgroundColor: accent } : undefined}
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  <i className={cat.icon}></i>
                </span>
                {cat.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-neutral-200 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 whitespace-nowrap cursor-pointer"
          >
            <span className="w-5 h-5 flex items-center justify-center">
              <i className="ri-external-link-line"></i>
            </span>
            사이트 보기
          </Link>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 whitespace-nowrap cursor-pointer"
          >
            <span className="w-5 h-5 flex items-center justify-center">
              <i className="ri-logout-box-line"></i>
            </span>
            로그아웃
          </button>
        </div>
      </aside>
    </>
  );
}