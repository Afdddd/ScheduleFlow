import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/**
 * MorePage — 모바일 하단 탭 '더보기'.
 *
 * 프로필 카드 + 그룹별 메뉴(업무 / 관리 / 기타). 하단 탭 4개를 유지하고
 * 자주 안 쓰는 진입점(거래처·파일함·사원관리·로그아웃)을 여기로 모은다.
 */

interface Row {
  label: string;
  to?: string;
  onClick?: () => void;
  count?: string;
  danger?: boolean;
  icon: React.ReactNode;
  iconBg: string;
}

const icon = {
  partner: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1" />
  ),
  file: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" />
  ),
  users: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  ),
  logout: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  ),
};

const MorePage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const groups: { title: string; rows: Row[] }[] = [
    {
      title: '업무',
      rows: [
        { label: '거래처', to: '/partners', icon: icon.partner, iconBg: '#0B4EC4' },
        { label: '파일함', to: '/files', icon: icon.file, iconBg: '#1B9E5A' },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: '관리 · ADMIN',
            rows: [{ label: '사원 관리', to: '/admin/users', icon: icon.users, iconBg: '#8B5CF6' }],
          },
        ]
      : []),
    {
      title: '기타',
      rows: [{ label: '로그아웃', onClick: handleLogout, danger: true, icon: icon.logout, iconBg: '#E5484D' }],
    },
  ];

  return (
    <div className="min-h-full bg-gray-50 px-4 pb-10 pt-4">
      <h1 className="mb-4 px-1 text-[25px] font-extrabold tracking-tight text-gray-900">더보기</h1>

      {/* 프로필 카드 */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <span className="flex flex-none items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-[19px] font-extrabold text-white" style={{ height: 52, width: 52 }}>
          {user?.username?.charAt(0)?.toUpperCase() ?? 'U'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-extrabold text-gray-900">{user?.username ?? '사용자'}</div>
          <div className="mt-1 flex items-center gap-2 text-[12.5px] font-semibold text-gray-500">
            <span className="rounded bg-primary-50 px-1.5 py-0.5 text-[10.5px] font-extrabold text-primary-600">
              {isAdmin ? 'ADMIN' : '사원'}
            </span>
          </div>
        </div>
      </div>

      {groups.map((g) => (
        <div key={g.title} className="mt-4">
          <div className="mb-2 px-1 text-[11.5px] font-extrabold tracking-wide text-gray-400">{g.title}</div>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {g.rows.map((r, i) => {
              const inner = (
                <>
                  <span
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] text-white"
                    style={{ backgroundColor: r.iconBg }}
                  >
                    <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      {r.icon}
                    </svg>
                  </span>
                  <span className={`flex-1 text-[16.5px] font-semibold ${r.danger ? 'text-red-500' : 'text-gray-800'}`}>
                    {r.label}
                  </span>
                  {r.count && <span className="text-[13px] font-bold text-gray-400">{r.count}</span>}
                  {!r.danger && (
                    <svg className="h-[18px] w-[18px] text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  )}
                </>
              );
              const cls = `flex w-full items-center gap-3.5 px-4 py-[17px] text-left ${
                i > 0 ? 'border-t border-gray-100' : ''
              } active:bg-gray-50`;
              return r.to ? (
                <button key={r.label} onClick={() => navigate(r.to!)} className={cls}>
                  {inner}
                </button>
              ) : (
                <button key={r.label} onClick={r.onClick} className={cls}>
                  {inner}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MorePage;
