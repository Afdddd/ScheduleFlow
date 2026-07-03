import React from 'react';
import BottomTabBar from './BottomTabBar';

interface MobileLayoutProps {
  children: React.ReactNode;
}

/**
 * MobileLayout — 모바일 전용 레이아웃 골격.
 *
 * 데스크톱 `Layout`(Header + Sidebar) 대신 모바일에서 쓰인다.
 * 구조: 스크롤되는 콘텐츠 영역 + 하단 고정 탭바.
 *
 * 설계 포인트:
 * - 세로 flex 컬럼. 콘텐츠(main)만 스크롤하고 탭바는 flex-none으로 항상 하단 고정.
 * - 탭바를 `fixed`가 아니라 flex 자식으로 둬서 콘텐츠와 겹칠 걱정이 없다.
 * - 페이지 내용 자체의 모바일 대응은 각 페이지에서 (기능명세 이후) 진행.
 *   이 컴포넌트는 "껍데기"만 책임진다.
 */
const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <main className="flex-1 overflow-y-auto">{children}</main>
      <BottomTabBar />
    </div>
  );
};

export default MobileLayout;
