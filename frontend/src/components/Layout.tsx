import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Layout 컴포넌트
 * 
 * 기능:
 * 1. Header, Sidebar, Content 영역을 포함한 전체 레이아웃 구조
 * 2. 보호된 페이지에서 공통으로 사용되는 레이아웃
 * 
 * 레이아웃 구조:
 * - Header: 상단 고정, 전체 너비
 * - Sidebar: 왼쪽 고정, 고정 너비 (w-64)
 * - Content: 오른쪽 영역, 남은 공간 사용, 스크롤 가능
 * 
 * 설계 포인트:
 * 
 * 1. **Flexbox 레이아웃**
 *    - h-screen: 전체 화면 높이
 *    - flex flex-col: 수직 방향 플렉스
 *    - Header는 flex-shrink-0으로 고정 높이
 *    - 나머지 영역은 flex-1로 남은 공간 차지
 * 
 * 2. **Sidebar + Content 레이아웃**
 *    - flex: 수평 방향으로 Sidebar와 Content 배치
 *    - Sidebar는 고정 너비 (w-64)
 *    - Content는 flex-1로 남은 공간 사용
 * 
 * 3. **스크롤 처리**
 *    - Content 영역만 overflow-y-auto로 스크롤 가능
 *    - Header와 Sidebar는 고정
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <Header />

      {/* Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

