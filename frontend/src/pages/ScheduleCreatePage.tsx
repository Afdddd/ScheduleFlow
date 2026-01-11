import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import Alert from '../components/Alert';
import { createSchedule, ScheduleCreateRequest } from '../api/schedule';
import { getAllProjects } from '../api/project';
import { ProjectListResponse } from '../api/list';
import { getAllUsers, UserListResponse } from '../api/user';

/**
 * 스케줄 등록 페이지
 *
 * 기능:
 * 1. 스케줄 기본 정보 입력 (제목, 타입, 시작일, 종료일, 프로젝트)
 * 2. 참여자 선택
 * 3. 스케줄 생성
 */
const ScheduleCreatePage: React.FC = () => {
  const navigate = useNavigate();

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

  // 프로젝트 및 사원 목록 로딩
  useEffect(() => {
    const loadData = async () => {
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
        setError('필요한 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoadingProjects(false);
        setLoadingUsers(false);
      }
    };

    loadData();
  }, []);

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

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 검증
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
        projectId: projectId || null,
        memberIds: selectedMemberIds.length > 0 ? selectedMemberIds : null,
      };

      await createSchedule(scheduleRequest);

      // 성공 시 스케줄 목록 페이지로 이동
      navigate('/schedules');
    } catch (error: any) {
      console.error('스케줄 생성 실패:', error);
      setError(
        error.response?.data?.message || '스케줄 생성에 실패했습니다. 다시 시도해주세요.'
      );
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">일정 등록</h1>
        <button
          onClick={() => navigate('/schedules')}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          목록으로
        </button>
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

      <form onSubmit={handleSubmit}>
        {/* 기본 정보 섹션 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">기본 정보</h2>

          <div className="space-y-4">
            {/* 일정 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                일정 제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="일정 제목을 입력하세요"
                required
              />
            </div>

            {/* 타입 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">타입</label>
              <select
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PROJECT">프로젝트 일정</option>
                <option value="TEST_RUN">시운전</option>
                <option value="WIRING">전기 배선</option>
                <option value="DESIGN">설계</option>
                <option value="MEETING">미팅</option>
              </select>
            </div>

            {/* 날짜 범위 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                기간 <span className="text-red-500">*</span>
              </label>
              <DatePicker
                selected={dateRange[0]}
                onChange={handleDateRangeChange}
                startDate={dateRange[0]}
                endDate={dateRange[1]}
                selectsRange
                locale={ko as any}
                dateFormat="yyyy-MM-dd"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholderText="시작일 ~ 종료일을 선택하세요"
                required
              />
            </div>

            {/* 프로젝트 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트</label>
              <select
                value={projectId || ''}
                onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loadingProjects}
              >
                <option value="">프로젝트를 선택하지 않음 (독립 일정)</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 참여자 섹션 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">참여자</h2>

          {loadingUsers ? (
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
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
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
          )}
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/schedules')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '등록 중...' : '일정 등록'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleCreatePage;

