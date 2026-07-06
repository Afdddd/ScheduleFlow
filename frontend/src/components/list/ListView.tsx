import React, { FormEvent, useState } from 'react';

/**
 * ListView — 데스크톱 목록 페이지 공통 스캐폴드.
 *
 * 프로젝트/거래처/일정/파일/사원 목록이 모두 같은 골격(검색 + 컬럼형 테이블 + 페이지네이션)이라,
 * 각 페이지는 **컬럼 선언만** 하고 레이아웃·상호작용은 이 컴포넌트가 담당한다.
 *
 * 설계 포인트 (목업 리디자인 — "데스크톱 앱답게, 밀도 있게"):
 * - 떠 있는 카드 나열이 아니라 **하나의 테이블 카드 + 얇은 구분선**. 넓은 화면에서 정렬되게.
 * - 헤더와 본문이 **같은 grid 트랙**을 공유해 컬럼이 정확히 세로 정렬된다.
 * - 타이포는 절제(이름 14.5px, 보조 13.5px) — 데이터 목록이 무겁지 않게.
 * - 행 hover는 배경 틴트 + 왼쪽 브랜드 바(클릭 가능한 행만).
 * - 리딩 요소(색 점·글리프·아바타)는 각 페이지가 컬럼 render에서 `cells` 헬퍼로 붙인다.
 * - 상태 필터·정렬은 백엔드 지원 후 추가 예정. (이슈 #100)
 */

