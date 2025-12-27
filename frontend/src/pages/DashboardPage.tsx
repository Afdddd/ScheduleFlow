import React from 'react';

/**
 * 대시보드 페이지
 * 
 * 레이아웃 구조:
 * - 캘린더 영역: 좌측 40%
 * - 우측 영역: 60%
 *   - 상단: My Tasks (50%)
 *   - 하단: 팀원 오늘 일정 (50%)
 */
const DashboardPage: React.FC = () => {
  return (
    <div className="h-full p-6">
      <div className="flex gap-6 h-full">
        {/* 캘린더 영역 - 좌측 40% */}
        <div className="flex-1" style={{ flexBasis: '65%' }}>
          <div className="bg-white rounded-lg shadow p-6 h-full">
            <h2 className="text-xl font-bold mb-4">캘린더</h2>
            <p className="text-gray-500">캘린더가 여기에 표시됩니다.</p>
          </div>
        </div>

        {/* 우측 영역 - 60% */}
        <div className="flex-1 flex flex-col gap-6" style={{ flexBasis: '35%' }}>
          {/* My Tasks 영역 - 상단 50% */}
          <div className="flex-1 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">✅ 이번달 내 할 일</h2>
            <p className="text-gray-500">My Tasks가 여기에 표시됩니다.</p>
          </div>

          {/* 팀원 오늘 일정 영역 - 하단 50% */}
          <div className="flex-1 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">👥 팀원 오늘 일정</h2>
            <p className="text-gray-500">팀원 일정이 여기에 표시됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
