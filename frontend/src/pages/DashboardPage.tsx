import React from 'react';
import Calendar from '../components/Calendar';
import MyTasks from '../components/MyTasks';
import TeamTasks from '../components/TeamTasks';
import MobileHomePage from './MobileHomePage';
import { useIsMobile } from '../hooks/useMediaQuery';

/**
 * 대시보드 페이지 (홈, 라우트 "/")
 *
 * - 모바일: 전용 홈 화면(`MobileHomePage`) — 인사·요약·오늘 일정·팀원 + 사진 올리기.
 * - 데스크톱: 캘린더(좌 65%) + My Tasks·팀원 일정(우 35%).
 *
 * 페이지 로직/데이터는 각 화면이 공유 API를 쓰고, 레이아웃만 뷰포트로 분기한다.
 */
const DashboardPage: React.FC = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileHomePage />;
  }

  return (
    <div className="h-full p-6">
      <div className="flex gap-6 h-full">
        {/* 캘린더 영역 - 좌측 65% */}
        <div className="flex-1" style={{ flexBasis: '65%' }}>
          <Calendar />
        </div>

        {/* 우측 영역 - 35% */}
        <div className="flex-1 flex flex-col gap-6" style={{ flexBasis: '35%' }}>
          {/* My Tasks 영역 - 상단 50% */}
          <div className="flex-1 min-h-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <MyTasks />
          </div>

          {/* 팀원 오늘 일정 영역 - 하단 50% */}
          <div className="flex-1 min-h-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <TeamTasks />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
