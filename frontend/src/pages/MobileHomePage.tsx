import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  startOfDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
  isAfter,
  isBefore,
} from 'date-fns';
import { useAuthStore } from '../stores/authStore';
import MobileScheduleCreateSheet from './MobileScheduleCreateSheet';
import {
  getMyTasks,
  getTodayTeamTasks,
  MyTaskResponse,
  TodayTeamTaskGroup,
} from '../api/calendar';

/**
 * MobileHomePage — 모바일 전용 홈 화면.
 *
 * 명세 순서(위→아래): 시간대 인사 · 날짜 → 요약 → 오늘 내 일정(전체 보기)
 * → 새 일정(큰 버튼) → 팀원. 플로팅 버튼 = 사진 올리기.
 *
 * 데이터 메모: 일정은 **날짜 구간 기반**(시각·완료상태 필드 없음)이라
 * 목업의 "09:30·진행중/지연"은 구현하지 않고, 오늘 진행 중인 일정을
 * 날짜 기준으로 정직하게 보여준다. (상태 필드는 백엔드 확장 후 반영)
 *
 * 컨셉: "아저씨도 헤매지 않게" — 큰 글씨·큰 버튼·글자 라벨. 대표색 코발트.
 */

const DEFAULT_COLOR = '#0B4EC4';

