import React, { useState } from 'react';

/**
 * MobileSearchInput — 모바일 목록용 인라인 검색. 엔터/지우기로 검색.
 */
const MobileSearchInput: React.FC<{ onSearch: (q: string) => void; placeholder?: string }> = ({
  onSearch,
  placeholder,
}) => {
  const [q, setQ] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(q.trim());
      }}
      className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm focus-within:border-primary-500"
    >
      <svg className="h-5 w-5 flex-none text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[16px] font-medium text-gray-900 outline-none placeholder:text-gray-400"
      />
      {q && (
        <button
          type="button"
          onClick={() => {
            setQ('');
            onSearch('');
          }}
          aria-label="지우기"
          className="flex-none text-gray-400"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
            <path d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </form>
  );
};

export default MobileSearchInput;
