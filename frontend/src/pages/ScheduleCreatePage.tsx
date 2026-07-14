import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import DatePickerInput from '../components/ui/DatePickerInput';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import Alert from '../components/Alert';
import { createSchedule, ScheduleCreateRequest } from '../api/schedule';
import { getAllProjects } from '../api/project';
import { ProjectListResponse } from '../api/list';
import { getAllUsers, UserListResponse } from '../api/user';
import { useAuthStore } from '../stores/authStore';
import { SCHEDULE_TYPES, scheduleTypeChipCls } from '../constants/scheduleTypes';

const TYPE_OPTS = SCHEDULE_TYPES.map((t) => ({ v: t.value, l: t.shortLabel }));
const AVATAR_COLORS = ['#0B4EC4', '#1B9E5A', '#8B5CF6', '#C6771A', '#E5484D', '#0EA5E9'];

const inputCls =
  'h-[42px] w-full rounded-xl border border-gray-300 bg-white px-3.5 text-[14px] font-medium text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100';
const labelCls = 'mb-1.5 block text-[12.5px] font-bold text-gray-500';
const segWrap = 'inline-flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1';
const segCls = (on: boolean) =>
  on
    ? 'rounded-lg bg-primary-500 px-3.5 py-2 text-[13px] font-bold text-white shadow-sm'
    : 'rounded-lg px-3.5 py-2 text-[13px] font-bold text-gray-500 transition-colors hover:text-gray-700';

/**
 * 스케줄 등록 페이지 (데스크톱: 좌측 입력 + 우측 고정 요약 레일 / 모바일: 단일단)
 */
