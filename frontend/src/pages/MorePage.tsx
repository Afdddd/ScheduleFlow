import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/**
 * 더보기 항목.
 */
interface MoreItem {
  label: string;
  to?: string;
  onClick?: () => void;
  requireAdmin?: boolean;
  danger?: boolean;
}

/**
 * MorePage — 모바일 하단 탭 '더보기'.
 *
 * 자주 안 쓰는 메뉴(거래처·파일함·사원관리·설정·로그아웃)를 한 곳에 모은다.
 * 하단 탭을 4개로 유지하면서 나머지 진입점을 여기로 내린 것.
 *
 * NOTE: 골격 단계의 스텁. 실제 항목/디자인은 기능명세 이후 다듬는다.
 */
const MorePage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const items: MoreItem[] = [
    { label: '거래처', to: '/partners' },
    { label: '파일함', to: '/files' },
    { label: '사원 관리', to: '/admin/users', requireAdmin: true },
    { label: '로그아웃', onClick: handleLogout, danger: true },
  ];

  const visibleItems = items.filter((item) => !item.requireAdmin || user?.role === 'ADMIN');

  return (
    <div className="p-4">
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">더보기</h1>
      {user && (
        <p className="text-sm text-gray-500 mb-5">
          {user.username}
          {user.role === 'ADMIN' && (
            <span className="ml-2 rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600">
              ADMIN
            </span>
          )}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {visibleItems.map((item, i) => {
          const rowClass =
            'flex items-center justify-between px-4 py-4 text-lg font-semibold ' +
            (i !== visibleItems.length - 1 ? 'border-b border-gray-100 ' : '') +
            (item.danger ? 'text-red-500' : 'text-gray-800');

          const chevron = !item.danger && (
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
            </svg>
          );

          if (item.to) {
            return (
              <Link key={item.label} to={item.to} className={rowClass}>
                <span>{item.label}</span>
                {chevron}
              </Link>
            );
          }
          return (
            <button key={item.label} type="button" onClick={item.onClick} className={`w-full text-left ${rowClass}`}>
              <span>{item.label}</span>
              {chevron}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MorePage;
