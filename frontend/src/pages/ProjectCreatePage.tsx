import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ko } from 'date-fns/locale';
import ColorPicker from '../components/ColorPicker';
import Alert from '../components/Alert';
import { createProject, ProjectCreateRequest } from '../api/project';
import { getAllPartners, getPartnerContacts, PartnerContactResponse } from '../api/partner';
import { getAllUsers, UserListResponse } from '../api/user';
import { createSchedule, ScheduleCreateRequest } from '../api/schedule';
import { uploadFile, FileUploadResponse } from '../api/file';
import { PartnerListResponse } from '../api/list';
import { format } from 'date-fns';

/**
 * 로컬 일정 타입 (프로젝트 생성 전 관리)
 */
interface LocalSchedule {
  id: string; // 임시 ID
  title: string;
  startDate: Date;
  endDate: Date;
  type: string;
  memberIds: number[];
}

/**
 * 로컬 파일 타입 (프로젝트 생성 전 관리)
 */
interface LocalFile {
  id: string; // 임시 ID
  file: File;
  category: string;
}

/**
 * 프로젝트 등록 페이지
 * 
 * 기능:
 * 1. 프로젝트 기본 정보 입력
 * 2. 거래처/연락처 선택
 * 3. 멤버 선택
 * 4. 일정 등록
 * 5. 파일 업로드
 * 6. 프로젝트 생성
 */
