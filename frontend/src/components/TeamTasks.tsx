import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getTodayTeamTasks, TodayTeamTaskGroup, TodayTeamTaskResponse } from '../api/calendar';

/**
 * TeamTasks 컴포넌트
 * 
 * 기능:
 * 1. 오늘 팀원 일정 목록 표시
 * 2. 팀원별 아코디언으로 일정 그룹화
 * 3. 프로젝트 색상 기반 점 표시
 * 4. 스크롤 가능한 목록
 */
const TeamTasks: React.FC = () => {
  const [taskGroups, setTaskGroups] = useState<TodayTeamTaskGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedUserIds, setExpandedUserIds] = useState<Set<number>>(new Set());
  const today = new Date();

  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        const data = await getTodayTeamTasks(today);
        setTaskGroups(data);
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

  /**
   * 팀원 아코디언 토글 핸들러
   */
  const handleToggleMember = (userId: number) => {
    setExpandedUserIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4">👥 팀원 오늘 일정</h2>
      
      {loading && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          로딩 중...
        </div>
      )}

      {!loading && taskGroups.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          오늘 팀원 일정이 없습니다.
        </div>
      )}

      {!loading && taskGroups.length > 0 && (
        <div className="max-h-[100%] overflow-y-auto space-y-3 min-h-0">
          {taskGroups.map((group) => {
            const isExpanded = expandedUserIds.has(group.userId);
            
            return (
              <div
                key={group.userId}
                className="rounded-lg bg-white border border-gray-200 overflow-hidden"
              >
                {/* 팀원 카드 헤더 (클릭 가능) */}
                <div
                  onClick={() => handleToggleMember(group.userId)}
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToggleMember(group.userId);
                    }
                  }}
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">
                        {group.memberName}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({group.tasks.length}개)
                      </span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        isExpanded ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* 일정 목록 (아코디언 내용) */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    {group.tasks.map((task, index) => (
                      <div
                        key={`${group.userId}-${task.scheduleTitle}-${index}`}
                        className="p-4 pl-6 bg-gray-50"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: getProjectColor(task.projectColorCode),
                            }}
                          />
                          <span className="text-sm font-medium text-gray-800">
                            {task.projectTitle}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 pl-5">
                          {task.scheduleTitle}
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

export default TeamTasks;

