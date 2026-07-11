import React, { useMemo, useState } from 'react';
import {
  addDays,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ProjectCalendarWithSchedulesResponse } from '../api/calendar';

/**
 * DashboardCalendar — 데스크톱 대시보드 전용 월간 캘린더 (조회용).
 *
 * 설계 (모바일 `ui/Calendar`의 dot 방식을 계승하고 데스크톱용으로 확장):
 * - **점(dot) = 일정**, **점 색 = 그 일정이 속한 프로젝트**. 격자엔 점만 둬서 깔끔하게.
 *   (일정은 항상 프로젝트 색을 물려받으므로 둘을 따로 그릴 필요가 없다.)
 * - 캘린더 아래 **프로젝트 범례** — 이번 달 프로젝트를 색·이름·기간으로 나열.
 *   범례를 클릭하면 그 프로젝트 일정이 있는 날만 선명하게, 나머진 흐리게(필터).
 * - 날짜를 클릭하면 부모가 그 날 일정 목록을 옆 패널에 펼친다.
 *
 * 무스크롤 대시보드에 맞춰 카드가 높이를 꽉 채우도록(flex) 구성한다.
 */

const DEFAULT_COLOR = '#0B4EC4';
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** "yyyy-MM-dd" → 로컬 자정 Date (시간대 오프바이원 방지). */
function toDay(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** day(자정)가 [start, end] 구간을 포함하는지. */
function covers(day: Date, start: string, end: string): boolean {
  const t = day.getTime();
  return toDay(start).getTime() <= t && t <= toDay(end).getTime();
}

interface ProjectDot {
  id: number;
  name: string;
  color: string;
}

interface DashboardCalendarProps {
  /** 보고 있는 달(그 달의 아무 날짜여도 됨). */
  viewDate: Date;
  /** 선택된 날짜(옆 패널이 이 날 일정을 보여줌). */
  selectedDate: Date;
  /** 이 달 그리드 범위에 걸치는 프로젝트 + 일정. */
  projects: ProjectCalendarWithSchedulesResponse[];
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

const DashboardCalendar: React.FC<DashboardCalendarProps> = ({
  viewDate,
  selectedDate,
  projects,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday,
}) => {
  // 범례 필터: 선택된 프로젝트 id(다시 누르면 해제).
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const today = new Date();

  // 6주(42칸) 그리드. 일요일 시작.
  const cells = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 0 });
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [viewDate]);

  /** 그 날 일정을 가진 프로젝트들(점 색 소스). 프로젝트 단위로 중복 제거. */
  const projectsOnDay = (day: Date): ProjectDot[] =>
    projects
      .filter((p) => p.schedules.some((s) => covers(day, s.startDate, s.endDate)))
      .map((p) => ({
        id: p.project.id,
        name: p.project.name,
        color: p.project.colorCode || DEFAULT_COLOR,
      }));

  const filtering = activeProjectId !== null;

  const toggleFilter = (projectId: number) => {
    setActiveProjectId((cur) => (cur === projectId ? null : projectId));
  };

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow">
      {/* 상단: 월 + 네비 */}
      <div className="flex flex-none items-center gap-3 px-5 pb-2 pt-4">
        <span className="text-lg font-extrabold tracking-tight tabular-nums text-gray-900">
          {format(viewDate, 'yyyy년 M월')}
        </span>
        <div className="ml-auto flex gap-1.5">
          <NavButton label="이전 달" onClick={onPrevMonth}>‹</NavButton>
          <button
            type="button"
            onClick={onToday}
            className="h-8 rounded-lg border border-gray-300 px-3 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-50"
          >
            오늘
          </button>
          <NavButton label="다음 달" onClick={onNextMonth}>›</NavButton>
        </div>
      </div>

      {/* 요일 + 날짜 그리드 */}
      <div className="flex min-h-0 flex-1 flex-col px-4">
        <div className="grid flex-none grid-cols-7">
          {WEEKDAYS.map((w, i) => (
            <span
              key={w}
              className={`pb-1.5 pt-0.5 text-center text-xs font-extrabold ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-primary-500' : 'text-gray-400'
              }`}
            >
              {w}
            </span>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-7 gap-1">
          {cells.map((day) => {
            const inMonth = isSameMonth(day, viewDate);
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDate);
            const isSunday = day.getDay() === 0;
            const dots = inMonth ? projectsOnDay(day) : [];
            const matches = filtering && dots.some((d) => d.id === activeProjectId);

            return (
              <button
                key={day.toISOString()}
                type="button"
                disabled={!inMonth}
                onClick={() => onSelectDate(day)}
                className={[
                  'flex flex-col items-center gap-1 rounded-xl border-[1.5px] pt-1.5 transition-colors',
                  !inMonth ? 'pointer-events-none' : 'hover:bg-gray-50',
                  isSelected && isToday
                    ? 'border-primary-700 bg-primary-600'
                    : isToday
                    ? 'border-transparent bg-primary-500'
                    : isSelected
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-transparent',
                  filtering && inMonth && !matches ? 'opacity-40' : 'opacity-100',
                ].join(' ')}
              >
                <span
                  className={[
                    'text-sm tabular-nums',
                    isToday ? 'font-extrabold text-white' : 'font-semibold',
                    !isToday && !inMonth ? 'text-gray-300' : '',
                    !isToday && inMonth && isSunday ? 'text-red-500' : '',
                    !isToday && inMonth && !isSunday ? 'text-gray-800' : '',
                  ].join(' ')}
                >
                  {day.getDate()}
                </span>
                <span className="flex h-[7px] items-center gap-[3px]">
                  {dots.slice(0, 3).map((d) => (
                    <span
                      key={d.id}
                      className="block h-[7px] w-[7px] rounded-full transition-opacity"
                      style={{
                        backgroundColor: d.color,
                        opacity: filtering && d.id !== activeProjectId ? 0.15 : 1,
                        boxShadow: isToday ? '0 0 0 1.5px rgba(255,255,255,.55)' : undefined,
                      }}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/*
        범례 (이번 달 프로젝트 + 필터)
        - 프로젝트 수와 무관하게 **한 줄 고정 높이** + 가로 스크롤.
          (flex-wrap이면 프로젝트가 많을수록 여러 줄로 쌓여 위 캘린더 높이를 달마다 밀어냄)
      */}
      <div className="flex flex-none items-center gap-2 border-t border-gray-200 px-4 py-3">
        <span className="flex-none text-xs font-extrabold text-gray-400">이번 달 프로젝트</span>
        {projects.length === 0 ? (
          <span className="text-xs font-semibold text-gray-400">이 달에 진행 중인 프로젝트가 없어요</span>
        ) : (
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {projects.map((p) => {
              const color = p.project.colorCode || DEFAULT_COLOR;
              const active = activeProjectId === p.project.id;
              return (
                <button
                  key={p.project.id}
                  type="button"
                  onClick={() => toggleFilter(p.project.id)}
                  style={{ color }}
                  className={`inline-flex flex-none items-center gap-2 whitespace-nowrap rounded-full border bg-white py-1 pl-2.5 pr-3 text-xs font-extrabold transition-shadow ${
                    active
                      ? 'border-current shadow-[inset_0_0_0_1px_currentColor]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-gray-900">{p.project.name}</span>
                  <span className="font-bold text-gray-400 tabular-nums">
                    {format(toDay(p.project.startDate), 'M.d')}–{format(toDay(p.project.endDate), 'M.d')}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

const NavButton: React.FC<{ label: string; onClick: () => void; children: React.ReactNode }> = ({
  label,
  onClick,
  children,
}) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-base font-bold text-gray-600 transition-colors hover:bg-gray-50"
  >
    {children}
  </button>
);

export default DashboardCalendar;
