import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import DashboardCalendar from '../components/DashboardCalendar';
import MobileHomePage from './MobileHomePage';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useAuthStore } from '../stores/authStore';
import {
  getProjectsByPeriodWithSchedules,
  getTodayTeamTasks,
  ProjectCalendarWithSchedulesResponse,
  TodayTeamTaskGroup,
} from '../api/calendar';

/**
 * 대시보드 페이지 (홈, 라우트 "/")
 *
 * - 모바일: 전용 홈 화면(`MobileHomePage`).
 * - 데스크톱: **관리자 상황판** — 한 화면(무스크롤)에 아래 3블록:
 *   1. 요약 KPI 4칸(컴팩트)
 *   2. 캘린더(프로젝트 범례·필터) + 선택한 날 일정
 *   3. 오늘 팀원 현황
 *
 * 데이터: `getProjectsByPeriodWithSchedules`(캘린더·일정·KPI) + `getTodayTeamTasks`(팀원).
 * "점=일정, 색=프로젝트" 규칙이라 일정은 프로젝트 색을 물려받는다.
 */

const DEFAULT_COLOR = '#0B4EC4';
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** "yyyy-MM-dd" → 로컬 자정 Date. */
function toDay(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 일정 구간이 특정 날짜를 포함하는지. */
function coversDay(day: Date, start: string, end: string): boolean {
  const t = day.getTime();
  return toDay(start).getTime() <= t && t <= toDay(end).getTime();
}

/** 일정 구간이 [from, to] 구간과 겹치는지. */
function overlapsRange(from: Date, to: Date, start: string, end: string): boolean {
  return toDay(start).getTime() <= to.getTime() && toDay(end).getTime() >= from.getTime();
}

/** 프로젝트 그룹을 일정 단건으로 펼친 형태(일정은 프로젝트 색·이름을 물려받음). */
interface FlatSchedule {
  id: number;
  title: string;
  projectName: string;
  color: string;
  start: string;
  end: string;
}

const DesktopDashboard: React.FC = () => {
  const navigate = useNavigate();
  const isAdmin = useAuthStore((state) => state.user?.role === 'ADMIN');

  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState<Date>(today); // 캘린더가 보는 달
  const [selectedDate, setSelectedDate] = useState<Date>(today); // 옆 패널이 보여주는 날
  const [data, setData] = useState<ProjectCalendarWithSchedulesResponse[]>([]);
  const [team, setTeam] = useState<TodayTeamTaskGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // 보고 있는 달의 그리드 전체 범위(앞뒤 달 포함)를 조회.
  useEffect(() => {
    let alive = true;
    const gridStart = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 0 });
    const gridEnd = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 0 });
    setLoading(true);
    getProjectsByPeriodWithSchedules(gridStart, gridEnd)
      .then((res) => alive && setData(res))
      .catch((e) => console.error('대시보드 프로젝트 로딩 실패:', e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [viewDate]);

  // 팀원 오늘 일정은 달과 무관하게 오늘 기준 1회.
  useEffect(() => {
    let alive = true;
    getTodayTeamTasks(today)
      .then((res) => alive && setTeam(res))
      .catch((e) => console.error('대시보드 팀원 로딩 실패:', e));
    return () => {
      alive = false;
    };
  }, [today]);

  // 모든 프로젝트 일정을 단건으로 펼침(KPI·선택일 목록 공용).
  const schedules = useMemo<FlatSchedule[]>(
    () =>
      data.flatMap((p) =>
        p.schedules.map((s) => ({
          id: s.scheduleId,
          title: s.title,
          projectName: p.project.name,
          color: p.project.colorCode || DEFAULT_COLOR,
          start: s.startDate,
          end: s.endDate,
        }))
      ),
    [data]
  );

  // KPI
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
  const todayCount = schedules.filter((s) => coversDay(today, s.start, s.end)).length;
  const weekCount = schedules.filter((s) => overlapsRange(weekStart, weekEnd, s.start, s.end)).length;
  const inProgressCount = data.filter((p) => p.project.status === 'IN_PROGRESS').length;
  const workingCount = team.filter((m) => m.tasks.length > 0).length;

  // 선택한 날 일정
  const selectedSchedules = useMemo(
    () =>
      schedules
        .filter((s) => coversDay(selectedDate, s.start, s.end))
        .sort((a, b) => a.start.localeCompare(b.start)),
    [schedules, selectedDate]
  );

  const selLabel = `${format(selectedDate, 'M월 d일')} (${WEEKDAYS[selectedDate.getDay()]})`;

  return (
    <div className="mx-auto flex h-full w-full max-w-[1200px] flex-col gap-4 overflow-hidden px-8 py-6">
      {/* KPI 요약 (컴팩트) */}
      <div className="grid flex-none grid-cols-4 gap-3.5">
        <Kpi n={todayCount} label="오늘 일정" icon="calendar" />
        <Kpi n={weekCount} label="이번 주 일정" icon="week" />
        <Kpi n={inProgressCount} label="진행 중 프로젝트" icon="folder" />
        <Kpi n={workingCount} suffix="명" label="오늘 근무 팀원" icon="users" />
      </div>

      {/* 캘린더 + 선택일 일정 + 팀원 */}
      <div className="grid min-h-0 flex-1 gap-5" style={{ gridTemplateColumns: '1.65fr 1fr' }}>
        <DashboardCalendar
          viewDate={viewDate}
          selectedDate={selectedDate}
          projects={data}
          onSelectDate={setSelectedDate}
          onPrevMonth={() => setViewDate((d) => subMonths(d, 1))}
          onNextMonth={() => setViewDate((d) => addMonths(d, 1))}
          onToday={() => {
            setViewDate(today);
            setSelectedDate(today);
          }}
        />

        <div className="flex min-h-0 flex-col gap-5">
          {/* 이 날 일정 */}
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-white shadow">
            <div className="flex flex-none items-baseline justify-between px-5 pb-1.5 pt-4">
              <h2 className="text-base font-extrabold tracking-tight text-gray-900">
                {selLabel} <span className="text-gray-400">· {selectedSchedules.length}건</span>
              </h2>
              <button onClick={() => navigate('/schedules')} className="text-xs font-extrabold text-primary-600">
                전체 ›
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
              {selectedSchedules.length === 0 ? (
                <EmptyBox text={loading ? '불러오는 중…' : '이 날은 일정이 없어요'} />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {selectedSchedules.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => navigate(`/schedules/${s.id}`)}
                      className="flex items-stretch overflow-hidden rounded-xl border border-gray-100 bg-white text-left transition-colors hover:border-gray-300"
                    >
                      <span className="w-1.5 flex-none" style={{ backgroundColor: s.color }} />
                      <span className="min-w-0 flex-1 px-3.5 py-3">
                        <span className="block truncate text-[15px] font-extrabold tracking-tight text-gray-900">
                          {s.title}
                        </span>
                        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-extrabold text-gray-600">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                          {s.projectName}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 오늘 팀원 현황 */}
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-white shadow">
            <div className="flex flex-none items-baseline justify-between px-5 pb-1.5 pt-4">
              <h2 className="text-base font-extrabold tracking-tight text-gray-900">오늘 팀원 현황</h2>
              {isAdmin && (
                <button onClick={() => navigate('/admin/users')} className="text-xs font-extrabold text-primary-600">
                  사원 ›
                </button>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3">
              {team.length === 0 ? (
                <EmptyBox text={loading ? '불러오는 중…' : '오늘 팀원 일정이 없어요'} />
              ) : (
                <div className="flex flex-col">
                  {team.map((m, i) => {
                    const first = m.tasks[0];
                    const color = first?.projectColorCode || DEFAULT_COLOR;
                    return (
                      <div
                        key={m.userId}
                        className={`flex items-center gap-3 py-2.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}
                      >
                        <span
                          className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-[15px] font-extrabold text-white"
                          style={{ backgroundColor: color }}
                        >
                          {m.memberName.charAt(0)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14.5px] font-extrabold text-gray-900">{m.memberName}</span>
                          <span className="block truncate text-[13px] font-medium text-gray-500">
                            {first ? (
                              <>
                                <b className="font-extrabold text-gray-800">{first.projectTitle}</b> · {first.scheduleTitle}
                              </>
                            ) : (
                              '배정된 일정 없음'
                            )}
                          </span>
                        </span>
                        {m.tasks.length > 0 && (
                          <span className="flex-none rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-extrabold text-gray-600 tabular-nums">
                            {m.tasks.length}건
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

/* ---- 내부 컴포넌트 ---- */

const KPI_ICONS: Record<string, React.ReactNode> = {
  calendar: <path d="M8 7V3m8 4V3M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  week: <path d="M3 6h18M3 12h18M3 18h18" />,
  folder: <path d="M9 12h6m-6 4h6M7 3h6l6 6v10a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />,
  users: <path d="M17 20h5v-1a4 4 0 00-3-3.9M9 20H2v-1a6 6 0 0112 0v1zm3-12a4 4 0 11-8 0 4 4 0 018 0z" />,
};

/** 컴팩트 KPI — 아이콘 · 숫자 · 라벨을 가로 한 줄로. */
const Kpi: React.FC<{ n: number; label: string; icon: string; suffix?: string }> = ({
  n,
  label,
  icon,
  suffix,
}) => (
  <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow">
    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-primary-50 text-primary-600">
      <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        {KPI_ICONS[icon]}
      </svg>
    </span>
    <div className="flex min-w-0 flex-col gap-0.5">
      <div className="text-xl font-extrabold leading-none tracking-tight text-gray-900 tabular-nums">
        {n}
        {suffix && <span className="ml-0.5 text-sm font-bold text-gray-400">{suffix}</span>}
      </div>
      <div className="text-xs font-bold text-gray-500">{label}</div>
    </div>
  </div>
);

const EmptyBox: React.FC<{ text: string }> = ({ text }) => (
  <div className="mt-2 rounded-xl border border-dashed border-gray-300 py-8 text-center text-sm font-semibold text-gray-400">
    {text}
  </div>
);

const DashboardPage: React.FC = () => {
  const isMobile = useIsMobile();
  return isMobile ? <MobileHomePage /> : <DesktopDashboard />;
};

export default DashboardPage;
