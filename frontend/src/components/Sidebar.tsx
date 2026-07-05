import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Avatar from './ui/Avatar';
import { useAuthStore } from '../stores/authStore';

/**
 * 사이드바 메뉴 항목 인터페이스
 */
interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  requireAdmin?: boolean;
}

/**
 * Sidebar 컴포넌트 — 데스크톱 셸의 주 네비게이션 (사이드바 주도 구조).
 *
 * 구조(위 → 아래):
 * 1. **브랜드** — 로고 + 서비스명. 헤더에서 옮겨와 사이드바가 앱 정체성의 중심.
 * 2. **내비게이션** — 메뉴 목록. 현재 페이지 하이라이트, 관리자 전용 필터.
 * 3. **프로필** — 하단 고정. 아바타 + 이름/권한 + 드롭다운(내 정보/로그아웃).
 *    (기존 Header의 프로필 드롭다운을 이리로 이동.)
 *
 * 설계 포인트:
 * - `Avatar` 공유 프리미티브를 재사용(플랫폼 공통) — 셸은 조합만 담당.
 * - 활성 상태는 색(primary)만이 아니라 배경+굵기로 이중 표시.
 * - 라우트 매칭: 대시보드(/)는 정확히, 나머지는 prefix 매칭(상세 경로 포함).
 */

// 메뉴 항목 정의 — 탭/권한 변경은 이 배열만 수정.
const menuItems: MenuItem[] = [
  {
    label: '대시보드',
    path: '/',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: '프로젝트',
    path: '/projects',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: '파일',
    path: '/files',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: '일정',
    path: '/schedules',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: '거래처',
    path: '/partners',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    label: '사원',
    path: '/admin/users',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    requireAdmin: true,
  },
];

// 현재 경로가 메뉴 항목과 일치하는지 확인.
const isActive = (menuPath: string, pathname: string): boolean =>
  menuPath === '/' ? pathname === '/' : pathname.startsWith(menuPath);

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 프로필 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
    navigate('/login');
  };

  // 권한 체크를 통과한 메뉴만 표시
  const visibleMenuItems = menuItems.filter((item) =>
    item.requireAdmin ? user?.role === 'ADMIN' : true
  );

  return (
    <aside className="w-64 flex-none flex flex-col h-full bg-white border-r border-gray-200">
      {/* 1. 브랜드 */}
      <div className="flex items-center gap-2.5 h-16 flex-none px-5 border-b border-gray-200">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-primary-500 text-white">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18M8.5 15.5l2.5 2.5 4.5-5" />
          </svg>
        </span>
        <span className="text-lg font-extrabold tracking-tight text-gray-900">ScheduleFlow</span>
      </div>

      {/* 2. 내비게이션 */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {visibleMenuItems.map((item) => {
            const active = isActive(item.path, location.pathname);
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm transition-colors ${
                    active
                      ? 'bg-primary-50 font-bold text-primary-700'
                      : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 3. 프로필 */}
      <div ref={profileRef} className="relative flex-none border-t border-gray-200 p-3">
        <button
          onClick={() => setIsMenuOpen((open) => !open)}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-gray-100"
          aria-label="프로필 메뉴"
          aria-expanded={isMenuOpen}
        >
          <Avatar name={user?.username ?? 'U'} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-gray-900">
              {user?.username ?? 'User'}
            </span>
            <span className="block text-xs text-gray-500">
              {user?.role === 'ADMIN' ? '관리자' : '사원'}
            </span>
          </span>
          <svg
            className={`h-4 w-4 flex-none text-gray-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* 위로 열리는 드롭다운 */}
        {isMenuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <button
              onClick={() => setIsMenuOpen(false)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
            >
              내 정보
            </button>
            <div className="my-1 border-t border-gray-200" />
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
