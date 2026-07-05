import React from 'react';

interface ListRowProps {
  label: string;
  /** 좌측 아이콘(색 사각형 안에 들어감) */
  icon?: React.ReactNode;
  iconBg?: string;
  /** 우측 요소(배지·값 등). chevron과 함께 표시 가능. */
  trailing?: React.ReactNode;
  showChevron?: boolean;
  onClick?: () => void;
  danger?: boolean;
}

/**
 * ListRow — 목록 한 줄 (더보기·설정 등).
 * 좌측 아이콘 + 라벨 + 우측(값/배지/화살표). 큰 탭 영역.
 *
 * 여러 줄을 묶을 땐 부모에서 `divide-y`로 감싼다.
 */
const ListRow: React.FC<ListRowProps> = ({ label, icon, iconBg = '#8B909C', trailing, showChevron, onClick, danger }) => {
  const content = (
    <>
      {icon && (
        <span
          className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </span>
      )}
      <span className={`flex-1 text-base font-semibold ${danger ? 'text-red-500' : 'text-gray-800'}`}>{label}</span>
      {trailing}
      {showChevron && (
        <svg className="h-5 w-5 flex-none text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
        </svg>
      )}
    </>
  );

  const cls = 'flex w-full items-center gap-3 px-4 py-4 text-left active:bg-gray-50';
  return onClick ? (
    <button type="button" onClick={onClick} className={cls}>
      {content}
    </button>
  ) : (
    <div className={cls}>{content}</div>
  );
};

export default ListRow;
