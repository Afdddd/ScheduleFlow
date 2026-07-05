import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * 하단 탭바 항목.
 */
interface TabItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

/**
 * BottomTabBar — 모바일 전용 하단 탭 네비게이션.
 *
 * 설계 포인트:
 * 1. **엄지 존 우선** — 주 이동을 화면 하단에 둬서 한 손으로 닿게 한다.
 * 2. **아저씨 친화** — 큰 아이콘(26px) + 항상 보이는 한글 라벨. 뭘 누르는지 바로 앎.
 * 3. **탭 구성은 잠정** — 홈·일정·프로젝트·더보기. 실제 사용 패턴 보고
 *    이 배열만 바꾸면 되도록 데이터로 분리했다.
 */
const tabs: TabItem[] = [
  {
    label: '홈',
    path: '/',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 9.5V21h14V9.5" />
      </svg>
    ),
  },
  {
    label: '일정',
    path: '/schedules',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    label: '프로젝트',
    path: '/projects',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"
        />
      </svg>
    ),
  },
  {
    label: '더보기',
    path: '/more',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="5" cy="12" r="1.6" />
        <circle cx="12" cy="12" r="1.6" />
        <circle cx="19" cy="12" r="1.6" />
      </svg>
    ),
  },
];

/**
 * 현재 경로가 탭에 해당하는지 판단.
 * 홈(/)은 정확히 일치할 때만, 나머지는 경로 시작 매칭(상세 페이지 포함).
 */
const isActive = (path: string, pathname: string): boolean =>
  path === '/' ? pathname === '/' : pathname.startsWith(path);

const BottomTabBar: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <nav className="flex-none flex border-t border-gray-200 bg-white pt-2 pb-5">
      {tabs.map((tab) => {
        const active = isActive(tab.path, pathname);
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex-1 flex flex-col items-center gap-1 py-2 ${
              active ? 'text-primary-500' : 'text-gray-400'
            }`}
          >
            {tab.icon}
            <span className={`text-xs ${active ? 'font-bold' : 'font-semibold'}`}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomTabBar;