const ScheduleCreatePage: React.FC = () => {
  const navigate = useNavigate();
  // STAFF는 독립(개인) 일정만 생성 가능 — 프로젝트 선택 숨김, 참여자는 본인 고정 (#110)
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');

  // 기본 정보
  const [title, setTitle] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [scheduleType, setScheduleType] = useState<string>('PROJECT');
  const [projectId, setProjectId] = useState<number | null>(null);

  // 참여자
  const [users, setUsers] = useState<UserListResponse[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

  // 프로젝트
  const [projects, setProjects] = useState<ProjectListResponse[]>([]);

  // 상태
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(false);

  // 프로젝트 및 사원 목록 로딩 (STAFF는 선택지가 없으므로 생략 — /users는 ADMIN 전용)
  useEffect(() => {
    if (!isAdmin) return;
    const loadData = async () => {
      setLoadingProjects(true);
      setLoadingUsers(true);
      try {
        const [projectsData, usersData] = await Promise.all([getAllProjects(), getAllUsers()]);
        setProjects(projectsData);
        setUsers(usersData);
      } catch (error) {
        console.error('프로젝트 및 사원 목록 로딩 실패:', error);
        setError('필요한 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoadingProjects(false);
        setLoadingUsers(false);
      }
    };
    loadData();
  }, [isAdmin]);

  // 날짜 범위 선택 핸들러
  const handleDateRangeChange = (dates: [Date | null, Date | null]) => {
    setDateRange(dates);
    if (dates[0]) setStartDate(dates[0]);
    if (dates[1]) setEndDate(dates[1]);
  };

  // 멤버 체크박스 핸들러
  const handleMemberToggle = (userId: number) => {
    setSelectedMemberIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('일정 제목을 입력해주세요.');
      return;
    }
    if (!startDate || !endDate) {
      setError('시작일과 종료일을 선택해주세요.');
      return;
    }
    if (startDate > endDate) {
      setError('시작일이 종료일보다 늦을 수 없습니다.');
      return;
    }

    setLoading(true);

    try {
      const scheduleRequest: ScheduleCreateRequest = {
        title: title.trim(),
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        scheduleType: scheduleType || 'PROJECT',
        projectId: isAdmin ? projectId || null : null,
        memberIds: isAdmin && selectedMemberIds.length > 0 ? selectedMemberIds : null,
      };

      await createSchedule(scheduleRequest);
      navigate('/schedules');
    } catch (error: any) {
      console.error('스케줄 생성 실패:', error);
      setError(error.response?.data?.message || '스케줄 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const projectName = projects.find((p) => p.id === projectId)?.name;
  const typeLabel = TYPE_OPTS.find((o) => o.v === scheduleType)?.l ?? scheduleType;

  return (
    <div className="mx-auto max-w-[1080px] px-5 py-6 sm:px-6">
      <button
        onClick={() => navigate('/schedules')}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-gray-500 transition-colors hover:text-gray-800"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        일정 목록으로
      </button>
      <div className="mb-5">
        <h1 className="text-[22px] font-extrabold tracking-tight text-gray-900">새 일정</h1>
        <p className="mt-1 text-[13.5px] font-semibold text-gray-400">프로젝트에 연결하거나 독립 일정으로 등록합니다.</p>
      </div>

      {error && <Alert type="error" message={error} dismissible onClose={() => setError(null)} style={{ marginBottom: '1.25rem' }} />}

      <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-5">
        {/* 좌: 입력 */}
        <div className="min-w-0 space-y-4 lg:space-y-5">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-[15.5px] font-extrabold tracking-tight text-gray-900">기본 정보</h2>
            <p className="mb-5 mt-0.5 text-[12.5px] font-semibold text-gray-400">일정의 제목과 기간, 연결할 프로젝트를 정합니다.</p>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>
                  일정 제목 <span className="text-red-500">*</span>
                </label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="일정 제목을 입력하세요" required />
              </div>

              <div>
                <label className={labelCls}>유형</label>
                <div className={segWrap}>
                  {TYPE_OPTS.map((o) => (
                    <button key={o.v} type="button" onClick={() => setScheduleType(o.v)} className={segCls(scheduleType === o.v)}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>
                    기간 <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    customInput={<DatePickerInput />}
                    selected={dateRange[0]}
                    onChange={handleDateRangeChange}
                    startDate={dateRange[0]}
                    endDate={dateRange[1]}
                    selectsRange
                    locale={ko as any}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="시작일 ~ 종료일"
                    required
                  />
                </div>
                {isAdmin && (
                <div>
                  <label className={labelCls}>프로젝트</label>
                  <div className="relative">
                    <select
                      value={projectId || ''}
                      onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}
                      className={`${inputCls} cursor-pointer appearance-none pr-9`}
                      disabled={loadingProjects}
                    >
                      <option value="">선택 안 함 (독립 일정)</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-[15.5px] font-extrabold tracking-tight text-gray-900">참여자</h2>
            <p className="mb-5 mt-0.5 text-[12.5px] font-semibold text-gray-400">
              {isAdmin ? '이 일정에 참여할 사원을 선택합니다.' : '본인 일정으로 등록됩니다.'}
            </p>
            {!isAdmin ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm font-semibold text-gray-500">
                참여자는 본인으로 자동 지정됩니다.
              </div>
            ) : loadingUsers ? (
              <div className="rounded-xl border border-gray-200 p-4 text-sm font-semibold text-gray-400">로딩 중…</div>
            ) : users.length === 0 ? (
              <div className="rounded-xl border border-gray-200 p-4 text-sm font-semibold text-gray-400">등록된 사원이 없습니다.</div>
            ) : (
              <div className="max-h-[280px] overflow-y-auto rounded-xl border border-gray-200">
                {users.map((user, i) => {
                  const on = selectedMemberIds.includes(user.id);
                  return (
                    <label
                      key={user.id}
                      className={`flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-2.5 last:border-b-0 ${
                        on ? 'bg-primary-50/60' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input type="checkbox" checked={on} onChange={() => handleMemberToggle(user.id)} className="sr-only" />
                      <span
                        className={`flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[6px] border transition-colors ${
                          on ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-300'
                        }`}
                      >
                        {on && (
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span
                        className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full text-[12px] font-bold text-white"
                        style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                      >
                        {user.name.charAt(0)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-bold text-gray-900">{user.name}</span>
                        {user.position && <span className="block truncate text-[11.5px] font-semibold text-gray-400">{user.position}</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* 우: 요약 + 액션 레일 */}
        <div className="mt-4 space-y-3.5 lg:sticky lg:top-4 lg:mt-0">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-[18px] pt-3.5 text-[11.5px] font-extrabold tracking-wide text-gray-400">미리보기</div>
            <div className="border-b border-gray-200 px-[18px] pb-3.5 pt-1.5">
              <span className="truncate text-[15px] font-extrabold tracking-tight text-gray-900">{title || '일정 제목'}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-[18px] py-2.5">
              <span className="text-[12.5px] font-bold text-gray-400">유형</span>
              <span className={`inline-flex h-[22px] items-center rounded-full px-2.5 text-[12px] font-bold ${scheduleTypeChipCls(scheduleType)}`}>{typeLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-[18px] py-2.5">
              <span className="text-[12.5px] font-bold text-gray-400">기간</span>
              <span className="text-[13px] font-bold text-gray-800 tabular-nums">
                {startDate && endDate ? `${format(startDate, 'MM.dd')} ~ ${format(endDate, 'MM.dd')}` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-[18px] py-2.5">
              <span className="text-[12.5px] font-bold text-gray-400">프로젝트</span>
              <span className="truncate text-[13px] font-bold text-gray-800">{projectName || '독립 일정'}</span>
            </div>
            <div className="flex items-center justify-between gap-3 px-[18px] py-2.5">
              <span className="text-[12.5px] font-bold text-gray-400">참여자</span>
              <span className="text-[13px] font-bold text-gray-800 tabular-nums">{isAdmin ? `${selectedMemberIds.length}명` : '본인'}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-primary-500 text-[14.5px] font-extrabold text-white shadow-md shadow-primary-500/30 transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading ? '등록 중…' : '일정 등록'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/schedules')}
              className="flex h-11 w-full items-center justify-center rounded-xl border border-gray-300 bg-white text-[14px] font-bold text-gray-600 transition-colors hover:bg-gray-50"
            >
              취소
            </button>
            <p className="text-center text-[11.5px] font-semibold text-gray-400">등록 후 일정 목록으로 이동합니다.</p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ScheduleCreatePage;
