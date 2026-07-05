import React, { useState, FormEvent } from 'react';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  initialValue?: string;
  /** 폼 래퍼 클래스. 기본은 아래 여백(mb-6). 툴바에 나란히 둘 땐 ""로 여백 제거. */
  className?: string;
}

/**
 * SearchBar 컴포넌트
 * 
 * 기능:
 * 1. 검색어 입력
 * 2. 검색 버튼 클릭 또는 Enter 키 입력 시 검색 실행
 * 3. 검색어 초기화 기능
 */
const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = '검색어를 입력하세요',
  onSearch,
  initialValue = '',
  className = 'mb-6',
}) => {
  const [query, setQuery] = useState<string>(initialValue);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="검색어 지우기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          검색
        </button>
      </div>
    </form>
  );
};

export default SearchBar;

