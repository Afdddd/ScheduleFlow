import React from 'react';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * SegmentedControl — 탭형 토글 (예: 일정 화면의 리스트/캘린더 전환).
 * 선택된 칸만 흰 배경으로 떠오른다.
 */
function SegmentedControl<T extends string>({ options, value, onChange, className = '' }: SegmentedControlProps<T>) {
  return (
    <div className={`flex rounded-xl bg-gray-100 p-1 ${className}`}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-colors ${
              selected ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
