import React, { useState } from 'react';
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
} from 'date-fns';
import { ko } from 'date-fns/locale';

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
 * 
 * 설계 포인트:
 * 
 * 1. **날짜 계산**
 *    - date-fns를 사용하여 월의 첫날, 마지막날, 주의 시작/끝 계산
 *    - eachDayOfInterval로 캘린더에 표시할 모든 날짜 생성
 * 
 * 2. **레이아웃**
 *    - CSS Grid로 7열 (일주일) 그리드 구성
 *    - 각 셀은 상대 위치(position: relative)로 프로젝트 바 배치 가능
 * 
 * 3. **토글 모드**
 *    - useState로 현재 모드 관리
 *    - 추후 백엔드 API 연동 시 모드에 따라 다른 데이터 로드
 * 
 * 4. **오늘 날짜 강조**
 *    - isToday 함수로 오늘 날짜 판단
 *    - 파란색 배경으로 시각적 강조
 */
const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [mode, setMode] = useState<CalendarMode>('PROJECT');

  // 현재 월의 시작일과 종료일
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // 캘린더에 표시할 시작일과 종료일 (주 단위로 맞추기 위해)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // 일요일 시작
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  // 캘린더에 표시할 모든 날짜 생성
  const calendarDays: Date[] = [];
  const currentDay = new Date(calendarStart);
  while (currentDay <= calendarEnd) {
    calendarDays.push(new Date(currentDay));
    currentDay.setDate(currentDay.getDate() + 1);
  }

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
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 mb-px">
          {weekDays.map((day) => (
            <div
              key={day}
              className="bg-gray-100 py-2 text-center text-sm font-medium text-gray-700"
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {calendarDays.map((day: Date) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`
                  bg-white min-h-[100px] p-2 relative
                  ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                  ${isTodayDate ? 'bg-blue-50 border-2 border-blue-500' : ''}
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

                {/* 프로젝트/일정 영역 (추후 데이터 연동) */}
                <div className="space-y-1">
                  {/* TODO: 프로젝트 바 또는 일정 아이템 렌더링 */}
                  {/* {mode === 'PROJECT' && day.projects?.map(...)} */}
                  {/* {mode === 'PROJECT_WITH_TASK' && day.projectTodos?.map(...)} */}
                  {/* {mode === 'BASE_TODO' && day.baseTodos?.map(...)} */}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Calendar;

