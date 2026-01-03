import React from 'react';
import Calendar from '../components/Calendar';
import MyTasks from '../components/MyTasks';
import TeamTasks from '../components/TeamTasks';

/**
 * 대시보드 페이지
 * 
 * 레이아웃 구조:
 * - 캘린더 영역: 좌측 65%
 * - 우측 영역: 35%
 *   - 상단: My Tasks (50%)
 *   - 하단: 팀원 오늘 일정 (50%)
 */
const DashboardPage: React.FC = () => {
  return (
    <div className="h-full p-6">
      <div className="flex gap-6 h-full">
        {/* 캘린더 영역 - 좌측 65% */}
        <div className="flex-1" style={{ flexBasis: '65%' }}>
          <Calendar />
        </div>

        {/* 우측 영역 - 60% */}
        <div className="flex-1 flex flex-col gap-6" style={{ flexBasis: '35%' }}>
          {/* My Tasks 영역 - 상단 50% */}
          <div className="flex-1 bg-white rounded-lg shadow p-6">
            <MyTasks />
          </div>

          {/* 팀원 오늘 일정 영역 - 하단 50% */}
          <div className="flex-1 bg-white rounded-lg shadow p-6">
            <TeamTasks />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
