import React, { useState, useEffect } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  format,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  isAfter,
  isBefore,
  isEqual,
} from 'date-fns';
import { 
  getProjectsByPeriod, 
  getProjectsByPeriodWithSchedules, 
  getSchedulesByPeriod,
  ProjectCalendarResponse,
  ProjectCalendarWithSchedulesResponse,
  ScheduleCalendarResponse,
} from '../api/calendar';

/**
 * 캘린더 모드 타입
 */
export type CalendarMode = 'PROJECT' | 'PROJECT_WITH_TASK' | 'BASE_TODO';

/**
 * Calendar 컴포넌트
 * 
 * 기능:
 * 1. 월간 캘린더 보기 (Month View)
 * 2. 이전/다음 월 네비게이션
 * 3. 토글 모드 (프로젝트 / 프로+일정 / 기본일정)
 * 4. 오늘 날짜 강조 표시
 * 5. 프로젝트 바 및 일정 렌더링
 */
const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [mode, setMode] = useState<CalendarMode>('PROJECT');
  const [loading, setLoading] = useState<boolean>(false);
  
  // 데이터 상태
  const [projects, setProjects] = useState<ProjectCalendarResponse[]>([]);
  const [projectsWithSchedules, setProjectsWithSchedules] = useState<ProjectCalendarWithSchedulesResponse[]>([]);
  const [baseSchedules, setBaseSchedules] = useState<ScheduleCalendarResponse[]>([]);

  // 현재 월의 시작일과 종료일
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // 캘린더에 표시할 시작일과 종료일 (주 단위로 맞추기 위해)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // 일요일 시작
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  // 데이터 로딩
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (mode === 'PROJECT') {
          const data = await getProjectsByPeriod(monthStart, monthEnd);
          setProjects(data);
        } else if (mode === 'PROJECT_WITH_TASK') {
          const data = await getProjectsByPeriodWithSchedules(monthStart, monthEnd);
          setProjectsWithSchedules(data);
        } else if (mode === 'BASE_TODO') {
          const data = await getSchedulesByPeriod(monthStart, monthEnd);
          setBaseSchedules(data);
        }
      } catch (error) {
        console.error('캘린더 데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // currentDate를 문자열로 변환하여 의존성 배열에 추가 (Date 객체의 참조 변경 문제 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, format(currentDate, 'yyyy-MM')]);

  // 캘린더에 표시할 모든 날짜 생성
  const calendarDays: Date[] = [];
  const currentDay = new Date(calendarStart);
  while (currentDay <= calendarEnd) {
    calendarDays.push(new Date(currentDay));
    currentDay.setDate(currentDay.getDate() + 1);
  }


  // 날짜가 프로젝트 기간 내에 있는지 확인
  const isDateInProjectRange = (date: Date, startDateStr: string, endDateStr: string): boolean => {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    // 날짜 비교를 위해 시간 부분 제거
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    return (
      (isEqual(dateOnly, startDateOnly) || isAfter(dateOnly, startDateOnly)) &&
      (isEqual(dateOnly, endDateOnly) || isBefore(dateOnly, endDateOnly))
    );
  };

  // 특정 날짜에 해당하는 프로젝트/일정 가져오기
  const getItemsForDate = (date: Date) => {
    if (mode === 'PROJECT') {
      return projects.filter((project) =>
        isDateInProjectRange(date, project.startDate, project.endDate)
      );
    } else if (mode === 'PROJECT_WITH_TASK') {
      const items: Array<{ type: 'project' | 'schedule'; data: any }> = [];
      projectsWithSchedules.forEach((projectWithSchedule) => {
        const { project, schedules } = projectWithSchedule;
        if (isDateInProjectRange(date, project.startDate, project.endDate)) {
          items.push({ type: 'project', data: project });
        }
        schedules.forEach((schedule) => {
          if (isDateInProjectRange(date, schedule.startDate, schedule.endDate)) {
            items.push({ type: 'schedule', data: schedule });
          }
        });
      });
      return items;
    } else if (mode === 'BASE_TODO') {
      return baseSchedules.filter((schedule) =>
        isDateInProjectRange(date, schedule.startDate, schedule.endDate)
      );
    }
    return [];
  };

  // 이전 월로 이동
  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  // 다음 월로 이동
  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // 토글 모드
  const modes: { id: CalendarMode; label: string }[] = [
    { id: 'PROJECT', label: '프로젝트' },
    { id: 'PROJECT_WITH_TASK', label: '프로젝트 일정' },
    { id: 'BASE_TODO', label: '기본일정' },
  ];

  // 요일 헤더
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col">
      {/* 헤더: 월 표시 + 네비게이션 + 토글 모드 */}
      <div className="flex justify-between items-center mb-4">
        {/* 월 표시 + 네비게이션 */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="이전 월"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-xl font-bold">
            {format(currentDate, 'yyyy년 M월')}
          </h3>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="다음 월"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* 토글 모드 */}
        <div className="flex gap-2">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                mode === m.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* 캘린더 그리드 */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        )}
        
        {!loading && (
          <>
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 border border-gray-200 border-b-0">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="bg-gray-100 py-2 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 border border-gray-200">
              {calendarDays.map((day: Date) => {
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isTodayDate = isToday(day);
                const items = getItemsForDate(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`
                      bg-white min-h-[100px] p-2 relative border-r border-b border-gray-200
                      ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                      ${isTodayDate ? 'bg-blue-50' : ''}
                    `}
                  >
                    {/* 날짜 표시 */}
                    <div
                      className={`
                        text-sm font-medium mb-1
                        ${isTodayDate ? 'text-blue-600' : ''}
                      `}
                    >
                      {format(day, 'd')}
                    </div>

                    {/* 프로젝트/일정 영역 */}
                    <div className="space-y-1 mt-1 -mx-2">
                      {mode === 'PROJECT' &&
                        (items as ProjectCalendarResponse[]).map((project) => {
                          const startDate = new Date(project.startDate);
                          const endDate = new Date(project.endDate);
                          const dayStr = format(day, 'yyyy-MM-dd');
                          const startDateStr = format(startDate, 'yyyy-MM-dd');
                          const endDateStr = format(endDate, 'yyyy-MM-dd');
                          
                          const isStart = dayStr === startDateStr;
                          const isEnd = dayStr === endDateStr;
                          const isOnlyOneDay = isStart && isEnd;
                          
                          // 둥근 모서리 결정
                          let roundedClass = 'rounded-none'; // 기본: 직사각형
                          if (isOnlyOneDay) {
                            roundedClass = 'rounded'; // 하루짜리: 모든 모서리
                          } else if (isStart) {
                            roundedClass = 'rounded-l'; // 시작일: 왼쪽만
                          } else if (isEnd) {
                            roundedClass = 'rounded-r'; // 종료일: 오른쪽만
                          }
                          
                          return (
                            <div
                              key={project.id}
                              className={`h-5 ${roundedClass} text-xs px-2 flex items-center truncate`}
                              style={{
                                backgroundColor: project.colorCode || '#3b82f6',
                                color: 'white',
                              }}
                              title={project.name}
                            >
                              {(isStart || isEnd) && project.name}
                            </div>
                          );
                        })}

                      {mode === 'PROJECT_WITH_TASK' &&
                        (items as Array<{ type: 'project' | 'schedule'; data: any }>).map((item, index) => {
                          if (item.type === 'project') {
                            const project = item.data as ProjectCalendarResponse;
                            const startDate = new Date(project.startDate);
                            const endDate = new Date(project.endDate);
                            const dayStr = format(day, 'yyyy-MM-dd');
                            const startDateStr = format(startDate, 'yyyy-MM-dd');
                            const endDateStr = format(endDate, 'yyyy-MM-dd');
                            
                            const isStart = dayStr === startDateStr;
                            const isEnd = dayStr === endDateStr;
                            const isOnlyOneDay = isStart && isEnd;
                            
                            // 둥근 모서리 결정
                            let roundedClass = 'rounded-none'; // 기본: 직사각형
                            if (isOnlyOneDay) {
                              roundedClass = 'rounded'; // 하루짜리: 모든 모서리
                            } else if (isStart) {
                              roundedClass = 'rounded-l'; // 시작일: 왼쪽만
                            } else if (isEnd) {
                              roundedClass = 'rounded-r'; // 종료일: 오른쪽만
                            }
                            
                            return (
                              <div
                                key={`project-${project.id}`}
                                className={`h-4 ${roundedClass} text-xs px-2 flex items-center truncate`}
                                style={{
                                  backgroundColor: project.colorCode || '#3b82f6',
                                  color: 'white',
                                }}
                                title={project.name}
                              >
                                {isStart && `█ ${project.name}`}
                              </div>
                            );
                          } else {
                            const schedule = item.data as ScheduleCalendarResponse;
                            return (
                              <div
                                key={`schedule-${schedule.scheduleId}`}
                                className="text-xs truncate"
                                title={schedule.title}
                              >
                                ✓ {schedule.title}
                              </div>
                            );
                          }
                        })}

                      {mode === 'BASE_TODO' &&
                        (items as ScheduleCalendarResponse[]).map((schedule) => (
                          <div
                            key={schedule.scheduleId}
                            className="text-xs truncate"
                            title={schedule.title}
                          >
                            ● {schedule.title}
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Calendar;
