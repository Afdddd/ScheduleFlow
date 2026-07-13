import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import DatePickerInput from '../components/ui/DatePickerInput';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import Alert from '../components/Alert';
import { useAuthStore } from '../stores/authStore';
import { SCHEDULE_TYPES, scheduleTypeLabel, scheduleTypeChipCls } from '../constants/scheduleTypes';
import {
  getScheduleDetail,
  updateSchedule,
  deleteSchedule,
  ScheduleDetailResponse,
  ScheduleUpdateRequest,
} from '../api/schedule';
import { getAllProjects, getProjectDetail } from '../api/project';
import { ProjectListResponse } from '../api/list';
import { getAllUsers, UserListResponse } from '../api/user';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useSmartBack } from '../hooks/useSmartBack';

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
 * 일정 상세 페이지
 *
 * 기능:
 * 1. 일정 상세 정보 조회
 * 2. 일정 수정 (ADMIN 권한)
 * 3. 일정 삭제 (ADMIN 권한)
 */
const ScheduleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isMobile = useIsMobile();
  const goBack = useSmartBack('/schedules');

  // 일정 데이터
  const [schedule, setSchedule] = useState<ScheduleDetailResponse | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 편집 모드
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // 편집 모드 상태 (일정 등록 페이지와 동일한 구조)
  const [title, setTitle] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [scheduleType, setScheduleType] = useState<string>('PROJECT');
  const [projectId, setProjectId] = useState<number | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

  // 편집 모드용 데이터
  const [projects, setProjects] = useState<ProjectListResponse[]>([]);
  const [users, setUsers] = useState<UserListResponse[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(false);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

  // 일정 데이터 로딩
  useEffect(() => {
    if (!id) return;

    const loadSchedule = async () => {
      setLoading(true);
      setError(null);
      try {
        const scheduleId = parseInt(id, 10);
        const scheduleData = await getScheduleDetail(scheduleId);
        setSchedule(scheduleData);

        // 프로젝트가 있으면 프로젝트 이름 조회
        if (scheduleData.projectId) {
          try {
            const projectData = await getProjectDetail(scheduleData.projectId);
            setProjectName(projectData.name);
          } catch (error) {
            console.error('프로젝트 정보 로딩 실패:', error);
            // 프로젝트 정보 로딩 실패는 무시 (일정 정보는 이미 로드됨)
          }
        }
      } catch (error: any) {
        console.error('일정 로딩 실패:', error);
        if (error.response?.status === 404) {
          setError('일정을 찾을 수 없습니다.');
        } else {
          setError('일정 정보를 불러오는데 실패했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [id]);

  // 편집 모드 진입 시 추가 데이터 로딩
  useEffect(() => {
    if (!isEditing) return;

    const loadEditData = async () => {
      setLoadingProjects(true);
      setLoadingUsers(true);
      try {
        const [projectsData, usersData] = await Promise.all([
          getAllProjects(),
          getAllUsers(),
        ]);
        setProjects(projectsData);
        setUsers(usersData);
      } catch (error) {
        console.error('프로젝트 및 사원 목록 로딩 실패:', error);
        setError('편집에 필요한 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoadingProjects(false);
        setLoadingUsers(false);
      }
    };

    loadEditData();
  }, [isEditing]);

  // 일정 데이터를 편집 모드 상태로 복사
  useEffect(() => {
    if (schedule && isEditing) {
      setTitle(schedule.title);
      setStartDate(new Date(schedule.startDate));
      setEndDate(new Date(schedule.endDate));
      setDateRange([new Date(schedule.startDate), new Date(schedule.endDate)]);
      setScheduleType(schedule.type);
      setProjectId(schedule.projectId);
      setSelectedMemberIds(schedule.members.map((m) => m.id));
    }
  }, [schedule, isEditing]);

  // 날짜 범위 선택 핸들러
  const handleDateRangeChange = (dates: [Date | null, Date | null]) => {
    setDateRange(dates);
    if (dates[0]) {
      setStartDate(dates[0]);
    }
    if (dates[1]) {
      setEndDate(dates[1]);
    }
  };

  // 멤버 체크박스 핸들러
  const handleMemberToggle = (userId: number) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // 편집 모드 진입
  const handleEdit = () => {
    setIsEditing(true);
  };

  // 편집 취소
  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    // 원본 데이터로 복원
    if (schedule) {
      setTitle(schedule.title);
      setStartDate(new Date(schedule.startDate));
      setEndDate(new Date(schedule.endDate));
      setDateRange([new Date(schedule.startDate), new Date(schedule.endDate)]);
      setScheduleType(schedule.type);
      setProjectId(schedule.projectId);
      setSelectedMemberIds(schedule.members.map((m) => m.id));
    }
  };

  // 일정 수정 저장
  const handleSave = async () => {
    if (!id || !startDate || !endDate) return;

    setError(null);

    // 검증
    if (!title.trim()) {
      setError('일정 제목을 입력해주세요.');
      return;
    }
    if (startDate > endDate) {
      setError('시작일이 종료일보다 늦을 수 없습니다.');
      return;
    }

    setLoading(true);

    try {
      const scheduleId = parseInt(id, 10);
      const updateRequest: ScheduleUpdateRequest = {
        title: title.trim(),
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        scheduleType: scheduleType || 'PROJECT',
        projectId: projectId || null,
        memberIds: selectedMemberIds.length > 0 ? selectedMemberIds : null,
      };

      const updatedSchedule = await updateSchedule(scheduleId, updateRequest);
      setSchedule(updatedSchedule);
      
      // 프로젝트 이름 업데이트
      if (updatedSchedule.projectId) {
        try {
          const projectData = await getProjectDetail(updatedSchedule.projectId);
          setProjectName(projectData.name);
        } catch (error) {
          console.error('프로젝트 정보 로딩 실패:', error);
        }
      } else {
        setProjectName(null);
      }
      
      setIsEditing(false);
      setError(null);
    } catch (error: any) {
      console.error('일정 수정 실패:', error);
      setError(error.response?.data?.message || '일정 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 일정 삭제
  const handleDelete = async () => {
    if (!id) return;

    const confirmed = window.confirm('정말로 이 일정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const scheduleId = parseInt(id, 10);
      await deleteSchedule(scheduleId);
      navigate('/schedules');
    } catch (error: any) {
      console.error('일정 삭제 실패:', error);
      setError(error.response?.data?.message || '일정 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string): string => scheduleTypeLabel(type);
  const getTypeColor = (type: string): string => scheduleTypeChipCls(type);

  if (loading && !schedule) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="p-6">
        <Alert type="error" message={error || '일정을 찾을 수 없습니다.'} />
        <button
          onClick={() => navigate('/schedules')}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          목록으로
        </button>
      </div>
    );
  }

  // ── 모바일 읽기 뷰 (편집은 아래 공용 폼 재사용) ──
  if (isMobile && !isEditing) {
    return (
      <div className="min-h-full bg-gray-50 pb-10">
        {/* 백바 */}
        <div className="flex items-center gap-1 px-2.5 pb-3 pt-3">
          <button
            onClick={goBack}
            aria-label="뒤로"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 active:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-[17px] font-extrabold tracking-tight text-gray-900">일정 상세</h1>
          <span className="w-10" />
        </div>

        <div className="px-[18px]">
          {error && (
            <Alert type="error" message={error} dismissible onClose={() => setError(null)} style={{ marginBottom: '1rem' }} />
          )}

          {/* 히어로 */}
          <span className={`inline-block rounded-full px-2.5 py-1 text-[12.5px] font-bold ${getTypeColor(schedule.type)}`}>
            {getTypeLabel(schedule.type)}
          </span>
          <h2 className="mt-2.5 text-[23px] font-extrabold leading-tight tracking-tight text-gray-900">{schedule.title}</h2>

          {/* 정보 카드 */}
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-4 shadow-sm">
            <InfoRow label="기간" value={`${schedule.startDate} ~ ${schedule.endDate}`} />
            <InfoRow label="프로젝트" value={schedule.projectId ? projectName || '불러오는 중…' : '독립 일정'} />
            <InfoRow label="타입" value={getTypeLabel(schedule.type)} last />
          </div>

          {/* 참여자 */}
          <div className="mt-5 mb-1 px-0.5 text-[15px] font-extrabold text-gray-900">참여자</div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            {schedule.members.length === 0 ? (
              <div className="text-[14px] font-semibold text-gray-400">할당된 참여자가 없어요</div>
            ) : (
              <div className="flex flex-col gap-3">
                {schedule.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary-500 text-[14px] font-extrabold text-white">
                      {m.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[15px] font-bold text-gray-900">{m.name}</div>
                      {m.position && <div className="text-[12.5px] font-medium text-gray-500">{m.position}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 관리자 액션 */}
          {isAdmin && (
            <div className="mt-6 flex gap-2.5">
              <button
                onClick={handleEdit}
                className="flex-1 rounded-2xl bg-primary-500 py-4 text-[16px] font-extrabold text-white shadow-sm active:scale-[0.99]"
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-2xl border border-red-200 bg-white py-4 text-[16px] font-extrabold text-red-500 active:scale-[0.99]"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── 데스크톱 뷰 (+ 모바일 편집) ──
  const previewType = isEditing ? scheduleType : schedule.type;
  const previewProject = isEditing
    ? projectId
      ? projects.find((p) => p.id === projectId)?.name ?? '독립 일정'
      : '독립 일정'
    : schedule.projectId
    ? projectName || '불러오는 중…'
    : '독립 일정';
  const participantCount = isEditing ? selectedMemberIds.length : schedule.members.length;
  const previewPeriod = isEditing
    ? startDate && endDate
      ? `${format(startDate, 'MM.dd')} ~ ${format(endDate, 'MM.dd')}`
      : '—'
    : `${schedule.startDate.slice(5).replace(/-/g, '.')} ~ ${schedule.endDate.slice(5).replace(/-/g, '.')}`;

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
      <div className="mb-5 flex items-center gap-2.5">
        <h1 className="text-[22px] font-extrabold tracking-tight text-gray-900">{schedule.title}</h1>
        {isEditing && <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11.5px] font-bold text-amber-700">편집 중</span>}
      </div>

      {error && <Alert type="error" message={error} dismissible onClose={() => setError(null)} style={{ marginBottom: '1.25rem' }} />}

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-5">
        {/* 좌: 정보 */}
        <div className="min-w-0 space-y-4 lg:space-y-5">
          {/* 기본 정보 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-5 text-[15.5px] font-extrabold tracking-tight text-gray-900">기본 정보</h2>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>
                    일정 제목 <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="일정 제목을 입력하세요" />
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
                    />
                  </div>
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
                </div>
              </div>
            ) : (
              <dl className="divide-y divide-gray-100">
                <DRow label="유형">
                  <span className={`inline-flex h-[22px] items-center rounded-full px-2.5 text-[12px] font-bold ${scheduleTypeChipCls(schedule.type)}`}>
                    {getTypeLabel(schedule.type)}
                  </span>
                </DRow>
                <DRow label="기간">
                  <span className="tabular-nums">
                    {schedule.startDate} ~ {schedule.endDate}
                  </span>
                </DRow>
                <DRow label="프로젝트">{schedule.projectId ? projectName || '불러오는 중…' : '독립 일정'}</DRow>
              </dl>
            )}
          </section>

          {/* 참여자 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <h2 className="text-[15.5px] font-extrabold tracking-tight text-gray-900">참여자</h2>
              <span className="inline-grid h-5 min-w-[20px] place-items-center rounded-full bg-primary-50 px-1.5 text-[11.5px] font-extrabold text-primary-600">{participantCount}</span>
            </div>

            {isEditing ? (
              loadingUsers ? (
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
              )
            ) : schedule.members.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 py-8 text-center text-[13px] font-semibold text-gray-400">할당된 참여자가 없어요.</div>
            ) : (
              <div className="space-y-2.5">
                {schedule.members.map((member, i) => (
                  <div key={member.id} className="flex items-center gap-3 rounded-xl border border-gray-200 px-3.5 py-3">
                    <span
                      className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[13px] font-bold text-white"
                      style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                    >
                      {member.name.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-extrabold text-gray-900">{member.name}</div>
                      {member.position && <div className="mt-0.5 truncate text-[12.5px] font-semibold text-gray-400">{member.position}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* 우: 요약 + 액션 레일 */}
        <div className="mt-4 space-y-3.5 lg:sticky lg:top-4 lg:mt-0">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-[18px] pt-3.5 text-[11.5px] font-extrabold tracking-wide text-gray-400">일정</div>
            <div className="border-b border-gray-200 px-[18px] pb-3.5 pt-1.5">
              <span className="truncate text-[15px] font-extrabold tracking-tight text-gray-900">{isEditing ? title || '일정 제목' : schedule.title}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-[18px] py-2.5">
              <span className="text-[12.5px] font-bold text-gray-400">유형</span>
              <span className={`inline-flex h-[22px] items-center rounded-full px-2.5 text-[12px] font-bold ${scheduleTypeChipCls(previewType)}`}>{getTypeLabel(previewType)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-[18px] py-2.5">
              <span className="text-[12.5px] font-bold text-gray-400">기간</span>
              <span className="text-[13px] font-bold text-gray-800 tabular-nums">{previewPeriod}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-[18px] py-2.5">
              <span className="text-[12.5px] font-bold text-gray-400">프로젝트</span>
              <span className="truncate text-[13px] font-bold text-gray-800">{previewProject}</span>
            </div>
            <div className="flex items-center justify-between gap-3 px-[18px] py-2.5">
              <span className="text-[12.5px] font-bold text-gray-400">참여자</span>
              <span className="text-[13px] font-bold text-gray-800 tabular-nums">{participantCount}명</span>
            </div>
          </div>

          {isAdmin && (
            <div className="space-y-2.5">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-primary-500 text-[14.5px] font-extrabold text-white shadow-md shadow-primary-500/30 transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {loading ? '저장 중…' : '저장'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex h-11 w-full items-center justify-center rounded-xl border border-gray-300 bg-white text-[14px] font-bold text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    취소
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-primary-500 text-[14.5px] font-extrabold text-white shadow-md shadow-primary-500/30 transition-colors hover:bg-primary-600"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex h-11 w-full items-center justify-center rounded-xl border border-red-200 bg-white text-[14px] font-bold text-red-500 transition-colors hover:bg-red-50"
                  >
                    삭제
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/** 모바일 상세 정보 행. */
const InfoRow: React.FC<{ label: string; value: string; last?: boolean }> = ({ label, value, last }) => (
  <div className={`flex items-center gap-3 py-3.5 ${last ? '' : 'border-b border-gray-100'}`}>
    <span className="w-20 flex-none text-[13px] font-semibold text-gray-400">{label}</span>
    <span className="min-w-0 flex-1 text-[15px] font-bold text-gray-900">{value}</span>
  </div>
);

/** 데스크톱 읽기 모드 정보 행. */
const DRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center gap-4 py-3">
    <span className="w-20 flex-none text-[13px] font-bold text-gray-400">{label}</span>
    <span className="min-w-0 flex-1 text-[14px] font-semibold text-gray-800">{children}</span>
  </div>
);

export default ScheduleDetailPage;

