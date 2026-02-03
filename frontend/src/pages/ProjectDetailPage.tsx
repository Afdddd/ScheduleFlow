import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import ColorPicker from '../components/ColorPicker';
import Alert from '../components/Alert';
import { useAuthStore } from '../stores/authStore';
import {
  getProjectDetail,
  updateProject,
  deleteProject,
  ProjectDetailResponse,
  ProjectUpdateRequest,
} from '../api/project';
import { getProjectFiles, downloadFile, deleteFile, uploadFile, FileResponse } from '../api/file';
import { createSchedule, deleteSchedule, ScheduleCreateRequest } from '../api/schedule';
import { getAllPartners, getPartnerContacts, PartnerContactResponse } from '../api/partner';
import { getAllUsers, UserListResponse } from '../api/user';
import { PartnerListResponse } from '../api/list';

/**
 * 프로젝트 상세 페이지
 *
 * 기능:
 * 1. 프로젝트 상세 정보 조회
 * 2. 프로젝트 수정 (ADMIN 권한)
 * 3. 프로젝트 삭제 (ADMIN 권한)
 * 4. 파일 목록 조회
 * 5. 파일 다운로드
 * 6. 파일 삭제 (ADMIN 권한)
 */
const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  // 프로젝트 데이터
  const [project, setProject] = useState<ProjectDetailResponse | null>(null);
  const [files, setFiles] = useState<FileResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 편집 모드
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // 편집 모드 상태 (프로젝트 등록 페이지와 동일한 구조)
  const [name, setName] = useState<string>('');
  const [clientId, setClientId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [status, setStatus] = useState<string>('IN_PROGRESS');
  const [description, setDescription] = useState<string>('');
  const [colorCode, setColorCode] = useState<string>('#3b82f6');

  // 편집 모드용 데이터
  const [partners, setPartners] = useState<PartnerListResponse[]>([]);
  const [partnerContacts, setPartnerContacts] = useState<PartnerContactResponse[]>([]);
  const [selectedPartnerContactIds, setSelectedPartnerContactIds] = useState<number[]>([]);
  const [users, setUsers] = useState<UserListResponse[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [loadingPartners, setLoadingPartners] = useState<boolean>(false);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [loadingContacts, setLoadingContacts] = useState<boolean>(false);

  // 일정 추가 폼
  const [showScheduleForm, setShowScheduleForm] = useState<boolean>(false);
  const [newScheduleTitle, setNewScheduleTitle] = useState<string>('');
  const [newScheduleType, setNewScheduleType] = useState<string>('PROJECT');
  const [newScheduleDateRange, setNewScheduleDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [newScheduleMemberIds, setNewScheduleMemberIds] = useState<number[]>([]);

  // 파일 업로드
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);

  // 파일 카테고리 탭
  const [activeFileCategory, setActiveFileCategory] = useState<string>('QUOTATION');

  // 프로젝트 데이터 로딩
  useEffect(() => {
    if (!id) return;

    const loadProject = async () => {
      setLoading(true);
      setError(null);
      try {
        const projectId = parseInt(id, 10);
        const [projectData, filesData] = await Promise.all([
          getProjectDetail(projectId),
          getProjectFiles(projectId),
        ]);
        setProject(projectData);
        setFiles(filesData);
      } catch (error: any) {
        console.error('프로젝트 로딩 실패:', error);
        if (error.response?.status === 404) {
          setError('프로젝트를 찾을 수 없습니다.');
        } else {
          setError('프로젝트 정보를 불러오는데 실패했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id]);

  // 편집 모드 진입 시 추가 데이터 로딩
    useEffect(() => {
        if (!isEditing) return;

        const loadEditData = async () => {
            setLoadingPartners(true);
            setLoadingUsers(true);
            try {
                const [partnersData, usersData] = await Promise.all([
                    getAllPartners(),
                    getAllUsers(),
                ]);
                setPartners(partnersData);
                setUsers(usersData);
            } catch (error) {
                console.error('거래처 및 사원 목록 로딩 실패:', error);
                setError('편집에 필요한 정보를 불러오는데 실패했습니다.');
            } finally {
                setLoadingPartners(false);
                setLoadingUsers(false);
            }
        };

        loadEditData();
    }, [isEditing]);

  // 거래처 선택 시 연락처 로딩
  useEffect(() => {
    if (!isEditing || !clientId) {
      setPartnerContacts([]);
      return;
    }

    const loadContacts = async () => {
      setLoadingContacts(true);
      try {
        const contactsData = await getPartnerContacts(clientId);
        setPartnerContacts(contactsData);
      } catch (error) {
        console.error('거래처 연락처 로딩 실패:', error);
        setPartnerContacts([]);
      } finally {
        setLoadingContacts(false);
      }
    };

    loadContacts();
  }, [isEditing, clientId]);

  // 프로젝트 데이터를 편집 모드 상태로 복사
  useEffect(() => {
    if (project && isEditing) {
      setName(project.name);
      setClientId(project.client.id);
      setStartDate(new Date(project.startDate));
      setEndDate(new Date(project.endDate));
      setDateRange([new Date(project.startDate), new Date(project.endDate)]);
      setStatus(project.status);
      setDescription(project.description || '');
      setColorCode(project.colorCode || '#3b82f6');
      setSelectedMemberIds(project.members.map((m) => m.id));
      setSelectedPartnerContactIds(project.partnerContacts.map((c) => c.partnerContactId));
    }
  }, [project, isEditing]);

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
    resetScheduleForm();
    // 원본 데이터로 복원
    if (project) {
      setName(project.name);
      setClientId(project.client.id);
      setStartDate(new Date(project.startDate));
      setEndDate(new Date(project.endDate));
      setDateRange([new Date(project.startDate), new Date(project.endDate)]);
      setStatus(project.status);
      setDescription(project.description || '');
      setColorCode(project.colorCode || '#3b82f6');
      setSelectedMemberIds(project.members.map((m) => m.id));
      setSelectedPartnerContactIds(project.partnerContacts.map((c) => c.partnerContactId));
    }
  };

  // 프로젝트 수정 저장
  const handleSave = async () => {
    if (!id || !startDate || !endDate) return;

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
    if (startDate > endDate) {
      setError('시작일이 종료일보다 늦을 수 없습니다.');
      return;
    }

    setLoading(true);

    try {
      const projectId = parseInt(id, 10);
      const updateRequest: ProjectUpdateRequest = {
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

      const updatedProject = await updateProject(projectId, updateRequest);
      setProject(updatedProject);
      setIsEditing(false);
      setError(null);
      resetScheduleForm();
    } catch (error: any) {
      console.error('프로젝트 수정 실패:', error);
      setError(error.response?.data?.message || '프로젝트 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 프로젝트 삭제
  const handleDelete = async () => {
    if (!id || !project) return;

    const scheduleCount = project.schedules.length;
    const fileCount = files.length;

    let confirmMessage = '정말로 이 프로젝트를 삭제하시겠습니까?\n\n';

    if (scheduleCount > 0 || fileCount > 0) {
      confirmMessage += '⚠️ 주의: 다음 연관 데이터가 함께 삭제됩니다:\n';
      if (scheduleCount > 0) {
        confirmMessage += `  - 일정 ${scheduleCount}개\n`;
      }
      if (fileCount > 0) {
        confirmMessage += `  - 파일 ${fileCount}개\n`;
      }
      confirmMessage += '\n';
    }

    confirmMessage += '이 작업은 되돌릴 수 없습니다.';

    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const projectId = parseInt(id, 10);
      await deleteProject(projectId);
      navigate('/projects');
    } catch (error: any) {
      console.error('프로젝트 삭제 실패:', error);
      setError(error.response?.data?.message || '프로젝트 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 파일 다운로드
  const handleFileDownload = async (fileId: number, fileName: string) => {
    try {
      const blob = await downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('파일 다운로드 실패:', error);
      setError('파일 다운로드에 실패했습니다.');
    }
  };

  // 파일 삭제
  const handleFileDelete = async (fileId: number) => {
    const confirmed = window.confirm('정말로 이 파일을 삭제하시겠습니까?');
    if (!confirmed) return;

    try {
      await deleteFile(fileId);
      setFiles(files.filter((f) => f.id !== fileId));
    } catch (error: any) {
      console.error('파일 삭제 실패:', error);
      setError(error.response?.data?.message || '파일 삭제에 실패했습니다.');
    }
  };

  // 프로젝트 데이터 새로고침
  const reloadProject = async () => {
    if (!id) return;
    try {
      const projectId = parseInt(id, 10);
      const [projectData, filesData] = await Promise.all([
        getProjectDetail(projectId),
        getProjectFiles(projectId),
      ]);
      setProject(projectData);
      setFiles(filesData);
    } catch (error) {
      console.error('프로젝트 새로고침 실패:', error);
    }
  };

  // 일정 추가 폼 초기화
  const resetScheduleForm = () => {
    setShowScheduleForm(false);
    setNewScheduleTitle('');
    setNewScheduleType('PROJECT');
    setNewScheduleDateRange([null, null]);
    setNewScheduleMemberIds([]);
  };

  // 일정 추가
  const handleScheduleAdd = async () => {
    if (!id || !newScheduleTitle.trim() || !newScheduleDateRange[0] || !newScheduleDateRange[1]) {
      setError('일정 제목과 기간을 입력해주세요.');
      return;
    }

    try {
      const request: ScheduleCreateRequest = {
        title: newScheduleTitle.trim(),
        scheduleType: newScheduleType,
        startDate: format(newScheduleDateRange[0], 'yyyy-MM-dd'),
        endDate: format(newScheduleDateRange[1], 'yyyy-MM-dd'),
        projectId: parseInt(id, 10),
        memberIds: newScheduleMemberIds.length > 0 ? newScheduleMemberIds : null,
      };
      await createSchedule(request);
      resetScheduleForm();
      await reloadProject();
    } catch (error: any) {
      console.error('일정 추가 실패:', error);
      setError(error.response?.data?.message || '일정 추가에 실패했습니다.');
    }
  };

  // 일정 삭제
  const handleScheduleDelete = async (scheduleId: number) => {
    const confirmed = window.confirm('정말로 이 일정을 삭제하시겠습니까?');
    if (!confirmed) return;

    try {
      await deleteSchedule(scheduleId);
      await reloadProject();
    } catch (error: any) {
      console.error('일정 삭제 실패:', error);
      setError(error.response?.data?.message || '일정 삭제에 실패했습니다.');
    }
  };

  // 파일 업로드
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setUploadingFile(true);

    try {
      const projectId = parseInt(id, 10);
      await uploadFile(projectId, file, activeFileCategory);
      const filesData = await getProjectFiles(projectId);
      setFiles(filesData);
    } catch (error: any) {
      console.error('파일 업로드 실패:', error);
      setError(error.response?.data?.message || '파일 업로드에 실패했습니다.');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  // 일정 추가 폼 멤버 토글
  const handleNewScheduleMemberToggle = (userId: number) => {
    setNewScheduleMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // 상태 라벨 변환
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'IN_PROGRESS':
        return '진행 중';
      case 'ON_HOLD':
        return '보류';
      case 'COMPLETE':
        return '완료';
      default:
        return status;
    }
  };

  // 상태 색상
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 일정 타입 라벨
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

  // 파일 카테고리 라벨
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

  // 파일 크기 포맷
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fileCategories = ['QUOTATION', 'DRAWING', 'PLC_PROGRAM', 'BOM', 'HMI_DESIGN'];

  if (loading && !project) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <Alert type="error" message={error || '프로젝트를 찾을 수 없습니다.'} />
        <button
          onClick={() => navigate('/projects')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          목록으로
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {project.colorCode && (
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: project.colorCode }}
            />
          )}
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
              project.status
            )}`}
          >
            {getStatusLabel(project.status)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            목록으로
          </button>
          {isAdmin && (
            <>
              {!isEditing ? (
                <>
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
              ) : (
                <>
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
                </>
              )}
            </>
          )}
        </div>
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

      {/* 상단 섹션: 기본 정보 및 메타 정보 (좌우 배치) */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* 좌측: 기본 정보 카드 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">기본 정보</h2>

          <div className="space-y-4">
            {/* 프로젝트 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트 이름</label>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="프로젝트 이름을 입력하세요"
                />
              ) : (
                <div className="px-4 py-2 text-gray-900">{project.name}</div>
              )}
            </div>

            {/* 거래처 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">거래처</label>
              {isEditing ? (
                <select
                  value={clientId || ''}
                  onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loadingPartners}
                >
                  <option value="">거래처를 선택하세요</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.companyName}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-4 py-2 text-gray-900">{project.client.companyName}</div>
              )}
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
              {isEditing ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="프로젝트 설명을 입력하세요"
                />
              ) : (
                <div className="px-4 py-2 text-gray-900 whitespace-pre-wrap min-h-[120px]">
                  {project.description || '-'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 우측: 메타 정보 카드 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">메타 정보</h2>

          <div className="space-y-4">
            {/* 기간 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">기간</label>
              {isEditing ? (
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
                />
              ) : (
                <div className="px-4 py-2 text-gray-900">
                  {project.startDate} ~ {project.endDate}
                </div>
              )}
            </div>

            {/* 상태 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
              {isEditing ? (
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="IN_PROGRESS">진행 중</option>
                  <option value="ON_HOLD">보류</option>
                  <option value="COMPLETE">완료</option>
                </select>
              ) : (
                <div className="px-4 py-2">
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {getStatusLabel(project.status)}
                  </span>
                </div>
              )}
            </div>

            {/* 색상 코드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">색상 코드</label>
              {isEditing ? (
                <ColorPicker value={colorCode} onChange={setColorCode} />
              ) : (
                <div className="flex flex-col gap-3">
                  {project.colorCode && (
                    <div className="flex items-center gap-3">
                      <div
                        className="w-16 h-16 rounded-lg border-2 border-gray-300 shadow-sm"
                        style={{ backgroundColor: project.colorCode }}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">프로젝트 색상</span>
                        <span className="text-xs text-gray-500 font-mono">
                          {project.colorCode}
                        </span>
                      </div>
                    </div>
                  )}
                  {!project.colorCode && (
                    <div className="text-sm text-gray-500">색상이 지정되지 않았습니다.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 중간 섹션: 팀 멤버 할당 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">팀 멤버 할당</h2>

        <div className="grid grid-cols-2 gap-6">
          {/* 사원(멤버) 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">사원(멤버)</label>
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
              )
            ) : (
              <div className="border border-gray-200 rounded-lg p-4">
                {project.members.length === 0 ? (
                  <div className="text-sm text-gray-500">할당된 멤버가 없습니다.</div>
                ) : (
                  <div className="space-y-2">
                    {project.members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
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

          {/* 거래처 연락처 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">거래처 연락처</label>
            {isEditing ? (
              !clientId ? (
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
              )
            ) : (
              <div className="border border-gray-200 rounded-lg p-4">
                {project.partnerContacts.length === 0 ? (
                  <div className="text-sm text-gray-500">할당된 연락처가 없습니다.</div>
                ) : (
                  <div className="space-y-2">
                    {project.partnerContacts.map((contact) => (
                      <div key={contact.partnerContactId}>
                        <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                        {contact.position && (
                          <div className="text-xs text-gray-500">{contact.position}</div>
                        )}
                        {contact.phone && (
                          <div className="text-xs text-gray-500">전화: {contact.phone}</div>
                        )}
                        {contact.email && (
                          <div className="text-xs text-gray-500">이메일: {contact.email}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 하단 섹션: 일정 및 파일 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">일정 및 파일</h2>

        {/* 일정 목록 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">일정</h3>
            {isEditing && (
              <button
                type="button"
                onClick={() => setShowScheduleForm(!showScheduleForm)}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {showScheduleForm ? '취소' : '일정 추가'}
              </button>
            )}
          </div>

          {/* 일정 추가 폼 */}
          {isEditing && showScheduleForm && (
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                  <input
                    type="text"
                    value={newScheduleTitle}
                    onChange={(e) => setNewScheduleTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="일정 제목"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">타입</label>
                  <select
                    value={newScheduleType}
                    onChange={(e) => setNewScheduleType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="PROJECT">프로젝트 일정</option>
                    <option value="TEST_RUN">시운전</option>
                    <option value="WIRING">전기 배선</option>
                    <option value="DESIGN">설계</option>
                    <option value="MEETING">미팅</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">기간</label>
                <DatePicker
                  selected={newScheduleDateRange[0]}
                  onChange={(dates: [Date | null, Date | null]) => setNewScheduleDateRange(dates)}
                  startDate={newScheduleDateRange[0]}
                  endDate={newScheduleDateRange[1]}
                  selectsRange
                  locale={ko as any}
                  dateFormat="yyyy-MM-dd"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholderText="시작일 ~ 종료일"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">참여자</label>
                <div className="border border-gray-200 rounded-lg p-2 max-h-32 overflow-y-auto bg-white">
                  {users.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center space-x-2 py-1 px-1 hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={newScheduleMemberIds.includes(u.id)}
                        onChange={() => handleNewScheduleMemberToggle(u.id)}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span>{u.name}</span>
                      {u.position && <span className="text-xs text-gray-400">({u.position})</span>}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleScheduleAdd}
                  className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  추가
                </button>
              </div>
            </div>
          )}

          {project.schedules.length === 0 && !showScheduleForm ? (
            <div className="text-sm text-gray-500 p-4 border border-gray-200 rounded-lg">
              등록된 일정이 없습니다.
            </div>
          ) : project.schedules.length > 0 ? (
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
                    {isEditing && (
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        작업
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {project.schedules.map((schedule) => (
                    <tr key={schedule.scheduleId}>
                      <td className="px-4 py-2 text-sm text-gray-900">{schedule.title}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {getScheduleTypeLabel(schedule.type)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {schedule.startDate} ~ {schedule.endDate}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {schedule.memberNames.length > 0
                          ? schedule.memberNames.join(', ')
                          : '-'}
                      </td>
                      {isEditing && (
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handleScheduleDelete(schedule.scheduleId)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            삭제
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        {/* 파일 목록 */}
        <div>
          <h3 className="text-lg font-semibold mb-2">파일</h3>

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

          {/* 파일 업로드 (편집 모드) */}
          {isEditing && (
            <div className="mb-4">
              <label className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-gray-600">
                  {uploadingFile ? '업로드 중...' : `${getFileCategoryLabel(activeFileCategory)} 파일 업로드`}
                </span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* 파일 목록 */}
          {files.filter((f) => f.category === activeFileCategory).length === 0 ? (
            <div className="text-sm text-gray-500 p-4 border border-gray-200 rounded-lg">
              등록된 파일이 없습니다.
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      파일명
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      크기
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
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {file.originalFileName}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {formatFileSize(file.fileSize)}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                file.id && handleFileDownload(file.id, file.originalFileName)
                              }
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              다운로드
                            </button>
                            {(isEditing || isAdmin) && file.id && (
                              <button
                                onClick={() => handleFileDelete(file.id!)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                삭제
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
