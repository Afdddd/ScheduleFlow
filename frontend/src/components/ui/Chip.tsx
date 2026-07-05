import React from 'react';

interface ChipProps {
  label: string;
  /** 왼쪽 점 색 (hex). 프로젝트 색 등. 없으면 점 생략. */
  color?: string;
  className?: string;
}

/**
 * Chip — 프로젝트/라벨용 작은 칩.
 * 왼쪽 색점(선택) + 라벨. 카드 안에서 부가 정보(프로젝트명 등) 표시에 쓴다.
 */
const Chip: React.FC<ChipProps> = ({ label, color, className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 ${className}`}
  >
    {color && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />}
    {label}
  </span>
);

export default Chip;