const ProjectCreatePage: React.FC = () => {
  const navigate = useNavigate();

  // 기본 정보
  const [name, setName] = useState<string>('');
  const [clientId, setClientId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [status, setStatus] = useState<string>('IN_PROGRESS');
  const [description, setDescription] = useState<string>('');
  const [colorCode, setColorCode] = useState<string>('#3b82f6');

  // 거래처/연락처
  const [partners, setPartners] = useState<PartnerListResponse[]>([]);
  const [partnerContacts, setPartnerContacts] = useState<PartnerContactResponse[]>([]);
  const [selectedPartnerContactIds, setSelectedPartnerContactIds] = useState<number[]>([]);

  // 멤버
  const [users, setUsers] = useState<UserListResponse[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

  // 일정
  const [schedules, setSchedules] = useState<LocalSchedule[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState<boolean>(false);
  const [scheduleDateRange, setScheduleDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [newSchedule, setNewSchedule] = useState<Partial<LocalSchedule>>({
    title: '',
    startDate: new Date(),
    endDate: new Date(),
    type: 'PROJECT',
    memberIds: [],
  });

  // 파일
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [activeFileCategory, setActiveFileCategory] = useState<string>('QUOTATION');

  // 상태
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPartners, setLoadingPartners] = useState<boolean>(false);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [loadingContacts, setLoadingContacts] = useState<boolean>(false);

  // 거래처 목록 로딩
  useEffect(() => {
    const loadPartners = async () => {
      setLoadingPartners(true);
      try {
        const data = await getAllPartners();
        setPartners(data);
      } catch (error) {
        console.error('거래처 목록 로딩 실패:', error);
      } finally {
        setLoadingPartners(false);
      }
    };

    loadPartners();
  }, []);

  // 사원 목록 로딩
  useEffect(() => {
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (error) {
        console.error('사원 목록 로딩 실패:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  // 거래처 선택 시 연락처 로딩
  useEffect(() => {
    if (clientId) {
      const loadContacts = async () => {
        setLoadingContacts(true);
        try {
          const data = await getPartnerContacts(clientId);
          setPartnerContacts(data);
          // 거래처 변경 시 연락처 선택 초기화
          setSelectedPartnerContactIds([]);
        } catch (error) {
          console.error('거래처 연락처 로딩 실패:', error);
          setPartnerContacts([]);
        } finally {
          setLoadingContacts(false);
        }
      };

      loadContacts();
    } else {
      setPartnerContacts([]);
      setSelectedPartnerContactIds([]);
    }
  }, [clientId]);

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

  // 거래처 연락처 체크박스 핸들러
  const handlePartnerContactToggle = (contactId: number) => {
    setSelectedPartnerContactIds((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  // 멤버 체크박스 핸들러
  const handleMemberToggle = (userId: number) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // 일정 날짜 범위 변경 핸들러
  const handleScheduleDateRangeChange = (dates: [Date | null, Date | null]) => {
    setScheduleDateRange(dates);
    if (dates[0]) {
      setNewSchedule({ ...newSchedule, startDate: dates[0] });
    }
    if (dates[1]) {
      setNewSchedule({ ...newSchedule, endDate: dates[1] });
    }
  };

  // 일정 추가
  const handleAddSchedule = () => {
    if (!newSchedule.title || !newSchedule.startDate || !newSchedule.endDate) {
      setError('일정 제목, 시작일, 종료일을 모두 입력해주세요.');
      return;
    }

    // 프로젝트 기간 검증
    if (!startDate || !endDate) {
      setError('프로젝트 기간을 먼저 설정해주세요.');
      return;
    }

    // 일정 시작일이 프로젝트 시작일보다 빠른지 확인
    if (newSchedule.startDate! < startDate) {
      setError('일정 시작일은 프로젝트 시작일보다 빠를 수 없습니다.');
      return;
    }

    // 일정 종료일이 프로젝트 종료일보다 늦은지 확인
    if (newSchedule.endDate! > endDate) {
      setError('일정 종료일은 프로젝트 종료일보다 늦을 수 없습니다.');
      return;
    }

    // 일정 시작일이 종료일보다 늦은지 확인
    if (newSchedule.startDate! > newSchedule.endDate!) {
      setError('일정 시작일이 종료일보다 늦을 수 없습니다.');
      return;
    }

    const schedule: LocalSchedule = {
      id: `temp-${Date.now()}`,
      title: newSchedule.title!,
      startDate: newSchedule.startDate!,
      endDate: newSchedule.endDate!,
      type: newSchedule.type || 'PROJECT',
      memberIds: newSchedule.memberIds || [],
    };

    setSchedules([...schedules, schedule]);
    setNewSchedule({
      title: '',
      startDate: new Date(),
      endDate: new Date(),
      type: 'PROJECT',
      memberIds: [],
    });
    setScheduleDateRange([null, null]);
    setShowScheduleForm(false);
    setError(null); // 성공 시 에러 메시지 초기화
  };

  // 일정 삭제
  const handleDeleteSchedule = (scheduleId: string) => {
    setSchedules(schedules.filter((s) => s.id !== scheduleId));
  };

  // 파일 추가
  const handleFileAdd = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newFiles: LocalFile[] = Array.from(selectedFiles).map((file) => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      file,
      category: activeFileCategory,
    }));

    setFiles([...files, ...newFiles]);
    // input 초기화
    event.target.value = '';
  };

  // 파일 삭제
  const handleFileDelete = (fileId: string) => {
    setFiles(files.filter((f) => f.id !== fileId));
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 검증
    if (!name.trim()) {
      setError('프로젝트 이름을 입력해주세요.');
      return;
    }
    if (!clientId) {
      setError('거래처를 선택해주세요.');
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
      // 1. 프로젝트 생성
      const projectRequest: ProjectCreateRequest = {
        name: name.trim(),
        clientId,
        partnerContactIds: selectedPartnerContactIds,
        memberIds: selectedMemberIds,
        status,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        description: description.trim() || null,
        colorCode: colorCode || null,
      };

      const projectId = await createProject(projectRequest);

      // 2. 일정 생성
      for (const schedule of schedules) {
        const scheduleRequest: ScheduleCreateRequest = {
          title: schedule.title,
          startDate: format(schedule.startDate, 'yyyy-MM-dd'),
          endDate: format(schedule.endDate, 'yyyy-MM-dd'),
          scheduleType: schedule.type,
          projectId,
          memberIds: schedule.memberIds.length > 0 ? schedule.memberIds : null,
        };
        await createSchedule(scheduleRequest);
      }

      // 3. 파일 업로드
      for (const file of files) {
        await uploadFile(projectId, file.file, file.category);
      }

      // 성공 시 프로젝트 상세 페이지로 이동
      navigate(`/projects/${projectId}`);
    } catch (error: any) {
      console.error('프로젝트 생성 실패:', error);
      setError(
        error.response?.data?.message || '프로젝트 생성에 실패했습니다. 다시 시도해주세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getScheduleTypeLabel = (type: string): string => {
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

  const getFileCategoryLabel = (category: string): string => {
    switch (category) {
      case 'QUOTATION':
        return '견적서';
      case 'DRAWING':
        return '회로도';
      case 'PLC_PROGRAM':
        return 'PLC 프로그램';
      case 'BOM':
        return '자재표';
      case 'HMI_DESIGN':
        return 'HMI 작화';
      default:
        return category;
    }
  };

  const fileCategories = ['QUOTATION', 'DRAWING', 'PLC_PROGRAM', 'BOM', 'HMI_DESIGN'];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">프로젝트 등록</h1>
        <button
          onClick={() => navigate('/projects')}
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
        {/* 상단 섹션: 기본 정보 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">기본 정보</h2>

          <div className="space-y-4">
            {/* 프로젝트 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                프로젝트 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="프로젝트 이름을 입력하세요"
                required
              />
            </div>

            {/* 거래처 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                거래처 <span className="text-red-500">*</span>
              </label>
              <select
                value={clientId || ''}
                onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loadingPartners}
              >
                <option value="">거래처를 선택하세요</option>
                {partners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.companyName}
                  </option>
                ))}
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

            {/* 상태 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="IN_PROGRESS">진행 중</option>
                <option value="ON_HOLD">보류</option>
                <option value="COMPLETE">완료</option>
              </select>
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="프로젝트 설명을 입력하세요"
              />
            </div>

            {/* 색상 코드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">색상 코드</label>
              <ColorPicker value={colorCode} onChange={setColorCode} />
            </div>
          </div>
        </div>

        {/* 중간 섹션: 팀 멤버 할당 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">팀 멤버 할당</h2>

          <div className="grid grid-cols-2 gap-6">

            {/* 사원(멤버) 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사원(멤버)
              </label>
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

              {/* 거래처 연락처 선택 */}
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                      거래처 연락처
                  </label>
                  {!clientId ? (
                      <div className="text-sm text-gray-500 p-4 border border-gray-200 rounded-lg">
                          거래처를 먼저 선택해주세요.
                      </div>
                  ) : loadingContacts ? (
                      <div className="text-sm text-gray-500 p-4 border border-gray-200 rounded-lg">
                          로딩 중...
                      </div>
                  ) : partnerContacts.length === 0 ? (
                      <div className="text-sm text-gray-500 p-4 border border-gray-200 rounded-lg">
                          등록된 연락처가 없습니다.
                      </div>
                  ) : (
                      <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                          {partnerContacts.map((contact) => (
                              <label
                                  key={contact.id}
                                  className="flex items-center space-x-2 py-2 hover:bg-gray-50 cursor-pointer"
                              >
                                  <input
                                      type="checkbox"
                                      checked={selectedPartnerContactIds.includes(contact.id)}
                                      onChange={() => handlePartnerContactToggle(contact.id)}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <div className="flex-1">
                                      <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                                      {contact.position && (
                                          <div className="text-xs text-gray-500">{contact.position}</div>
                                      )}
                                  </div>
                              </label>
                          ))}
                      </div>
                  )}
              </div>
          </div>
        </div>

        {/* 하단 섹션: 일정 및 파일 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">일정 및 파일</h2>

          {/* 일정 등록 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">일정</h3>
              <button
                type="button"
                onClick={() => setShowScheduleForm(!showScheduleForm)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                {showScheduleForm ? '취소' : '일정 추가'}
              </button>
            </div>

            {showScheduleForm && (
              <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      일정 제목 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newSchedule.title || ''}
                      onChange={(e) =>
                        setNewSchedule({ ...newSchedule, title: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="일정 제목을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      기간 <span className="text-red-500">*</span>
                    </label>
                    {!startDate || !endDate ? (
                      <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 text-sm">
                        프로젝트 기간을 먼저 설정해주세요.
                      </div>
                    ) : (
                      <DatePicker
                        selected={scheduleDateRange[0]}
                        onChange={handleScheduleDateRangeChange}
                        startDate={scheduleDateRange[0]}
                        endDate={scheduleDateRange[1]}
                        selectsRange
                        minDate={startDate}
                        maxDate={endDate}
                        locale={ko as any}
                        dateFormat="yyyy-MM-dd"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholderText="시작일 ~ 종료일을 선택하세요"
                      />
                    )}
                    {startDate && endDate && (
                      <p className="mt-1 text-xs text-gray-500">
                        선택 가능한 기간: {format(startDate, 'yyyy-MM-dd')} ~{' '}
                        {format(endDate, 'yyyy-MM-dd')}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">타입</label>
                    <select
                      value={newSchedule.type || 'PROJECT'}
                      onChange={(e) => setNewSchedule({ ...newSchedule, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="PROJECT">프로젝트 일정</option>
                      <option value="TEST_RUN">시운전</option>
                      <option value="WIRING">전기 배선</option>
                      <option value="DESIGN">설계</option>
                      <option value="MEETING">미팅</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      참여자 선택
                    </label>
                    <div className="border border-gray-200 rounded-lg p-2 max-h-32 overflow-y-auto">
                      {users.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center space-x-2 py-1 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={(newSchedule.memberIds || []).includes(user.id)}
                            onChange={(e) => {
                              const memberIds = newSchedule.memberIds || [];
                              if (e.target.checked) {
                                setNewSchedule({
                                  ...newSchedule,
                                  memberIds: [...memberIds, user.id],
                                });
                              } else {
                                setNewSchedule({
                                  ...newSchedule,
                                  memberIds: memberIds.filter((id) => id !== user.id),
                                });
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{user.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSchedule}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    일정 추가
                  </button>
                </div>
              </div>
            )}

            {/* 일정 목록 */}
            {schedules.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        제목
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        타입
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        기간
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        참여자
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {schedules.map((schedule) => (
                      <tr key={schedule.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{schedule.title}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {getScheduleTypeLabel(schedule.type)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {format(schedule.startDate, 'yyyy-MM-dd')} ~{' '}
                          {format(schedule.endDate, 'yyyy-MM-dd')}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {schedule.memberIds.length > 0
                            ? users
                                .filter((u) => schedule.memberIds.includes(u.id))
                                .map((u) => u.name)
                                .join(', ')
                            : '-'}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 파일 업로드 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">파일</h3>
            </div>

            {/* 카테고리 탭 */}
            <div className="flex gap-2 mb-4 border-b border-gray-200">
              {fileCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveFileCategory(category)}
                  className={`
                    px-4 py-2 text-sm font-medium transition-colors
                    ${
                      activeFileCategory === category
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-600 hover:text-gray-800'
                    }
                  `}
                >
                  {getFileCategoryLabel(category)}
                </button>
              ))}
            </div>

            {/* 파일 업로드 버튼 */}
            <div className="mb-4">
              <label className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer">
                파일 선택
                <input
                  type="file"
                  multiple
                  onChange={handleFileAdd}
                  className="hidden"
                />
              </label>
            </div>

            {/* 업로드된 파일 목록 */}
            {files.filter((f) => f.category === activeFileCategory).length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        파일명
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        카테고리
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {files
                      .filter((f) => f.category === activeFileCategory)
                      .map((file) => (
                        <tr key={file.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{file.file.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {getFileCategoryLabel(file.category)}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => handleFileDelete(file.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '등록 중...' : '프로젝트 등록'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectCreatePage;

