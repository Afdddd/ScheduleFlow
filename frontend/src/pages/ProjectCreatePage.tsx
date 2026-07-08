import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ko } from 'date-fns/locale';
import Alert from '../components/Alert';
import { createProject, ProjectCreateRequest } from '../api/project';
import { getAllPartners, getPartnerContacts, PartnerContactResponse } from '../api/partner';
import { getAllUsers, UserListResponse } from '../api/user';
import { createSchedule, ScheduleCreateRequest } from '../api/schedule';
import { uploadFile } from '../api/file';
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

// 대표 색상 프리셋(스와치) — 목록 색 점/캘린더와 톤 통일.
const COLOR_SWATCHES = ['#0B4EC4', '#12805C', '#6B46C1', '#A3610C', '#C1352F', '#0EA5E9'];
const STATUS_OPTS = [
  { v: 'IN_PROGRESS', l: '진행 중' },
  { v: 'ON_HOLD', l: '보류' },
  { v: 'COMPLETE', l: '완료' },
];
const TYPE_OPTS = [
  { v: 'PROJECT', l: '프로젝트' },
  { v: 'TEST_RUN', l: '시운전' },
  { v: 'WIRING', l: '전기 배선' },
  { v: 'DESIGN', l: '설계' },
  { v: 'MEETING', l: '미팅' },
];
const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  IN_PROGRESS: { label: '진행 중', cls: 'text-primary-600 bg-primary-50' },
  ON_HOLD: { label: '보류', cls: 'text-amber-700 bg-amber-50' },
  COMPLETE: { label: '완료', cls: 'text-green-700 bg-green-50' },
};

// 공통 폼 클래스
const inputCls =
  'h-[42px] w-full rounded-xl border border-gray-300 bg-white px-3.5 text-[14px] font-medium text-gray-900 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100';
const labelCls = 'mb-1.5 block text-[12.5px] font-bold text-gray-500';
const segWrap = 'inline-flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1';
const segCls = (on: boolean) =>
  on
    ? 'rounded-lg bg-primary-500 px-3.5 py-2 text-[13px] font-bold text-white shadow-sm'
    : 'rounded-lg px-3.5 py-2 text-[13px] font-bold text-gray-500 transition-colors hover:text-gray-700';

