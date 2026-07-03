import React from 'react';
import StatusPill, { ScheduleStatus } from './StatusPill';
import Chip from './Chip';

interface ScheduleCardProps {
  time: string; // "09:30"
  duration?: string; // "1시간"
  title: string;
  status: ScheduleStatus;
  projectName?: string;
  /** 왼쪽 색 띠 + 프로젝트 칩 점 색 */
  projectColor?: string;
  onClick?: () => void;
}

/**
 * ScheduleCard — 일정 한 건 카드.
 *
 * 설계 포인트:
 * - **표 대신 카드.** 좁은 화면에서 시간·제목·상태·프로젝트를 한 장에 요약.
 * - 큰 글씨(제목 16px, 시간 18px) + 넉넉한 탭 영역 (아저씨 친화).
 * - 왼쪽 색 띠로 프로젝트를 한눈에 구분.
 */
const ScheduleCard: React.FC<ScheduleCardProps> = ({
  time,
  duration,
  title,
  status,
  projectName,
  projectColor = '#3457D5',
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-stretch overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition-transform active:scale-[0.99]"
  >
    <span className="w-1 flex-none" style={{ backgroundColor: projectColor }} />
    <span className="w-16 flex-none py-3.5 pl-3.5">
      <span className="block text-lg font-extrabold tracking-tight tabular-nums">{time}</span>
      {duration && <span className="mt-0.5 block text-xs text-gray-400">{duration}</span>}
    </span>
    <span className="min-w-0 flex-1 py-3.5 pl-1.5 pr-3">
      <span className="block truncate text-base font-bold">{title}</span>
      <span className="mt-1.5 flex items-center gap-1.5">
        {projectName && <Chip label={projectName} color={projectColor} />}
        <StatusPill status={status} />
      </span>
    </span>
  </button>
);

export default ScheduleCard;
