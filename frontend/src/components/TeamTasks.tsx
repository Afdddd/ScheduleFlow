import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getTodayTeamTasks, TodayTeamTaskResponse } from '../api/calendar';

/**
 * TeamTasks 컴포넌트
 * 
 * 기능:
 * 1. 오늘 팀원 일정 목록 표시
 * 2. 각 팀원 일정을 카드 형태로 표시
 * 3. 프로젝트 색상 기반 점 표시
 * 4. 스크롤 가능한 목록
 */
const TeamTasks: React.FC = () => {
  const [tasks, setTasks] = useState<TodayTeamTaskResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const today = new Date();

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        const data = await getTodayTeamTasks(today);
        setTasks(data);
      } catch (error) {
        console.error('팀원 일정 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  /**
   * 프로젝트 색상 코드 가져오기 (기본값: 파란색)
   */
  const getProjectColor = (colorCode: string | null): string => {
    return colorCode || '#3b82f6';
  };

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">👥 팀원 오늘 일정</h2>
      
      {loading && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          로딩 중...
        </div>
      )}

      {!loading && tasks.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          오늘 팀원 일정이 없습니다.
        </div>
      )}

      {!loading && tasks.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-3">
          {tasks.map((task, index) => (
            <div
              key={`${task.memberName}-${task.scheduleTitle}-${index}`}
              className="rounded-lg p-4 w-full bg-white border border-gray-200"
            >
              {/* 첫 번째 줄: 점(프로젝트 색상) + 이름 */}
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: getProjectColor(task.projectColorCode),
                  }}
                />
                <span className="font-semibold text-gray-800">
                  {task.memberName}
                </span>
              </div>

              {/* 두 번째 줄: 프로젝트 + 스케줄 */}
              <div className="text-sm text-gray-600 pl-5">
                {task.projectTitle} {task.scheduleTitle}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamTasks;

