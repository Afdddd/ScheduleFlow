import React from 'react';

/** 배지 톤 — 의미(상태·권한·카테고리)에 매핑해서 쓴다. */
export type BadgeTone = 'blue' | 'green' | 'amber' | 'gray' | 'red' | 'purple';

/** 칩(배지) 배경/글자 톤. blue는 브랜드(코발트)에 맞춰 primary를 쓴다. */
const TONES: Record<BadgeTone, string> = {
  blue: 'text-primary-600 bg-primary-50',
  green: 'text-green-700 bg-green-50',
  amber: 'text-amber-700 bg-amber-50',
  gray: 'text-gray-600 bg-gray-100',
  red: 'text-red-700 bg-red-50',
  purple: 'text-purple-700 bg-purple-50',
};

/** 글리프(파일 확장자 등) 톤 — 칩보다 살짝 진한 글자색. */
export const GLYPH_TONES: Record<BadgeTone, string> = {
  blue: 'text-primary-600 bg-primary-50',
  green: 'text-green-600 bg-green-50',
  amber: 'text-amber-600 bg-amber-50',
  gray: 'text-gray-500 bg-gray-100',
  red: 'text-red-600 bg-red-50',
  purple: 'text-purple-600 bg-purple-50',
};

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  /** 왼쪽 점 표시 여부(상태 배지엔 켜고, 단순 태그엔 꺼도 됨). */
  dot?: boolean;
}

/**
 * Badge — 목록/상세 공통 상태·태그 칩.
 *
 * 설계 포인트: **색 + 글자 이중 인코딩.** 색만으로 구분하지 않아 색약·노안도 읽을 수 있게.
 */
const Badge: React.FC<BadgeProps> = ({ label, tone = 'gray', dot = true }) => (
  <span
    className={`inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12.5px] font-bold ${TONES[tone]}`}
  >
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    {label}
  </span>
);

export default Badge;
