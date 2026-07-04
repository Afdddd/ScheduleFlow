import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileLayout from './mobile/MobileLayout';
import { useIsMobile } from '../hooks/useMediaQuery';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Layout 컴포넌트 — 보호된 페이지의 공통 셸.
 *
 * 레이아웃 구조 (사이드바 주도):
 * - Sidebar: 왼쪽 전체 높이 고정 컬럼 (로고 + 내비 + 프로필). 고정 너비 (w-64)
 * - 오른쪽 컬럼: 상단 Header(컨텍스트 바) + 그 아래 스크롤되는 Content
 *
 * 설계 포인트:
 *
 * 1. **사이드바 주도 골격**
 *    - 최상위는 수평 flex: [Sidebar | 오른쪽 컬럼]
 *    - 로고·프로필은 사이드바가 소유 → 헤더는 콘텐츠 위 얇은 컨텍스트 바로 축소
 *    - 사이드바 브랜드 영역 높이(h-16)와 헤더 높이(h-16)를 맞춰 상단 라인 정렬
 *
 * 2. **스크롤 처리**
 *    - 오른쪽 컬럼은 flex-col, Content(main)만 overflow-y-auto
 *    - Sidebar와 Header는 고정
 *
 * 3. **반응형 분기 (모바일 전용 레이아웃 분리)**
 *    - 모바일 뷰포트면 사이드바 대신 `MobileLayout`(하단 탭바)을 렌더한다.
 *    - `ProtectedRoute`는 그대로 `<Layout>`을 쓰므로, 분기는 여기 한 곳에만 둔다.
 *    - 페이지·라우팅·store는 데스크톱과 그대로 공유한다.
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar: 전체 높이 좌측 컬럼 */}
      <Sidebar />

      {/* 오른쪽 컬럼: 컨텍스트 바 + 콘텐츠 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
