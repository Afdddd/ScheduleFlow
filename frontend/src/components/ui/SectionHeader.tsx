import React from 'react';

interface SectionHeaderProps {
  title: string;
  /** 우측 액션 링크(예: "전체 보기") */
  action?: { label: string; onClick?: () => void };
  className?: string;
}

/**
 * SectionHeader — 섹션 제목 줄.
 * 좌측 제목 + (선택) 우측 액션 링크. 홈/상세의 각 구획 머리말에 쓴다.
 */
const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action, className = '' }) => (
  <div className={`mb-2.5 flex items-center justify-between ${className}`}>
    <h3 className="text-base font-bold tracking-tight">{title}</h3>
    {action && (
      <button type="button" onClick={action.onClick} className="text-sm font-bold text-primary-500">
        {action.label}
      </button>
    )}
  </div>
);

export default SectionHeader;
