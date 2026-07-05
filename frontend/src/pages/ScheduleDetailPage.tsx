import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import DatePickerInput from '../components/ui/DatePickerInput';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import Alert from '../components/Alert';
import { useAuthStore } from '../stores/authStore';
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

  // 타입 라벨 변환
  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'PROJECT':
        return '프로젝트 일정';
      case 'TEST_RUN':
        return '시운전';
      case 'WIRING':
        return '전기 배선';
      case 'DESIGN':
        return '설계';
      case 'MEETING':
        return '미팅';
      default:
        return type;
    }
  };

  // 타입 색상
  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'PROJECT':
        return 'bg-blue-100 text-blue-800';
      case 'TEST_RUN':
        return 'bg-green-100 text-green-800';
      case 'WIRING':
        return 'bg-yellow-100 text-yellow-800';
      case 'DESIGN':
        return 'bg-purple-100 text-purple-800';
      case 'MEETING':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{schedule.title}</h1>
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(
              schedule.type
            )}`}
          >
            {getTypeLabel(schedule.type)}
          </span>
        </div>
        {/* 뷰 모드 액션은 상단, 편집 모드 액션(목록으로·취소·저장)은 페이지 맨 밑으로 */}
        {!isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/schedules')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              목록으로
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  삭제
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          dismissible
          onClose={() => setError(null)}
          style={{ marginBottom: '1.5rem' }}
        />
      )}

      {/* 기본 정보 섹션 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
        <h2 className="text-xl font-bold mb-4">기본 정보</h2>

        <div className="space-y-4">
          {/* 일정 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">일정 제목</label>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="일정 제목을 입력하세요"
              />
            ) : (
              <div className="px-4 py-2 text-gray-900">{schedule.title}</div>
            )}
          </div>

          {/* 타입 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">타입</label>
            {isEditing ? (
              <select
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="PROJECT">프로젝트 일정</option>
                <option value="TEST_RUN">시운전</option>
                <option value="WIRING">전기 배선</option>
                <option value="DESIGN">설계</option>
                <option value="MEETING">미팅</option>
              </select>
            ) : (
              <div className="px-4 py-2">
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${getTypeColor(
                    schedule.type
                  )}`}
                >
                  {getTypeLabel(schedule.type)}
                </span>
              </div>
            )}
          </div>

          {/* 날짜 범위 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">기간</label>
            {isEditing ? (
              <DatePicker
                customInput={<DatePickerInput />}
                selected={dateRange[0]}
                onChange={handleDateRangeChange}
                startDate={dateRange[0]}
                endDate={dateRange[1]}
                selectsRange
                locale={ko as any}
                dateFormat="yyyy-MM-dd"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholderText="시작일 ~ 종료일을 선택하세요"
              />
            ) : (
              <div className="px-4 py-2 text-gray-900">
                {schedule.startDate} ~ {schedule.endDate}
              </div>
            )}
          </div>

          {/* 프로젝트 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트</label>
            {isEditing ? (
              <select
                value={projectId || ''}
                onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={loadingProjects}
              >
                <option value="">프로젝트를 선택하지 않음 (독립 일정)</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-4 py-2 text-gray-900">
                {schedule.projectId ? projectName || '프로젝트 로딩 중...' : '독립 일정'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 참여자 섹션 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
        <h2 className="text-xl font-bold mb-4">참여자</h2>

        {isEditing ? (
          loadingUsers ? (
            <div className="text-sm text-gray-500 p-4 border border-gray-200 rounded-lg">
              로딩 중...
            </div>
          ) : users.length === 0 ? (
            <div className="text-sm text-gray-500 p-4 border border-gray-200 rounded-lg">
              등록된 사원이 없습니다.
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
              {users.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center space-x-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.includes(user.id)}
                    onChange={() => handleMemberToggle(user.id)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    {user.position && (
                      <div className="text-xs text-gray-500">{user.position}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )
        ) : (
          <div className="border border-gray-200 rounded-lg p-4">
            {schedule.members.length === 0 ? (
              <div className="text-sm text-gray-500">할당된 참여자가 없습니다.</div>
            ) : (
              <div className="space-y-2">
                {schedule.members.map((member) => (
                  <div key={member.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      {member.position && (
                        <div className="text-xs text-gray-500">{member.position}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 편집 모드 하단 액션: 목록으로 · 취소 · 저장 */}
      {isEditing && (
        <div className="mt-2 flex justify-end gap-3">
          <button
            onClick={() => navigate('/schedules')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            목록으로
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      )}
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

export default ScheduleDetailPage;

