import React, { useState, useEffect } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { getMyTasks, ProjectTaskGroup } from '../api/calendar';

/**
 * MyTasks 컴포넌트
 * 
 * 기능:
 * 1. 이번달 내 할 일 목록 표시
 * 2. 프로젝트별로 그룹화하여 아코디언 형태로 표시
 * 3. 프로젝트 색상 기반 배경색 적용
 * 4. 스크롤 가능한 목록
 */
const MyTasks: React.FC = () => {
  const [taskGroups, setTaskGroups] = useState<ProjectTaskGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<number>>(new Set());
  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        const data = await getMyTasks(monthStart, monthEnd);
        setTaskGroups(data);
        // 모든 프로젝트를 기본적으로 펼침
        setExpandedProjectIds(new Set(data.map(group => group.projectId)));
      } catch (error) {
        console.error('할 일 목록 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  /**
   * 프로젝트 아코디언 토글 핸들러
   * @param projectId 프로젝트 ID
   */
  const handleToggleProject = (projectId: number) => {
    setExpandedProjectIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  /**
   * 색상 코드를 연하게 변환 (투명도 추가)
   * @param colorCode HEX 색상 코드 (예: #3b82f6)
   * @returns rgba 형식의 연한 색상
   */
  const getLightBackgroundColor = (colorCode: string | null): string => {
    if (!colorCode) {
      return 'rgba(59, 130, 246, 0.1)'; // 기본 파란색 연하게
    }

    // HEX를 RGB로 변환
    const hex = colorCode.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // 투명도 0.1로 연하게
    return `rgba(${r}, ${g}, ${b}, 0.1)`;
  };

  /**
   * 날짜 포맷팅 (yyyy-MM-dd -> yyyy.MM.dd)
   */
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return format(date, 'yyyy.MM.dd');
  };

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">✅ 이번달 내 할 일</h2>
      
      {loading && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          로딩 중...
        </div>
      )}

      {!loading && taskGroups.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          이번달 할 일이 없습니다.
        </div>
      )}

      {!loading && taskGroups.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
          {taskGroups.map((group) => {
            const isExpanded = expandedProjectIds.has(group.projectId);
            const backgroundColor = getLightBackgroundColor(group.colorCode);

            return (
              <div key={group.projectId} className="rounded-lg w-full overflow-hidden">
                {/* 프로젝트 카드 (클릭 가능) */}
                <div
                  onClick={() => handleToggleProject(group.projectId)}
                  className="p-4 cursor-pointer transition-colors hover:opacity-80"
                  style={{ backgroundColor }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">
                        {group.projectTitle}
                      </span>
                      <span className="text-sm text-gray-600">
                        ({group.tasks.length}개)
                      </span>
                    </div>
                    <span className="text-gray-600">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                {/* 일정 목록 (아코디언) */}
                {isExpanded && (
                  <div className="pl-4 pr-4 pb-4 space-y-2">
                    {group.tasks.map((task) => (
                      <div
                        key={task.scheduleId}
                        className="rounded-lg p-3 ml-4 bg-white border border-gray-200"
                      >
                        {/* 첫 번째 줄: 스케줄 이름 [스케줄 타입] */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-gray-900">{task.scheduleTitle}</span>
                          <span className="text-sm text-gray-600">
                            [{task.scheduleType}]
                          </span>
                        </div>

                        {/* 두 번째 줄: 시작일 ~ 종료일 */}
                        <div className="text-sm text-gray-600">
                          {formatDate(task.scheduleStartDate)} ~ {formatDate(task.scheduleEndDate)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTasks;

