import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuthStore } from '../stores/authStore';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * Header 컴포넌트 — 사이드바 주도 구조의 얇은 "컨텍스트 바".
 *
 * 콘텐츠 영역 상단에만 걸리며(사이드바 오른쪽), 현재 화면의 제목을 보여준다.
 * 로고·프로필은 사이드바로 이동했으므로 여기서는 다루지 않는다.
 *
 * - 제목은 라우트에서 파생한다(각 페이지가 제목을 중복으로 렌더하지 않도록 셸이 소유).
 * - 상세 페이지는 엔티티명(예: 프로젝트명)을 페이지 본문 h1로 따로 두므로,
 *   여기서는 섹션 성격의 "상세"만 표시해 서로 보완되게 한다.
 * - 우측은 향후 전역 검색·빠른 액션 자리(현재는 비움).
 */

// 라우트 → 화면 제목. 위에서부터 먼저 매칭되는 규칙을 사용(구체적인 경로를 위에).
const TITLE_RULES: { match: (path: string) => boolean; title: string }[] = [
  { match: (p) => p === '/', title: '대시보드' },
  { match: (p) => p === '/projects/new', title: '프로젝트 등록' },
  { match: (p) => p.startsWith('/projects/'), title: '프로젝트 상세' },
  { match: (p) => p.startsWith('/projects'), title: '프로젝트' },
  { match: (p) => p.startsWith('/files'), title: '파일함' },
  { match: (p) => p === '/schedules/new', title: '일정 등록' },
  { match: (p) => p.startsWith('/schedules/'), title: '일정 상세' },
  { match: (p) => p.startsWith('/schedules'), title: '일정' },
  { match: (p) => p === '/partners/new', title: '거래처 등록' },
  { match: (p) => p.startsWith('/partners/'), title: '거래처 상세' },
  { match: (p) => p.startsWith('/partners'), title: '거래처' },
  { match: (p) => p.startsWith('/admin/users'), title: '사원 관리' },
  { match: (p) => p.startsWith('/more'), title: '더보기' },
];

const getPageTitle = (pathname: string): string =>
  TITLE_RULES.find((rule) => rule.match(pathname))?.title ?? 'ScheduleFlow';

const Header: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isAdmin = useAuthStore((state) => state.user?.role === 'ADMIN');
  const title = getPageTitle(pathname);
  const isDashboard = pathname === '/';

  const today = new Date();
  const dateLabel = `${format(today, 'yyyy년 M월 d일')} (${WEEKDAYS[today.getDay()]})`;

  return (
    <header className="flex h-16 flex-none items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-lg font-bold text-gray-900">{title}</h1>

      {/* 우측: 대시보드에서는 날짜 + 빠른 액션 */}
      {isDashboard ? (
        <div className="flex items-center gap-2.5">
          <span className="mr-1 text-sm font-bold tabular-nums text-gray-500">{dateLabel}</span>
          {isAdmin && (
            <button
              type="button"
              onClick={() => navigate('/projects/new')}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 text-[13px] font-extrabold text-primary-600 shadow-sm transition-colors hover:border-primary-400"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" />
              </svg>
              새 프로젝트
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/schedules/new')}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary-500 px-3.5 text-[13px] font-extrabold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <rect x="3" y="4.5" width="18" height="16.5" rx="3" />
              <path d="M16 2.5v4M8 2.5v4M3 10h18M12 13.5v4M10 15.5h4" />
            </svg>
            새 일정
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2" />
      )}
    </header>
  );
};

export default Header;
