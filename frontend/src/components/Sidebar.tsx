import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/**
 * 사이드바 메뉴 항목 인터페이스
 */
interface MenuItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
  requireAdmin?: boolean;
}

/**
 * Sidebar 컴포넌트
 * 
 * 기능:
 * 1. 메뉴 목록 표시 (대시보드 / 프로젝트 / 파일 / 일정 / 거래처 / 사원)
 * 2. 현재 페이지 하이라이트 표시
 * 3. 관리자 전용 메뉴 표시/숨김
 * 
 * 설계 포인트:
 * 
 * 1. **현재 페이지 감지**
 *    - useLocation 훅으로 현재 경로 확인
 *    - pathname.startsWith()로 동적 라우트 매칭 (예: /projects/:id)
 * 
 * 2. **메뉴 활성화 로직**
 *    - 정확한 경로 매칭 (대시보드는 /만)
 *    - 프로젝트 메뉴는 /projects로 시작하는 모든 경로 활성화
 * 
 * 3. **권한 체크**
 *    - requireAdmin이 true인 메뉴는 ADMIN 권한 체크
 *    - useAuthStore에서 user.role 확인
 */
const Sidebar: React.FC = () => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  // 메뉴 항목 정의
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

  // 현재 경로가 메뉴 항목과 일치하는지 확인
  const isActive = (menuPath: string): boolean => {
    if (menuPath === '/') {
      // 대시보드는 정확히 /인 경우만 활성화
      return location.pathname === '/';
    }
    // 다른 메뉴는 경로로 시작하는 경우 활성화 (예: /projects, /projects/:id)
    return location.pathname.startsWith(menuPath);
  };

  // 권한 체크를 통과한 메뉴만 필터링
  const visibleMenuItems = menuItems.filter((item) => {
    if (item.requireAdmin) {
      return user?.role === 'ADMIN';
    }
    return true;
  });

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 h-full overflow-y-auto">
      <nav className="p-4">
        <ul className="space-y-1">
          {visibleMenuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                    ${
                      active
                        ? 'bg-blue-500 text-white font-medium'
                        : 'text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

