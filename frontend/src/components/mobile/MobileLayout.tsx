import React from 'react';
import BottomTabBar from './BottomTabBar';
import InstallBanner from '../ui/InstallBanner';

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
 * - 셸을 `fixed inset-0`으로 뷰포트에 못 박는다 — h-screen(100vh) 컬럼일 때는
 *   바디가 스크롤/오버스크롤(iOS 고무줄, 키보드 포커스 스크롤)될 수 있어서
 *   셸 전체가 밀리며 하단 탭바가 화면 밖으로 짤리는 문제가 있었다.
 * - main에 overscroll-contain: 내부 스크롤이 끝에 닿아도 바디로 체이닝되지 않게 차단.
 * - 페이지 내용 자체의 모바일 대응은 각 페이지에서 (기능명세 이후) 진행.
 *   이 컴포넌트는 "껍데기"만 책임진다.
 */
const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50">
      <InstallBanner />
      <main className="flex-1 overflow-y-auto overscroll-contain">{children}</main>
      <BottomTabBar />
    </div>
  );
};

export default MobileLayout;
