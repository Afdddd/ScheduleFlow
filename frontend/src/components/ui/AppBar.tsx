import React from 'react';

interface AppBarProps {
  title: string;
  /** 있으면 좌측 뒤로가기 버튼 표시 + 제목 중앙 정렬(상세 화면 스타일). 없으면 큰 제목 좌측 정렬(목록 스타일). */
  onBack?: () => void;
  subtitle?: string;
  /** 우측 액션(아이콘 버튼 등) */
  right?: React.ReactNode;
}

/**
 * AppBar — 모바일 상단 바.
 *
 * 두 가지 모드:
 * - 목록/홈: 뒤로가기 없음 → 큰 제목 좌측 정렬.
 * - 상세/생성: onBack 있음 → 중앙 제목 + 좌측 `‹ 뒤로`.
 *
 * 설계 포인트: 상세에는 항상 뒤로가기를 둬서 "길 잃음"을 방지 (아저씨 친화).
 */
const AppBar: React.FC<AppBarProps> = ({ title, onBack, subtitle, right }) => {
  if (onBack) {
    return (
      <div className="flex flex-none items-center gap-1 px-2.5 py-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로"
          className="flex h-10 w-10 flex-none items-center justify-center rounded-xl text-gray-600 active:scale-95"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className="flex-1 truncate text-center text-lg font-bold">{title}</h1>
        <div className="flex h-10 w-10 flex-none items-center justify-center">{right}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-none items-center gap-3 px-4 pb-3 pt-2">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
};

export default AppBar;