/**
 * 프로젝트 등록 페이지 (데스크톱: 좌측 입력 + 우측 고정 요약 레일 / 모바일: 단일단 + 하단 시트)
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
  const [colorCode, setColorCode] = useState<string>('#0B4EC4');

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
  const [scheduleDateRange, setScheduleDateRange] = useState<[Date | null, Date | null]>([null, null]);
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
    if (dates[0]) setStartDate(dates[0]);
    if (dates[1]) setEndDate(dates[1]);
  };

  // 거래처 연락처 체크박스 핸들러
  const handlePartnerContactToggle = (contactId: number) => {
    setSelectedPartnerContactIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  // 멤버 체크박스 핸들러
  const handleMemberToggle = (userId: number) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // 일정 날짜 범위 변경 핸들러
  const handleScheduleDateRangeChange = (dates: [Date | null, Date | null]) => {
    setScheduleDateRange(dates);
    if (dates[0]) setNewSchedule({ ...newSchedule, startDate: dates[0] });
    if (dates[1]) setNewSchedule({ ...newSchedule, endDate: dates[1] });
  };

  // 일정 추가
  const handleAddSchedule = () => {
    if (!newSchedule.title || !newSchedule.startDate || !newSchedule.endDate) {
      setError('일정 제목, 시작일, 종료일을 모두 입력해주세요.');
      return;
    }
    if (!startDate || !endDate) {
      setError('프로젝트 기간을 먼저 설정해주세요.');
      return;
    }
    if (newSchedule.startDate! < startDate) {
      setError('일정 시작일은 프로젝트 시작일보다 빠를 수 없습니다.');
      return;
    }
    if (newSchedule.endDate! > endDate) {
      setError('일정 종료일은 프로젝트 종료일보다 늦을 수 없습니다.');
      return;
    }
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
    setNewSchedule({ title: '', startDate: new Date(), endDate: new Date(), type: 'PROJECT', memberIds: [] });
    setScheduleDateRange([null, null]);
    setShowScheduleForm(false);
    setError(null);
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

      for (const file of files) {
        await uploadFile(projectId, file.file, file.category);
      }

      navigate(`/projects/${projectId}`);
    } catch (error: any) {
      console.error('프로젝트 생성 실패:', error);
      setError(error.response?.data?.message || '프로젝트 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const getScheduleTypeLabel = (type: string): string =>
    TYPE_OPTS.find((o) => o.v === type)?.l ?? type;

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

  // 참여자 아바타 색상 팔레트
  const AVATAR_COLORS = ['#0B4EC4', '#1B9E5A', '#8B5CF6', '#C6771A', '#E5484D', '#0EA5E9'];

  // 파일 확장자 → 아이콘 라벨/색
  const fileIconStyle = (filename: string): { label: string; bg: string } => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return { label: 'PDF', bg: '#E5484D' };
    if (['dwg', 'dxf'].includes(ext)) return { label: 'DWG', bg: '#0B4EC4' };
    if (['xls', 'xlsx', 'csv'].includes(ext)) return { label: 'XLS', bg: '#177245' };
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext)) return { label: 'IMG', bg: '#1B9E5A' };
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

  // 일정 추가 시트가 열려 있는 동안 배경 스크롤 잠금
  useScrollLock(showScheduleForm);

  // 선택 리스트 한 행(멤버/참여자 공통)
  const pickRow = (user: UserListResponse, i: number, checked: boolean, onToggle: () => void) => (
    <label
      key={user.id}
      className={`relative flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-2.5 last:border-b-0 ${
        checked ? 'bg-primary-50/60' : 'hover:bg-gray-50'
      }`}
    >
      <input type="checkbox" checked={checked} onChange={onToggle} className="sr-only" />
      <span
        className={`flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[6px] border transition-colors ${
          checked ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-300'
        }`}
      >
        {checked && (
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

  const clientName = partners.find((p) => p.id === clientId)?.companyName;
  const statusChip = STATUS_CHIP[status];

  return (
    <div className="mx-auto max-w-[1080px] px-5 py-6 sm:px-6">
      {/* 상단 */}
      <button
        onClick={() => navigate('/projects')}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-gray-500 transition-colors hover:text-gray-800"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        프로젝트 목록으로
      </button>
      <div className="mb-5">
        <h1 className="text-[22px] font-extrabold tracking-tight text-gray-900">새 프로젝트</h1>
        <p className="mt-1 text-[13.5px] font-semibold text-gray-400">기본 정보와 팀·일정·파일을 한 화면에서 등록합니다.</p>
      </div>

      {error && <Alert type="error" message={error} dismissible onClose={() => setError(null)} style={{ marginBottom: '1.25rem' }} />}

      <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-5">
        {/* 좌: 입력 */}
        <div className="min-w-0 space-y-4 lg:space-y-5">
          {/* 기본 정보 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-[15.5px] font-extrabold tracking-tight text-gray-900">기본 정보</h2>
            <p className="mb-5 mt-0.5 text-[12.5px] font-semibold text-gray-400">프로젝트를 식별하는 핵심 정보입니다.</p>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>
                  프로젝트 이름 <span className="text-red-500">*</span>
                </label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="프로젝트 이름을 입력하세요" required />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>
                    거래처 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={clientId || ''}
                      onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : null)}
                      className={`${inputCls} cursor-pointer appearance-none pr-9`}
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
                    <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
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
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>상태</label>
                <div className={segWrap}>
                  {STATUS_OPTS.map((o) => (
                    <button key={o.v} type="button" onClick={() => setStatus(o.v)} className={segCls(status === o.v)}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>대표 색상</label>
                <div className="flex flex-wrap gap-2.5">
                  {COLOR_SWATCHES.map((c) => {
                    const on = colorCode.toUpperCase() === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColorCode(c)}
                        aria-label={`색상 ${c}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform hover:scale-105"
                        style={{ backgroundColor: c, boxShadow: on ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : undefined }}
                      >
                        {on && (
                          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={labelCls}>설명</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className={`${inputCls} h-auto py-2.5 leading-relaxed`}
                  placeholder="프로젝트 설명을 입력하세요"
                />
              </div>
            </div>
          </section>

          {/* 팀 & 연락처 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-[15.5px] font-extrabold tracking-tight text-gray-900">팀 · 거래처 연락처</h2>
            <p className="mb-5 mt-0.5 text-[12.5px] font-semibold text-gray-400">프로젝트에 참여할 사원과 거래처 담당자를 고릅니다.</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelCls}>사원(멤버)</label>
                {loadingUsers ? (
                  <div className="rounded-xl border border-gray-200 p-4 text-sm font-semibold text-gray-400">로딩 중…</div>
                ) : users.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 p-4 text-sm font-semibold text-gray-400">등록된 사원이 없습니다.</div>
                ) : (
                  <div className="max-h-[220px] overflow-y-auto rounded-xl border border-gray-200">
                    {users.map((user, i) => pickRow(user, i, selectedMemberIds.includes(user.id), () => handleMemberToggle(user.id)))}
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>거래처 연락처</label>
                {!clientId ? (
                  <div className="rounded-xl border border-gray-200 p-4 text-sm font-semibold text-gray-400">거래처를 먼저 선택해주세요.</div>
                ) : loadingContacts ? (
                  <div className="rounded-xl border border-gray-200 p-4 text-sm font-semibold text-gray-400">로딩 중…</div>
                ) : partnerContacts.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 p-4 text-sm font-semibold text-gray-400">등록된 연락처가 없습니다.</div>
                ) : (
                  <div className="max-h-[220px] overflow-y-auto rounded-xl border border-gray-200">
                    {partnerContacts.map((contact) => {
                      const on = selectedPartnerContactIds.includes(contact.id);
                      return (
                        <label
                          key={contact.id}
                          className={`relative flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-2.5 last:border-b-0 ${
                            on ? 'bg-primary-50/60' : 'hover:bg-gray-50'
                          }`}
                        >
                          <input type="checkbox" checked={on} onChange={() => handlePartnerContactToggle(contact.id)} className="sr-only" />
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
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13.5px] font-bold text-gray-900">{contact.name}</span>
                            {contact.position && <span className="block truncate text-[11.5px] font-semibold text-gray-400">{contact.position}</span>}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 일정 */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <h2 className="text-[15.5px] font-extrabold tracking-tight text-gray-900">일정</h2>
              {schedules.length > 0 && (
                <span className="inline-grid h-5 min-w-[20px] place-items-center rounded-full bg-primary-50 px-1.5 text-[11.5px] font-extrabold text-primary-600">
                  {schedules.length}
                </span>
              )}
              <div className="flex-1" />
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
            </div>

            {schedules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 py-8 text-center text-[13px] font-semibold text-gray-400">
                등록된 일정이 없어요. ‘일정 추가’로 넣어보세요.
              </div>
            ) : (
              <div className="space-y-2.5">
                {schedules.map((schedule) => {
                  const st = scheduleTypeStyle(schedule.type);
                  const members = users.filter((u) => schedule.memberIds.includes(u.id));
                  return (
                    <div key={schedule.id} className="relative flex gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-3">
                      <span className={`w-1 flex-none rounded ${st.stripe}`} />
                      <div className="min-w-0 flex-1 pr-7">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[14px] font-extrabold text-gray-900">{schedule.title}</span>
                          <span className={`flex-none rounded-full px-2 py-0.5 text-[11px] font-extrabold ${st.pill}`}>{getScheduleTypeLabel(schedule.type)}</span>
                        </div>
                        <div className="mt-1.5 text-[12.5px] font-semibold text-gray-500 tabular-nums">
                          {format(schedule.startDate, 'yyyy.MM.dd')} ~ {format(schedule.endDate, 'yyyy.MM.dd')}
                        </div>
                        {members.length > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex">
                              {members.slice(0, 3).map((m, idx) => (
                                <span
                                  key={m.id}
                                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[10px] font-extrabold text-white"
                                  style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length], marginLeft: idx === 0 ? 0 : -7 }}
                                >
                                  {m.name.charAt(0)}
                                </span>
                              ))}
                            </div>
                            <span className="text-[12px] font-bold text-gray-600">
                              {members.length <= 2 ? members.map((m) => m.name).join(', ') : `${members[0].name} 외 ${members.length - 1}명`}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        aria-label="일정 삭제"
                        className="absolute right-2 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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

            <div className="mb-3 flex flex-wrap gap-2">
              {fileCategories.map((category) => {
                const active = activeFileCategory === category;
                const count = files.filter((f) => f.category === category).length;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveFileCategory(category)}
                    className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-[12.5px] font-bold transition-colors ${
                      active ? 'border-primary-500 bg-primary-500 text-white shadow-sm shadow-primary-500/25' : 'border-gray-200 bg-white text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {getFileCategoryLabel(category)}
                    {count > 0 && <span className={`ml-1.5 ${active ? 'text-white/80' : 'text-gray-400'}`}>{count}</span>}
                  </button>
                );
              })}
            </div>

            <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50 px-4 py-4 text-[13.5px] font-bold text-primary-600 transition-colors hover:bg-primary-100">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M12 16V4M7 9l5-5 5 5" />
                <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
              </svg>
              {getFileCategoryLabel(activeFileCategory)} 파일 선택
              <input type="file" multiple onChange={handleFileAdd} className="hidden" />
            </label>

            {files.filter((f) => f.category === activeFileCategory).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 py-8 text-center text-[13px] font-semibold text-gray-400">
                이 카테고리에 담긴 파일이 없어요.
              </div>
            ) : (
              <div className="space-y-2">
                {files
                  .filter((f) => f.category === activeFileCategory)
                  .map((file) => {
                    const ic = fileIconStyle(file.file.name);
                    return (
                      <div key={file.id} className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5">
                        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-[10px] font-black text-white" style={{ backgroundColor: ic.bg }}>
                          {ic.label}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13.5px] font-bold text-gray-900">{file.file.name}</div>
                          <div className="mt-0.5 text-[12px] font-semibold text-gray-400 tabular-nums">
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
          </section>
        </div>

        {/* 우: 요약 + 액션 레일 */}
        <div className="mt-4 space-y-3.5 lg:sticky lg:top-4 lg:mt-0">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-[18px] pt-3.5 text-[11.5px] font-extrabold tracking-wide text-gray-400">미리보기</div>
            <div className="flex items-center gap-2.5 border-b border-gray-200 px-[18px] pb-3.5 pt-1.5">
              <span className="h-[11px] w-[11px] flex-none rounded-full" style={{ backgroundColor: colorCode }} />
              <span className="truncate text-[15px] font-extrabold tracking-tight text-gray-900">{name || '프로젝트 이름'}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-[18px] py-2.5">
              <span className="text-[12.5px] font-bold text-gray-400">거래처</span>
              <span className="truncate text-[13px] font-bold text-gray-800">{clientName || '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-[18px] py-2.5">
              <span className="text-[12.5px] font-bold text-gray-400">기간</span>
              <span className="text-[13px] font-bold text-gray-800 tabular-nums">
                {startDate && endDate ? `${format(startDate, 'MM.dd')} ~ ${format(endDate, 'MM.dd')}` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-[18px] py-2.5">
              <span className="text-[12.5px] font-bold text-gray-400">상태</span>
              <span className={`inline-flex h-[22px] items-center rounded-full px-2.5 text-[12px] font-bold ${statusChip.cls}`}>{statusChip.label}</span>
            </div>
            <div className="flex">
              {[
                { n: selectedMemberIds.length, l: '멤버' },
                { n: schedules.length, l: '일정' },
                { n: files.length, l: '파일' },
              ].map((c, i) => (
                <div key={c.l} className={`flex-1 py-3 text-center ${i < 2 ? 'border-r border-gray-200' : ''}`}>
                  <div className="text-[18px] font-extrabold text-gray-900 tabular-nums">{c.n}</div>
                  <div className="mt-0.5 text-[11px] font-bold text-gray-400">{c.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-primary-500 text-[14.5px] font-extrabold text-white shadow-md shadow-primary-500/30 transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading ? '등록 중…' : '프로젝트 등록'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="flex h-11 w-full items-center justify-center rounded-xl border border-gray-300 bg-white text-[14px] font-bold text-gray-600 transition-colors hover:bg-gray-50"
            >
              취소
            </button>
            <p className="text-center text-[11.5px] font-semibold text-gray-400">등록 후 프로젝트 상세로 이동합니다.</p>
          </div>
        </div>
      </form>

      {/* 일정 추가 — 모달(데스크톱 중앙) / 하단 시트(모바일) */}
      {showScheduleForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setShowScheduleForm(false)} />
          <div className="relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-[540px] sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-[17px] font-extrabold text-gray-900">일정 추가</h3>
              <button
                type="button"
                onClick={() => setShowScheduleForm(false)}
                aria-label="닫기"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
                  <path d="M6 6l12 12M6 18 18 6" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto overscroll-contain px-5 py-5">
              <div>
                <label className={labelCls}>
                  일정 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSchedule.title || ''}
                  onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                  className={inputCls}
                  placeholder="일정 제목을 입력하세요"
                />
              </div>

              <div>
                <label className={labelCls}>
                  기간 <span className="text-red-500">*</span>
                </label>
                {!startDate || !endDate ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-[13.5px] font-semibold text-gray-500">
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
                      placeholderText="시작일 ~ 종료일"
                    />
                    <p className="mt-1.5 text-[11.5px] font-semibold text-gray-400">
                      선택 가능한 기간: {format(startDate, 'yyyy-MM-dd')} ~ {format(endDate, 'yyyy-MM-dd')} (프로젝트 기간 내)
                    </p>
                  </>
                )}
              </div>

              <div>
                <label className={labelCls}>유형</label>
                <div className={segWrap}>
                  {TYPE_OPTS.map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setNewSchedule({ ...newSchedule, type: o.v })}
                      className={segCls((newSchedule.type || 'PROJECT') === o.v)}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>참여자</label>
                {users.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[13.5px] font-semibold text-gray-400">등록된 사원이 없습니다.</div>
                ) : (
                  <div className="max-h-56 overflow-y-auto overscroll-contain rounded-xl border border-gray-200">
                    {users.map((user, i) => {
                      const on = (newSchedule.memberIds || []).includes(user.id);
                      return pickRow(user, i, on, () => {
                        const memberIds = newSchedule.memberIds || [];
                        setNewSchedule({
                          ...newSchedule,
                          memberIds: on ? memberIds.filter((id) => id !== user.id) : [...memberIds, user.id],
                        });
                      });
                    })}
                  </div>
                )}
              </div>

              {error && <p className="text-[13px] font-semibold text-red-500">{error}</p>}
            </div>

            <div className="flex justify-end gap-2.5 border-t border-gray-200 bg-gray-50 px-5 py-4">
              <button
                type="button"
                onClick={() => setShowScheduleForm(false)}
                className="flex h-[42px] items-center rounded-xl border border-gray-300 bg-white px-4 text-[14px] font-bold text-gray-600 hover:bg-gray-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAddSchedule}
                className="flex h-[42px] items-center rounded-xl bg-primary-500 px-5 text-[14px] font-extrabold text-white shadow-sm shadow-primary-500/30 hover:bg-primary-600"
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

export default ProjectCreatePage;