export interface ListColumn<T> {
  key: string;
  header: string;
  /** CSS grid 트랙 값 (예: 'minmax(0,2fr)', '200px'). */
  width: string;
  render: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface EmptyConfig {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

interface ListViewProps<T> {
  columns: ListColumn<T>[];
  items: T[];
  rowKey: (item: T) => React.Key;
  loading?: boolean;
  /** 행 클릭 시 이동 등. 있으면 커서/›(chevron)/hover 강조. */
  onRowClick?: (item: T) => void;

  // 툴바
  searchPlaceholder?: string;
  searchInitial?: string;
  onSearch?: (q: string) => void;
  createButton?: { label: string; onClick: () => void };

  totalLabel?: React.ReactNode;
  empty: EmptyConfig;

  // 페이지네이션
  currentPage?: number;
  totalPages?: number;
  totalElements?: number;
  onPageChange?: (page: number) => void;
}

const ALIGN: Record<'left' | 'center' | 'right', string> = {
  left: 'justify-start text-left',
  center: 'justify-center text-center',
  right: 'justify-end text-right',
};

function ListView<T>(props: ListViewProps<T>) {
  const {
    columns,
    items,
    rowKey,
    loading,
    onRowClick,
    searchPlaceholder = '검색',
    searchInitial = '',
    onSearch,
    createButton,
    totalLabel,
    empty,
    currentPage = 0,
    totalPages = 0,
    totalElements = 0,
    onPageChange,
  } = props;

  const hasChevron = !!onRowClick;

  // 헤더/행이 같은 그리드 트랙을 공유해 컬럼이 세로로 정렬된다.
  const gridTemplateColumns = [...columns.map((c) => c.width), hasChevron ? '26px' : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="px-6 py-5">
      {/* 툴바: 검색 + 등록 */}
      {(onSearch || createButton) && (
        <div className="flex items-center gap-2.5">
          {onSearch && (
            <SearchInput placeholder={searchPlaceholder} initial={searchInitial} onSearch={onSearch} />
          )}
          {createButton && (
            <button
              type="button"
              onClick={createButton.onClick}
              className="inline-flex h-10 flex-none items-center gap-1.5 whitespace-nowrap rounded-xl bg-primary-500 px-4 text-[14px] font-bold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-600"
            >
              <svg className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {createButton.label}
            </button>
          )}
        </div>
      )}

      {totalLabel ? (
        <div className="mb-2 mt-4 px-0.5 text-[13px] font-semibold text-gray-500">{totalLabel}</div>
      ) : (
        <div className="mt-4" />
      )}

      {/* 테이블 카드 */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          {/* 컬럼 헤더 */}
          <div
            className="grid min-h-[37px] items-center gap-4 border-b border-gray-200 bg-gray-50 px-5 text-[12px] font-bold tracking-wide text-gray-400"
            style={{ gridTemplateColumns }}
          >
            {columns.map((c) => (
              <span key={c.key} className={c.align === 'center' ? 'text-center' : c.align === 'right' ? 'text-right' : ''}>
                {c.header}
              </span>
            ))}
            {hasChevron && <span />}
          </div>

          {/* 본문 */}
          {loading ? (
            <div className="py-16 text-center text-sm font-semibold text-gray-400">불러오는 중…</div>
          ) : items.length === 0 ? (
            <EmptyState {...empty} />
          ) : (
            items.map((item) => (
              <div
                key={rowKey(item)}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(item);
                        }
                      }
                    : undefined
                }
                className={`group relative grid min-h-[48px] items-center gap-4 border-b border-gray-100 px-5 transition-colors last:border-b-0 ${
                  onRowClick
                    ? "cursor-pointer hover:bg-primary-50/60 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-primary-500 before:opacity-0 before:content-[''] group-hover:before:opacity-100"
                    : 'hover:bg-gray-50'
                }`}
                style={{ gridTemplateColumns }}
              >
                {columns.map((c) => (
                  <div key={c.key} className={`flex min-w-0 items-center py-2 ${ALIGN[c.align ?? 'left']}`}>
                    {c.render(item)}
                  </div>
                ))}
                {hasChevron && (
                  <div className="flex items-center justify-end">
                    <svg className="h-[18px] w-[18px] text-gray-300 transition-colors group-hover:text-primary-500" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 페이지네이션 */}
      {!loading && items.length > 0 && onPageChange && totalPages > 1 && (
        <Pager
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={totalElements}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

/* ---- 내부: 검색창 ---- */
const SearchInput: React.FC<{ placeholder: string; initial: string; onSearch: (q: string) => void }> = ({
  placeholder,
  initial,
  onSearch,
}) => {
  const [query, setQuery] = useState(initial);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };
  return (
    <form onSubmit={submit} className="relative flex-1">
      <svg className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4-4" />
      </svg>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-gray-300 bg-white pl-[42px] pr-10 text-[14px] font-medium text-gray-900 placeholder:font-medium placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            onSearch('');
          }}
          aria-label="검색어 지우기"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </form>
  );
};

/* ---- 내부: 빈 상태 ---- */
const EmptyState: React.FC<EmptyConfig> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center px-6 py-16 text-center">
    {icon && (
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-500">
        {icon}
      </span>
    )}
    <h3 className="text-[16px] font-extrabold text-gray-900">{title}</h3>
    {description && <p className="mt-1.5 text-sm font-semibold text-gray-500">{description}</p>}
    {action && (
      <button
        type="button"
        onClick={action.onClick}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-primary-500/25 transition-colors hover:bg-primary-600"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {action.label}
      </button>
    )}
  </div>
);

/* ---- 내부: 페이지네이션 (번호 표시) ---- */
const Pager: React.FC<{
  currentPage: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (p: number) => void;
}> = ({ currentPage, totalPages, totalElements, onPageChange }) => {
  // 현재 페이지 중심으로 최대 7개 번호 노출.
  const MAX = 7;
  let start = Math.max(0, currentPage - 3);
  const end = Math.min(totalPages - 1, start + MAX - 1);
  start = Math.max(0, end - MAX + 1);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  const btn =
    'flex h-9 min-w-[36px] items-center justify-center rounded-lg border border-gray-200 px-2.5 text-[13.5px] font-bold text-gray-600 tabular-nums transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent';

  return (
    <div className="mt-3.5 flex items-center justify-between px-0.5">
      <div className="text-[13px] font-semibold text-gray-400">
        전체 {totalElements}개 · {currentPage + 1}/{totalPages} 페이지
      </div>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0} aria-label="이전 페이지" className={btn}>
          ‹
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === currentPage ? 'page' : undefined}
            className={
              p === currentPage
                ? 'flex h-9 min-w-[36px] items-center justify-center rounded-lg border border-primary-500 bg-primary-500 px-2.5 text-[13.5px] font-bold text-white tabular-nums'
                : btn
            }
          >
            {p + 1}
          </button>
        ))}
        <button type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages - 1} aria-label="다음 페이지" className={btn}>
          ›
        </button>
      </div>
    </div>
  );
};

export default ListView;
