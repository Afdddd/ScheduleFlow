import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  onPageChange: (page: number) => void;
}

/**
 * Pagination 컴포넌트
 * 
 * 기능:
 * 1. 좌우 화살표 버튼으로 페이지 이동 (+5씩 이동)
 * 2. 현재 페이지 정보 표시
 * 3. 첫 페이지/마지막 페이지에서 버튼 비활성화
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalElements,
  onPageChange,
}) => {
  const handlePrevious = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  };

  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-gray-600">
        {totalElements > 0 ? (
          <>
            {startItem}-{endItem} / 전체 {totalElements}개
          </>
        ) : (
          '데이터가 없습니다'
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 0}
          className={`
            px-4 py-2 rounded-lg transition-colors
            ${
              currentPage === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }
          `}
          aria-label="이전 페이지"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="px-4 py-2 text-sm text-gray-700">
          {totalPages > 0 ? `${currentPage + 1} / ${totalPages}` : '0 / 0'}
        </span>

        <button
          onClick={handleNext}
          disabled={currentPage >= totalPages - 1}
          className={`
            px-4 py-2 rounded-lg transition-colors
            ${
              currentPage >= totalPages - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }
          `}
          aria-label="다음 페이지"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Pagination;

