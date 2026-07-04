import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import BottomSheet from '../components/ui/BottomSheet';
import { createSchedule, ScheduleCreateRequest } from '../api/schedule';
import { getAllProjects } from '../api/project';
import { getAllUsers, UserListResponse } from '../api/user';
import { ProjectListResponse } from '../api/list';

/**
 * MobileScheduleCreateSheet — 새 일정 바텀시트.
 *
 * 페이지 이동 없이 아래에서 올라오는 시트로 일정을 만든다(목업의 FAB 흐름).
 * 새 API 없이 기존 `createSchedule`/`getAllProjects`/`getAllUsers`를 그대로 사용.
 */

const TYPES: { value: string; label: string }[] = [
  { value: 'PROJECT', label: '프로젝트 일정' },
  { value: 'TEST_RUN', label: '시운전' },
  { value: 'WIRING', label: '전기 배선' },
  { value: 'DESIGN', label: '설계' },
  { value: 'MEETING', label: '미팅' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const MobileScheduleCreateSheet: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('PROJECT');
  const [range, setRange] = useState<[Date | null, Date | null]>([null, null]);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [memberIds, setMemberIds] = useState<number[]>([]);

  const [projects, setProjects] = useState<ProjectListResponse[]>([]);
  const [users, setUsers] = useState<UserListResponse[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 열릴 때 폼 초기화 + 선택지 로딩
  useEffect(() => {
    if (!open) return;
    setTitle('');
    setType('PROJECT');
    setRange([null, null]);
    setProjectId(null);
    setMemberIds([]);
    setError(null);
    (async () => {
      try {
        const [ps, us] = await Promise.all([getAllProjects(), getAllUsers()]);
        setProjects(ps);
        setUsers(us);
      } catch (e) {
        console.error('선택지 로딩 실패:', e);
      }
    })();
  }, [open]);

  const toggleMember = (id: number) =>
    setMemberIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const submit = async () => {
    setError(null);
    const [start, end] = range;
    if (!title.trim()) return setError('일정 제목을 입력해 주세요.');
    if (!start || !end) return setError('기간을 선택해 주세요.');
    if (start > end) return setError('시작일이 종료일보다 늦을 수 없어요.');

    setSaving(true);
    try {
      const req: ScheduleCreateRequest = {
        title: title.trim(),
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
        scheduleType: type,
        projectId: projectId || null,
        memberIds: memberIds.length > 0 ? memberIds : null,
      };
      await createSchedule(req);
      onCreated();
      onClose();
    } catch (e: any) {
      console.error('일정 생성 실패:', e);
      setError(e.response?.data?.message || '일정 생성에 실패했어요. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="새 일정" confirmLabel={saving ? '저장 중…' : '저장'} onConfirm={saving ? undefined : submit}>
      <div className="flex flex-col gap-5 pt-1">
        {/* 제목 */}
        <Field label="일정 제목" required>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="일정 제목을 입력하세요"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[16px] text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500"
          />
        </Field>

        {/* 타입 (칩) */}
        <Field label="타입">
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => {
              const on = type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`rounded-full border px-3.5 py-2 text-[14px] font-bold transition-colors ${
                    on ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </Field>

        {/* 기간 */}
        <Field label="기간" required>
          <DatePicker
            selected={range[0]}
            onChange={(dates) => setRange(dates as [Date | null, Date | null])}
            startDate={range[0]}
            endDate={range[1]}
            selectsRange
            locale={ko as any}
            dateFormat="yyyy-MM-dd"
            placeholderText="시작일 ~ 종료일 선택"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[16px] text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500"
          />
        </Field>

        {/* 프로젝트 */}
        <Field label="프로젝트">
          <select
            value={projectId ?? ''}
            onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[16px] text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500"
          >
            <option value="">선택 안 함 (독립 일정)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>

        {/* 참여자 */}
        <Field label="참여자">
          {users.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] font-semibold text-gray-400">
              사원이 없어요
            </div>
          ) : (
            <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-200 bg-white">
              {users.map((u, i) => {
                const on = memberIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleMember(u.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left ${i > 0 ? 'border-t border-gray-100' : ''}`}
                  >
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary-500 text-[13px] font-extrabold text-white">
                      {u.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-bold text-gray-900">{u.name}</span>
                      {u.position && <span className="block text-[12px] font-medium text-gray-500">{u.position}</span>}
                    </span>
                    <span
                      className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 ${
                        on ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-300 text-transparent'
                      }`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Field>

        {error && <p className="text-[14px] font-semibold text-red-500">{error}</p>}
      </div>
    </BottomSheet>
  );
};

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({
  label,
  required,
  children,
}) => (
  <div>
    <div className="mb-2 text-[14px] font-bold text-gray-600">
      {label} {required && <span className="text-red-500">*</span>}
    </div>
    {children}
  </div>
);

export default MobileScheduleCreateSheet;
