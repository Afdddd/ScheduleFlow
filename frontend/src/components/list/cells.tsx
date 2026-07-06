import React from 'react';

/**
 * 목록 행 셀 헬퍼 — 데스크톱 `ListView` 컬럼에서 공통으로 쓰는 표현 요소.
 *
 * 목업 리디자인 기준(밀도 있는 테이블):
 * - 이름은 14.5px bold, 보조 텍스트는 13.5px semibold 회색.
 * - 리딩 요소(점·글리프·아바타)는 목록 성격에 맞춰 이름 왼쪽에 정렬한다.
 */

/** 이름 셀 — 선택적 리딩 요소 + 강조 텍스트(말줄임). */
export const NameCell: React.FC<{ lead?: React.ReactNode; children: React.ReactNode }> = ({ lead, children }) => (
  <span className="flex min-w-0 items-center gap-2.5">
    {lead}
    <span className="truncate text-[14.5px] font-bold tracking-tight text-gray-900">{children}</span>
  </span>
);

/** 색 점 — 프로젝트/카테고리 색 표시(캘린더와 연결). */
export const Dot: React.FC<{ color?: string | null }> = ({ color }) => (
  <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ backgroundColor: color || '#cbd5e1' }} />
);

/** 글리프 칩 — 파일 확장자 등 짧은 텍스트 아이콘. `tone`은 GLYPH_TONES 클래스 문자열. */
export const Glyph: React.FC<{ text: string; tone: string }> = ({ text, tone }) => (
  <span className={`flex h-[30px] w-[30px] flex-none items-center justify-center rounded-lg text-[11px] font-extrabold ${tone}`}>
    {text}
  </span>
);

/** 이니셜 아바타 — 사원 등. */
export const Avatar: React.FC<{ text: string; className?: string }> = ({ text, className }) => (
  <span className={`flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full text-[12px] font-bold text-white ${className ?? 'bg-primary-500'}`}>
    {text}
  </span>
);

/** 보조 텍스트(진한 회색). */
export const Sub: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="truncate text-[13.5px] font-semibold text-gray-600">{children}</span>
);

/** 흐린 보조 텍스트. */
export const Muted: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="truncate text-[13.5px] font-semibold text-gray-400">{children}</span>
);

/** 숫자/날짜(고정폭 숫자, 줄바꿈 없음). */
export const Num: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="whitespace-nowrap text-[13.5px] font-semibold text-gray-500 tabular-nums">{children}</span>
);
