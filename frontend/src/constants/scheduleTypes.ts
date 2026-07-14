// 일정 태그(타입) 단일 정의 — 백엔드 ScheduleType enum과 1:1 대응.
// 태그를 추가할 땐 백엔드 ScheduleType.kt와 이 파일 두 곳만 고치면 된다.

export const SCHEDULE_TYPES = [
  { value: 'PROJECT', label: '프로젝트 일정', shortLabel: '프로젝트' },
  { value: 'TEST_RUN', label: '시운전', shortLabel: '시운전' },
  { value: 'WIRING', label: '전기 배선', shortLabel: '전기 배선' },
  { value: 'DESIGN', label: '설계', shortLabel: '설계' },
  { value: 'MEETING', label: '미팅', shortLabel: '미팅' },
  { value: 'VACATION', label: '휴가', shortLabel: '휴가' },
  { value: 'ETC', label: '기타', shortLabel: '기타' },
] as const;

export type ScheduleTypeValue = (typeof SCHEDULE_TYPES)[number]['value'];

const LABEL_MAP: Record<string, string> = Object.fromEntries(
  SCHEDULE_TYPES.map((t) => [t.value, t.label]),
);

export const scheduleTypeLabel = (type?: string | null): string =>
  (type && LABEL_MAP[type]) || type || '';

// 목록/상세 화면의 타입 칩(chip) 색상
const TYPE_CHIP: Record<string, string> = {
  PROJECT: 'text-primary-600 bg-primary-50',
  TEST_RUN: 'text-green-700 bg-green-50',
  WIRING: 'text-amber-700 bg-amber-50',
  DESIGN: 'text-purple-700 bg-purple-50',
  MEETING: 'text-red-700 bg-red-50',
  VACATION: 'text-sky-700 bg-sky-50',
  ETC: 'text-gray-600 bg-gray-100',
};

export const scheduleTypeChipCls = (type?: string | null): string =>
  (type && TYPE_CHIP[type]) || 'text-gray-600 bg-gray-100';

// 프로젝트 화면의 일정 카드 스트라이프/필(pill) 색상
const TYPE_ACCENT: Record<string, { stripe: string; pill: string }> = {
  PROJECT: { stripe: 'bg-primary-500', pill: 'bg-primary-50 text-primary-700' },
  TEST_RUN: { stripe: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700' },
  WIRING: { stripe: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700' },
  DESIGN: { stripe: 'bg-violet-500', pill: 'bg-violet-50 text-violet-700' },
  MEETING: { stripe: 'bg-rose-500', pill: 'bg-rose-50 text-rose-700' },
  VACATION: { stripe: 'bg-sky-500', pill: 'bg-sky-50 text-sky-700' },
  ETC: { stripe: 'bg-gray-400', pill: 'bg-gray-100 text-gray-600' },
};

export const scheduleTypeAccent = (type?: string | null): { stripe: string; pill: string } =>
  (type && TYPE_ACCENT[type]) || { stripe: 'bg-gray-400', pill: 'bg-gray-100 text-gray-600' };