/** "yyyy-MM-dd" → 로컬 자정 Date (시간대 오프바이원 방지). */
function toDay(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 시간대별 인사말. */
function greetingFor(hour: number): string {
  if (hour < 11) return '좋은 아침이에요';
  if (hour < 17) return '점심 맛있게 드세요';
  return '오늘도 고생하셨어요';
}

/** 프로젝트 그룹을 일정 단건 배열로 펼치고, 색은 태스크→그룹 순으로 채운다. */
type Task = MyTaskResponse & { color: string };

const MobileHomePage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<TodayTeamTaskGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reload, setReload] = useState(0);

  const now = useMemo(() => new Date(), []);
  const today = startOfDay(now);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const [groups, teamGroups] = await Promise.all([
          getMyTasks(startOfMonth(now), endOfMonth(now)),
          getTodayTeamTasks(now),
        ]);
        if (!alive) return;
        setTasks(
          groups.flatMap((g) =>
            g.tasks.map((t) => ({ ...t, color: t.colorCode ?? g.colorCode ?? DEFAULT_COLOR }))
          )
        );
        setTeam(teamGroups);
      } catch (e) {
        console.error('홈 데이터 로딩 실패:', e);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [now, reload]);

  // 오늘 진행 중인 일정 (시작~종료가 오늘을 포함)
  const todayTasks = useMemo(
    () =>
      tasks
        .filter((t) => {
          const s = toDay(t.scheduleStartDate);
          const e = toDay(t.scheduleEndDate);
          return !isAfter(s, today) && !isBefore(e, today); // s <= today <= e
        })
        .sort((a, b) => a.scheduleStartDate.localeCompare(b.scheduleStartDate)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks]
  );

  // 요약 지표 (일정은 상태 필드가 없어 날짜 기준으로 집계)
  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
  const weekCount = tasks.filter((t) => {
    const s = toDay(t.scheduleStartDate);
    const e = toDay(t.scheduleEndDate);
    return !isAfter(s, weekEnd) && !isAfter(weekStart, e); // 구간이 이번 주와 겹침
  }).length;

  const greeting = greetingFor(now.getHours());
  const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const dateLabel = `${now.getMonth() + 1}월 ${now.getDate()}일 ${WEEKDAYS[now.getDay()]}요일`;

  return (
    <div className="min-h-full bg-gray-50 px-[18px] pb-28 pt-2">
      {/* 인사 · 날짜 */}
      <header className="flex items-center gap-3 px-0.5 pt-2">
        <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-md shadow-primary-500/30">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <rect x="3" y="4.5" width="18" height="16.5" rx="3" />
            <path d="M16 2.5v4M8 2.5v4M3 10h18M8.5 15l2.3 2.3 4.2-4.6" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-gray-500">{greeting}</p>
          <p className="mt-0.5 text-[22px] font-extrabold leading-tight tracking-tight text-gray-900">
            <span className="text-primary-600">{user?.username ?? '반갑습니다'}</span>님
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-500">{dateLabel}</p>
        </div>
      </header>

      {/* 요약 */}
      <section className="mt-5 grid grid-cols-3 gap-2.5">
        <StatCard n={todayTasks.length} label="오늘 일정" />
        <StatCard n={weekCount} label="이번 주" />
        <StatCard n={tasks.length} label="이번 달" />
      </section>

      {/* 새 일정 (큰 버튼) */}
      <button
        onClick={() => setSheetOpen(true)}
        className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 py-[18px] text-[18px] font-extrabold tracking-tight text-white shadow-lg shadow-primary-500/30 transition-transform active:scale-[0.99]"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="3" y="4.5" width="18" height="16.5" rx="3" />
          <path d="M16 2.5v4M8 2.5v4M3 10h18M12 13.5v4M10 15.5h4" />
        </svg>
        새 일정 만들기
      </button>

      {/* 오늘 내 일정 */}
      <section className="mt-6">
        <SectionHead title="오늘 내 일정" actionLabel="전체 보기" onAction={() => navigate('/schedules')} />
        {loading ? (
          <LoadingRow />
        ) : todayTasks.length === 0 ? (
          <EmptyBox text="오늘 진행 중인 일정이 없어요" />
        ) : (
          <div className="mt-3 flex flex-col gap-2.5">
            {todayTasks.map((t) => (
              <button
                key={t.scheduleId}
                onClick={() => navigate(`/schedules/${t.scheduleId}`)}
                className="flex w-full items-stretch overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition-transform active:scale-[0.99]"
              >
                <span className="w-1.5 flex-none" style={{ backgroundColor: t.color }} />
                <span className="min-w-0 flex-1 px-4 py-3.5">
                  <span className="block truncate text-[16px] font-bold text-gray-900">{t.scheduleTitle}</span>
                  <span className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[13px] font-bold text-gray-700">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                      {t.projectTitle}
                    </span>
                    <span className="text-[13px] font-semibold text-gray-400 tabular-nums">
                      {format(toDay(t.scheduleStartDate), 'M.d')} – {format(toDay(t.scheduleEndDate), 'M.d')}
                    </span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 팀원 */}
      <section className="mt-6">
        <SectionHead title="지금 팀원들" />
        {loading ? (
          <LoadingRow />
        ) : team.length === 0 ? (
          <EmptyBox text="오늘 팀원 일정이 없어요" />
        ) : (
          <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {team.map((m, i) => {
              const first = m.tasks[0];
              const color = first?.projectColorCode ?? DEFAULT_COLOR;
              return (
                <div
                  key={m.userId}
                  className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}
                >
                  <span
                    className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-[15px] font-extrabold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {m.memberName.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold text-gray-900">{m.memberName}</span>
                    <span className="block truncate text-[13.5px] font-medium text-gray-500">
                      {first ? (
                        <>
                          <b className="font-bold text-gray-800">{first.projectTitle}</b> · {first.scheduleTitle}
                        </>
                      ) : (
                        '일정 없음'
                      )}
                    </span>
                  </span>
                  {m.tasks.length > 0 && (
                    <span className="flex-none text-[13px] font-bold text-gray-400">{m.tasks.length}건</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 사진 올리기 (FAB) */}
      <button
        onClick={() => navigate('/photos')}
        aria-label="사진 올리기"
        className="fixed bottom-24 right-5 z-40 flex items-center gap-2 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 py-[15px] pl-[18px] pr-[22px] text-[16px] font-extrabold text-white shadow-xl shadow-primary-500/40 transition-transform active:scale-95"
      >
        <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
          <circle cx="12" cy="13" r="3.2" />
        </svg>
        사진 올리기
      </button>

      <MobileScheduleCreateSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCreated={() => setReload((r) => r + 1)}
      />
    </div>
  );
};

/* ---- 작은 내부 컴포넌트 ---- */

const StatCard: React.FC<{ n: number; label: string }> = ({ n, label }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="text-[28px] font-extrabold leading-none tracking-tight text-gray-900 tabular-nums">{n}</div>
    <div className="mt-2 text-[13px] font-semibold text-gray-500">{label}</div>
  </div>
);

const SectionHead: React.FC<{ title: string; actionLabel?: string; onAction?: () => void }> = ({
  title,
  actionLabel,
  onAction,
}) => (
  <div className="flex items-baseline justify-between px-0.5">
    <h2 className="text-[18px] font-extrabold tracking-tight text-gray-900">{title}</h2>
    {actionLabel && (
      <button onClick={onAction} className="text-sm font-bold text-primary-600">
        {actionLabel} ›
      </button>
    )}
  </div>
);

const LoadingRow: React.FC = () => (
  <div className="mt-3 rounded-2xl border border-gray-200 bg-white py-8 text-center text-sm font-semibold text-gray-400 shadow-sm">
    불러오는 중…
  </div>
);

const EmptyBox: React.FC<{ text: string }> = ({ text }) => (
  <div className="mt-3 rounded-2xl border border-dashed border-gray-300 bg-white/60 py-8 text-center text-sm font-semibold text-gray-400">
    {text}
  </div>
);

export default MobileHomePage;
