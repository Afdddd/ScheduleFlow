import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import ColorPicker from '../components/ColorPicker';
import Alert from '../components/Alert';
import { useAuthStore } from '../stores/authStore';
import { SCHEDULE_TYPES, scheduleTypeLabel, scheduleTypeAccent } from '../constants/scheduleTypes';
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
import { useIsMobile } from '../hooks/useMediaQuery';
import { useScrollLock } from '../hooks/useScrollLock';
import { useSmartBack } from '../hooks/useSmartBack';
import DatePickerInput from '../components/ui/DatePickerInput';

const inputCls =
  'h-[42px] w-full rounded-xl border border-gray-300 bg-white px-3.5 text-[14px] font-medium text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100';
const labelCls = 'mb-1.5 block text-[12.5px] font-bold text-gray-500';

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
  const isMobile = useIsMobile();
  const goBack = useSmartBack('/projects');

  // 프로젝트 데이터
  const [project, setProject] = useState<ProjectDetailResponse | null>(null);
  const [files, setFiles] = useState<FileResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
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

  // 일정 추가 바텀시트가 열려 있는 동안 배경 스크롤 잠금 (조기 return 위에서 호출)
  useScrollLock(isEditing && showScheduleForm);

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
  const getScheduleTypeLabel = (type: string): string => scheduleTypeLabel(type);

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

  // 일정 타입별 색상 (좌측 스트라이프 / 배지)
  const scheduleTypeStyle = scheduleTypeAccent;

  // 참여자 아바타 색상 팔레트
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
          <h1 className="flex-1 text-center text-[17px] font-extrabold tracking-tight text-gray-900">프로젝트 상세</h1>
          <span className="w-10" />
        </div>

        <div className="px-[18px]">
          {error && (
            <Alert type="error" message={error} dismissible onClose={() => setError(null)} style={{ marginBottom: '1rem' }} />
          )}

          {/* 히어로 */}
          <div className="flex items-center gap-2.5">
            <span className="h-3.5 w-3.5 flex-none rounded-[5px]" style={{ backgroundColor: project.colorCode ?? '#0B4EC4' }} />
            <span className={`rounded-full px-2.5 py-1 text-[12.5px] font-bold ${getStatusColor(project.status)}`}>
              {getStatusLabel(project.status)}
            </span>
          </div>
          <h2 className="mt-2.5 text-[23px] font-extrabold leading-tight tracking-tight text-gray-900">{project.name}</h2>

          {/* 정보 */}
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white px-4 shadow-sm">
            <MRow label="거래처" value={project.client?.companyName ?? '-'} />
            <MRow label="기간" value={`${project.startDate} ~ ${project.endDate}`} last={!project.description} />
            {project.description && <MRow label="설명" value={project.description} last />}
          </div>

          {/* 일정 */}
          <MSection title="일정" count={project.schedules.length} />
          {project.schedules.length === 0 ? (
            <MEmpty>등록된 일정이 없어요</MEmpty>
          ) : (
            <div className="flex flex-col gap-2.5">
              {project.schedules.map((s) => (
                <button
                  key={s.scheduleId}
                  onClick={() => navigate(`/schedules/${s.scheduleId}`)}
                  className="flex w-full items-stretch overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm active:scale-[0.99]"
                >
                  <span className="w-1.5 flex-none" style={{ backgroundColor: project.colorCode ?? '#0B4EC4' }} />
                  <span className="min-w-0 flex-1 px-4 py-3.5">
                    <span className="block truncate text-[15.5px] font-bold text-gray-900">{s.title}</span>
                    <span className="mt-1.5 flex items-center gap-2">
                      <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[12px] font-bold text-primary-700">{getScheduleTypeLabel(s.type)}</span>
                      <span className="text-[12.5px] font-semibold text-gray-400 tabular-nums">{s.startDate} – {s.endDate}</span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 담당자 */}
          <MSection title="담당자" count={project.members.length} />
          {project.members.length === 0 ? (
            <MEmpty>담당자가 없어요</MEmpty>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3">
                {project.members.map((m) => (
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
            </div>
          )}

          {/* 거래처 담당자 (전화 바로가기) */}
          {project.partnerContacts.length > 0 && (
            <>
              <MSection title="거래처 담당자" count={project.partnerContacts.length} />
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {project.partnerContacts.map((c, i) => (
                  <div key={c.partnerContactId} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-bold text-gray-900">
                        {c.name} <span className="text-[13px] font-semibold text-gray-400">· {c.companyName}</span>
                      </div>
                      {c.position && <div className="text-[12.5px] font-medium text-gray-500">{c.position}</div>}
                    </div>
                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-green-50 text-green-600"
                        aria-label={`${c.name} 전화`}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
                        </svg>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 파일 */}
          <MSection title="파일" count={files.length} />
          {files.length === 0 ? (
            <MEmpty>파일이 없어요</MEmpty>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {files.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => handleFileDownload(f.id, f.originalFileName)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left ${i > 0 ? 'border-t border-gray-100' : ''} active:bg-gray-50`}
                >
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-primary-50 text-primary-600">
                    <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6" />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-bold text-gray-900">{f.originalFileName}</span>
                    <span className="text-[12px] font-semibold text-gray-400">{formatFileSize(f.fileSize)}</span>
                  </span>
                  <svg className="h-5 w-5 flex-none text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                </button>
              ))}
            </div>
          )}

          {/* 관리자 액션 */}
          {isAdmin && (
            <div className="mt-6 flex gap-2.5">
              <button onClick={handleEdit} className="flex-1 rounded-2xl bg-primary-500 py-4 text-[16px] font-extrabold text-white shadow-sm active:scale-[0.99]">
                수정
              </button>
              <button onClick={handleDelete} className="flex-1 rounded-2xl border border-red-200 bg-white py-4 text-[16px] font-extrabold text-red-500 active:scale-[0.99]">
                삭제
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── 데스크톱 뷰 (+ 모바일 편집) ──
  const previewName = isEditing ? name : project.name;
  const previewClient = isEditing
    ? partners.find((p) => p.id === clientId)?.companyName ?? project.client.companyName
    : project.client.companyName;
  const previewStart = isEditing && startDate ? format(startDate, 'yyyy-MM-dd') : project.startDate;
  const previewEnd = isEditing && endDate ? format(endDate, 'yyyy-MM-dd') : project.endDate;
  const previewStatus = isEditing ? status : project.status;
  const previewColor = isEditing ? colorCode : project.colorCode ?? '#0B4EC4';
  const memberCount = isEditing ? selectedMemberIds.length : project.members.length;
  const contactCount = isEditing ? selectedPartnerContactIds.length : project.partnerContacts.length;

  return (
    <div className="mx-auto max-w-[1080px] px-5 py-6 sm:px-6">
      <button
        onClick={() => navigate('/projects')}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-gray-500 transition-colors hover:text-gray-800"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        프로젝트 목록으로
      </button>

      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <span className="h-3.5 w-3.5 flex-none rounded-[5px]" style={{ backgroundColor: previewColor }} />
        <h1 className="text-[22px] font-extrabold tracking-tight text-gray-900">{previewName || '프로젝트'}</h1>
        <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${getStatusColor(previewStatus)}`}>
          {getStatusLabel(previewStatus)}
        </span>
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
                    프로젝트 이름 <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="프로젝트 이름을 입력하세요" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>
                      거래처 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={clientId || ''}
                      onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : null)}
                      className={inputCls}
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
                </div>
                <div>
                  <label className={labelCls}>상태</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { v: 'IN_PROGRESS', l: '진행 중' },
                      { v: 'ON_HOLD', l: '보류' },
                      { v: 'COMPLETE', l: '완료' },
                    ].map((o) => {
                      const on = status === o.v;
                      return (
                        <button
                          key={o.v}
                          type="button"
                          onClick={() => setStatus(o.v)}
                          className={`rounded-xl border px-3.5 py-2.5 text-[13.5px] font-bold transition-colors ${
                            on ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-200 bg-white text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {o.l}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>색상</label>
                  <ColorPicker value={colorCode} onChange={setColorCode} />
                </div>
                <div>
                  <label className={labelCls}>설명</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className={`${inputCls} h-auto py-2.5 leading-relaxed`}
                    placeholder="프로젝트 설명을 입력하세요"
                  />
                </div>
              </div>
            ) : (
              <dl className="divide-y divide-gray-100">
                <DRow label="거래처" value={project.client.companyName} />
                <DRow label="기간" value={`${project.startDate} ~ ${project.endDate}`} mono />
                <DRow
                  label="상태"
                  value={
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[12px] font-bold ${getStatusColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  }
                />
                <DRow
                  label="색상"
                  value={
                    project.colorCode ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded" style={{ backgroundColor: project.colorCode }} />
                        <span className="tabular-nums text-gray-600">{project.colorCode}</span>
                      </span>
                    ) : (
                      '-'
                    )
                  }
                />
                <DRow label="설명" value={project.description || '-'} preLine />
              </dl>
            )}
          </section>

          {/* 팀 구성 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 text-[15.5px] font-extrabold tracking-tight text-gray-900">팀 구성</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {/* 담당자(사원) */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500">담당자</span>
                  {memberCount > 0 && <span className="text-[12px] font-bold text-gray-400">{memberCount}</span>}
                </div>
                {isEditing ? (
                  loadingUsers ? (
                    <div className="rounded-xl border border-gray-200 px-4 py-3 text-[13px] font-semibold text-gray-400">로딩 중…</div>
                  ) : users.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 px-4 py-3 text-[13px] font-semibold text-gray-400">등록된 사원이 없습니다.</div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto overscroll-contain rounded-xl border border-gray-200">
                      {users.map((u, i) => {
                        const on = selectedMemberIds.includes(u.id);
                        return (
                          <label key={u.id} className={`flex cursor-pointer items-center gap-3 px-3.5 py-2.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => handleMemberToggle(u.id)}
                              className="h-4 w-4 flex-none rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary-500 text-[13px] font-extrabold text-white">
                              {u.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[14px] font-bold text-gray-900">{u.name}</span>
                              {u.position && <span className="block text-[12px] font-medium text-gray-500">{u.position}</span>}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )
                ) : project.members.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center text-[13px] font-semibold text-gray-400">할당된 멤버가 없어요.</div>
                ) : (
                  <div className="space-y-2.5">
                    {project.members.map((member, i) => (
                      <div key={member.id} className="flex items-center gap-3 rounded-xl border border-gray-200 px-3.5 py-2.5">
                        <span
                          className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[13px] font-bold text-white"
                          style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-extrabold text-gray-900">{member.name}</div>
                          {member.position && <div className="text-[12px] font-semibold text-gray-500">{member.position}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 거래처 담당자 */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-500">거래처 담당자</span>
                  {contactCount > 0 && <span className="text-[12px] font-bold text-gray-400">{contactCount}</span>}
                </div>
                {isEditing ? (
                  !clientId ? (
                    <div className="rounded-xl border border-gray-200 px-4 py-3 text-[13px] font-semibold text-gray-400">거래처를 먼저 선택해주세요.</div>
                  ) : loadingContacts ? (
                    <div className="rounded-xl border border-gray-200 px-4 py-3 text-[13px] font-semibold text-gray-400">로딩 중…</div>
                  ) : partnerContacts.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 px-4 py-3 text-[13px] font-semibold text-gray-400">등록된 연락처가 없습니다.</div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto overscroll-contain rounded-xl border border-gray-200">
                      {partnerContacts.map((contact, i) => {
                        const on = selectedPartnerContactIds.includes(contact.id);
                        return (
                          <label key={contact.id} className={`flex cursor-pointer items-center gap-3 px-3.5 py-2.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => handlePartnerContactToggle(contact.id)}
                              className="h-4 w-4 flex-none rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[14px] font-bold text-gray-900">{contact.name}</span>
                              {contact.position && <span className="block text-[12px] font-medium text-gray-500">{contact.position}</span>}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )
                ) : project.partnerContacts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center text-[13px] font-semibold text-gray-400">할당된 연락처가 없어요.</div>
                ) : (
                  <div className="space-y-2.5">
                    {project.partnerContacts.map((contact) => (
                      <div key={contact.partnerContactId} className="rounded-xl border border-gray-200 px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[14px] font-extrabold text-gray-900">{contact.name}</span>
                          {contact.position && <span className="flex-none rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600">{contact.position}</span>}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12.5px] font-semibold text-gray-500">
                          {contact.companyName && <span>{contact.companyName}</span>}
                          {contact.phone && <span className="tabular-nums">{contact.phone}</span>}
                          {contact.email && <span className="truncate">{contact.email}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 일정 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <h2 className="text-[15.5px] font-extrabold tracking-tight text-gray-900">일정</h2>
              {project.schedules.length > 0 && (
                <span className="inline-grid h-5 min-w-[20px] place-items-center rounded-full bg-primary-50 px-1.5 text-[11.5px] font-extrabold text-primary-600">
                  {project.schedules.length}
                </span>
              )}
              <div className="flex-1" />
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setShowScheduleForm(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3.5 py-2 text-[13px] font-bold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  일정 추가
                </button>
              )}
            </div>

          {project.schedules.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 py-8 text-center text-[13.5px] font-semibold text-gray-400">
              등록된 일정이 없어요.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200">
              {project.schedules.map((schedule) => {
                const st = scheduleTypeStyle(schedule.type);
                return (
                  <div key={schedule.scheduleId} className="relative flex gap-3 bg-white px-3.5 py-3.5">
                    <span className={`w-1 flex-none rounded ${st.stripe}`} />
                    <div className="min-w-0 flex-1">
                      <div className={`flex items-center gap-2 ${isEditing ? 'pr-8' : ''}`}>
                        <span className="truncate text-[15px] font-extrabold text-gray-900">{schedule.title}</span>
                        <span className={`flex-none rounded-full px-2 py-0.5 text-[11px] font-extrabold ${st.pill}`}>
                          {getScheduleTypeLabel(schedule.type)}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-gray-500">
                        <svg className="h-3.5 w-3.5 flex-none text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
                          <path d="M8 2.5v4M16 2.5v4M3 10h18" />
                        </svg>
                        <span className="tabular-nums">{schedule.startDate} ~ {schedule.endDate}</span>
                      </div>
                      {schedule.memberNames.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex">
                            {schedule.memberNames.slice(0, 3).map((name, idx) => (
                              <span
                                key={idx}
                                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[10px] font-extrabold text-white"
                                style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length], marginLeft: idx === 0 ? 0 : -7 }}
                              >
                                {name.charAt(0)}
                              </span>
                            ))}
                          </div>
                          <span className="text-[12px] font-bold text-gray-600">
                            {schedule.memberNames.length <= 2
                              ? schedule.memberNames.join(', ')
                              : `${schedule.memberNames[0]} 외 ${schedule.memberNames.length - 1}명`}
                          </span>
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleScheduleDelete(schedule.scheduleId)}
                        aria-label="일정 삭제"
                        className="absolute right-1.5 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
                          <path d="M6 6l12 12M6 18 18 6" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          </section>

          {/* 파일 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <h2 className="text-[15.5px] font-extrabold tracking-tight text-gray-900">파일</h2>
              {files.length > 0 && (
                <span className="inline-grid h-5 min-w-[20px] place-items-center rounded-full bg-primary-50 px-1.5 text-[11.5px] font-extrabold text-primary-600">
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

          {/* 업로드 드롭존 (편집 모드) */}
          {isEditing && (
            <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50 px-4 py-4 text-[14px] font-extrabold text-primary-600 transition-colors hover:bg-primary-100">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M12 16V4M7 9l5-5 5 5" />
                <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
              </svg>
              {uploadingFile ? '업로드 중...' : `${getFileCategoryLabel(activeFileCategory)} 파일 업로드`}
              <input type="file" onChange={handleFileUpload} disabled={uploadingFile} className="hidden" />
            </label>
          )}

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
                  const ic = fileIconStyle(file.originalFileName);
                  return (
                    <div key={file.id} className="flex items-center gap-3 bg-white px-3.5 py-2.5">
                      <span
                        className="flex h-10 w-10 flex-none items-center justify-center rounded-xl text-[10px] font-black text-white"
                        style={{ backgroundColor: ic.bg }}
                      >
                        {ic.label}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14.5px] font-bold text-gray-900">{file.originalFileName}</div>
                        <div className="mt-0.5 text-[12px] font-semibold text-gray-500">
                          {formatFileSize(file.fileSize)} · {getFileCategoryLabel(file.category)}
                        </div>
                      </div>
                      <div className="flex flex-none items-center gap-1">
                        <button
                          type="button"
                          onClick={() => file.id && handleFileDownload(file.id, file.originalFileName)}
                          aria-label="다운로드"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-600 hover:bg-primary-50"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                          </svg>
                        </button>
                        {(isEditing || isAdmin) && file.id && (
                          <button
                            type="button"
                            onClick={() => handleFileDelete(file.id!)}
                            aria-label="파일 삭제"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-red-500"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
                              <path d="M6 6l12 12M6 18 18 6" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
          </section>
        </div>

        {/* 우: 요약 + 액션 레일 */}
        <div className="mt-4 space-y-3.5 lg:sticky lg:top-4 lg:mt-0">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-[18px] pt-3.5 text-[11.5px] font-extrabold tracking-wide text-gray-400">프로젝트</div>
            <div className="flex items-center gap-2.5 border-b border-gray-200 px-[18px] pb-3.5 pt-1.5">
              <span className="h-3.5 w-3.5 flex-none rounded-[5px]" style={{ backgroundColor: previewColor }} />
              <span className="truncate text-[15px] font-extrabold tracking-tight text-gray-900">{previewName || '프로젝트명'}</span>
            </div>
            <RailRow label="거래처" value={previewClient || '—'} />
            <RailRow label="기간" value={`${previewStart} ~ ${previewEnd}`} mono />
            <RailRow label="상태" value={getStatusLabel(previewStatus)} />
            <RailRow label="담당자" value={`${memberCount}명`} />
            <RailRow label="일정" value={`${project.schedules.length}개`} />
            <RailRow label="파일" value={`${files.length}개`} last />
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

      {/* 일정 추가 — 바텀 시트 */}
      {isEditing && showScheduleForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setShowScheduleForm(false)} />
          <div className="relative max-h-[88vh] w-full overflow-y-auto overscroll-contain rounded-t-3xl bg-white px-5 pb-8 pt-2 shadow-2xl sm:max-w-[560px] sm:rounded-2xl">
            <div className="mx-auto mb-4 mt-2 h-1.5 w-10 rounded-full bg-gray-300 sm:hidden" />
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
              <div>
                <label className="mb-2 block text-[13px] font-extrabold text-gray-700">
                  일정 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newScheduleTitle}
                  onChange={(e) => setNewScheduleTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="일정 제목을 입력하세요"
                />
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-extrabold text-gray-700">
                  기간 <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  customInput={<DatePickerInput />}
                  selected={newScheduleDateRange[0]}
                  onChange={(dates: [Date | null, Date | null]) => setNewScheduleDateRange(dates)}
                  startDate={newScheduleDateRange[0]}
                  endDate={newScheduleDateRange[1]}
                  selectsRange
                  withPortal
                  locale={ko as any}
                  dateFormat="yyyy-MM-dd"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholderText="시작일 ~ 종료일을 선택하세요"
                />
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-extrabold text-gray-700">타입</label>
                <div className="flex flex-wrap gap-2">
                  {SCHEDULE_TYPES.map((t) => ({ value: t.value, label: t.shortLabel })).map((opt) => {
                    const on = newScheduleType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNewScheduleType(opt.value)}
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

              <div>
                <label className="mb-2 block text-[13px] font-extrabold text-gray-700">참여자</label>
                {users.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[13.5px] font-semibold text-gray-400">
                    등록된 사원이 없습니다.
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto overscroll-contain rounded-xl border border-gray-200">
                    {users.map((u, i) => {
                      const on = newScheduleMemberIds.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className={`flex cursor-pointer items-center gap-3 px-3.5 py-2.5 ${i > 0 ? 'border-t border-gray-100' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => handleNewScheduleMemberToggle(u.id)}
                            className="h-4 w-4 flex-none rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary-500 text-[13px] font-extrabold text-white">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[14.5px] font-bold text-gray-900">{u.name}</span>
                            {u.position && (
                              <span className="block text-[12px] font-medium text-gray-500">{u.position}</span>
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
                onClick={handleScheduleAdd}
                className="mt-1 w-full rounded-xl bg-primary-500 py-3.5 text-[16px] font-extrabold text-white shadow-lg shadow-primary-500/30 transition-transform active:scale-[0.99]"
              >
                일정 추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---- 모바일 상세 공용 조각 ---- */
const MRow: React.FC<{ label: string; value: string; last?: boolean }> = ({ label, value, last }) => (
  <div className={`flex gap-3 py-3.5 ${last ? '' : 'border-b border-gray-100'}`}>
    <span className="w-16 flex-none text-[13px] font-semibold text-gray-400">{label}</span>
    <span className="min-w-0 flex-1 whitespace-pre-wrap text-[15px] font-bold text-gray-900">{value}</span>
  </div>
);

const MSection: React.FC<{ title: string; count?: number }> = ({ title, count }) => (
  <div className="mb-2 mt-5 flex items-baseline gap-2 px-0.5">
    <span className="text-[15px] font-extrabold text-gray-900">{title}</span>
    {count !== undefined && <span className="text-[13px] font-bold text-gray-400">{count}</span>}
  </div>
);

const MEmpty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-2xl border border-dashed border-gray-300 py-8 text-center text-[13.5px] font-semibold text-gray-400">
    {children}
  </div>
);

/* ---- 데스크톱 조각 ---- */
/** 데스크톱 읽기 모드 정보 행. */
const DRow: React.FC<{ label: string; value: React.ReactNode; mono?: boolean; preLine?: boolean }> = ({ label, value, mono, preLine }) => (
  <div className="flex gap-4 py-3">
    <span className="w-20 flex-none text-[13px] font-bold text-gray-400">{label}</span>
    <span className={`min-w-0 flex-1 text-[14px] font-semibold text-gray-800 ${mono ? 'tabular-nums' : ''} ${preLine ? 'whitespace-pre-wrap' : ''}`}>{value}</span>
  </div>
);

/** 우측 요약 레일 행. */
const RailRow: React.FC<{ label: string; value: string; mono?: boolean; last?: boolean }> = ({ label, value, mono, last }) => (
  <div className={`flex items-center justify-between gap-3 px-[18px] py-2.5 ${last ? '' : 'border-b border-gray-200'}`}>
    <span className="flex-none text-[12.5px] font-bold text-gray-400">{label}</span>
    <span className={`truncate text-[13px] font-bold text-gray-800 ${mono ? 'tabular-nums' : ''}`}>{value}</span>
  </div>
);

export default ProjectDetailPage;
