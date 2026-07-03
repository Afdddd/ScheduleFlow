import React from 'react';

interface TextFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  /** 여러 줄 입력(textarea)로 렌더 */
  multiline?: boolean;
  rows?: number;
  /** 라벨 옆 회색 보조 문구 (예: "(안 써도 돼요)") */
  hint?: string;
}

/**
 * TextField — 폼 입력 필드 (한 줄/여러 줄).
 *
 * 설계 포인트: 큰 글씨(16px)·넉넉한 패딩으로 아저씨도 편하게.
 * 16px 이상이라 iOS에서 포커스 시 자동 확대(zoom)도 방지된다.
 */
const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  multiline = false,
  rows = 3,
  hint,
}) => {
  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40';

  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm font-bold text-gray-600">
          {label}
          {hint && <span className="ml-1.5 font-medium text-gray-400">{hint}</span>}
        </label>
      )}
      {multiline ? (
        <textarea
          className={`${inputClass} resize-none`}
          value={value}
          rows={rows}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={inputClass}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
};

export default TextField;
