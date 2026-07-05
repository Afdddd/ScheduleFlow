import React from 'react';

/**
 * 일정/작업 상태.
 * 백엔드 enum 매핑은 사용 지점에서 하고, 이 컴포넌트는 표시만 담당한다.
 */
export type ScheduleStatus = 'planned' | 'ongoing' | 'done' | 'delayed';

const STYLES: Record<ScheduleStatus, { label: string; className: string }> = {
  planned: { label: '예정', className: 'text-blue-600 bg-blue-50' },
  ongoing: { label: '진행중', className: 'text-green-700 bg-green-50' },
  done: { label: '완료', className: 'text-gray-500 bg-gray-100' },
  delayed: { label: '지연', className: 'text-amber-700 bg-amber-50' },
};

interface StatusPillProps {
  status: ScheduleStatus;
  className?: string;
}

/**
 * StatusPill — 일정 상태 배지.
 *
 * 설계 포인트: **색 + 글자(라벨) 이중 인코딩.** 색만으로 구분하지 않아
 * 색약·노안 사용자도 상태를 읽을 수 있다.
 */
const StatusPill: React.FC<StatusPillProps> = ({ status, className = '' }) => {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${s.className} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
};

export default StatusPill;
