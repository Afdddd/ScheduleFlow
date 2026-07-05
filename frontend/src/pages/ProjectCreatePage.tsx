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
import { useScrollLock } from '../hooks/useScrollLock';
import DatePickerInput from '../components/ui/DatePickerInput';

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

  // 일정 타입별 색상 (좌측 스트라이프 / 배지)
  const scheduleTypeStyle = (type: string): { stripe: string; pill: string } => {
    switch (type) {
      case 'PROJECT':
        return { stripe: 'bg-primary-500', pill: 'bg-primary-50 text-primary-700' };
      case 'TEST_RUN':
        return { stripe: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700' };
      case 'WIRING':
        return { stripe: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700' };
      case 'DESIGN':
        return { stripe: 'bg-violet-500', pill: 'bg-violet-50 text-violet-700' };
      case 'MEETING':
        return { stripe: 'bg-rose-500', pill: 'bg-rose-50 text-rose-700' };
      default:
        return { stripe: 'bg-gray-400', pill: 'bg-gray-100 text-gray-600' };
    }
  };

  // 참여자 아바타 색상 팔레트 (모바일 목록과 동일 톤)
  const AVATAR_COLORS = ['#0B4EC4', '#1B9E5A', '#8B5CF6', '#C6771A', '#E5484D', '#0EA5E9'];

  // 파일 확장자 → 아이콘 라벨/색
  const fileIconStyle = (filename: string): { label: string; bg: string } => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return { label: 'PDF', bg: '#E5484D' };
    if (['dwg', 'dxf'].includes(ext)) return { label: 'DWG', bg: '#0B4EC4' };
    if (['xls', 'xlsx', 'csv'].includes(ext)) return { label: 'XLS', bg: '#177245' };
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext))
      return { label: 'IMG', bg: '#1B9E5A' };
    if (['doc', 'docx'].includes(ext)) return { label: 'DOC', bg: '#2B5797' };
    if (['zip', 'rar', '7z'].includes(ext)) return { label: 'ZIP', bg: '#7C3AED' };
    return { label: ext ? ext.slice(0, 3).toUpperCase() : 'FILE', bg: '#6B7280' };
  };

  // 파일 크기 표기
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 일정 추가 바텀시트가 열려 있는 동안 배경 스크롤 잠금
  useScrollLock(showScheduleForm);

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-gray-800"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
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
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                required
              />
            </div>

            {/* 상태 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
          <h2 className="text-xl font-bold mb-4">팀 멤버 할당</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

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
                                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
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
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm mb-6">
          {/* 일정 */}
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-[17px] font-extrabold text-gray-900">일정</h3>
              {schedules.length > 0 && (
                <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[12px] font-extrabold text-primary-600">
                  {schedules.length}
                </span>
              )}
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setShowScheduleForm(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary-500 px-3.5 py-2 text-[13.5px] font-extrabold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                추가
              </button>
            </div>

            {/* 일정 목록 — 카드 */}
            {schedules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 py-8 text-center text-[13.5px] font-semibold text-gray-400">
                등록된 일정이 없어요. ‘추가’로 일정을 넣어보세요.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200">
                {schedules.map((schedule) => {
                  const st = scheduleTypeStyle(schedule.type);
                  const members = users.filter((u) => schedule.memberIds.includes(u.id));
                  return (
                    <div key={schedule.id} className="relative flex gap-3 bg-white px-3.5 py-3.5">
                      <span className={`w-1 flex-none rounded ${st.stripe}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 pr-8">
                          <span className="truncate text-[15px] font-extrabold text-gray-900">
                            {schedule.title}
                          </span>
                          <span className={`flex-none rounded-full px-2 py-0.5 text-[11px] font-extrabold ${st.pill}`}>
                            {getScheduleTypeLabel(schedule.type)}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-500">
                          <svg className="h-3.5 w-3.5 flex-none text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
                            <path d="M8 2.5v4M16 2.5v4M3 10h18" />
                          </svg>
                          {format(schedule.startDate, 'yyyy.MM.dd')} ~ {format(schedule.endDate, 'yyyy.MM.dd')}
                        </div>
                        {members.length > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex">
                              {members.slice(0, 3).map((m, idx) => (
                                <span
                                  key={m.id}
                                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[10px] font-extrabold text-white"
                                  style={{
                                    backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
                                    marginLeft: idx === 0 ? 0 : -7,
                                  }}
                                >
                                  {m.name.charAt(0)}
                                </span>
                              ))}
                            </div>
                            <span className="text-[12px] font-bold text-gray-600">
                              {members.length <= 2
                                ? members.map((m) => m.name).join(', ')
                                : `${members[0].name} 외 ${members.length - 1}명`}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        aria-label="일정 삭제"
                        className="absolute right-1.5 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
                          <path d="M6 6l12 12M6 18 18 6" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 파일 */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-[17px] font-extrabold text-gray-900">파일</h3>
              {files.length > 0 && (
                <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[12px] font-extrabold text-primary-600">
                  {files.length}
                </span>
              )}
            </div>

            {/* 카테고리 탭 — pill */}
            <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
              {fileCategories.map((category) => {
                const active = activeFileCategory === category;
                const count = files.filter((f) => f.category === category).length;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveFileCategory(category)}
                    className={`flex-none whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-bold transition-colors ${
                      active
                        ? 'border-primary-500 bg-primary-500 text-white shadow-sm shadow-primary-500/25'
                        : 'border-gray-200 bg-white text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {getFileCategoryLabel(category)}
                    {count > 0 && (
                      <span className={`ml-1.5 ${active ? 'text-white/80' : 'text-gray-400'}`}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 업로드 드롭존 */}
            <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50 px-4 py-4 text-[14px] font-extrabold text-primary-600 transition-colors hover:bg-primary-100">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M12 16V4M7 9l5-5 5 5" />
                <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
              </svg>
              {getFileCategoryLabel(activeFileCategory)} 파일 선택
              <input type="file" multiple onChange={handleFileAdd} className="hidden" />
            </label>

            {/* 파일 목록 — 카드 */}
            {files.filter((f) => f.category === activeFileCategory).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 py-8 text-center text-[13.5px] font-semibold text-gray-400">
                이 카테고리에 담긴 파일이 없어요.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200">
                {files
                  .filter((f) => f.category === activeFileCategory)
                  .map((file) => {
                    const ic = fileIconStyle(file.file.name);
                    return (
                      <div key={file.id} className="flex items-center gap-3 bg-white px-3.5 py-2.5">
                        <span
                          className="flex h-10 w-10 flex-none items-center justify-center rounded-xl text-[10px] font-black text-white"
                          style={{ backgroundColor: ic.bg }}
                        >
                          {ic.label}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14.5px] font-bold text-gray-900">{file.file.name}</div>
                          <div className="mt-0.5 text-[12px] font-semibold text-gray-500">
                            {formatFileSize(file.file.size)} · {getFileCategoryLabel(file.category)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleFileDelete(file.id)}
                          aria-label="파일 삭제"
                          className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
                            <path d="M6 6l12 12M6 18 18 6" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* 일정 추가 — 바텀 시트 */}
        {showScheduleForm && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-gray-900/40" onClick={() => setShowScheduleForm(false)} />
            <div className="relative max-h-[88vh] overflow-y-auto overscroll-contain rounded-t-3xl bg-white px-5 pb-8 pt-2 shadow-2xl">
              <div className="mx-auto mb-4 mt-2 h-1.5 w-10 rounded-full bg-gray-300" />
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[19px] font-extrabold text-gray-900">일정 추가</h3>
                <button
                  type="button"
                  onClick={() => setShowScheduleForm(false)}
                  aria-label="닫기"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
                    <path d="M6 6l12 12M6 18 18 6" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* 제목 */}
                <div>
                  <label className="mb-2 block text-[13px] font-extrabold text-gray-700">
                    일정 제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSchedule.title || ''}
                    onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="일정 제목을 입력하세요"
                  />
                </div>

                {/* 기간 */}
                <div>
                  <label className="mb-2 block text-[13px] font-extrabold text-gray-700">
                    기간 <span className="text-red-500">*</span>
                  </label>
                  {!startDate || !endDate ? (
                    <div className="rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-[14px] font-semibold text-gray-500">
                      프로젝트 기간을 먼저 설정해주세요.
                    </div>
                  ) : (
                    <>
                      <DatePicker
                        customInput={<DatePickerInput />}
                        selected={scheduleDateRange[0]}
                        onChange={handleScheduleDateRangeChange}
                        startDate={scheduleDateRange[0]}
                        endDate={scheduleDateRange[1]}
                        selectsRange
                        withPortal
                        minDate={startDate}
                        maxDate={endDate}
                        locale={ko as any}
                        dateFormat="yyyy-MM-dd"
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholderText="시작일 ~ 종료일을 선택하세요"
                      />
                      <p className="mt-1.5 text-[12px] font-semibold text-gray-400">
                        선택 가능한 기간: {format(startDate, 'yyyy-MM-dd')} ~ {format(endDate, 'yyyy-MM-dd')}
                      </p>
                    </>
                  )}
                </div>

                {/* 타입 — chip */}
                <div>
                  <label className="mb-2 block text-[13px] font-extrabold text-gray-700">타입</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'PROJECT', label: '프로젝트' },
                      { value: 'TEST_RUN', label: '시운전' },
                      { value: 'WIRING', label: '전기 배선' },
                      { value: 'DESIGN', label: '설계' },
                      { value: 'MEETING', label: '미팅' },
                    ].map((opt) => {
                      const on = (newSchedule.type || 'PROJECT') === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setNewSchedule({ ...newSchedule, type: opt.value })}
                          className={`rounded-xl border px-3.5 py-2.5 text-[13.5px] font-bold transition-colors ${
                            on ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-200 bg-white text-gray-500'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 참여자 — 체크박스 리스트 */}
                <div>
                  <label className="mb-2 block text-[13px] font-extrabold text-gray-700">참여자</label>
                  {users.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[13.5px] font-semibold text-gray-400">
                      등록된 사원이 없습니다.
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto overscroll-contain rounded-xl border border-gray-200">
                      {users.map((user, i) => {
                        const on = (newSchedule.memberIds || []).includes(user.id);
                        return (
                          <label
                            key={user.id}
                            className={`flex cursor-pointer items-center gap-3 px-3.5 py-2.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => {
                                const memberIds = newSchedule.memberIds || [];
                                setNewSchedule({
                                  ...newSchedule,
                                  memberIds: on
                                    ? memberIds.filter((id) => id !== user.id)
                                    : [...memberIds, user.id],
                                });
                              }}
                              className="h-4 w-4 flex-none rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary-500 text-[13px] font-extrabold text-white">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[14.5px] font-bold text-gray-900">{user.name}</span>
                              {user.position && (
                                <span className="block text-[12px] font-medium text-gray-500">{user.position}</span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {error && <p className="text-[13px] font-semibold text-red-500">{error}</p>}

                <button
                  type="button"
                  onClick={handleAddSchedule}
                  className="mt-1 w-full rounded-xl bg-primary-500 py-3.5 text-[16px] font-extrabold text-white shadow-lg shadow-primary-500/30 transition-transform active:scale-[0.99]"
                >
                  일정 추가
                </button>
              </div>
            </div>
          </div>
        )}

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
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '등록 중...' : '프로젝트 등록'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectCreatePage;

